-- Fix the malformed test user record by setting required string columns to empty strings
UPDATE auth.users 
SET 
  email_change = '',
  email_change_token_new = '',
  email_change_token_current = '',
  phone = '',
  phone_change = '',
  phone_change_token = '',
  recovery_token = '',
  reauthentication_token = '',
  is_sso_user = false,
  deleted_at = NULL
WHERE email = 'testuser@walletiq.app';