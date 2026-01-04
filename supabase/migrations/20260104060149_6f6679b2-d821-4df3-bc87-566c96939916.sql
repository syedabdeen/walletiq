-- Drop the existing SELECT policy that only allows authenticated users
DROP POLICY IF EXISTS "Anyone can view active subscription plans" ON public.subscription_plans;

-- Create a new policy that allows both authenticated and anonymous users to view active plans
CREATE POLICY "Anyone can view active subscription plans" 
ON public.subscription_plans 
FOR SELECT 
USING (is_active = true);

-- Also fix subscription_offers for the same reason
DROP POLICY IF EXISTS "Anyone can view active offers" ON public.subscription_offers;

CREATE POLICY "Anyone can view active offers" 
ON public.subscription_offers 
FOR SELECT 
USING (is_active = true AND valid_from <= now() AND valid_until >= now());