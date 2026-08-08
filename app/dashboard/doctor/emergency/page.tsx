'use client';
import * as React from 'react';
import { supabase } from '@/lib/supabase';
import { DashboardShell, StatCard } from '@/components/dashboard/shell';
import type { EmergencySOS } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Siren, MapPin, Clock, CheckCircle2 } from 'lucide-react';
import { timeAgo, formatDateTime } from '@/lib/health-utils';
import { toast } from 'sonner';

export default function DoctorEmergencyPage() {
  const [alerts, setAlerts] = React.useState<EmergencySOS[]>([]);
  React.useEffect(() => {
    (async () => {
      const { data } = await supabase.from('emergency_sos').select('*').order('created_at', { ascending: false });
      setAlerts(data as EmergencySOS[] || []);
    })();
  }, []);

  const handleRespond = async (id: string) => {
    const { error } = await supabase.from('emergency_sos').update({ status: 'responded' }).eq('id', id);
    if (error) { toast.error('Failed to respond'); }
    else { toast.success('Emergency response sent'); setAlerts(prev => prev.map(a => a.id === id ? { ...a, status: 'responded' as const } : a)); }
  };

  const handleResolve = async (id: string) => {
    const { error } = await supabase.from('emergency_sos').update({ status: 'resolved', resolved_at: new Date().toISOString() }).eq('id', id);
    if (error) { toast.error('Failed to resolve'); }
    else { toast.success('Emergency resolved'); setAlerts(prev => prev.map(a => a.id === id ? { ...a, status: 'resolved' as const } : a)); }
  };

  const active = alerts.filter(a => a.status === 'active').length;
  return (
    <DashboardShell title="Emergency Cases" description="Active and resolved emergency SOS alerts">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 mb-6">
        <StatCard icon={Siren} label="Active" value={active} color="bg-destructive" />
        <StatCard icon={Clock} label="Responded" value={alerts.filter(a => a.status === 'responded').length} color="bg-warning" />
        <StatCard icon={CheckCircle2} label="Resolved" value={alerts.filter(a => a.status === 'resolved').length} color="bg-success" />
        <StatCard icon={Siren} label="Total" value={alerts.length} color="bg-primary" />
      </div>
      <div className="space-y-4">
        {alerts.length > 0 ? alerts.map(sos => (
          <Card key={sos.id} className={'glass ' + (sos.status === 'active' ? 'border-destructive/30' : '')}>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className={'flex h-10 w-10 items-center justify-center rounded-xl ' + (sos.status === 'active' ? 'bg-destructive/10' : 'bg-muted')}>
                    <Siren className={'h-5 w-5 ' + (sos.status === 'active' ? 'text-destructive' : 'text-muted-foreground')} />
                  </div>
                  <div>
                    <h3 className="font-semibold">SOS Alert</h3>
                    <p className="text-xs text-muted-foreground">{timeAgo(sos.created_at)}</p>
                    {sos.latitude && sos.longitude && <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1"><MapPin className="h-3 w-3" /> {sos.latitude.toFixed(4)}, {sos.longitude.toFixed(4)}</p>}
                    {sos.medical_summary && <p className="text-xs text-muted-foreground mt-1">{sos.medical_summary}</p>}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <Badge variant="secondary" className={sos.status === 'active' ? 'bg-destructive/10 text-destructive' : sos.status === 'responded' ? 'bg-warning/10 text-warning' : 'bg-success/10 text-success'}>{sos.status}</Badge>
                  {sos.status === 'active' && <button onClick={() => handleRespond(sos.id)} className="text-xs text-primary hover:underline">Respond</button>}
                  {sos.status === 'responded' && <button onClick={() => handleResolve(sos.id)} className="text-xs text-success hover:underline">Mark Resolved</button>}
                </div>
              </div>
            </CardContent>
          </Card>
        )) : <Card className="glass"><CardContent className="flex flex-col items-center py-12"><Siren className="h-12 w-12 text-muted-foreground" /><p className="mt-4 text-sm text-muted-foreground">No emergency alerts.</p></CardContent></Card>}
      </div>
    </DashboardShell>
  );
}
