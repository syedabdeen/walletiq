import { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  useAllWhitelistRequests,
  useApproveWhitelistRequest,
  useRejectWhitelistRequest,
  WhitelistRequest,
} from '@/hooks/useWhitelistRequests';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { Loader2, CheckCircle, XCircle, Clock, Smartphone } from 'lucide-react';
import { format } from 'date-fns';

export default function AdminWhitelistRequests() {
  const { data: requests, isLoading } = useAllWhitelistRequests();
  const { mutate: approveRequest, isPending: isApproving } = useApproveWhitelistRequest();
  const { mutate: rejectRequest, isPending: isRejecting } = useRejectWhitelistRequest();
  const { user } = useAdminAuth();

  const [selectedRequest, setSelectedRequest] = useState<WhitelistRequest | null>(null);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  // Get user profiles for display
  const userIds = requests?.map((r) => r.user_id) || [];
  const { data: profiles } = useQuery({
    queryKey: ['admin-profiles', userIds],
    queryFn: async () => {
      if (userIds.length === 0) return {};
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, full_name')
        .in('user_id', userIds);

      if (error) throw error;
      
      const profileMap: Record<string, string> = {};
      data?.forEach((p) => {
        profileMap[p.user_id] = p.full_name || 'Unknown User';
      });
      return profileMap;
    },
    enabled: userIds.length > 0,
  });

  const handleApprove = (request: WhitelistRequest) => {
    if (!user) return;
    approveRequest({
      requestId: request.id,
      userId: request.user_id,
      newDeviceId: request.new_device_id,
      adminId: user.id,
      adminResponse: 'Request approved',
    });
  };

  const handleRejectClick = (request: WhitelistRequest) => {
    setSelectedRequest(request);
    setRejectReason('');
    setRejectDialogOpen(true);
  };

  const handleRejectConfirm = () => {
    if (!selectedRequest || !user || !rejectReason.trim()) return;
    rejectRequest(
      {
        requestId: selectedRequest.id,
        adminId: user.id,
        adminResponse: rejectReason.trim(),
      },
      {
        onSuccess: () => {
          setRejectDialogOpen(false);
          setSelectedRequest(null);
          setRejectReason('');
        },
      }
    );
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/30">
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </Badge>
        );
      case 'approved':
        return (
          <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/30">
            <CheckCircle className="w-3 h-3 mr-1" />
            Approved
          </Badge>
        );
      case 'rejected':
        return (
          <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/30">
            <XCircle className="w-3 h-3 mr-1" />
            Rejected
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const pendingRequests = requests?.filter((r) => r.status === 'pending') || [];
  const processedRequests = requests?.filter((r) => r.status !== 'pending') || [];

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Whitelist Requests</h1>
          <p className="text-slate-400">Manage device change requests from users</p>
        </div>

        {/* Pending Requests */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Smartphone className="w-5 h-5" />
              Pending Requests
              {pendingRequests.length > 0 && (
                <Badge className="bg-yellow-500 text-black ml-2">{pendingRequests.length}</Badge>
              )}
            </CardTitle>
            <CardDescription className="text-slate-400">
              Users requesting to access their account from a new device
            </CardDescription>
          </CardHeader>
          <CardContent>
            {pendingRequests.length === 0 ? (
              <p className="text-slate-400 text-center py-8">No pending requests</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-700">
                    <TableHead className="text-slate-300">User</TableHead>
                    <TableHead className="text-slate-300">Reason</TableHead>
                    <TableHead className="text-slate-300">Requested</TableHead>
                    <TableHead className="text-slate-300 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingRequests.map((request) => (
                    <TableRow key={request.id} className="border-slate-700">
                      <TableCell className="text-white font-medium">
                        {profiles?.[request.user_id] || 'Loading...'}
                      </TableCell>
                      <TableCell className="text-slate-300 max-w-xs truncate">
                        {request.reason}
                      </TableCell>
                      <TableCell className="text-slate-400">
                        {format(new Date(request.created_at), 'MMM d, yyyy HH:mm')}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-green-500 border-green-500/30 hover:bg-green-500/10"
                            onClick={() => handleApprove(request)}
                            disabled={isApproving}
                          >
                            {isApproving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-1" />}
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-500 border-red-500/30 hover:bg-red-500/10"
                            onClick={() => handleRejectClick(request)}
                            disabled={isRejecting}
                          >
                            <XCircle className="w-4 h-4 mr-1" />
                            Reject
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Request History */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Request History</CardTitle>
            <CardDescription className="text-slate-400">
              Previously processed requests
            </CardDescription>
          </CardHeader>
          <CardContent>
            {processedRequests.length === 0 ? (
              <p className="text-slate-400 text-center py-8">No processed requests yet</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-700">
                    <TableHead className="text-slate-300">User</TableHead>
                    <TableHead className="text-slate-300">Reason</TableHead>
                    <TableHead className="text-slate-300">Status</TableHead>
                    <TableHead className="text-slate-300">Admin Response</TableHead>
                    <TableHead className="text-slate-300">Reviewed</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {processedRequests.map((request) => (
                    <TableRow key={request.id} className="border-slate-700">
                      <TableCell className="text-white font-medium">
                        {profiles?.[request.user_id] || 'Loading...'}
                      </TableCell>
                      <TableCell className="text-slate-300 max-w-xs truncate">
                        {request.reason}
                      </TableCell>
                      <TableCell>{getStatusBadge(request.status)}</TableCell>
                      <TableCell className="text-slate-400 max-w-xs truncate">
                        {request.admin_response || '-'}
                      </TableCell>
                      <TableCell className="text-slate-400">
                        {request.reviewed_at
                          ? format(new Date(request.reviewed_at), 'MMM d, yyyy HH:mm')
                          : '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent className="bg-slate-800 border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-white">Reject Request</DialogTitle>
            <DialogDescription className="text-slate-400">
              Please provide a reason for rejecting this request. The user will see this message.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reject-reason" className="text-white">
                Rejection Reason
              </Label>
              <Textarea
                id="reject-reason"
                placeholder="e.g., Suspicious activity detected, please contact support..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="bg-slate-900 border-slate-600 text-white"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleRejectConfirm}
              disabled={isRejecting || !rejectReason.trim()}
            >
              {isRejecting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Reject Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
