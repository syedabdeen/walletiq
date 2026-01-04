-- Create trigger to call handle_new_user when a new user signs up
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Backfill: Create profiles for any users missing them
INSERT INTO public.profiles (user_id, full_name, created_at, updated_at)
SELECT
  u.id,
  u.raw_user_meta_data ->> 'full_name',
  u.created_at,
  u.created_at
FROM auth.users u
LEFT JOIN public.profiles p ON p.user_id = u.id
WHERE p.user_id IS NULL
ON CONFLICT (user_id) DO NOTHING;

-- Backfill: Create user_settings for any users missing them
INSERT INTO public.user_settings (user_id, created_at, updated_at)
SELECT
  u.id,
  u.created_at,
  u.created_at
FROM auth.users u
LEFT JOIN public.user_settings us ON us.user_id = u.id
WHERE us.user_id IS NULL
ON CONFLICT (user_id) DO NOTHING;

-- Backfill: Create default expense categories for users missing them
INSERT INTO public.expense_categories (user_id, name, icon, is_default)
SELECT u.id, cat.name, cat.icon, true
FROM auth.users u
CROSS JOIN (
  VALUES 
    ('Food & Groceries', 'utensils'),
    ('Travel & Transportation', 'car'),
    ('Education', 'graduation-cap'),
    ('House Rent', 'home'),
    ('Utilities', 'zap'),
    ('Cleaning & Maintenance', 'sparkles'),
    ('Medical & Health', 'heart-pulse'),
    ('Shopping', 'shopping-bag'),
    ('Entertainment', 'tv'),
    ('Bills', 'receipt'),
    ('Subscription', 'repeat'),
    ('Water & Electricity', 'lightbulb'),
    ('Miscellaneous', 'folder')
) AS cat(name, icon)
WHERE NOT EXISTS (
  SELECT 1 FROM public.expense_categories ec 
  WHERE ec.user_id = u.id AND ec.name = cat.name
);