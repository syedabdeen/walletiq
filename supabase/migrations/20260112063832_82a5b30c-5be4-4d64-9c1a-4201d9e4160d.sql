-- Create status enum for whitelist requests
CREATE TYPE public.whitelist_request_status AS ENUM ('pending', 'approved', 'rejected');

-- Create whitelist_requests table
CREATE TABLE public.whitelist_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  current_device_id TEXT NOT NULL,
  new_device_id TEXT NOT NULL,
  reason TEXT NOT NULL,
  status public.whitelist_request_status NOT NULL DEFAULT 'pending',
  admin_response TEXT,
  reviewed_by UUID,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.whitelist_requests ENABLE ROW LEVEL SECURITY;

-- Users can create their own requests
CREATE POLICY "Users can insert their own requests"
ON public.whitelist_requests
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can view their own requests
CREATE POLICY "Users can view their own requests"
ON public.whitelist_requests
FOR SELECT
USING (auth.uid() = user_id);

-- Super admins can view all requests
CREATE POLICY "Super admins can view all requests"
ON public.whitelist_requests
FOR SELECT
USING (is_super_admin(auth.uid()));

-- Super admins can update any request (approve/reject)
CREATE POLICY "Super admins can update requests"
ON public.whitelist_requests
FOR UPDATE
USING (is_super_admin(auth.uid()));

-- Super admins can delete requests
CREATE POLICY "Super admins can delete requests"
ON public.whitelist_requests
FOR DELETE
USING (is_super_admin(auth.uid()));

-- Add trigger for updated_at
CREATE TRIGGER update_whitelist_requests_updated_at
BEFORE UPDATE ON public.whitelist_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();