-- Quick Fix: Recreate the user signup trigger
-- Run this in Supabase SQL Editor

-- Drop the existing trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS create_default_categories() CASCADE;

-- Recreate the function with better error handling
CREATE OR REPLACE FUNCTION create_default_categories()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert default categories for the new user
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
  ON CONFLICT (user_id, name) DO NOTHING;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't fail the user creation
    RAISE WARNING 'Failed to create default categories for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION create_default_categories();
