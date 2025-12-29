import { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { useAllOffers, useCreateOffer, useUpdateOffer } from '@/hooks/useAdminData';
import { SubscriptionType } from '@/hooks/useSubscription';
import { Loader2, Plus, Tag, Calendar, Users, Percent } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

export default function AdminOffers() {
  const { data: offers, isLoading } = useAllOffers();
  const createOffer = useCreateOffer();
  const updateOffer = useUpdateOffer();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newOffer, setNewOffer] = useState({
    name: '',
    description: '',
    discount_percent: 10,
    applicable_plans: ['monthly', 'yearly'] as SubscriptionType[],
    for_new_subscribers: true,
    for_existing_subscribers: false,
    valid_from: format(new Date(), 'yyyy-MM-dd'),
    valid_until: format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
  });

  const handleCreate = async () => {
    if (!newOffer.name || !newOffer.discount_percent) {
      toast.error('Please fill in required fields');
      return;
    }

    try {
      await createOffer.mutateAsync({
        name: newOffer.name,
        description: newOffer.description || undefined,
        discount_percent: newOffer.discount_percent,
        applicable_plans: newOffer.applicable_plans,
        for_new_subscribers: newOffer.for_new_subscribers,
        for_existing_subscribers: newOffer.for_existing_subscribers,
        valid_from: new Date(newOffer.valid_from).toISOString(),
        valid_until: new Date(newOffer.valid_until).toISOString(),
      });
      setIsCreateOpen(false);
      setNewOffer({
        name: '',
        description: '',
        discount_percent: 10,
        applicable_plans: ['monthly', 'yearly'],
        for_new_subscribers: true,
        for_existing_subscribers: false,
        valid_from: format(new Date(), 'yyyy-MM-dd'),
        valid_until: format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
      });
    } catch {
      // Error handled by mutation
    }
  };

  const toggleOfferActive = (id: string, currentStatus: boolean) => {
    updateOffer.mutate({ id, updates: { is_active: !currentStatus } });
  };

  const togglePlan = (plan: SubscriptionType) => {
    setNewOffer(prev => ({
      ...prev,
      applicable_plans: prev.applicable_plans.includes(plan)
        ? prev.applicable_plans.filter(p => p !== plan)
        : [...prev.applicable_plans, plan]
    }));
  };

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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Promotional Offers</h1>
            <p className="text-slate-400">Create and manage discount offers</p>
          </div>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button className="bg-emerald-600 hover:bg-emerald-700">
                <Plus className="w-4 h-4 mr-2" />
                Create Offer
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-md">
              <DialogHeader>
                <DialogTitle>Create New Offer</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label>Offer Name *</Label>
                  <Input
                    placeholder="e.g., New Year Special"
                    value={newOffer.name}
                    onChange={(e) => setNewOffer({ ...newOffer, name: e.target.value })}
                    className="bg-slate-900 border-slate-600"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    placeholder="Offer description..."
                    value={newOffer.description}
                    onChange={(e) => setNewOffer({ ...newOffer, description: e.target.value })}
                    className="bg-slate-900 border-slate-600"
                    rows={2}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Discount Percentage *</Label>
                  <Input
                    type="number"
                    min="1"
                    max="100"
                    value={newOffer.discount_percent}
                    onChange={(e) => setNewOffer({ ...newOffer, discount_percent: parseInt(e.target.value) || 0 })}
                    className="bg-slate-900 border-slate-600"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Applicable Plans</Label>
                  <div className="flex gap-4">
                    {(['monthly', 'yearly'] as SubscriptionType[]).map(plan => (
                      <div key={plan} className="flex items-center gap-2">
                        <Checkbox
                          id={plan}
                          checked={newOffer.applicable_plans.includes(plan)}
                          onCheckedChange={() => togglePlan(plan)}
                        />
                        <label htmlFor={plan} className="text-sm capitalize">{plan}</label>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Valid From</Label>
                    <Input
                      type="date"
                      value={newOffer.valid_from}
                      onChange={(e) => setNewOffer({ ...newOffer, valid_from: e.target.value })}
                      className="bg-slate-900 border-slate-600"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Valid Until</Label>
                    <Input
                      type="date"
                      value={newOffer.valid_until}
                      onChange={(e) => setNewOffer({ ...newOffer, valid_until: e.target.value })}
                      className="bg-slate-900 border-slate-600"
                    />
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>For New Subscribers</Label>
                    <Switch
                      checked={newOffer.for_new_subscribers}
                      onCheckedChange={(checked) => setNewOffer({ ...newOffer, for_new_subscribers: checked })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>For Existing Subscribers</Label>
                    <Switch
                      checked={newOffer.for_existing_subscribers}
                      onCheckedChange={(checked) => setNewOffer({ ...newOffer, for_existing_subscribers: checked })}
                    />
                  </div>
                </div>
                <Button
                  onClick={handleCreate}
                  disabled={createOffer.isPending}
                  className="w-full bg-emerald-600 hover:bg-emerald-700"
                >
                  {createOffer.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Create Offer
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Active Offers */}
        <div className="grid gap-4">
          {offers?.length === 0 && (
            <Card className="bg-slate-800 border-slate-700">
              <CardContent className="p-8 text-center">
                <Tag className="w-12 h-12 mx-auto text-slate-500 mb-4" />
                <p className="text-slate-400">No offers created yet</p>
                <p className="text-sm text-slate-500">Create your first promotional offer to attract more subscribers</p>
              </CardContent>
            </Card>
          )}

          {offers?.map((offer) => {
            const isExpired = new Date(offer.valid_until) < new Date();
            const isUpcoming = new Date(offer.valid_from) > new Date();

            return (
              <Card key={offer.id} className="bg-slate-800 border-slate-700">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-bold text-white">{offer.name}</h3>
                        <Badge variant={offer.is_active && !isExpired ? 'default' : 'secondary'}>
                          {isExpired ? 'Expired' : isUpcoming ? 'Upcoming' : offer.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                      {offer.description && (
                        <p className="text-sm text-slate-400">{offer.description}</p>
                      )}
                      <div className="flex flex-wrap gap-4 text-sm">
                        <div className="flex items-center gap-1 text-emerald-400">
                          <Percent className="w-4 h-4" />
                          <span>{offer.discount_percent}% discount</span>
                        </div>
                        <div className="flex items-center gap-1 text-slate-400">
                          <Calendar className="w-4 h-4" />
                          <span>{format(new Date(offer.valid_from), 'PP')} - {format(new Date(offer.valid_until), 'PP')}</span>
                        </div>
                        <div className="flex items-center gap-1 text-slate-400">
                          <Users className="w-4 h-4" />
                          <span>
                            {offer.for_new_subscribers && offer.for_existing_subscribers
                              ? 'All users'
                              : offer.for_new_subscribers
                              ? 'New users only'
                              : 'Existing users only'}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {offer.applicable_plans.map(plan => (
                          <Badge key={plan} variant="outline" className="capitalize border-slate-600">
                            {plan}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={offer.is_active}
                        onCheckedChange={() => toggleOfferActive(offer.id, offer.is_active)}
                        disabled={isExpired}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </AdminLayout>
  );
}
