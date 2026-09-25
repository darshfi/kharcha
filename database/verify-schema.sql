-- Schema ground truth — run this FIRST and paste the output back.
-- Read-only. Changes nothing.
--
-- This prints the live deployed columns for every table the app touches, plus
-- the constraints and triggers that affect writes. It is the source of truth
-- we diff the frontend's field names against — not database/schema.sql, which
-- only describes what we *intended* to deploy.

-- =====================================================
-- 1. Live columns, grouped by table
-- =====================================================
SELECT
  table_name,
  ordinal_position,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN ('expenses', 'expense_categories', 'incomes', 'budgets')
ORDER BY table_name, ordinal_position;

-- =====================================================
-- 2. Every constraint — surfaces NOT NULLs we may be missing and the
--    unique keys that turn a repeat insert into a 409
-- =====================================================
SELECT
  conrelid::regclass AS table_name,
  conname,
  pg_get_constraintdef(oid) AS definition
FROM pg_constraint
WHERE conrelid IN ('expenses'::regclass, 'expense_categories'::regclass,
                   'incomes'::regclass, 'budgets'::regclass)
ORDER BY conrelid::regclass::text, conname;

-- =====================================================
-- 3. Triggers — confirms the updated_at and budget-spend triggers exist
-- =====================================================
SELECT
  event_object_table AS table_name,
  trigger_name,
  action_timing,
  event_manipulation,
  action_statement
FROM information_schema.triggers
WHERE event_object_table IN ('expenses', 'expense_categories', 'incomes', 'budgets')
ORDER BY event_object_table, trigger_name, event_manipulation;

-- =====================================================
-- 4. RLS enabled + the actual policies
-- =====================================================
SELECT c.relname AS table_name, c.relrowsecurity AS rls_enabled
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relname IN ('expenses', 'expense_categories', 'incomes', 'budgets')
ORDER BY c.relname;

SELECT tablename, policyname, cmd, roles, qual, with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('expenses', 'expense_categories', 'incomes', 'budgets')
ORDER BY tablename, policyname;

-- =====================================================
-- 5. Row counts — tells us whether the tables are actually reachable
--    and whether the default-categories trigger ever fired
-- =====================================================
SELECT 'expense_categories' AS table_name, count(*) AS rows FROM expense_categories
UNION ALL SELECT 'expenses', count(*) FROM expenses
UNION ALL SELECT 'incomes', count(*) FROM incomes
UNION ALL SELECT 'budgets', count(*) FROM budgets;
