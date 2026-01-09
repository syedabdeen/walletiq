
-- Update check_device_access to whitelist super admins and test users
CREATE OR REPLACE FUNCTION public.check_device_access(_user_id uuid, _device_id text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    existing_device record;
    user_email text;
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
$function$;
