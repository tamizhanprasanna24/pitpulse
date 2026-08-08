'use client';

import * as React from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/auth-context';
import { DashboardShell, StatCard } from '@/components/dashboard/shell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Baby, Activity, Home, BarChart3, Loader2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export default function AshaReportsPage() {
  const { profile } = useAuth();
  const [loading, setLoading] = React.useState(true);
  const [stats, setStats] = React.useState({ patients: 0, visits: 0, vaccinations: 0, surveys: 0 });
  const [visitTypeData, setVisitTypeData] = React.useState<{ type: string; count: number; fill: string }[]>([]);

  React.useEffect(() => {
    if (!profile) return;
    (async () => {
      const [p, v, vac, sur] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'patient'),
        supabase.from('asha_visits').select('*', { count: 'exact', head: true }).eq('asha_id', profile.id),
        supabase.from('vaccinations').select('*', { count: 'exact', head: true }).eq('user_id', profile.id),
        supabase.from('asha_surveys').select('*', { count: 'exact', head: true }).eq('asha_id', profile.id),
      ]);

      setStats({
        patients: p.count || 0,
        visits: v.count || 0,
        vaccinations: vac.count || 0,
        surveys: sur.count || 0,
      });

      const { data: visits } = await supabase
        .from('asha_visits')
        .select('visit_type')
        .eq('asha_id', profile.id);

      const typeCounts: Record<string, number> = {
        home_visit: 0, survey: 0, vaccination: 0, medicine_distribution: 0, emergency: 0,
      };
      visits?.forEach(vt => {
        typeCounts[vt.visit_type] = (typeCounts[vt.visit_type] || 0) + 1;
      });

      const colors: Record<string, string> = {
        home_visit: 'hsl(199 89% 48%)',
        survey: 'hsl(38 92% 50%)',
        vaccination: 'hsl(152 76% 40%)',
        medicine_distribution: 'hsl(280 65% 60%)',
        emergency: 'hsl(0 84% 60%)',
      };
      const labels: Record<string, string> = {
        home_visit: 'Home Visits',
        survey: 'Surveys',
        vaccination: 'Vaccinations',
        medicine_distribution: 'Medicines',
        emergency: 'Emergency',
      };

      setVisitTypeData(
        Object.entries(typeCounts).map(([key, count]) => ({
          type: labels[key] || key,
          count,
          fill: colors[key] || 'hsl(199 89% 48%)',
        }))
      );
      setLoading(false);
    })();
  }, [profile]);

  if (loading) {
    return (
      <DashboardShell title="Reports" description="Community health reports and statistics">
        <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell title="Reports" description="Community health reports and statistics">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 mb-6">
        <StatCard icon={Users} label="Registered Patients" value={stats.patients} color="bg-primary" />
        <StatCard icon={Home} label="Home Visits" value={stats.visits} color="bg-accent" />
        <StatCard icon={Baby} label="Vaccinations" value={stats.vaccinations} color="bg-warning" />
        <StatCard icon={Activity} label="Surveys" value={stats.surveys} color="bg-chart-4" />
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="glass">
          <CardHeader><CardTitle className="flex items-center gap-2"><BarChart3 className="h-5 w-5 text-primary" /> Visit Distribution</CardTitle></CardHeader>
          <CardContent>
            {visitTypeData.some(d => d.count > 0) ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={visitTypeData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="type" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} allowDecimals={false} />
                  <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {visitTypeData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-[300px] items-center justify-center text-sm text-muted-foreground">
                No visit data yet. Record visits to see distribution.
              </div>
            )}
          </CardContent>
        </Card>
        <Card className="glass">
          <CardHeader><CardTitle>Summary</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-lg bg-card/50 p-3"><p className="text-sm font-medium">Total Home Visits</p><p className="text-2xl font-bold text-primary">{stats.visits}</p></div>
            <div className="rounded-lg bg-card/50 p-3"><p className="text-sm font-medium">Vaccinations Administered</p><p className="text-2xl font-bold text-accent">{stats.vaccinations}</p></div>
            <div className="rounded-lg bg-card/50 p-3"><p className="text-sm font-medium">Registered Patients</p><p className="text-2xl font-bold text-warning">{stats.patients}</p></div>
            <div className="rounded-lg bg-card/50 p-3"><p className="text-sm font-medium">Health Surveys Completed</p><p className="text-2xl font-bold text-chart-4">{stats.surveys}</p></div>
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}
