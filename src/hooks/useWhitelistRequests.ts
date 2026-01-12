import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export type WhitelistRequestStatus = 'pending' | 'approved' | 'rejected';

export interface WhitelistRequest {
  id: string;
  user_id: string;
  current_device_id: string;
  new_device_id: string;
  reason: string;
  status: WhitelistRequestStatus;
  admin_response: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
}

// User: Submit a whitelist request
export function useSubmitWhitelistRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      userId,
      currentDeviceId,
      newDeviceId,
      reason,
    }: {
      userId: string;
      currentDeviceId: string;
      newDeviceId: string;
      reason: string;
    }) => {
      const { data, error } = await supabase
        .from('whitelist_requests')
        .insert({
          user_id: userId,
          current_device_id: currentDeviceId,
          new_device_id: newDeviceId,
          reason,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-whitelist-requests'] });
      toast.success('Whitelist request submitted successfully');
    },
    onError: (error) => {
      toast.error('Failed to submit request: ' + error.message);
    },
  });
}

// User: Get their own pending request
export function useMyWhitelistRequests(userId: string | undefined) {
  return useQuery({
    queryKey: ['my-whitelist-requests', userId],
    queryFn: async () => {
      if (!userId) return [];
      
      const { data, error } = await supabase
        .from('whitelist_requests')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as WhitelistRequest[];
    },
    enabled: !!userId,
  });
}

// Admin: Get all whitelist requests
export function useAllWhitelistRequests() {
  return useQuery({
    queryKey: ['admin-whitelist-requests'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('whitelist_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as WhitelistRequest[];
    },
  });
}

// Admin: Get pending count for badge
export function usePendingWhitelistCount() {
  return useQuery({
    queryKey: ['admin-whitelist-pending-count'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('whitelist_requests')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      if (error) throw error;
      return count || 0;
    },
  });
}

// Admin: Approve a whitelist request
export function useApproveWhitelistRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      requestId,
      userId,
      newDeviceId,
      adminId,
      adminResponse,
    }: {
      requestId: string;
      userId: string;
      newDeviceId: string;
      adminId: string;
      adminResponse?: string;
    }) => {
      // First update the user's device
      const { error: deviceError } = await supabase
        .from('user_devices')
        .update({ 
          device_id: newDeviceId, 
          last_seen_at: new Date().toISOString() 
        })
        .eq('user_id', userId);

      if (deviceError) throw deviceError;

      // Then update the request status
      const { data, error } = await supabase
        .from('whitelist_requests')
        .update({
          status: 'approved',
          admin_response: adminResponse || 'Request approved',
          reviewed_by: adminId,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', requestId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-whitelist-requests'] });
      queryClient.invalidateQueries({ queryKey: ['admin-whitelist-pending-count'] });
      toast.success('Request approved - user can now login from the new device');
    },
    onError: (error) => {
      toast.error('Failed to approve request: ' + error.message);
    },
  });
}

// Admin: Reject a whitelist request
export function useRejectWhitelistRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      requestId,
      adminId,
      adminResponse,
    }: {
      requestId: string;
      adminId: string;
      adminResponse: string;
    }) => {
      const { data, error } = await supabase
        .from('whitelist_requests')
        .update({
          status: 'rejected',
          admin_response: adminResponse,
          reviewed_by: adminId,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', requestId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-whitelist-requests'] });
      queryClient.invalidateQueries({ queryKey: ['admin-whitelist-pending-count'] });
      toast.success('Request rejected');
    },
    onError: (error) => {
      toast.error('Failed to reject request: ' + error.message);
    },
  });
}
