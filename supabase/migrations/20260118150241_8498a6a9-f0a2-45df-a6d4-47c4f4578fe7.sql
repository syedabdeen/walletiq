-- Add is_whitelisted column to profiles table
ALTER TABLE public.profiles
ADD COLUMN is_whitelisted boolean NOT NULL DEFAULT false;

-- Update check_device_access function to check whitelist status
CREATE OR REPLACE FUNCTION public.check_device_access(_device_id text, _user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    existing_device record;
    user_email text;
    user_whitelisted boolean;
    result jsonb;
BEGIN
    -- Get user email from auth.users
    SELECT email INTO user_email
    FROM auth.users
    WHERE id = _user_id;

    -- Whitelist: Super admins bypass device check
    IF EXISTS (SELECT 1 FROM public.admin_roles WHERE user_id = _user_id AND role = 'super_admin') THEN
        result := jsonb_build_object('allowed', true, 'reason', 'super_admin_whitelisted');
        RETURN result;
    END IF;

    -- Whitelist: Test users (emails containing 'test' or ending with '@walletiq.app')
    IF user_email ILIKE '%test%' OR user_email ILIKE '%@walletiq.app' THEN
        result := jsonb_build_object('allowed', true, 'reason', 'test_user_whitelisted');
        RETURN result;
    END IF;

    -- Check if user is admin-whitelisted (can login from any device)
    SELECT is_whitelisted INTO user_whitelisted
    FROM public.profiles
    WHERE user_id = _user_id;

    IF user_whitelisted = true THEN
        -- User is whitelisted by admin, allow access from any device
        -- Update or insert device record for tracking purposes
        INSERT INTO public.user_devices (user_id, device_id)
        VALUES (_user_id, _device_id)
        ON CONFLICT (user_id) 
        DO UPDATE SET device_id = _device_id, last_seen_at = now();
        
        result := jsonb_build_object('allowed', true, 'reason', 'admin_whitelisted');
        RETURN result;
    END IF;

    -- Check if user has a registered device
    SELECT * INTO existing_device
    FROM public.user_devices
    WHERE user_id = _user_id;
    
    IF existing_device IS NULL THEN
        -- No device registered, allow access and register this device
        INSERT INTO public.user_devices (user_id, device_id)
        VALUES (_user_id, _device_id);
        
        result := jsonb_build_object('allowed', true, 'reason', 'device_registered');
    ELSIF existing_device.device_id = _device_id THEN
        -- Same device, update last seen and allow
        UPDATE public.user_devices
        SET last_seen_at = now()
        WHERE user_id = _user_id;
        
        result := jsonb_build_object('allowed', true, 'reason', 'device_matched');
    ELSE
        -- Different device, deny access
        result := jsonb_build_object('allowed', false, 'reason', 'device_mismatch');
    END IF;
    
    RETURN result;
END;
$$;