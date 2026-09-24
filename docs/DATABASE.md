# Database Schema

This document describes the database schema for the Expense Tracker application using Supabase (PostgreSQL).

## Tables

### 1. Users Table
Stores user account information.

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255),
  currency VARCHAR(3) DEFAULT 'INR',
  date_format VARCHAR(10) DEFAULT 'DD/MM/YYYY',
  theme VARCHAR(10) DEFAULT 'light', -- 'light' or 'dark'
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  last_login TIMESTAMP,
  is_active BOOLEAN DEFAULT true
);
```

### 2. Expense Categories Table
Stores expense categories for each user.

```sql
CREATE TABLE expense_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(50) NOT NULL,
  icon VARCHAR(100), -- emoji or icon name
  color VARCHAR(7), -- hex color code
  is_custom BOOLEAN DEFAULT false,
  is_archived BOOLEAN DEFAULT false,
  order_index INTEGER,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, name)
);
```

### 3. Expenses Table
Stores expense transactions.

```sql
CREATE TABLE expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES expense_categories(id),
  amount DECIMAL(10, 2) NOT NULL,
  description TEXT,
  expense_date DATE NOT NULL,
  expense_time TIME,
  transaction_type VARCHAR(20) DEFAULT 'manual', -- 'manual' or 'upi'
  upi_ref_number VARCHAR(50) UNIQUE, -- for deduplication
  merchant_name VARCHAR(255),
  receipt_url VARCHAR(500), -- optional receipt image
  balance_after DECIMAL(15, 2), -- account balance after transaction (from SMS)
  status VARCHAR(20) DEFAULT 'confirmed', -- 'pending', 'confirmed'
  is_recurring BOOLEAN DEFAULT false,
  recurring_frequency VARCHAR(20), -- 'daily', 'weekly', 'monthly'
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP -- soft delete
);

-- Indexes for performance
CREATE INDEX idx_user_expenses ON expenses(user_id, expense_date);
CREATE INDEX idx_category_expenses ON expenses(category_id);
CREATE INDEX idx_upi_ref ON expenses(upi_ref_number);
```

### 4. Incomes Table
Stores income transactions.

```sql
CREATE TABLE incomes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL,
  source VARCHAR(255) NOT NULL,
  payment_mode VARCHAR(50) NOT NULL, -- UPI, Cash, Bank transfer, etc.
  reference_number VARCHAR(50),
  income_date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_user_incomes ON incomes(user_id, income_date);
```

### 5. Budgets Table
Stores budget limits for categories.

```sql
CREATE TABLE budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category_id UUID REFERENCES expense_categories(id) ON DELETE CASCADE,
  monthly_limit DECIMAL(10, 2) NOT NULL,
  alert_threshold DECIMAL(3, 2) DEFAULT 0.8, -- alert at 80%
  month_year VARCHAR(7), -- 'YYYY-MM'
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, category_id, month_year)
);
```

### 6. Recurring Expenses Table
Stores recurring expense templates.

```sql
CREATE TABLE recurring_expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES expense_categories(id),
  name VARCHAR(255) NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  frequency VARCHAR(20) NOT NULL, -- 'daily', 'weekly', 'monthly', 'yearly'
  day_of_month INTEGER, -- for monthly recurring
  day_of_week VARCHAR(10), -- for weekly recurring
  next_due_date DATE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 7. SMS Parsing Log Table (For Debugging)
Logs SMS parsing attempts for debugging and improvement.

```sql
CREATE TABLE sms_parse_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  raw_sms_text TEXT NOT NULL,
  parsed_amount DECIMAL(10, 2),
  parsed_merchant VARCHAR(255),
  parsed_date TIMESTAMP,
  parse_status VARCHAR(20), -- 'success', 'partial', 'failed'
  expense_id UUID REFERENCES expenses(id),
  created_at TIMESTAMP DEFAULT NOW()
);
```

## Row-Level Security (RLS)

Enable RLS on all tables to ensure users can only access their own data:

```sql
-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE incomes ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE recurring_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE sms_parse_logs ENABLE ROW LEVEL SECURITY;

-- Policies for users table
CREATE POLICY "Users can view their own data"
  ON users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own data"
  ON users FOR UPDATE
  USING (auth.uid() = id);

-- Policies for expense_categories table
CREATE POLICY "Users can view their own categories"
  ON expense_categories FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own categories"
  ON expense_categories FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own categories"
  ON expense_categories FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own categories"
  ON expense_categories FOR DELETE
  USING (auth.uid() = user_id);

-- Policies for expenses table
CREATE POLICY "Users can view their own expenses"
  ON expenses FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own expenses"
  ON expenses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own expenses"
  ON expenses FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own expenses"
  ON expenses FOR DELETE
  USING (auth.uid() = user_id);

-- Policies for incomes table
CREATE POLICY "Users can view their own incomes"
  ON incomes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own incomes"
  ON incomes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own incomes"
  ON incomes FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own incomes"
  ON incomes FOR DELETE
  USING (auth.uid() = user_id);

-- Policies for budgets table
CREATE POLICY "Users can view their own budgets"
  ON budgets FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own budgets"
  ON budgets FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own budgets"
  ON budgets FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own budgets"
  ON budgets FOR DELETE
  USING (auth.uid() = user_id);

-- Policies for recurring_expenses table
CREATE POLICY "Users can view their own recurring expenses"
  ON recurring_expenses FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own recurring expenses"
  ON recurring_expenses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own recurring expenses"
  ON recurring_expenses FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own recurring expenses"
  ON recurring_expenses FOR DELETE
  USING (auth.uid() = user_id);

-- Policies for sms_parse_logs table
CREATE POLICY "Users can view their own SMS logs"
  ON sms_parse_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own SMS logs"
  ON sms_parse_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);
```

## Sample Data

To get started quickly, you can insert some sample categories:

```sql
-- Insert sample expense categories
INSERT INTO expense_categories (user_id, name, icon, color, is_custom, order_index)
VALUES 
  ('00000000-0000-0000-0000-000000000000', 'Food', '🍔', '#F59E0B', false, 0),
  ('00000000-0000-0000-0000-000000000000', 'Transport', '🚗', '#3B82F6', false, 1),
  ('00000000-0000-0000-0000-000000000000', 'Health', '🏥', '#EF4444', false, 2),
  ('00000000-0000-0000-0000-000000000000', 'Shopping', '🛍️', '#EC4899', false, 3),
  ('00000000-0000-0000-0000-000000000000', 'Rent & Bills', '🏠', '#8B5CF6', false, 4),
  ('00000000-0000-0000-0000-000000000000', 'Subscriptions', '📱', '#06B6D4', false, 5),
  ('00000000-0000-0000-0000-000000000000', 'Entertainment', '🎮', '#10B981', false, 6),
  ('00000000-0000-0000-0000-000000000000', 'Travel', '✈️', '#F97316', false, 7),
  ('00000000-0000-0000-0000-000000000000', 'Education', '📚', '#6366F1', false, 8),
  ('00000000-0000-0000-0000-000000000000', 'Gifts', '🎁', '#D946EF', false, 9),
  ('00000000-0000-0000-0000-000000000000', 'Work', '💼', '#64748B', false, 10),
  ('00000000-0000-0000-0000-000000000000', 'Others', '📦', '#94A3B8', false, 11);
```

Note: Replace the user_id with an actual user ID from your users table when inserting sample data.

## Connection Information

When connecting to your Supabase database, use:

- **URL**: Found in your Supabase project settings under API
- **ANON Key**: For client-side connections (frontend)
- **SERVICE_KEY**: For server-side connections (backend) - has elevated privileges

Never expose your SERVICE_KEY in client-side code!