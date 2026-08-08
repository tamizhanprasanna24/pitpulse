'use client';

import * as React from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/auth-context';
import { DashboardShell, StatCard } from '@/components/dashboard/shell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Wallet, TrendingUp, Star, Bike, Loader2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { formatCurrency } from '@/lib/health-utils';

export default function DeliveryEarningsPage() {
  const { profile } = useAuth();
  const [loading, setLoading] = React.useState(true);
  const [weeklyData, setWeeklyData] = React.useState<{ day: string; earnings: number }[]>([]);
  const [totalWeek, setTotalWeek] = React.useState(0);
  const [todayEarnings, setTodayEarnings] = React.useState(0);
  const [totalDeliveries, setTotalDeliveries] = React.useState(0);
  const [rating, setRating] = React.useState(0);
  const [avgPerDelivery, setAvgPerDelivery] = React.useState(0);

  React.useEffect(() => {
    if (!profile) return;
    (async () => {
      const now = new Date();
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      const { data: orders } = await supabase
        .from('medicine_orders')
        .select('total_amount, created_at, status')
        .eq('delivery_partner_id', profile.id)
        .eq('status', 'delivered')
        .gte('created_at', sevenDaysAgo.toISOString())
        .order('created_at', { ascending: true });

      const days: Record<string, number> = {};
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        const key = d.toLocaleDateString('en-IN', { weekday: 'short' });
        days[key] = 0;
      }

      let weekTotal = 0;
      let todayTotal = 0;
      orders?.forEach(o => {
        const d = new Date(o.created_at);
        const key = d.toLocaleDateString('en-IN', { weekday: 'short' });
        const amount = Number(o.total_amount) || 0;
        if (days[key] !== undefined) days[key] += amount;
        weekTotal += amount;
        if (d >= todayStart) todayTotal += amount;
      });

      const dayLabels = Object.entries(days).map(([day, earnings]) => ({ day, earnings }));
      setWeeklyData(dayLabels);
      setTotalWeek(weekTotal);
      setTodayEarnings(todayTotal);

      const { data: partner } = await supabase
        .from('delivery_partners')
        .select('total_deliveries, total_earnings, rating')
        .eq('profile_id', profile.id)
        .maybeSingle();

      const deliveries = partner?.total_deliveries || 0;
      const earnings = Number(partner?.total_earnings) || 0;
      setTotalDeliveries(deliveries);
      setRating(partner?.rating || 0);
      setAvgPerDelivery(deliveries > 0 ? Math.round(earnings / deliveries) : 0);
      setLoading(false);
    })();
  }, [profile]);

  if (loading) {
    return (
      <DashboardShell title="Earnings" description="Track your delivery earnings">
        <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell title="Earnings" description="Track your delivery earnings">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 mb-6">
        <StatCard icon={Wallet} label="This Week" value={formatCurrency(totalWeek)} color="bg-primary" />
        <StatCard icon={TrendingUp} label="Today" value={formatCurrency(todayEarnings)} color="bg-accent" />
        <StatCard icon={Bike} label="Total Deliveries" value={totalDeliveries} color="bg-warning" />
        <StatCard icon={Star} label="Rating" value={rating.toFixed(1)} color="bg-success" />
      </div>
      <Card className="glass">
        <CardHeader><CardTitle className="flex items-center gap-2"><TrendingUp className="h-5 w-5 text-primary" /> Weekly Earnings</CardTitle></CardHeader>
        <CardContent>
          {weeklyData.some(d => d.earnings > 0) ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} formatter={(v: number) => formatCurrency(v)} />
                <Bar dataKey="earnings" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-[300px] items-center justify-center text-sm text-muted-foreground">
              No delivered orders this week yet.
            </div>
          )}
        </CardContent>
      </Card>
      <Card className="glass mt-6">
        <CardHeader><CardTitle>Earnings Breakdown</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between rounded-lg bg-card/50 p-3"><span className="text-sm text-muted-foreground">Total Deliveries Completed</span><span className="font-semibold">{totalDeliveries}</span></div>
          <div className="flex justify-between rounded-lg bg-card/50 p-3"><span className="text-sm text-muted-foreground">Average Earnings per Delivery</span><span className="font-semibold">{formatCurrency(avgPerDelivery)}</span></div>
          <div className="flex justify-between rounded-lg bg-card/50 p-3"><span className="text-sm text-muted-foreground">This Week Total</span><span className="font-semibold">{formatCurrency(totalWeek)}</span></div>
          <div className="flex justify-between rounded-lg bg-success/5 p-3"><span className="text-sm font-semibold">Your Rating</span><span className="font-bold text-success">{rating.toFixed(1)} / 5.0</span></div>
        </CardContent>
      </Card>
    </DashboardShell>
  );
}
