-- Create test user in auth.users with email confirmed
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  role,
  aud,
  confirmation_token
)
SELECT 
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000000',
  'testuser@walletiq.app',
  crypt('Test@123', gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"full_name":"Test User"}'::jsonb,
  now(),
  now(),
  'authenticated',
  'authenticated',
  ''
WHERE NOT EXISTS (
  SELECT 1 FROM auth.users WHERE email = 'testuser@walletiq.app'
);

-- Update super admin password
UPDATE auth.users 
SET encrypted_password = crypt('Admin@123', gen_salt('bf')),
    updated_at = now()
WHERE email = 'superadmin@walletiq.app';

-- Ensure admin role exists and doesn't require password change
INSERT INTO public.admin_roles (user_id, role, must_change_password)
SELECT id, 'super_admin', false 
FROM auth.users 
WHERE email = 'superadmin@walletiq.app'
ON CONFLICT (user_id) DO UPDATE SET must_change_password = false;