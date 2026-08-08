'use client';
import * as React from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/auth-context';
import { DashboardShell } from '@/components/dashboard/shell';
import type { AshaVisit } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Home, ClipboardList, Baby, Activity, AlertCircle, Plus, MapPin } from 'lucide-react';
import { timeAgo } from '@/lib/health-utils';
import { toast } from 'sonner';

export default function AshaVisitsPage() {
  const { profile } = useAuth();
  const [visits, setVisits] = React.useState<AshaVisit[]>([]);
  const [showForm, setShowForm] = React.useState(false);
  const [form, setForm] = React.useState({ patient_name: '', visit_type: 'home_visit', notes: '' });
  React.useEffect(() => {
    if (!profile) return;
    (async () => {
      const { data } = await supabase.from('asha_visits').select('*').eq('asha_id', profile.id).order('visit_date', { ascending: false });
      setVisits(data as AshaVisit[] || []);
    })();
  }, [profile]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || !form.patient_name) return;
    const { data, error } = await supabase.from('asha_visits').insert({ asha_id: profile.id, patient_name: form.patient_name, visit_type: form.visit_type, notes: form.notes || null, village: profile.assigned_village || null, status: 'completed' }).select().single();
    if (error) { toast.error('Failed to log visit'); }
    else { toast.success('Visit logged'); setVisits(prev => [data as AshaVisit, ...prev]); setShowForm(false); setForm({ patient_name: '', visit_type: 'home_visit', notes: '' }); }
  };

  const icons: Record<string, typeof Home> = { home_visit: Home, survey: ClipboardList, vaccination: Baby, medicine_distribution: Activity, emergency: AlertCircle };
  return (
    <DashboardShell title="Home Visits" description="Log and track home visits">
      <div className="mb-4">
        <Button onClick={() => setShowForm(!showForm)} className="bg-gradient-to-r from-primary to-accent text-white"><Plus className="mr-1 h-4 w-4" /> Log Visit</Button>
      </div>
      {showForm && (
        <Card className="glass mb-4">
          <CardContent className="pt-6">
            <form onSubmit={handleAdd} className="space-y-4">
              <div className="space-y-2"><Label>Patient Name</Label><Input placeholder="Patient name" value={form.patient_name} onChange={(e) => setForm({ ...form, patient_name: e.target.value })} required /></div>
              <div className="space-y-2"><Label>Visit Type</Label><Select value={form.visit_type} onValueChange={(v) => setForm({ ...form, visit_type: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="home_visit">Home Visit</SelectItem><SelectItem value="survey">Health Survey</SelectItem><SelectItem value="vaccination">Vaccination</SelectItem><SelectItem value="medicine_distribution">Medicine Distribution</SelectItem><SelectItem value="emergency">Emergency</SelectItem></SelectContent></Select></div>
              <div className="space-y-2"><Label>Notes</Label><Input placeholder="Visit notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
              <div className="flex gap-2"><Button type="submit" className="bg-gradient-to-r from-primary to-accent text-white">Save</Button><Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button></div>
            </form>
          </CardContent>
        </Card>
      )}
      <div className="space-y-4">
        {visits.length > 0 ? visits.map(v => {
          const Icon = icons[v.visit_type] || Home;
          return (
            <Card key={v.id} className="glass">
              <CardContent className="pt-6 flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10"><Icon className="h-5 w-5 text-primary" /></div>
                  <div>
                    <h3 className="font-semibold">{v.patient_name || 'Patient'}</h3>
                    <p className="text-xs text-muted-foreground capitalize">{v.visit_type.replace(/_/g, ' ')} - {v.village || 'N/A'}</p>
                    {v.notes && <p className="mt-1 text-sm text-muted-foreground">{v.notes}</p>}
                  </div>
                </div>
                <div className="text-right"><Badge variant="secondary" className="bg-success/10 text-success">{v.status}</Badge><p className="mt-1 text-xs text-muted-foreground">{timeAgo(v.visit_date)}</p></div>
              </CardContent>
            </Card>
          );
        }) : <Card className="glass"><CardContent className="flex flex-col items-center py-12"><Home className="h-12 w-12 text-muted-foreground" /><p className="mt-4 text-sm text-muted-foreground">No visits logged yet.</p></CardContent></Card>}
      </div>
    </DashboardShell>
  );
}
