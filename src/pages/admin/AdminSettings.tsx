import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useSystemSettings, useUpdateSystemSetting } from '@/hooks/useAdminData';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';
import { Loader2, Save } from 'lucide-react';

export default function AdminSettings() {
  const { data: settings, isLoading } = useSystemSettings();
  const updateSetting = useUpdateSystemSetting();
  const [email, setEmail] = useState('');
  const [whatsapp, setWhatsapp] = useState('');

  useEffect(() => {
    if (settings) {
      setEmail(settings.support_email?.replace(/"/g, '') || '');
      setWhatsapp(settings.support_whatsapp?.replace(/"/g, '') || '');
    }
  }, [settings]);

  if (isLoading) {
    return <AdminLayout><div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div></AdminLayout>;
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div><h1 className="text-2xl font-bold text-white">System Settings</h1><p className="text-slate-400">Configure application settings</p></div>

        <Card className="bg-slate-800 border-slate-700">
          <CardHeader><CardTitle className="text-white">Support Contact</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-slate-300">Support Email</Label>
              <div className="flex gap-2">
                <Input value={email} onChange={(e) => setEmail(e.target.value)} className="bg-slate-900 border-slate-600 text-white" />
                <Button onClick={() => updateSetting.mutate({ key: 'support_email', value: email })} disabled={updateSetting.isPending}><Save className="w-4 h-4" /></Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">Support WhatsApp</Label>
              <div className="flex gap-2">
                <Input value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} className="bg-slate-900 border-slate-600 text-white" />
                <Button onClick={() => updateSetting.mutate({ key: 'support_whatsapp', value: whatsapp })} disabled={updateSetting.isPending}><Save className="w-4 h-4" /></Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
