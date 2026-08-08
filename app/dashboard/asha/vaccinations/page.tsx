'use client';
import * as React from 'react';
import { supabase } from '@/lib/supabase';
import { DashboardShell, StatCard } from '@/components/dashboard/shell';
import type { Vaccination } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Baby, CheckCircle2, Clock, AlertCircle, Plus } from 'lucide-react';
import { formatDate } from '@/lib/health-utils';
import { toast } from 'sonner';

export default function AshaVaccinationsPage() {
  const [vaccines, setVaccines] = React.useState<Vaccination[]>([]);
  const [showForm, setShowForm] = React.useState(false);
  const [form, setForm] = React.useState({ vaccine_name: '', dose_number: '1', administered_date: '', next_due_date: '', administered_by: '' });
  React.useEffect(() => {
    (async () => {
      const { data } = await supabase.from('vaccinations').select('*').order('created_at', { ascending: false });
      setVaccines(data as Vaccination[] || []);
    })();
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.vaccine_name) return;
    const { data, error } = await supabase.from('vaccinations').insert({ vaccine_name: form.vaccine_name, dose_number: Number(form.dose_number) || 1, administered_date: form.administered_date || null, next_due_date: form.next_due_date || null, administered_by: form.administered_by || null, status: 'completed' }).select().single();
    if (error) { toast.error('Failed to add vaccination record'); }
    else { toast.success('Vaccination recorded'); setVaccines(prev => [data as Vaccination, ...prev]); setShowForm(false); setForm({ vaccine_name: '', dose_number: '1', administered_date: '', next_due_date: '', administered_by: '' }); }
  };

  return (
    <DashboardShell title="Vaccination Tracking" description="Track vaccinations in your community">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 mb-6">
        <StatCard icon={CheckCircle2} label="Completed" value={vaccines.filter(v => v.status === 'completed').length} color="bg-success" />
        <StatCard icon={Clock} label="Pending" value={vaccines.filter(v => v.status === 'pending').length} color="bg-warning" />
        <StatCard icon={AlertCircle} label="Overdue" value={vaccines.filter(v => v.status === 'overdue').length} color="bg-destructive" />
        <StatCard icon={Baby} label="Total" value={vaccines.length} color="bg-primary" />
      </div>
      <div className="mb-4"><Button onClick={() => setShowForm(!showForm)} className="bg-gradient-to-r from-primary to-accent text-white"><Plus className="mr-1 h-4 w-4" /> Record Vaccination</Button></div>
      {showForm && (
        <Card className="glass mb-4">
          <CardContent className="pt-6">
            <form onSubmit={handleAdd} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2"><Label>Vaccine Name</Label><Input placeholder="e.g. BCG, OPV" value={form.vaccine_name} onChange={(e) => setForm({ ...form, vaccine_name: e.target.value })} required /></div>
                <div className="space-y-2"><Label>Dose Number</Label><Input type="number" value={form.dose_number} onChange={(e) => setForm({ ...form, dose_number: e.target.value })} /></div>
                <div className="space-y-2"><Label>Administered Date</Label><Input type="date" value={form.administered_date} onChange={(e) => setForm({ ...form, administered_date: e.target.value })} /></div>
                <div className="space-y-2"><Label>Next Due Date</Label><Input type="date" value={form.next_due_date} onChange={(e) => setForm({ ...form, next_due_date: e.target.value })} /></div>
                <div className="space-y-2"><Label>Administered By</Label><Input placeholder="Health worker name" value={form.administered_by} onChange={(e) => setForm({ ...form, administered_by: e.target.value })} /></div>
              </div>
              <div className="flex gap-2"><Button type="submit" className="bg-gradient-to-r from-primary to-accent text-white">Save</Button><Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button></div>
            </form>
          </CardContent>
        </Card>
      )}
      <div className="space-y-4">
        {vaccines.length > 0 ? vaccines.map(v => (
          <Card key={v.id} className="glass">
            <CardContent className="pt-6 flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10"><Baby className="h-5 w-5 text-primary" /></div>
                <div>
                  <h3 className="font-semibold">{v.vaccine_name} - Dose {v.dose_number}</h3>
                  <p className="text-xs text-muted-foreground">{v.administered_date ? `Given: ${formatDate(v.administered_date)}` : 'Not yet administered'}</p>
                  {v.next_due_date && <p className="text-xs text-muted-foreground">Next due: {formatDate(v.next_due_date)}</p>}
                  {v.administered_by && <p className="text-xs text-muted-foreground">By: {v.administered_by}</p>}
                </div>
              </div>
              <Badge variant="secondary" className={v.status === 'completed' ? 'bg-success/10 text-success' : v.status === 'overdue' ? 'bg-destructive/10 text-destructive' : 'bg-warning/10 text-warning'}>{v.status}</Badge>
            </CardContent>
          </Card>
        )) : <Card className="glass"><CardContent className="flex flex-col items-center py-12"><Baby className="h-12 w-12 text-muted-foreground" /><p className="mt-4 text-sm text-muted-foreground">No vaccination records yet.</p></CardContent></Card>}
      </div>
    </DashboardShell>
  );
}
