-- Run in Supabase SQL Editor. Safe to re-run; preserves transactions.
-- Recalculate both the old and new categories when expenses move.
CREATE OR REPLACE FUNCTION calculate_budget_spend()
RETURNS TRIGGER AS $$
DECLARE
  old_user UUID;
  old_category UUID;
  new_user UUID;
  new_category UUID;
BEGIN
  IF TG_OP <> 'INSERT' THEN
    old_user := OLD.user_id;
    old_category := OLD.category_id;
  END IF;
  IF TG_OP <> 'DELETE' THEN
    new_user := NEW.user_id;
    new_category := NEW.category_id;
  END IF;

  UPDATE budgets b
  SET current_spend = COALESCE((
    SELECT SUM(e.amount) FROM expenses e
    WHERE e.user_id = b.user_id AND e.category_id = b.category_id
      AND TO_CHAR(e.date, 'YYYY-MM') = b.month_year AND e.status = 'confirmed'
  ), 0)
  WHERE (b.user_id = old_user AND b.category_id = old_category)
     OR (b.user_id = new_user AND b.category_id = new_category);
  RETURN NULL; -- AFTER triggers ignore their return value.
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_budget_on_expense_change ON expenses;
CREATE TRIGGER update_budget_on_expense_change
  AFTER INSERT OR UPDATE OR DELETE ON expenses
  FOR EACH ROW EXECUTE FUNCTION calculate_budget_spend();

-- A budget created after its expenses must include that existing spending.
-- Recompute on updates too, including category/month edits and client writes.
CREATE OR REPLACE FUNCTION initialize_budget_spend()
RETURNS TRIGGER AS $$
BEGIN
  NEW.current_spend := COALESCE((
    SELECT SUM(e.amount) FROM expenses e
    WHERE e.user_id = NEW.user_id AND e.category_id = NEW.category_id
      AND TO_CHAR(e.date, 'YYYY-MM') = NEW.month_year AND e.status = 'confirmed'
  ), 0);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS initialize_budget_current_spend ON budgets;
CREATE TRIGGER initialize_budget_current_spend
  BEFORE INSERT OR UPDATE ON budgets
  FOR EACH ROW EXECUTE FUNCTION initialize_budget_spend();

-- Repair existing totals using confirmed expenses only.
UPDATE budgets b
SET current_spend = COALESCE((
  SELECT SUM(e.amount) FROM expenses e
  WHERE e.user_id = b.user_id AND e.category_id = b.category_id
    AND TO_CHAR(e.date, 'YYYY-MM') = b.month_year AND e.status = 'confirmed'
), 0);
