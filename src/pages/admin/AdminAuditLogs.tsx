import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuditLogs } from '@/hooks/useAdminData';
import { Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export default function AdminAuditLogs() {
  const { data: logs, isLoading } = useAuditLogs();

  if (isLoading) {
    return <AdminLayout><div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div></AdminLayout>;
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div><h1 className="text-2xl font-bold text-white">Audit Logs</h1><p className="text-slate-400">System activity and changes log</p></div>

        <Card className="bg-slate-800 border-slate-700">
          <CardHeader><CardTitle className="text-white">Recent Activity</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="border-slate-700">
                  <TableHead className="text-slate-300">Timestamp</TableHead>
                  <TableHead className="text-slate-300">Action</TableHead>
                  <TableHead className="text-slate-300">Entity Type</TableHead>
                  <TableHead className="text-slate-300">Entity ID</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs?.map((log) => (
                  <TableRow key={log.id} className="border-slate-700">
                    <TableCell className="text-slate-300">{format(new Date(log.created_at), 'PPpp')}</TableCell>
                    <TableCell className="text-white">{log.action}</TableCell>
                    <TableCell className="text-slate-300">{log.entity_type}</TableCell>
                    <TableCell className="text-slate-400 font-mono text-xs">{log.entity_id || '-'}</TableCell>
                  </TableRow>
                ))}
                {(!logs || logs.length === 0) && (
                  <TableRow><TableCell colSpan={4} className="text-center text-slate-400 py-8">No audit logs found</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
