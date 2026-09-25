-- Auto-seed starter categories for new users
-- This trigger fires whenever a new user signs up and gives them the predefined categories

CREATE OR REPLACE FUNCTION seed_starter_categories()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert the 5 predefined categories for the new user
  INSERT INTO expense_categories (user_id, name, icon, color, is_custom, order_index)
  VALUES
    (NEW.id, 'Food', '🍔', '#FF6B6B', false, 1),
    (NEW.id, 'Ride', '🚗', '#4ECDC4', false, 2),
    (NEW.id, 'Recharge', '📱', '#95E1D3', false, 3),
    (NEW.id, 'Other', '📦', '#F38181', false, 4),
    (NEW.id, 'Don''t Know', '❓', '#AA96DA', false, 5);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop the trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created_seed_categories ON auth.users;

-- Create the trigger on auth.users
CREATE TRIGGER on_auth_user_created_seed_categories
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION seed_starter_categories();

-- Optionally: seed categories for existing users who don't have any yet
INSERT INTO expense_categories (user_id, name, icon, color, is_custom, order_index)
SELECT
  u.id,
  cat.name,
  cat.icon,
  cat.color,
  false,
  cat.order_index
FROM auth.users u
CROSS JOIN (VALUES
  ('Food', '🍔', '#FF6B6B', 1),
  ('Ride', '🚗', '#4ECDC4', 2),
  ('Recharge', '📱', '#95E1D3', 3),
  ('Other', '📦', '#F38181', 4),
  ('Don''t Know', '❓', '#AA96DA', 5)
) AS cat(name, icon, color, order_index)
WHERE NOT EXISTS (
  SELECT 1 FROM expense_categories ec WHERE ec.user_id = u.id
)
ON CONFLICT DO NOTHING;
