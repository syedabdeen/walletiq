import { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useAllUsersWithSubscriptions, useSubscriptionStats } from '@/hooks/useAdminData';
import { CalendarIcon, Download, FileText, Loader2, Users, CreditCard, TrendingUp, DollarSign, BarChart3 } from 'lucide-react';
import { format, subDays, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { cn } from '@/lib/utils';

type ReportType = 'users' | 'subscriptions' | 'revenue' | 'trials' | 'churn' | 'offers';
type ExportFormat = 'csv' | 'pdf';

export default function AdminReports() {
  const { data: users, isLoading: usersLoading } = useAllUsersWithSubscriptions();
  const { data: stats, isLoading: statsLoading } = useSubscriptionStats();
  const [selectedReport, setSelectedReport] = useState<ReportType>('users');
  const [dateFrom, setDateFrom] = useState<Date>(subDays(new Date(), 30));
  const [dateTo, setDateTo] = useState<Date>(new Date());
  const [isExporting, setIsExporting] = useState(false);

  const isLoading = usersLoading || statsLoading;

  const reports = [
    { id: 'users' as ReportType, name: 'User Registration Report', icon: Users, description: 'All registered users with registration dates' },
    { id: 'subscriptions' as ReportType, name: 'Active vs Expired Subscriptions', icon: CreditCard, description: 'Breakdown of subscription statuses' },
    { id: 'revenue' as ReportType, name: 'Revenue Report', icon: DollarSign, description: 'Monthly and yearly revenue breakdown' },
    { id: 'trials' as ReportType, name: 'Free Trial Conversion', icon: TrendingUp, description: 'Trial users conversion rates' },
    { id: 'churn' as ReportType, name: 'Churn/Expiry Report', icon: BarChart3, description: 'Expired and cancelled subscriptions' },
    { id: 'offers' as ReportType, name: 'Offer Performance', icon: FileText, description: 'Promotional offers usage stats' },
  ];

  const generateCSV = (data: Record<string, unknown>[], filename: string) => {
    if (!data.length) return;
    
    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => headers.map(h => {
        const val = row[h];
        if (val === null || val === undefined) return '';
        if (typeof val === 'string' && val.includes(',')) return `"${val}"`;
        return String(val);
      }).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${filename}_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
  };

  const generatePDF = (title: string, data: Record<string, unknown>[]) => {
    // Create a printable HTML version
    const headers = data.length ? Object.keys(data[0]) : [];
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${title}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          h1 { color: #333; border-bottom: 2px solid #10b981; padding-bottom: 10px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #10b981; color: white; }
          tr:nth-child(even) { background-color: #f9f9f9; }
          .meta { color: #666; font-size: 12px; margin-bottom: 20px; }
        </style>
      </head>
      <body>
        <h1>${title}</h1>
        <p class="meta">Generated: ${format(new Date(), 'PPpp')}<br/>Period: ${format(dateFrom, 'PP')} - ${format(dateTo, 'PP')}</p>
        <table>
          <thead><tr>${headers.map(h => `<th>${h.replace(/_/g, ' ').toUpperCase()}</th>`).join('')}</tr></thead>
          <tbody>${data.map(row => `<tr>${headers.map(h => `<td>${row[h] ?? '-'}</td>`).join('')}</tr>`).join('')}</tbody>
        </table>
      </body>
      </html>
    `;
    
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const handleExport = async (exportFormat: ExportFormat) => {
    setIsExporting(true);
    
    try {
      let data: Record<string, unknown>[] = [];
      let filename = '';
      let title = '';

      switch (selectedReport) {
        case 'users':
          title = 'User Registration Report';
          filename = 'user_registration_report';
          data = (users || []).map(u => ({
            name: u.full_name || 'N/A',
            registered: u.created_at ? format(new Date(u.created_at), 'PP') : '-',
            plan_type: u.subscription?.plan_type || 'None',
            status: u.subscription?.status || 'No Subscription',
            amount_paid: u.subscription?.amount_paid || 0,
            start_date: u.subscription?.start_date ? format(new Date(u.subscription.start_date), 'PP') : '-',
            end_date: u.subscription?.end_date ? format(new Date(u.subscription.end_date), 'PP') : '-',
          }));
          break;

        case 'subscriptions':
          title = 'Active vs Expired Subscriptions';
          filename = 'subscriptions_report';
          data = [
            { metric: 'Total Users', value: stats?.totalUsers || 0 },
            { metric: 'Active Subscriptions', value: stats?.activeSubscriptions || 0 },
            { metric: 'Expired Subscriptions', value: stats?.expiredSubscriptions || 0 },
            { metric: 'Trial Users', value: stats?.trialUsers || 0 },
            { metric: 'Monthly Users', value: stats?.monthlyUsers || 0 },
            { metric: 'Yearly Users', value: stats?.yearlyUsers || 0 },
          ];
          break;

        case 'revenue':
          title = 'Revenue Report';
          filename = 'revenue_report';
          data = [
            { metric: 'Total Revenue', amount: `$${stats?.totalRevenue?.toFixed(2) || '0.00'}` },
            { metric: 'Monthly Revenue', amount: `$${stats?.monthlyRevenue?.toFixed(2) || '0.00'}` },
            { metric: 'Yearly Revenue', amount: `$${stats?.yearlyRevenue?.toFixed(2) || '0.00'}` },
          ];
          break;

        case 'trials':
          title = 'Free Trial Conversion Report';
          filename = 'trial_conversion_report';
          const totalTrials = stats?.trialUsers || 0;
          const convertedUsers = (stats?.monthlyUsers || 0) + (stats?.yearlyUsers || 0);
          data = [
            { metric: 'Total Trial Users', value: totalTrials },
            { metric: 'Converted to Paid', value: convertedUsers },
            { metric: 'Conversion Rate', value: totalTrials > 0 ? `${((convertedUsers / totalTrials) * 100).toFixed(1)}%` : '0%' },
          ];
          break;

        case 'churn':
          title = 'Churn/Expiry Report';
          filename = 'churn_report';
          const expiredUsers = (users || []).filter(u => u.subscription?.status === 'expired' || u.subscription?.status === 'cancelled');
          data = expiredUsers.map(u => ({
            name: u.full_name || 'N/A',
            plan_type: u.subscription?.plan_type || '-',
            status: u.subscription?.status || '-',
            end_date: u.subscription?.end_date ? format(new Date(u.subscription.end_date), 'PP') : '-',
          }));
          if (data.length === 0) {
            data = [{ message: 'No churned users in this period' }];
          }
          break;

        case 'offers':
          title = 'Offer Performance Report';
          filename = 'offers_report';
          data = [{ message: 'Offer tracking data will be available after offers are used' }];
          break;
      }

      if (exportFormat === 'csv') {
        generateCSV(data, filename);
      } else {
        generatePDF(title, data);
      }
    } finally {
      setIsExporting(false);
    }
  };

  const quickDateRanges = [
    { label: 'Last 7 days', from: subDays(new Date(), 7), to: new Date() },
    { label: 'Last 30 days', from: subDays(new Date(), 30), to: new Date() },
    { label: 'This month', from: startOfMonth(new Date()), to: endOfMonth(new Date()) },
    { label: 'Last month', from: startOfMonth(subMonths(new Date(), 1)), to: endOfMonth(subMonths(new Date(), 1)) },
  ];

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  const selectedReportInfo = reports.find(r => r.id === selectedReport);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Reports & Analytics</h1>
          <p className="text-slate-400">Generate and download business reports</p>
        </div>

        {/* Date Range Selection */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Report Period</CardTitle>
            <CardDescription className="text-slate-400">Select the date range for your report</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {quickDateRanges.map(range => (
                <Button
                  key={range.label}
                  variant="outline"
                  size="sm"
                  className="bg-slate-900 border-slate-600 text-slate-300 hover:bg-slate-700"
                  onClick={() => { setDateFrom(range.from); setDateTo(range.to); }}
                >
                  {range.label}
                </Button>
              ))}
            </div>
            <div className="flex flex-wrap gap-4">
              <div className="space-y-2">
                <span className="text-sm text-slate-400">From</span>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("w-[200px] justify-start text-left font-normal bg-slate-900 border-slate-600 text-white")}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {format(dateFrom, 'PPP')}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 bg-slate-800 border-slate-700">
                    <Calendar mode="single" selected={dateFrom} onSelect={(d) => d && setDateFrom(d)} initialFocus className="bg-slate-800" />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <span className="text-sm text-slate-400">To</span>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("w-[200px] justify-start text-left font-normal bg-slate-900 border-slate-600 text-white")}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {format(dateTo, 'PPP')}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 bg-slate-800 border-slate-700">
                    <Calendar mode="single" selected={dateTo} onSelect={(d) => d && setDateTo(d)} initialFocus className="bg-slate-800" />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Report Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {reports.map(report => (
            <Card
              key={report.id}
              className={cn(
                "cursor-pointer transition-all border-2",
                selectedReport === report.id
                  ? "bg-emerald-900/30 border-emerald-500"
                  : "bg-slate-800 border-slate-700 hover:border-slate-600"
              )}
              onClick={() => setSelectedReport(report.id)}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className={cn("p-2 rounded-lg", selectedReport === report.id ? "bg-emerald-500/20" : "bg-slate-700")}>
                    <report.icon className={cn("w-5 h-5", selectedReport === report.id ? "text-emerald-400" : "text-slate-400")} />
                  </div>
                  <div>
                    <h3 className="font-medium text-white">{report.name}</h3>
                    <p className="text-sm text-slate-400">{report.description}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Export Actions */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              {selectedReportInfo && <selectedReportInfo.icon className="w-5 h-5 text-emerald-400" />}
              {selectedReportInfo?.name}
            </CardTitle>
            <CardDescription className="text-slate-400">{selectedReportInfo?.description}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <Button
                onClick={() => handleExport('csv')}
                disabled={isExporting}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                {isExporting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
                Export as CSV (Excel)
              </Button>
              <Button
                onClick={() => handleExport('pdf')}
                disabled={isExporting}
                variant="outline"
                className="border-slate-600 text-white hover:bg-slate-700"
              >
                {isExporting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FileText className="w-4 h-4 mr-2" />}
                Export as PDF
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-white">{stats?.totalUsers || 0}</p>
              <p className="text-sm text-slate-400">Total Users</p>
            </CardContent>
          </Card>
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-emerald-400">{stats?.activeSubscriptions || 0}</p>
              <p className="text-sm text-slate-400">Active Subs</p>
            </CardContent>
          </Card>
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-red-400">{stats?.expiredSubscriptions || 0}</p>
              <p className="text-sm text-slate-400">Expired</p>
            </CardContent>
          </Card>
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-yellow-400">${stats?.totalRevenue?.toFixed(2) || '0.00'}</p>
              <p className="text-sm text-slate-400">Revenue</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
