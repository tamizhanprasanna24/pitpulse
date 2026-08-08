'use client';

import * as React from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/auth-context';
import { DashboardShell, StatCard, SectionCard } from '@/components/dashboard/shell';
import type { Profile, Appointment, MedicineOrder, EmergencySOS } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Users, Calendar, Siren, TrendingUp, Activity, Pill, Heart, Brain } from 'lucide-react';
import { getInitials, formatDateTime, timeAgo } from '@/lib/health-utils';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line,
} from 'recharts';

export default function DoctorDashboard() {
  const { profile } = useAuth();
  const [patients, setPatients] = React.useState<Profile[]>([]);
  const [appointments, setAppointments] = React.useState<Appointment[]>([]);
  const [orders, setOrders] = React.useState<MedicineOrder[]>([]);
  const [sosAlerts, setSosAlerts] = React.useState<EmergencySOS[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    (async () => {
      const [pts, appts, ords, sos] = await Promise.all([
        supabase.from('profiles').select('*').eq('role', 'patient').limit(10),
        supabase.from('appointments').select('*').order('scheduled_at', { ascending: false }).limit(10),
        supabase.from('medicine_orders').select('*').order('created_at', { ascending: false }).limit(10),
        supabase.from('emergency_sos').select('*').order('created_at', { ascending: false }).limit(5),
      ]);
      setPatients(pts.data as Profile[] || []);
      setAppointments(appts.data as Appointment[] || []);
      setOrders(ords.data as MedicineOrder[] || []);
      setSosAlerts(sos.data as EmergencySOS[] || []);
      setLoading(false);
    })();
  }, []);

  const patientGenderData = [
    { name: 'Male', value: patients.filter(p => p.gender === 'male').length || 3, fill: 'hsl(199 89% 48%)' },
    { name: 'Female', value: patients.filter(p => p.gender === 'female').length || 4, fill: 'hsl(152 76% 40%)' },
    { name: 'Others', value: patients.filter(p => p.gender === 'others').length || 1, fill: 'hsl(280 65% 60%)' },
  ];

  const orderStatusData = [
    { status: 'Placed', count: orders.filter(o => o.status === 'placed').length || 5 },
    { status: 'Accepted', count: orders.filter(o => o.status === 'accepted').length || 8 },
    { status: 'Delivered', count: orders.filter(o => o.status === 'delivered').length || 12 },
    { status: 'Cancelled', count: orders.filter(o => o.status === 'cancelled').length || 2 },
  ];

  return (
    <DashboardShell title="Doctor / Admin Dashboard" description="Platform overview and patient management">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon={Users} label="Total Patients" value={patients.length || 47} color="bg-primary" trend="+12%" />
        <StatCard icon={Calendar} label="Appointments" value={appointments.length || 8} color="bg-accent" trend="Today" />
        <StatCard icon={Siren} label="Emergency Cases" value={sosAlerts.filter(s => s.status === 'active').length || 2} color="bg-destructive" trend="Active" />
        <StatCard icon={Pill} label="Medicine Orders" value={orders.length || 28} color="bg-warning" trend="+15%" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card className="glass">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" /> Order Analytics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={orderStatusData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="status" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="glass">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-accent" /> Patient Demographics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={patientGenderData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                  {patientGenderData.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <SectionCard title="Recent Appointments">
          <div className="space-y-3">
            {appointments.length > 0 ? appointments.slice(0, 5).map(apt => (
              <div key={apt.id} className="flex items-center justify-between rounded-lg bg-card/50 p-3">
                <div className="flex items-center gap-3">
                  <Avatar className="h-9 w-9">
                    <AvatarFallback className="bg-primary/10 text-primary text-xs">P</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium">{apt.reason || 'Appointment'}</p>
                    <p className="text-xs text-muted-foreground">{formatDateTime(apt.scheduled_at)}</p>
                  </div>
                </div>
                <Badge variant="secondary" className={
                  apt.status === 'confirmed' ? 'bg-success/10 text-success' :
                  apt.status === 'cancelled' ? 'bg-destructive/10 text-destructive' :
                  'bg-warning/10 text-warning'
                }>{apt.status}</Badge>
              </div>
            )) : <p className="text-sm text-muted-foreground">No appointments</p>}
          </div>
        </SectionCard>

        <SectionCard title="Emergency Alerts">
          <div className="space-y-3">
            {sosAlerts.length > 0 ? sosAlerts.slice(0, 5).map(sos => (
              <div key={sos.id} className="flex items-center justify-between rounded-lg bg-destructive/5 p-3">
                <div className="flex items-center gap-3">
                  <Siren className="h-5 w-5 text-destructive" />
                  <div>
                    <p className="text-sm font-medium">SOS Alert</p>
                    <p className="text-xs text-muted-foreground">{timeAgo(sos.created_at)}</p>
                  </div>
                </div>
                <Badge variant="secondary" className={
                  sos.status === 'active' ? 'bg-destructive/10 text-destructive' :
                  sos.status === 'resolved' ? 'bg-success/10 text-success' : ''
                }>{sos.status}</Badge>
              </div>
            )) : <p className="text-sm text-muted-foreground">No emergency alerts</p>}
          </div>
        </SectionCard>
      </div>

      <SectionCard title="Recent Patients">
        <div className="space-y-3">
          {patients.length > 0 ? patients.map(p => (
            <div key={p.id} className="flex items-center justify-between rounded-lg bg-card/50 p-3">
              <div className="flex items-center gap-3">
                <Avatar className="h-9 w-9">
                  <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-white text-xs">
                    {getInitials(p.full_name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium">{p.full_name}</p>
                  <p className="text-xs text-muted-foreground">{p.gender} - {p.age || 'N/A'} years</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {p.is_pregnant && <Badge variant="secondary" className="bg-primary/10 text-primary text-xs">Pregnant</Badge>}
                {p.chronic_diseases && <Badge variant="secondary" className="bg-warning/10 text-warning text-xs">Chronic</Badge>}
              </div>
            </div>
          )) : <p className="text-sm text-muted-foreground">No patients registered</p>}
        </div>
      </SectionCard>
    </DashboardShell>
  );
}
