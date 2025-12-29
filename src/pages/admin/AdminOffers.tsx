import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent } from '@/components/ui/card';

export default function AdminOffers() {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div><h1 className="text-2xl font-bold text-white">Promotional Offers</h1><p className="text-slate-400">Create and manage discount offers</p></div>
        <Card className="bg-slate-800 border-slate-700"><CardContent className="p-6 text-center text-slate-400">Offers management coming soon</CardContent></Card>
      </div>
    </AdminLayout>
  );
}
