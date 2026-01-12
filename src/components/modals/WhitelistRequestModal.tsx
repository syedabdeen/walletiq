import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useSubmitWhitelistRequest, useMyWhitelistRequests } from '@/hooks/useWhitelistRequests';
import { Loader2, AlertCircle, Clock, CheckCircle, XCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface WhitelistRequestModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  currentDeviceId: string;
  newDeviceId: string;
}

export function WhitelistRequestModal({
  open,
  onOpenChange,
  userId,
  currentDeviceId,
  newDeviceId,
}: WhitelistRequestModalProps) {
  const [reason, setReason] = useState('');
  const { mutate: submitRequest, isPending } = useSubmitWhitelistRequest();
  const { data: myRequests, isLoading: loadingRequests } = useMyWhitelistRequests(userId);

  // Check if there's already a pending request for this device
  const existingPendingRequest = myRequests?.find(
    (r) => r.status === 'pending' && r.new_device_id === newDeviceId
  );
  
  const lastRequest = myRequests?.[0];

  const handleSubmit = () => {
    if (!reason.trim()) return;

    submitRequest(
      {
        userId,
        currentDeviceId,
        newDeviceId,
        reason: reason.trim(),
      },
      {
        onSuccess: () => {
          setReason('');
        },
      }
    );
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case 'approved':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'rejected':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-orange-500" />
            Device Access Request
          </DialogTitle>
          <DialogDescription>
            Your account is registered on a different device. You can request access from this new device.
          </DialogDescription>
        </DialogHeader>

        {loadingRequests ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : existingPendingRequest ? (
          <Alert>
            <Clock className="h-4 w-4" />
            <AlertTitle>Request Pending</AlertTitle>
            <AlertDescription>
              You already have a pending request submitted on{' '}
              {new Date(existingPendingRequest.created_at).toLocaleDateString()}.
              Please wait for admin approval.
            </AlertDescription>
          </Alert>
        ) : lastRequest?.status === 'rejected' ? (
          <div className="space-y-4">
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertTitle>Previous Request Rejected</AlertTitle>
              <AlertDescription>
                {lastRequest.admin_response || 'Your request was rejected by an administrator.'}
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label htmlFor="reason">Why do you need to access from this device?</Label>
              <Textarea
                id="reason"
                placeholder="e.g., I got a new phone, lost my old device..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
              />
              <p className="text-xs text-muted-foreground">
                Please provide a clear reason to help the admin understand your request.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reason">Why do you need to access from this device?</Label>
              <Textarea
                id="reason"
                placeholder="e.g., I got a new phone, lost my old device..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
              />
              <p className="text-xs text-muted-foreground">
                Please provide a clear reason to help the admin understand your request.
              </p>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          {!existingPendingRequest && (
            <Button onClick={handleSubmit} disabled={isPending || !reason.trim()}>
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit Request'
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
