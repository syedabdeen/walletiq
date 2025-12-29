import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useAllSubscriptionPlans, useUpdateSubscriptionPlan, useSystemSettings, useUpdateSystemSetting } from '@/hooks/useAdminData';
import { Loader2, Save } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function AdminSubscriptions() {
  const { data: plans, isLoading } = useAllSubscriptionPlans();
  const { data: settings } = useSystemSettings();
  const updatePlan = useUpdateSubscriptionPlan();
  const updateSetting = useUpdateSystemSetting();
  const [trialDays, setTrialDays] = useState('14');
  const [editedPlans, setEditedPlans] = useState<Record<string, { price: string; is_active: boolean }>>({});

  useEffect(() => {
    if (settings?.trial_duration_days) {
      setTrialDays(settings.trial_duration_days.replace(/"/g, ''));
    }
    if (plans) {
      const initial: Record<string, { price: string; is_active: boolean }> = {};
      plans.forEach(p => { initial[p.id] = { price: String(p.price), is_active: p.is_active }; });
      setEditedPlans(initial);
    }
  }, [settings, plans]);

  const handleSavePlan = (id: string) => {
    const edited = editedPlans[id];
    if (!edited) return;
    updatePlan.mutate({ id, updates: { price: parseFloat(edited.price), is_active: edited.is_active } });
  };

  const handleSaveTrialDays = () => {
    updateSetting.mutate({ key: 'trial_duration_days', value: trialDays });
  };

  if (isLoading) {
    return <AdminLayout><div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div></AdminLayout>;
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div><h1 className="text-2xl font-bold text-white">Subscription Management</h1><p className="text-slate-400">Configure subscription plans and pricing</p></div>

        <Card className="bg-slate-800 border-slate-700">
          <CardHeader><CardTitle className="text-white">Trial Duration</CardTitle></CardHeader>
          <CardContent className="flex items-end gap-4">
            <div className="space-y-2 flex-1">
              <Label className="text-slate-300">Days</Label>
              <Input type="number" value={trialDays} onChange={(e) => setTrialDays(e.target.value)} className="bg-slate-900 border-slate-600 text-white" />
            </div>
            <Button onClick={handleSaveTrialDays} disabled={updateSetting.isPending}><Save className="w-4 h-4 mr-2" />Save</Button>
          </CardContent>
        </Card>

        <div className="grid gap-4">
          {plans?.map((plan) => (
            <Card key={plan.id} className="bg-slate-800 border-slate-700">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div><h3 className="text-lg font-bold text-white">{plan.name}</h3><p className="text-sm text-slate-400">{plan.description}</p></div>
                  <div className="flex items-center gap-4">
                    <div className="space-y-1">
                      <Label className="text-slate-300 text-xs">Price ($)</Label>
                      <Input type="number" step="0.01" value={editedPlans[plan.id]?.price || ''} onChange={(e) => setEditedPlans(prev => ({ ...prev, [plan.id]: { ...prev[plan.id], price: e.target.value } }))} className="w-24 bg-slate-900 border-slate-600 text-white" disabled={plan.plan_type === 'free_trial'} />
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch checked={editedPlans[plan.id]?.is_active ?? plan.is_active} onCheckedChange={(checked) => setEditedPlans(prev => ({ ...prev, [plan.id]: { ...prev[plan.id], is_active: checked } }))} />
                      <span className="text-sm text-slate-300">Active</span>
                    </div>
                    <Button size="sm" onClick={() => handleSavePlan(plan.id)} disabled={updatePlan.isPending}><Save className="w-4 h-4" /></Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
}
