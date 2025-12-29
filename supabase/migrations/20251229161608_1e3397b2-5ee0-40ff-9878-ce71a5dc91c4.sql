-- Create enum for subscription types
CREATE TYPE public.subscription_type AS ENUM ('free_trial', 'monthly', 'yearly');

-- Create enum for subscription status
CREATE TYPE public.subscription_status AS ENUM ('active', 'expired', 'cancelled');

-- Create enum for admin role
CREATE TYPE public.admin_role AS ENUM ('super_admin');

-- Subscription Plans table (configurable by super admin)
CREATE TABLE public.subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_type subscription_type UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC NOT NULL DEFAULT 0,
  currency_code TEXT NOT NULL DEFAULT 'USD',
  duration_days INTEGER NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- User Subscriptions table
CREATE TABLE public.user_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES public.subscription_plans(id),
  plan_type subscription_type NOT NULL,
  status subscription_status NOT NULL DEFAULT 'active',
  amount_paid NUMERIC NOT NULL DEFAULT 0,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  is_renewal BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Promotional Offers table
CREATE TABLE public.subscription_offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  discount_percent NUMERIC NOT NULL CHECK (discount_percent >= 0 AND discount_percent <= 100),
  applicable_plans subscription_type[] NOT NULL,
  for_new_subscribers BOOLEAN NOT NULL DEFAULT true,
  for_existing_subscribers BOOLEAN NOT NULL DEFAULT false,
  valid_from TIMESTAMP WITH TIME ZONE NOT NULL,
  valid_until TIMESTAMP WITH TIME ZONE NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Admin roles table (for super admin access)
CREATE TABLE public.admin_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role admin_role NOT NULL,
  must_change_password BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Audit logs table
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- System settings table (for configurable values like trial duration)
CREATE TABLE public.system_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL,
  description TEXT,
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all new tables
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- Security definer function to check admin role
CREATE OR REPLACE FUNCTION public.is_super_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.admin_roles
    WHERE user_id = _user_id
      AND role = 'super_admin'
  )
$$;

-- Security definer function to check active subscription
CREATE OR REPLACE FUNCTION public.has_active_subscription(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_subscriptions
    WHERE user_id = _user_id
      AND status = 'active'
      AND end_date > now()
  )
$$;

-- Get user subscription details function
CREATE OR REPLACE FUNCTION public.get_user_subscription(_user_id UUID)
RETURNS TABLE (
  id UUID,
  plan_type subscription_type,
  status subscription_status,
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  amount_paid NUMERIC
)
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    us.id,
    us.plan_type,
    us.status,
    us.start_date,
    us.end_date,
    us.amount_paid
  FROM public.user_subscriptions us
  WHERE us.user_id = _user_id
  ORDER BY us.created_at DESC
  LIMIT 1
$$;

-- RLS Policies for subscription_plans (readable by all authenticated, writable by super admin)
CREATE POLICY "Anyone can view active subscription plans"
ON public.subscription_plans
FOR SELECT
TO authenticated
USING (is_active = true OR public.is_super_admin(auth.uid()));

CREATE POLICY "Super admins can insert subscription plans"
ON public.subscription_plans
FOR INSERT
TO authenticated
WITH CHECK (public.is_super_admin(auth.uid()));

CREATE POLICY "Super admins can update subscription plans"
ON public.subscription_plans
FOR UPDATE
TO authenticated
USING (public.is_super_admin(auth.uid()));

CREATE POLICY "Super admins can delete subscription plans"
ON public.subscription_plans
FOR DELETE
TO authenticated
USING (public.is_super_admin(auth.uid()));

-- RLS Policies for user_subscriptions
CREATE POLICY "Users can view their own subscriptions"
ON public.user_subscriptions
FOR SELECT
TO authenticated
USING (auth.uid() = user_id OR public.is_super_admin(auth.uid()));

CREATE POLICY "Users can insert their own subscriptions"
ON public.user_subscriptions
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id OR public.is_super_admin(auth.uid()));

CREATE POLICY "Super admins can update subscriptions"
ON public.user_subscriptions
FOR UPDATE
TO authenticated
USING (public.is_super_admin(auth.uid()));

-- RLS Policies for subscription_offers
CREATE POLICY "Anyone can view active offers"
ON public.subscription_offers
FOR SELECT
TO authenticated
USING (is_active = true AND valid_until > now() OR public.is_super_admin(auth.uid()));

CREATE POLICY "Super admins can manage offers"
ON public.subscription_offers
FOR ALL
TO authenticated
USING (public.is_super_admin(auth.uid()));

-- RLS Policies for admin_roles
CREATE POLICY "Super admins can view admin roles"
ON public.admin_roles
FOR SELECT
TO authenticated
USING (public.is_super_admin(auth.uid()) OR auth.uid() = user_id);

CREATE POLICY "Super admins can manage admin roles"
ON public.admin_roles
FOR ALL
TO authenticated
USING (public.is_super_admin(auth.uid()));

-- RLS Policies for audit_logs (only super admins can view)
CREATE POLICY "Super admins can view audit logs"
ON public.audit_logs
FOR SELECT
TO authenticated
USING (public.is_super_admin(auth.uid()));

CREATE POLICY "Super admins can insert audit logs"
ON public.audit_logs
FOR INSERT
TO authenticated
WITH CHECK (public.is_super_admin(auth.uid()));

-- RLS Policies for system_settings
CREATE POLICY "Authenticated users can view system settings"
ON public.system_settings
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Super admins can manage system settings"
ON public.system_settings
FOR ALL
TO authenticated
USING (public.is_super_admin(auth.uid()));

-- Trigger to update updated_at
CREATE TRIGGER update_subscription_plans_updated_at
BEFORE UPDATE ON public.subscription_plans
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_subscriptions_updated_at
BEFORE UPDATE ON public.user_subscriptions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_subscription_offers_updated_at
BEFORE UPDATE ON public.subscription_offers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_admin_roles_updated_at
BEFORE UPDATE ON public.admin_roles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_system_settings_updated_at
BEFORE UPDATE ON public.system_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default subscription plans
INSERT INTO public.subscription_plans (plan_type, name, description, price, duration_days) VALUES
('free_trial', 'Free Trial', '14-day free trial with full access', 0, 14),
('monthly', 'Monthly', 'Monthly subscription with full access', 9.99, 30),
('yearly', 'Yearly', 'Yearly subscription with full access', 99.99, 365);

-- Insert default system settings
INSERT INTO public.system_settings (key, value, description) VALUES
('trial_duration_days', '14', 'Default trial duration in days'),
('support_email', '"cmc@wiedelens.info"', 'Support email address'),
('support_whatsapp', '"+971 52 594 3300"', 'Support WhatsApp number');