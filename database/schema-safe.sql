-- Expense Tracker Database Schema (Safe Version)
-- Run this in Supabase SQL Editor
-- This version uses IF NOT EXISTS to avoid errors if tables already exist

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- EXPENSE CATEGORIES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS expense_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  icon TEXT NOT NULL,
  color TEXT NOT NULL,
  is_custom BOOLEAN DEFAULT false,
  is_archived BOOLEAN DEFAULT false,
  order_index INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add unique constraint if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'unique_category_per_user'
  ) THEN
    ALTER TABLE expense_categories ADD CONSTRAINT unique_category_per_user UNIQUE(user_id, name);
  END IF;
END
$$;

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_expense_categories_user ON expense_categories(user_id);
CREATE INDEX IF NOT EXISTS idx_expense_categories_archived ON expense_categories(user_id, is_archived);

-- =====================================================
-- EXPENSES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  category_id UUID REFERENCES expense_categories(id) ON DELETE SET NULL,
  amount NUMERIC(12,2) NOT NULL CHECK (amount >= 0),
  description TEXT,
  date DATE NOT NULL,
  time TIME,
  transaction_type TEXT CHECK (transaction_type IN ('manual', 'upi')) DEFAULT 'manual',
  upi_ref_number TEXT,
  merchant_name TEXT,
  receipt_url TEXT,
  balance_after NUMERIC(12,2),
  status TEXT CHECK (status IN ('pending', 'confirmed')) DEFAULT 'confirmed',
  is_recurring BOOLEAN DEFAULT false,
  recurring_frequency TEXT CHECK (recurring_frequency IN ('daily', 'weekly', 'monthly', 'yearly')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_expenses_user ON expenses(user_id);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category_id);
CREATE INDEX IF NOT EXISTS idx_expenses_merchant ON expenses(merchant_name);
CREATE INDEX IF NOT EXISTS idx_expenses_upi_ref ON expenses(upi_ref_number) WHERE upi_ref_number IS NOT NULL;

-- =====================================================
-- INCOMES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS incomes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  amount NUMERIC(12,2) NOT NULL CHECK (amount >= 0),
  source TEXT NOT NULL,
  payment_mode TEXT NOT NULL,
  date DATE NOT NULL,
  reference_number TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_incomes_user ON incomes(user_id);
CREATE INDEX IF NOT EXISTS idx_incomes_date ON incomes(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_incomes_source ON incomes(user_id, source);

-- =====================================================
-- BUDGETS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS budgets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  category_id UUID REFERENCES expense_categories(id) ON DELETE CASCADE NOT NULL,
  monthly_limit NUMERIC(12,2) NOT NULL CHECK (monthly_limit > 0),
  alert_threshold NUMERIC(3,2) DEFAULT 0.80 CHECK (alert_threshold > 0 AND alert_threshold <= 1),
  month_year TEXT NOT NULL,
  current_spend NUMERIC(12,2) DEFAULT 0 CHECK (current_spend >= 0),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'unique_budget_per_category_month'
  ) THEN
    ALTER TABLE budgets ADD CONSTRAINT unique_budget_per_category_month UNIQUE(user_id, category_id, month_year);
  END IF;
END
$$;

CREATE INDEX IF NOT EXISTS idx_budgets_user ON budgets(user_id);
CREATE INDEX IF NOT EXISTS idx_budgets_month ON budgets(user_id, month_year);
CREATE INDEX IF NOT EXISTS idx_budgets_category ON budgets(category_id);

-- =====================================================
-- FUNCTIONS & TRIGGERS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS update_expenses_updated_at ON expenses;
DROP TRIGGER IF EXISTS update_incomes_updated_at ON incomes;
DROP TRIGGER IF EXISTS update_budgets_updated_at ON budgets;

-- Apply updated_at triggers
CREATE TRIGGER update_expenses_updated_at BEFORE UPDATE ON expenses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_incomes_updated_at BEFORE UPDATE ON incomes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_budgets_updated_at BEFORE UPDATE ON budgets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to calculate budget current_spend
CREATE OR REPLACE FUNCTION calculate_budget_spend()
RETURNS TRIGGER AS $$
DECLARE
  budget_record RECORD;
BEGIN
  FOR budget_record IN
    SELECT id, category_id, user_id, month_year
    FROM budgets
    WHERE user_id = COALESCE(NEW.user_id, OLD.user_id)
      AND category_id = COALESCE(NEW.category_id, OLD.category_id)
  LOOP
    UPDATE budgets
    SET current_spend = (
      SELECT COALESCE(SUM(amount), 0)
      FROM expenses
      WHERE user_id = budget_record.user_id
        AND category_id = budget_record.category_id
        AND TO_CHAR(date, 'YYYY-MM') = budget_record.month_year
        AND status = 'confirmed'
    )
    WHERE id = budget_record.id;
  END LOOP;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Drop and recreate budget trigger
DROP TRIGGER IF EXISTS update_budget_on_expense_change ON expenses;
CREATE TRIGGER update_budget_on_expense_change
AFTER INSERT OR UPDATE OR DELETE ON expenses
FOR EACH ROW EXECUTE FUNCTION calculate_budget_spend();

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

ALTER TABLE expense_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE incomes ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own categories" ON expense_categories;
DROP POLICY IF EXISTS "Users can insert their own categories" ON expense_categories;
DROP POLICY IF EXISTS "Users can update their own categories" ON expense_categories;
DROP POLICY IF EXISTS "Users can delete their own categories" ON expense_categories;

DROP POLICY IF EXISTS "Users can view their own expenses" ON expenses;
DROP POLICY IF EXISTS "Users can insert their own expenses" ON expenses;
DROP POLICY IF EXISTS "Users can update their own expenses" ON expenses;
DROP POLICY IF EXISTS "Users can delete their own expenses" ON expenses;

DROP POLICY IF EXISTS "Users can view their own incomes" ON incomes;
DROP POLICY IF EXISTS "Users can insert their own incomes" ON incomes;
DROP POLICY IF EXISTS "Users can update their own incomes" ON incomes;
DROP POLICY IF EXISTS "Users can delete their own incomes" ON incomes;

DROP POLICY IF EXISTS "Users can view their own budgets" ON budgets;
DROP POLICY IF EXISTS "Users can insert their own budgets" ON budgets;
DROP POLICY IF EXISTS "Users can update their own budgets" ON budgets;
DROP POLICY IF EXISTS "Users can delete their own budgets" ON budgets;

-- Expense Categories Policies
CREATE POLICY "Users can view their own categories"
  ON expense_categories FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own categories"
  ON expense_categories FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own categories"
  ON expense_categories FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own categories"
  ON expense_categories FOR DELETE
  USING (auth.uid() = user_id);

-- Expenses Policies
CREATE POLICY "Users can view their own expenses"
  ON expenses FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own expenses"
  ON expenses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own expenses"
  ON expenses FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own expenses"
  ON expenses FOR DELETE
  USING (auth.uid() = user_id);

-- Incomes Policies
CREATE POLICY "Users can view their own incomes"
  ON incomes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own incomes"
  ON incomes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own incomes"
  ON incomes FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own incomes"
  ON incomes FOR DELETE
  USING (auth.uid() = user_id);

-- Budgets Policies
CREATE POLICY "Users can view their own budgets"
  ON budgets FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own budgets"
  ON budgets FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own budgets"
  ON budgets FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own budgets"
  ON budgets FOR DELETE
  USING (auth.uid() = user_id);

-- =====================================================
-- DEFAULT CATEGORIES ON USER SIGNUP
-- =====================================================

CREATE OR REPLACE FUNCTION create_default_categories()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO expense_categories (user_id, name, icon, color, is_custom, order_index) VALUES
    (NEW.id, 'Food & Dining', '🍔', '#ef4444', false, 1),
    (NEW.id, 'Transportation', '🚗', '#f59e0b', false, 2),
    (NEW.id, 'Shopping', '🛍️', '#ec4899', false, 3),
    (NEW.id, 'Entertainment', '🎬', '#8b5cf6', false, 4),
    (NEW.id, 'Bills & Utilities', '💡', '#3b82f6', false, 5),
    (NEW.id, 'Healthcare', '🏥', '#10b981', false, 6),
    (NEW.id, 'Education', '📚', '#06b6d4', false, 7),
    (NEW.id, 'Personal Care', '💅', '#f43f5e', false, 8),
    (NEW.id, 'Travel', '✈️', '#6366f1', false, 9),
    (NEW.id, 'Others', '📦', '#6b7280', false, 10)
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop and recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION create_default_categories();

-- =====================================================
-- VIEWS
-- =====================================================

CREATE OR REPLACE VIEW monthly_spending_summary AS
SELECT
  user_id,
  TO_CHAR(date, 'YYYY-MM') as month_year,
  COUNT(*) as transaction_count,
  SUM(amount) as total_spent,
  AVG(amount) as avg_transaction
FROM expenses
WHERE status = 'confirmed'
GROUP BY user_id, TO_CHAR(date, 'YYYY-MM');

CREATE OR REPLACE VIEW category_spending AS
SELECT
  e.user_id,
  e.category_id,
  c.name as category_name,
  c.icon,
  c.color,
  COUNT(*) as transaction_count,
  SUM(e.amount) as total_spent
FROM expenses e
LEFT JOIN expense_categories c ON e.category_id = c.id
WHERE e.status = 'confirmed'
GROUP BY e.user_id, e.category_id, c.name, c.icon, c.color;
