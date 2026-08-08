'use client';

import * as React from 'react';
import { supabase } from '@/lib/supabase';
import { DashboardShell, StatCard } from '@/components/dashboard/shell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Pill, Calendar, TrendingUp, Activity, Loader2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

export default function DoctorAnalyticsPage() {
  const [loading, setLoading] = React.useState(true);
  const [stats, setStats] = React.useState({ patients: 0, appointments: 0, orders: 0, healthRecords: 0 });
  const [monthlyData, setMonthlyData] = React.useState<{ month: string; patients: number; orders: number }[]>([]);

  React.useEffect(() => {
    (async () => {
      const now = new Date();
      const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

      const [patients, appts, orders, health] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'patient'),
        supabase.from('appointments').select('*', { count: 'exact', head: true }),
        supabase.from('medicine_orders').select('*', { count: 'exact', head: true }),
        supabase.from('health_records').select('*', { count: 'exact', head: true }),
      ]);

      setStats({
        patients: patients.count || 0,
        appointments: appts.count || 0,
        orders: orders.count || 0,
        healthRecords: health.count || 0,
      });

      const { data: apptData } = await supabase
        .from('appointments')
        .select('created_at')
        .gte('created_at', sixMonthsAgo.toISOString())
        .order('created_at', { ascending: true });

      const { data: orderData } = await supabase
        .from('medicine_orders')
        .select('created_at')
        .gte('created_at', sixMonthsAgo.toISOString())
        .order('created_at', { ascending: true });

      const months: Record<string, { patients: number; orders: number }> = {};
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = d.toLocaleDateString('en-IN', { month: 'short' });
        months[key] = { patients: 0, orders: 0 };
      }
      apptData?.forEach(a => {
        const key = new Date(a.created_at).toLocaleDateString('en-IN', { month: 'short' });
        if (months[key]) months[key].patients++;
      });
      orderData?.forEach(o => {
        const key = new Date(o.created_at).toLocaleDateString('en-IN', { month: 'short' });
        if (months[key]) months[key].orders++;
      });

      setMonthlyData(Object.entries(months).map(([month, v]) => ({ month, ...v })));
      setLoading(false);
    })();
  }, []);

  if (loading) {
    return (
      <DashboardShell title="Analytics" description="Platform-wide health analytics">
        <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell title="Analytics" description="Platform-wide health analytics">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 mb-6">
        <StatCard icon={Users} label="Total Patients" value={stats.patients} color="bg-primary" />
        <StatCard icon={Calendar} label="Appointments" value={stats.appointments} color="bg-accent" />
        <StatCard icon={Pill} label="Medicine Orders" value={stats.orders} color="bg-warning" />
        <StatCard icon={Activity} label="Health Records" value={stats.healthRecords} color="bg-success" />
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="glass">
          <CardHeader><CardTitle className="flex items-center gap-2"><TrendingUp className="h-5 w-5 text-primary" /> Appointments (6 months)</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} allowDecimals={false} />
                <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                <Line type="monotone" dataKey="patients" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card className="glass">
          <CardHeader><CardTitle className="flex items-center gap-2"><Pill className="h-5 w-5 text-accent" /> Medicine Orders (6 months)</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} allowDecimals={false} />
                <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                <Bar dataKey="orders" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}
