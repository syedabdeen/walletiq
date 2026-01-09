-- Create table to track user devices
CREATE TABLE public.user_devices (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL UNIQUE,
    device_id text NOT NULL,
    device_info jsonb DEFAULT '{}'::jsonb,
    registered_at timestamp with time zone NOT NULL DEFAULT now(),
    last_seen_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_devices ENABLE ROW LEVEL SECURITY;

-- Users can view their own device
CREATE POLICY "Users can view their own device"
ON public.user_devices
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own device (first registration only)
CREATE POLICY "Users can register their device"
ON public.user_devices
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own device (for last_seen_at)
CREATE POLICY "Users can update their own device"
ON public.user_devices
FOR UPDATE
USING (auth.uid() = user_id);

-- Super admins can manage all devices
CREATE POLICY "Super admins can manage devices"
ON public.user_devices
FOR ALL
USING (is_super_admin(auth.uid()));

-- Create function to check if user can access from this device
CREATE OR REPLACE FUNCTION public.check_device_access(
    _user_id uuid,
    _device_id text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    existing_device record;
    result jsonb;
BEGIN
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