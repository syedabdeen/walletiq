import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useAllUsersWithSubscriptions, useActivateUserSubscription, useUpdateUserProfile, useDeleteUser } from '@/hooks/useAdminData';
import { Loader2, UserPlus, Pencil, Trash2, X, Check } from 'lucide-react';
import { format } from 'date-fns';
import { useState } from 'react';
import { SubscriptionType } from '@/hooks/useSubscription';
import { Badge } from '@/components/ui/badge';

export default function AdminUsers() {
  const { data: users, isLoading } = useAllUsersWithSubscriptions();
  const activateSub = useActivateUserSubscription();
  const updateProfile = useUpdateUserProfile();
  const deleteUser = useDeleteUser();
  
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionType>('monthly');
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; name: string } | null>(null);

  const handleActivate = (userId: string) => {
    activateSub.mutate({ userId, planType: selectedPlan, amountPaid: 0 });
    setSelectedUser(null);
  };

  const handleStartEdit = (userId: string, currentName: string) => {
    setEditingUser(userId);
    setEditName(currentName || '');
  };

  const handleSaveEdit = (userId: string) => {
    updateProfile.mutate({ userId, fullName: editName });
    setEditingUser(null);
  };

  const handleDelete = () => {
    if (deleteConfirm) {
      deleteUser.mutate(deleteConfirm.id);
      setDeleteConfirm(null);
    }
  };

  if (isLoading) {
    return <AdminLayout><div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div></AdminLayout>;
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">User Management</h1>
          <p className="text-slate-400">View, edit, and manage user subscriptions</p>
        </div>

        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">All Users ({users?.length || 0})</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="border-slate-700">
                  <TableHead className="text-slate-300">Name</TableHead>
                  <TableHead className="text-slate-300">Registered</TableHead>
                  <TableHead className="text-slate-300">Plan</TableHead>
                  <TableHead className="text-slate-300">Status</TableHead>
                  <TableHead className="text-slate-300">Amount</TableHead>
                  <TableHead className="text-slate-300">End Date</TableHead>
                  <TableHead className="text-slate-300">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users?.map((user) => (
                  <TableRow key={user.id} className="border-slate-700">
                    <TableCell className="text-white">
                      {editingUser === user.id ? (
                        <div className="flex items-center gap-2">
                          <Input
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="h-8 w-40 bg-slate-900 border-slate-600 text-white"
                          />
                          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => handleSaveEdit(user.id)} disabled={updateProfile.isPending}>
                            <Check className="w-4 h-4 text-green-500" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setEditingUser(null)}>
                            <X className="w-4 h-4 text-slate-400" />
                          </Button>
                        </div>
                      ) : (
                        user.full_name || 'N/A'
                      )}
                    </TableCell>
                    <TableCell className="text-slate-300">{format(new Date(user.created_at), 'PP')}</TableCell>
                    <TableCell>
                      <Badge variant={user.subscription ? 'default' : 'secondary'}>
                        {user.subscription?.plan_type?.replace('_', ' ') || 'None'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.subscription?.status === 'active' ? 'default' : 'destructive'}>
                        {user.subscription?.status || 'No Sub'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-slate-300">${user.subscription?.amount_paid || 0}</TableCell>
                    <TableCell className="text-slate-300">
                      {user.subscription?.end_date ? format(new Date(user.subscription.end_date), 'PP') : '-'}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {selectedUser === user.id ? (
                          <div className="flex gap-2">
                            <Select value={selectedPlan} onValueChange={(v) => setSelectedPlan(v as SubscriptionType)}>
                              <SelectTrigger className="w-24 h-8 bg-slate-900 border-slate-600 text-white text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="free_trial">Trial</SelectItem>
                                <SelectItem value="monthly">Monthly</SelectItem>
                                <SelectItem value="yearly">Yearly</SelectItem>
                              </SelectContent>
                            </Select>
                            <Button size="sm" className="h-8" onClick={() => handleActivate(user.id)} disabled={activateSub.isPending}>
                              OK
                            </Button>
                            <Button size="sm" variant="ghost" className="h-8" onClick={() => setSelectedUser(null)}>
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        ) : (
                          <>
                            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setSelectedUser(user.id)} title="Add Subscription">
                              <UserPlus className="w-4 h-4 text-blue-400" />
                            </Button>
                            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => handleStartEdit(user.id, user.full_name || '')} title="Edit Name">
                              <Pencil className="w-4 h-4 text-yellow-400" />
                            </Button>
                            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setDeleteConfirm({ id: user.id, name: user.full_name || 'this user' })} title="Delete User">
                              <Trash2 className="w-4 h-4 text-red-400" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteConfirm} onOpenChange={(open) => !open && setDeleteConfirm(null)}>
        <DialogContent className="bg-slate-800 border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-white">Delete User</DialogTitle>
            <DialogDescription className="text-slate-400">
              Are you sure you want to delete <span className="font-semibold text-white">{deleteConfirm?.name}</span>? 
              This action cannot be undone. All user data including expenses, categories, and subscriptions will be permanently removed.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleteUser.isPending}>
              {deleteUser.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
