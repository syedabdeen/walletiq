import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent } from '@/components/ui/card';

export default function AdminReports() {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div><h1 className="text-2xl font-bold text-white">Reports</h1><p className="text-slate-400">Download business reports</p></div>
        <Card className="bg-slate-800 border-slate-700"><CardContent className="p-6 text-center text-slate-400">Reports module coming soon</CardContent></Card>
      </div>
    </AdminLayout>
  );
}
