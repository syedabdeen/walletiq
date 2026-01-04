-- Allow super admins to update profiles
DROP POLICY IF EXISTS "Super admins can update all profiles" ON public.profiles;
CREATE POLICY "Super admins can update all profiles"
ON public.profiles
FOR UPDATE
TO authenticated
USING (public.is_super_admin(auth.uid()));

-- Allow super admins to delete profiles
DROP POLICY IF EXISTS "Super admins can delete profiles" ON public.profiles;
CREATE POLICY "Super admins can delete profiles"
ON public.profiles
FOR DELETE
TO authenticated
USING (public.is_super_admin(auth.uid()));

-- Allow super admins to view all user_settings
DROP POLICY IF EXISTS "Super admins can view all user_settings" ON public.user_settings;
CREATE POLICY "Super admins can view all user_settings"
ON public.user_settings
FOR SELECT
TO authenticated
USING (public.is_super_admin(auth.uid()));

-- Allow super admins to delete user_settings
DROP POLICY IF EXISTS "Super admins can delete user_settings" ON public.user_settings;
CREATE POLICY "Super admins can delete user_settings"
ON public.user_settings
FOR DELETE
TO authenticated
USING (public.is_super_admin(auth.uid()));

-- Allow super admins to view all expense_categories
DROP POLICY IF EXISTS "Super admins can view all expense_categories" ON public.expense_categories;
CREATE POLICY "Super admins can view all expense_categories"
ON public.expense_categories
FOR SELECT
TO authenticated
USING (public.is_super_admin(auth.uid()));

-- Allow super admins to delete expense_categories
DROP POLICY IF EXISTS "Super admins can delete expense_categories" ON public.expense_categories;
CREATE POLICY "Super admins can delete expense_categories"
ON public.expense_categories
FOR DELETE
TO authenticated
USING (public.is_super_admin(auth.uid()));

-- Allow super admins to view all user_subscriptions
DROP POLICY IF EXISTS "Super admins can view all subscriptions" ON public.user_subscriptions;
CREATE POLICY "Super admins can view all subscriptions"
ON public.user_subscriptions
FOR SELECT
TO authenticated
USING (public.is_super_admin(auth.uid()));

-- Allow super admins to delete user_subscriptions
DROP POLICY IF EXISTS "Super admins can delete subscriptions" ON public.user_subscriptions;
CREATE POLICY "Super admins can delete subscriptions"
ON public.user_subscriptions
FOR DELETE
TO authenticated
USING (public.is_super_admin(auth.uid()));