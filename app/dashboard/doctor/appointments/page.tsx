'use client';
import * as React from 'react';
import { supabase } from '@/lib/supabase';
import { DashboardShell } from '@/components/dashboard/shell';
import type { Appointment } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock } from 'lucide-react';
import { formatDateTime } from '@/lib/health-utils';

export default function DoctorAppointmentsPage() {
  const [appointments, setAppointments] = React.useState<Appointment[]>([]);
  React.useEffect(() => {
    (async () => {
      const { data } = await supabase.from('appointments').select('*').order('scheduled_at', { ascending: false });
      setAppointments(data as Appointment[] || []);
    })();
  }, []);
  return (
    <DashboardShell title="Appointments" description="View and manage all appointments">
      <div className="space-y-4">
        {appointments.length > 0 ? appointments.map(apt => (
          <Card key={apt.id} className="glass">
            <CardContent className="pt-6 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10"><Calendar className="h-5 w-5 text-primary" /></div>
                <div>
                  <h3 className="font-semibold">{apt.reason || 'General Appointment'}</h3>
                  <p className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" /> {formatDateTime(apt.scheduled_at)}</p>
                </div>
              </div>
              <Badge variant="secondary" className={apt.status === 'confirmed' ? 'bg-success/10 text-success' : apt.status === 'cancelled' ? 'bg-destructive/10 text-destructive' : 'bg-warning/10 text-warning'}>{apt.status}</Badge>
            </CardContent>
          </Card>
        )) : <Card className="glass"><CardContent className="flex flex-col items-center py-12"><Calendar className="h-12 w-12 text-muted-foreground" /><p className="mt-4 text-sm text-muted-foreground">No appointments scheduled.</p></CardContent></Card>}
      </div>
    </DashboardShell>
  );
}
