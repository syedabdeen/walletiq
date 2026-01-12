-- Super admins can delete user devices (to reset device lock/whitelist)
CREATE POLICY "Super admins can delete devices"
ON public.user_devices
FOR DELETE
USING (is_super_admin(auth.uid()));