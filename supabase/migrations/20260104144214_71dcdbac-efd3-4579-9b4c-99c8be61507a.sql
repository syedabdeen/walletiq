-- Fix RLS policies that have RESTRICTIVE AND conflicts between user policies and super admin policies
-- The issue: multiple RESTRICTIVE policies combine with AND, blocking normal users

-- =====================
-- user_subscriptions table
-- =====================
-- The "Users can view their own subscriptions" policy already has OR is_super_admin,
-- so we need to drop the redundant super admin SELECT policy
DROP POLICY IF EXISTS "Super admins can view all subscriptions" ON public.user_subscriptions;

-- =====================
-- profiles table
-- =====================
-- Drop super admin policies that conflict with user policies (they combine with AND since all are RESTRICTIVE)
DROP POLICY IF EXISTS "Super admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Super admins can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Super admins can delete profiles" ON public.profiles;

-- Re-create user policies with OR is_super_admin to allow super admin access
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile"
ON public.profiles FOR SELECT
USING (auth.uid() = user_id OR is_super_admin(auth.uid()));

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
USING (auth.uid() = user_id OR is_super_admin(auth.uid()));

-- Create policy for super admin delete (no conflict since users can't delete)
CREATE POLICY "Super admins can delete profiles"
ON public.profiles FOR DELETE
USING (is_super_admin(auth.uid()));

-- =====================
-- user_settings table
-- =====================
-- Drop conflicting super admin policies
DROP POLICY IF EXISTS "Super admins can view all user_settings" ON public.user_settings;
DROP POLICY IF EXISTS "Super admins can delete user_settings" ON public.user_settings;

-- Re-create user SELECT policy with OR is_super_admin
DROP POLICY IF EXISTS "Users can view their own settings" ON public.user_settings;
CREATE POLICY "Users can view their own settings"
ON public.user_settings FOR SELECT
USING (auth.uid() = user_id OR is_super_admin(auth.uid()));

-- Create policy for super admin delete
CREATE POLICY "Super admins can delete user_settings"
ON public.user_settings FOR DELETE
USING (is_super_admin(auth.uid()));

-- =====================
-- expense_categories table
-- =====================
-- Drop conflicting super admin policies
DROP POLICY IF EXISTS "Super admins can view all expense_categories" ON public.expense_categories;
DROP POLICY IF EXISTS "Super admins can delete expense_categories" ON public.expense_categories;

-- Re-create user policies with OR is_super_admin
DROP POLICY IF EXISTS "Users can view their own categories" ON public.expense_categories;
CREATE POLICY "Users can view their own categories"
ON public.expense_categories FOR SELECT
USING (auth.uid() = user_id OR is_super_admin(auth.uid()));

DROP POLICY IF EXISTS "Users can delete their own categories" ON public.expense_categories;
CREATE POLICY "Users can delete their own categories"
ON public.expense_categories FOR DELETE
USING (auth.uid() = user_id OR is_super_admin(auth.uid()));