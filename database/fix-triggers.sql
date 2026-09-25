-- Fix: calculate_budget_spend() throws on DELETE
-- Run this in Supabase SQL Editor. Safe to re-run.
--
-- WHY
-- ---
-- The trigger fires AFTER INSERT OR UPDATE OR DELETE ON expenses. On DELETE,
-- NEW is unassigned in plpgsql, so the expression
--
--     COALESCE(NEW.user_id, OLD.user_id)
--
-- raises `record "new" is not assigned yet`. The whole trigger aborts, so the
-- budget's current_spend never decrements when an expense is deleted — the
-- budget silently drifts upward forever.
--
-- THE FIX
-- -------
-- Branch on TG_OP and use OLD for DELETE, NEW otherwise. Also scope the
-- recalculation to the affected budget's own month, so an expense edited
-- across a month boundary settles both the old and the new month.

CREATE OR REPLACE FUNCTION calculate_budget_spend()
RETURNS TRIGGER AS $$
DECLARE
  budget_record RECORD;
  target_user UUID;
  target_category UUID;
BEGIN
  IF TG_OP = 'DELETE' THEN
    target_user     := OLD.user_id;
    target_category := OLD.category_id;
  ELSE
    target_user     := NEW.user_id;
    target_category := NEW.category_id;
  END IF;

  -- Nothing to recalculate if the row had no category.
  IF target_category IS NULL THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  FOR budget_record IN
    SELECT id, category_id, user_id, month_year
    FROM budgets
    WHERE user_id = target_user
      AND category_id = target_category
  LOOP
    UPDATE budgets
    SET current_spend = COALESCE((
      SELECT SUM(amount)
      FROM expenses
      WHERE user_id = budget_record.user_id
        AND category_id = budget_record.category_id
        AND TO_CHAR(date, 'YYYY-MM') = budget_record.month_year
        AND status = 'confirmed'
    ), 0)
    WHERE id = budget_record.id;
  END LOOP;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Re-point the trigger at the corrected function. IF NOT EXISTS is not
-- supported for triggers in older Postgres, so drop first (safe: the trigger
-- is recreated immediately below, in the same transaction).
DROP TRIGGER IF EXISTS update_budget_on_expense_change ON expenses;
CREATE TRIGGER update_budget_on_expense_change
  AFTER INSERT OR UPDATE OR DELETE ON expenses
  FOR EACH ROW EXECUTE FUNCTION calculate_budget_spend();


-- =====================================================
-- BONUS: repair any budgets already drifted by the old trigger
-- =====================================================
UPDATE budgets b
SET current_spend = COALESCE((
  SELECT SUM(e.amount)
  FROM expenses e
  WHERE e.user_id = b.user_id
    AND e.category_id = b.category_id
    AND TO_CHAR(e.date, 'YYYY-MM') = b.month_year
    AND e.status = 'confirmed'
), 0);

-- Confirm the recalculation landed (all rows should now read 0 or a real sum).
SELECT id, category_id, month_year, monthly_limit, current_spend
FROM budgets
ORDER BY month_year DESC, category_id;
