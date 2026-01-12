import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useSubscriptionStats } from '@/hooks/useAdminData';
import { usePendingWhitelistCount } from '@/hooks/useWhitelistRequests';
import { Users, CreditCard, TrendingUp, DollarSign, Loader2, Smartphone, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function AdminDashboard() {
  const { data: stats, isLoading } = useSubscriptionStats();
  const { data: pendingCount } = usePendingWhitelistCount();
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  const statCards = [
    {
      title: 'Total Users',
      value: stats?.totalUsers || 0,
      icon: Users,
      color: 'text-blue-400',
      bg: 'bg-blue-400/10',
    },
    {
      title: 'Active Subscriptions',
      value: stats?.activeSubscriptions || 0,
      icon: CreditCard,
      color: 'text-green-400',
      bg: 'bg-green-400/10',
    },
    {
      title: 'Expired',
      value: stats?.expiredSubscriptions || 0,
      icon: TrendingUp,
      color: 'text-red-400',
      bg: 'bg-red-400/10',
    },
    {
      title: 'Total Revenue',
      value: `$${stats?.totalRevenue?.toFixed(2) || '0.00'}`,
      icon: DollarSign,
      color: 'text-yellow-400',
      bg: 'bg-yellow-400/10',
    },
  ];

  const breakdownCards = [
    { title: 'Trial Users', value: stats?.trialUsers || 0, color: 'text-purple-400' },
    { title: 'Monthly Users', value: stats?.monthlyUsers || 0, color: 'text-blue-400' },
    { title: 'Yearly Users', value: stats?.yearlyUsers || 0, color: 'text-green-400' },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-slate-400">Overview of your subscription business</p>
        </div>

        {/* Pending Whitelist Requests Alert */}
        {pendingCount && pendingCount > 0 ? (
          <Card className="bg-yellow-500/10 border-yellow-500/30">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-yellow-500/20">
                    <Smartphone className="w-5 h-5 text-yellow-500" />
                  </div>
                  <div>
                    <p className="font-medium text-yellow-500">
                      {pendingCount} Pending Whitelist Request{pendingCount > 1 ? 's' : ''}
                    </p>
                    <p className="text-sm text-yellow-500/70">
                      Users are requesting device access approval
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  className="text-yellow-500 border-yellow-500/30 hover:bg-yellow-500/10"
                  onClick={() => navigate('/admin/whitelist-requests')}
                >
                  View Requests
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : null}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((stat) => (
            <Card key={stat.title} className="bg-slate-800 border-slate-700">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-400">{stat.title}</p>
                    <p className="text-2xl font-bold text-white mt-1">{stat.value}</p>
                  </div>
                  <div className={`p-3 rounded-lg ${stat.bg}`}>
                    <stat.icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Subscription Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Subscription Breakdown</CardTitle>
              <CardDescription className="text-slate-400">
                Active subscriptions by type
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {breakdownCards.map((item) => (
                  <div key={item.title} className="flex items-center justify-between">
                    <span className="text-slate-300">{item.title}</span>
                    <span className={`font-bold ${item.color}`}>{item.value}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Revenue Breakdown</CardTitle>
              <CardDescription className="text-slate-400">
                Revenue by subscription type
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-slate-300">Monthly Revenue</span>
                  <span className="font-bold text-blue-400">${stats?.monthlyRevenue?.toFixed(2) || '0.00'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-300">Yearly Revenue</span>
                  <span className="font-bold text-green-400">${stats?.yearlyRevenue?.toFixed(2) || '0.00'}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
