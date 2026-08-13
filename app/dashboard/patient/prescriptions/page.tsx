'use client';

import * as React from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/auth-context';
import { DashboardShell } from '@/components/dashboard/shell';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { FileText, Upload, Pill, Calendar, User, Plus, Loader2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose,
} from '@/components/ui/dialog';

interface Prescription {
  id: string;
  doctor_name: string | null;
  medicines: string;
  notes: string | null;
  prescribed_date: string | null;
  status: 'active' | 'completed' | 'expired';
  created_at: string;
}

const initialDemoPrescriptions: Prescription[] = [
  {
    id: 'demo-p1',
    doctor_name: 'Dr. Rajesh Verma (Cardiologist)',
    medicines: 'Telmisartan 40mg - 1-0-0 (Morning after breakfast)\nAspirin 75mg - 0-0-1 (Night after dinner)',
    notes: 'Monitor blood pressure weekly. Avoid high sodium foods.',
    prescribed_date: new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0],
    status: 'active',
    created_at: new Date().toISOString(),
  },
  {
    id: 'demo-p2',
    doctor_name: 'Dr. Anita Sharma (General Physician)',
    medicines: 'Metformin 500mg - 1-0-1 (After meals)\nParacetamol 650mg - As needed for fever',
    notes: 'Maintain low sugar diet and walk 30 mins daily.',
    prescribed_date: new Date(Date.now() - 20 * 86400000).toISOString().split('T')[0],
    status: 'active',
    created_at: new Date().toISOString(),
  }
];

export default function PrescriptionsPage() {
  const { profile } = useAuth();
  const [prescriptions, setPrescriptions] = React.useState<Prescription[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [form, setForm] = React.useState({ doctor_name: '', medicines: '', notes: '', prescribed_date: '' });

  const fetchPrescriptions = React.useCallback(async () => {
    if (!profile) return;
    try {
      const { data, error } = await supabase
        .from('prescriptions')
        .select('*')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        setPrescriptions(data as Prescription[]);
      } else {
        setPrescriptions(initialDemoPrescriptions);
      }
    } catch {
      setPrescriptions(initialDemoPrescriptions);
    } finally {
      setLoading(false);
    }
  }, [profile]);

  React.useEffect(() => {
    fetchPrescriptions();
  }, [fetchPrescriptions]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setSubmitting(true);
    const { error } = await supabase.from('prescriptions').insert({
      user_id: profile.id,
      doctor_name: form.doctor_name || null,
      medicines: form.medicines,
      notes: form.notes || null,
      prescribed_date: form.prescribed_date || null,
    });
    setSubmitting(false);
    if (error) {
      toast.error('Failed to add prescription');
      return;
    }
    toast.success('Prescription added');
    setForm({ doctor_name: '', medicines: '', notes: '', prescribed_date: '' });
    setDialogOpen(false);
    fetchPrescriptions();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('prescriptions').delete().eq('id', id);
    if (error) {
      toast.error('Failed to delete prescription');
      return;
    }
    toast.success('Prescription deleted');
    setPrescriptions(prev => prev.filter(p => p.id !== id));
  };

  const handleStatusChange = async (id: string, status: string) => {
    const { error } = await supabase.from('prescriptions').update({ status }).eq('id', id);
    if (error) {
      toast.error('Failed to update status');
      return;
    }
    setPrescriptions(prev => prev.map(p => p.id === id ? { ...p, status: status as Prescription['status'] } : p));
    toast.success('Status updated');
  };

  return (
    <DashboardShell title="Prescriptions" description="View and manage your prescriptions">
      <div className="space-y-6">
        <Card className="glass">
          <CardContent className="flex flex-col items-center justify-between gap-4 p-6 md:flex-row">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                <Upload className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">Add Prescription</h3>
                <p className="text-sm text-muted-foreground">Record a prescription from your doctor</p>
              </div>
            </div>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-primary to-accent text-white">
                  <Plus className="mr-2 h-4 w-4" /> Add Prescription
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Prescription</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="doctor">Doctor Name</Label>
                    <Input id="doctor" placeholder="Dr. Rajesh Kumar" value={form.doctor_name} onChange={e => setForm({ ...form, doctor_name: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="medicines">Medicines</Label>
                    <Textarea id="medicines" placeholder="Metformin 500mg - 1-0-1&#10;Amlodipine 5mg - 1-0-0" value={form.medicines} onChange={e => setForm({ ...form, medicines: e.target.value })} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="notes">Notes</Label>
                    <Textarea id="notes" placeholder="Take after meals. Monitor blood sugar daily." value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="date">Prescribed Date</Label>
                    <Input id="date" type="date" value={form.prescribed_date} onChange={e => setForm({ ...form, prescribed_date: e.target.value })} />
                  </div>
                  <DialogFooter>
                    <DialogClose asChild>
                      <Button type="button" variant="outline">Cancel</Button>
                    </DialogClose>
                    <Button type="submit" disabled={submitting} className="bg-gradient-to-r from-primary to-accent text-white">
                      {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />} Add
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : prescriptions.length === 0 ? (
          <Card className="glass">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <FileText className="h-12 w-12 text-muted-foreground mb-3" />
              <p className="text-muted-foreground">No prescriptions yet. Add your first one above.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {prescriptions.map(pres => (
              <Card key={pres.id} className="glass">
                <CardContent className="pt-6">
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-primary" />
                        <h3 className="font-semibold">
                          Prescription from {pres.doctor_name || 'Unknown Doctor'}
                        </h3>
                        <Badge variant="secondary" className={
                          pres.status === 'active' ? 'bg-success/10 text-success' :
                          pres.status === 'completed' ? 'bg-muted text-muted-foreground' :
                          'bg-destructive/10 text-destructive'
                        }>{pres.status}</Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        {pres.prescribed_date && (
                          <span className="flex items-center gap-1"><Calendar className="h-4 w-4" /> {new Date(pres.prescribed_date).toLocaleDateString('en-IN')}</span>
                        )}
                        {pres.doctor_name && (
                          <span className="flex items-center gap-1"><User className="h-4 w-4" /> {pres.doctor_name}</span>
                        )}
                      </div>
                      <div className="rounded-lg bg-card/50 p-3">
                        <p className="mb-2 text-xs font-semibold text-muted-foreground">Medicines:</p>
                        <div className="space-y-1">
                          {pres.medicines.split('\n').filter(Boolean).map((med, i) => (
                            <div key={i} className="flex items-center gap-2 text-sm">
                              <Pill className="h-3 w-3 text-accent" /> {med}
                            </div>
                          ))}
                        </div>
                      </div>
                      {pres.notes && (
                        <p className="text-sm text-muted-foreground"><span className="font-medium">Notes:</span> {pres.notes}</p>
                      )}
                      <div className="flex gap-2">
                        {pres.status !== 'completed' && (
                          <Button variant="outline" size="sm" onClick={() => handleStatusChange(pres.id, 'completed')}>
                            Mark Complete
                          </Button>
                        )}
                        {pres.status === 'completed' && (
                          <Button variant="outline" size="sm" onClick={() => handleStatusChange(pres.id, 'active')}>
                            Reactivate
                          </Button>
                        )}
                        <Button variant="outline" size="sm" className="text-destructive" onClick={() => handleDelete(pres.id)}>
                          <Trash2 className="mr-1 h-3 w-3" /> Delete
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
