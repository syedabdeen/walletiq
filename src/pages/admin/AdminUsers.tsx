import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAllUsersWithSubscriptions, useActivateUserSubscription } from '@/hooks/useAdminData';
import { Loader2, UserPlus } from 'lucide-react';
import { format } from 'date-fns';
import { useState } from 'react';
import { SubscriptionType } from '@/hooks/useSubscription';
import { Badge } from '@/components/ui/badge';

export default function AdminUsers() {
  const { data: users, isLoading } = useAllUsersWithSubscriptions();
  const activateSub = useActivateUserSubscription();
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionType>('monthly');

  const handleActivate = (userId: string) => {
    activateSub.mutate({ userId, planType: selectedPlan, amountPaid: 0 });
    setSelectedUser(null);
  };

  if (isLoading) {
    return <AdminLayout><div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div></AdminLayout>;
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div><h1 className="text-2xl font-bold text-white">User Management</h1><p className="text-slate-400">View and manage user subscriptions</p></div>

        <Card className="bg-slate-800 border-slate-700">
          <CardHeader><CardTitle className="text-white">All Users ({users?.length || 0})</CardTitle></CardHeader>
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
                    <TableCell className="text-white">{user.full_name || 'N/A'}</TableCell>
                    <TableCell className="text-slate-300">{format(new Date(user.created_at), 'PP')}</TableCell>
                    <TableCell><Badge variant={user.subscription ? 'default' : 'secondary'}>{user.subscription?.plan_type || 'None'}</Badge></TableCell>
                    <TableCell><Badge variant={user.subscription?.status === 'active' ? 'default' : 'destructive'}>{user.subscription?.status || 'No Sub'}</Badge></TableCell>
                    <TableCell className="text-slate-300">${user.subscription?.amount_paid || 0}</TableCell>
                    <TableCell className="text-slate-300">{user.subscription?.end_date ? format(new Date(user.subscription.end_date), 'PP') : '-'}</TableCell>
                    <TableCell>
                      {selectedUser === user.id ? (
                        <div className="flex gap-2">
                          <Select value={selectedPlan} onValueChange={(v) => setSelectedPlan(v as SubscriptionType)}>
                            <SelectTrigger className="w-28 bg-slate-900 border-slate-600 text-white"><SelectValue /></SelectTrigger>
                            <SelectContent><SelectItem value="free_trial">Trial</SelectItem><SelectItem value="monthly">Monthly</SelectItem><SelectItem value="yearly">Yearly</SelectItem></SelectContent>
                          </Select>
                          <Button size="sm" onClick={() => handleActivate(user.id)} disabled={activateSub.isPending}>Activate</Button>
                        </div>
                      ) : (
                        <Button size="sm" variant="outline" onClick={() => setSelectedUser(user.id)}><UserPlus className="w-4 h-4 mr-1" />Add Sub</Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
