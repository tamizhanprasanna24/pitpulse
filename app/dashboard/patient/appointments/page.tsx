'use client';

import * as React from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/auth-context';
import { DashboardShell } from '@/components/dashboard/shell';
import type { Appointment, Hospital } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Plus, Stethoscope, Clock, CheckCircle2, XCircle } from 'lucide-react';
import { formatDateTime } from '@/lib/health-utils';
import { toast } from 'sonner';

export default function AppointmentsPage() {
  const { profile } = useAuth();
  const [appointments, setAppointments] = React.useState<Appointment[]>([]);
  const [hospitals, setHospitals] = React.useState<Hospital[]>([]);
  const [showForm, setShowForm] = React.useState(false);
  const [reason, setReason] = React.useState('');
  const [scheduledAt, setScheduledAt] = React.useState('');
  const [hospitalId, setHospitalId] = React.useState('');
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!profile) return;
    (async () => {
      const [appts, hosp] = await Promise.all([
        supabase.from('appointments').select('*').eq('patient_id', profile.id).order('scheduled_at', { ascending: false }),
        supabase.from('hospitals').select('*'),
      ]);
      setAppointments(appts.data as Appointment[] || []);
      setHospitals(hosp.data as Hospital[] || []);
      setLoading(false);
    })();
  }, [profile]);

  const handleBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || !scheduledAt) return;
    const { data, error } = await supabase.from('appointments').insert({
      patient_id: profile.id,
      hospital_id: hospitalId || null,
      scheduled_at: new Date(scheduledAt).toISOString(),
      reason: reason || null,
      status: 'scheduled',
    }).select().single();
    if (error) {
      toast.error('Failed to book appointment');
    } else {
      toast.success('Appointment booked successfully');
      setAppointments(prev => [data as Appointment, ...prev]);
      setShowForm(false);
      setReason('');
      setScheduledAt('');
      setHospitalId('');
    }
  };

  return (
    <DashboardShell title="Appointments" description="Schedule and manage your doctor appointments">
      <div className="space-y-6">
        {!showForm ? (
          <Button onClick={() => setShowForm(true)} className="bg-gradient-to-r from-primary to-accent text-white">
            <Plus className="mr-2 h-4 w-4" /> Book Appointment
          </Button>
        ) : (
          <Card className="glass">
            <CardHeader>
              <CardTitle>Book New Appointment</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleBook} className="space-y-4">
                <div className="space-y-2">
                  <Label>Reason for Visit</Label>
                  <Input placeholder="e.g. Regular checkup" value={reason} onChange={(e) => setReason(e.target.value)} />
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Hospital</Label>
                    <Select value={hospitalId} onValueChange={setHospitalId}>
                      <SelectTrigger><SelectValue placeholder="Select hospital" /></SelectTrigger>
                      <SelectContent>
                        {hospitals.map(h => <SelectItem key={h.id} value={h.id}>{h.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Date & Time</Label>
                    <Input type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} required />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button type="submit" className="bg-gradient-to-r from-primary to-accent text-white">Book</Button>
                  <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {loading ? (
          <p className="text-sm text-muted-foreground">Loading appointments...</p>
        ) : appointments.length === 0 ? (
          <Card className="glass">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Calendar className="h-12 w-12 text-muted-foreground" />
              <p className="mt-4 text-sm text-muted-foreground">No appointments yet. Book one to get started.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {appointments.map(apt => (
              <Card key={apt.id} className="glass">
                <CardContent className="pt-6">
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                        <Stethoscope className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{apt.reason || 'General Appointment'}</h3>
                        <div className="mt-1 flex items-center gap-3 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1"><Clock className="h-4 w-4" /> {formatDateTime(apt.scheduled_at)}</span>
                        </div>
                      </div>
                    </div>
                    <Badge variant="secondary" className={
                      apt.status === 'confirmed' ? 'bg-success/10 text-success' :
                      apt.status === 'cancelled' ? 'bg-destructive/10 text-destructive' :
                      apt.status === 'completed' ? 'bg-muted text-muted-foreground' :
                      'bg-warning/10 text-warning'
                    }>
                      {apt.status}
                    </Badge>
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
