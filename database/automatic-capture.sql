-- Run after fix-app-bugs.sql in Supabase SQL Editor. Safe to re-run.
-- Notification text and authentication tokens are never stored here.
BEGIN;
ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS capture_source TEXT;
ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS capture_event_id TEXT;
ALTER TABLE public.incomes ADD COLUMN IF NOT EXISTS capture_source TEXT;
ALTER TABLE public.incomes ADD COLUMN IF NOT EXISTS capture_event_id TEXT;

-- Permanent receipts intentionally survive deletion of the linked ledger row.
CREATE TABLE IF NOT EXISTS public.capture_identities (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  transaction_kind TEXT NOT NULL CHECK(transaction_kind IN ('expense','income')),
  reference_key TEXT NOT NULL,
  amount NUMERIC(12,2) NOT NULL,
  ledger_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY(user_id, transaction_kind, reference_key)
);
CREATE TABLE IF NOT EXISTS public.capture_events (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_id TEXT NOT NULL,
  transaction_kind TEXT NOT NULL,
  reference_key TEXT NOT NULL,
  amount NUMERIC(12,2) NOT NULL,
  ledger_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY(user_id,event_id)
);
ALTER TABLE public.capture_identities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.capture_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS capture_identities_owner_read ON public.capture_identities;
CREATE POLICY capture_identities_owner_read ON public.capture_identities FOR SELECT TO authenticated USING(auth.uid()=user_id);
DROP POLICY IF EXISTS capture_events_owner_read ON public.capture_events;
CREATE POLICY capture_events_owner_read ON public.capture_events FOR SELECT TO authenticated USING(auth.uid()=user_id);
REVOKE ALL ON public.capture_identities,public.capture_events FROM PUBLIC,anon,authenticated;
GRANT SELECT ON public.capture_identities,public.capture_events TO authenticated;

CREATE OR REPLACE FUNCTION public.import_notification_transaction(
  p_event_id TEXT, p_source_package TEXT, p_kind TEXT, p_amount NUMERIC,
  p_reference TEXT, p_date DATE, p_payment_mode TEXT, p_expected_user UUID, p_balance_after NUMERIC DEFAULT NULL
) RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
  owner UUID := auth.uid();
  ref TEXT := upper(p_reference);
  receipt public.capture_events%ROWTYPE;
  identity public.capture_identities%ROWTYPE;
  ledger UUID;
  existing_amount NUMERIC;
  category UUID;
  imported BOOLEAN := false;
BEGIN
  IF owner IS NULL THEN RAISE EXCEPTION 'Authentication required' USING ERRCODE='28000'; END IF;
  IF p_expected_user IS NULL OR owner<>p_expected_user THEN RAISE EXCEPTION 'Account changed' USING ERRCODE='28000'; END IF;
  IF p_event_id IS NULL OR p_event_id !~ '^[a-f0-9]{64}$'
     OR p_source_package IS NULL OR length(p_source_package)>200 OR p_source_package !~ '^[A-Za-z][A-Za-z0-9_]*(\.[A-Za-z0-9_]+)+$'
     OR p_kind IS NULL OR p_kind NOT IN ('expense','income')
     OR p_amount IS NULL OR p_amount<=0 OR p_amount>9999999999.99 OR p_amount<>round(p_amount,2)
     OR ref IS NULL OR ref !~ '^[A-Z0-9]{6,40}$'
     OR p_date IS NULL OR p_date>current_date+1 OR p_date<current_date-3650
     OR p_payment_mode IS NULL OR p_payment_mode NOT IN ('UPI','Bank transfer','Card / wallet')
     OR (p_balance_after IS NOT NULL AND (p_balance_after<0 OR p_balance_after>9999999999.99 OR p_balance_after<>round(p_balance_after,2)))
  THEN RAISE EXCEPTION 'Invalid captured transaction' USING ERRCODE='22023'; END IF;

  -- Serialize retries by event and duplicates across distinct apps by reference.
  PERFORM pg_advisory_xact_lock(hashtextextended(owner::text || ':event:' || p_event_id,0));
  SELECT * INTO receipt FROM public.capture_events WHERE user_id=owner AND event_id=p_event_id;
  IF FOUND THEN
    IF receipt.amount<>p_amount OR receipt.transaction_kind<>p_kind OR receipt.reference_key<>ref THEN
      RAISE EXCEPTION 'Conflicting values for an existing capture event' USING ERRCODE='22023';
    END IF;
    RETURN jsonb_build_object('outcome','duplicate','id',receipt.ledger_id,'type',receipt.transaction_kind);
  END IF;
  PERFORM pg_advisory_xact_lock(hashtextextended(owner::text || ':ref:' || p_kind || ':' || ref,0));
  SELECT * INTO identity FROM public.capture_identities WHERE user_id=owner AND transaction_kind=p_kind AND reference_key=ref;
  IF FOUND THEN
    IF identity.amount<>p_amount THEN RAISE EXCEPTION 'Conflicting amount for an existing transaction reference' USING ERRCODE='22023'; END IF;
    ledger:=identity.ledger_id;
  ELSE
    -- Existing pasted/manual imports also count. Keep legacy ledger rows intact.
    IF p_kind='expense' THEN
      SELECT id,amount INTO ledger,existing_amount FROM public.expenses
      WHERE user_id=owner AND upper(upi_ref_number)=ref ORDER BY created_at LIMIT 1;
    ELSE
      SELECT id,amount INTO ledger,existing_amount FROM public.incomes
      WHERE user_id=owner AND upper(reference_number)=ref ORDER BY created_at LIMIT 1;
    END IF;
    IF ledger IS NOT NULL AND existing_amount<>p_amount THEN
      RAISE EXCEPTION 'Conflicting amount for an existing transaction reference' USING ERRCODE='22023';
    END IF;
    IF ledger IS NULL THEN
      IF p_kind='expense' THEN
        SELECT id INTO category FROM public.expense_categories WHERE user_id=owner AND name='Others' AND NOT coalesce(is_archived,false) LIMIT 1;
        INSERT INTO public.expenses(user_id,category_id,amount,description,date,payment_mode,transaction_type,upi_ref_number,balance_after,status,capture_source,capture_event_id)
        VALUES(owner,category,p_amount,'Captured payment',p_date,p_payment_mode,CASE WHEN p_payment_mode='UPI' THEN 'upi' ELSE 'manual' END,ref,p_balance_after,'confirmed',p_source_package,p_event_id)
        RETURNING id INTO ledger;
      ELSE
        INSERT INTO public.incomes(user_id,amount,source,date,payment_mode,reference_number,capture_source,capture_event_id)
        VALUES(owner,p_amount,'Captured credit',p_date,p_payment_mode,ref,p_source_package,p_event_id) RETURNING id INTO ledger;
      END IF;
      imported:=true;
    END IF;
    INSERT INTO public.capture_identities(user_id,transaction_kind,reference_key,amount,ledger_id) VALUES(owner,p_kind,ref,p_amount,ledger);
  END IF;
  INSERT INTO public.capture_events(user_id,event_id,transaction_kind,reference_key,amount,ledger_id) VALUES(owner,p_event_id,p_kind,ref,p_amount,ledger);
  RETURN jsonb_build_object('outcome',CASE WHEN imported THEN 'imported' ELSE 'duplicate' END,'id',ledger,'type',p_kind);
END;
$$;
REVOKE ALL ON FUNCTION public.import_notification_transaction(TEXT,TEXT,TEXT,NUMERIC,TEXT,DATE,TEXT,UUID,NUMERIC) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.import_notification_transaction(TEXT,TEXT,TEXT,NUMERIC,TEXT,DATE,TEXT,UUID,NUMERIC) TO authenticated;
NOTIFY pgrst, 'reload schema';
COMMIT;
