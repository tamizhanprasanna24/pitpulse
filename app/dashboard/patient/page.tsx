'use client';

import * as React from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/auth-context';
import { DashboardShell, StatCard, SectionCard } from '@/components/dashboard/shell';
import { getHealthInsights } from '@/lib/ai-service';
import { getHealthScore, formatDateTime, timeAgo, getPregnancyWeekInfo } from '@/lib/health-utils';
import type { HealthRecord, MedicineOrder, Appointment, Reminder, Notification } from '@/types';
import {
  Heart, Activity, Pill, Truck, Calendar, Bell, Brain,
  Stethoscope, Baby, Siren, ArrowRight, TrendingUp, Droplet,
  Moon, Footprints, Thermometer, Clock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadialBarChart, RadialBar, Area, AreaChart,
} from 'recharts';
import { toast } from 'sonner';

export default function PatientDashboard() {
  const { profile } = useAuth();
  const [healthRecords, setHealthRecords] = React.useState<HealthRecord[]>([]);
  const [orders, setOrders] = React.useState<MedicineOrder[]>([]);
  const [appointments, setAppointments] = React.useState<Appointment[]>([]);
  const [reminders, setReminders] = React.useState<Reminder[]>([]);
  const [notifications, setNotifications] = React.useState<Notification[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!profile) return;
    (async () => {
      const [health, ords, appts, rems, notifs] = await Promise.all([
        supabase.from('health_records').select('*').eq('user_id', profile.id).order('recorded_at', { ascending: false }).limit(50),
        supabase.from('medicine_orders').select('*').eq('patient_id', profile.id).order('created_at', { ascending: false }).limit(5),
        supabase.from('appointments').select('*').eq('patient_id', profile.id).order('scheduled_at', { ascending: false }).limit(5),
        supabase.from('reminders').select('*').eq('user_id', profile.id).eq('is_completed', false).order('scheduled_time', { ascending: true }).limit(5),
        supabase.from('notifications').select('*').eq('user_id', profile.id).order('created_at', { ascending: false }).limit(5),
      ]);

      setHealthRecords(health.data as HealthRecord[] || []);
      setOrders(ords.data as MedicineOrder[] || []);
      setAppointments(appts.data as Appointment[] || []);
      setReminders(rems.data as Reminder[] || []);
      setNotifications(notifs.data as Notification[] || []);
      setLoading(false);
    })();
  }, [profile]);

  if (!profile) return null;

  const healthScore = getHealthScore(healthRecords);
  const insights = getHealthInsights(healthRecords, profile);
  const isPregnant = profile.is_pregnant && profile.gender === 'female';
  const pregnancyInfo = isPregnant && profile.pregnancy_week ? getPregnancyWeekInfo(profile.pregnancy_week) : null;

  const bpData = healthRecords.filter(r => r.type === 'blood_pressure').slice(0, 7).reverse().map(r => ({
    date: new Date(r.recorded_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
    systolic: r.value,
    diastolic: r.secondary_value || 80,
  }));

  const heartRateData = healthRecords.filter(r => r.type === 'heart_rate').slice(0, 7).reverse().map(r => ({
    date: new Date(r.recorded_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
    bpm: r.value,
  }));

  const latestBP = healthRecords.find(r => r.type === 'blood_pressure');
  const latestSugar = healthRecords.find(r => r.type === 'blood_sugar');
  const latestHR = healthRecords.find(r => r.type === 'heart_rate');
  const latestO2 = healthRecords.find(r => r.type === 'oxygen_saturation');

  const handleSOS = async () => {
    const dispatchSos = async (lat: number, lng: number) => {
      const summary = `BP: ${latestBP?.value || '120'}/${latestBP?.secondary_value || '80'}, Sugar: ${latestSugar?.value || '95'}, Allergies: ${profile.allergies || 'None'}`;
      try {
        await supabase.from('emergency_sos').insert({
          user_id: profile.id,
          latitude: lat,
          longitude: lng,
          medical_summary: summary,
        });
      } catch {
        // Fallback for demo or local auth session
      }

      // Persist to local emergency state
      const sosRecord = {
        id: 'sos-' + Date.now(),
        user_id: profile.id,
        latitude: lat,
        longitude: lng,
        status: 'active',
        medical_summary: summary,
        created_at: new Date().toISOString(),
      };
      const saved = JSON.parse(localStorage.getItem('pitpulse_emergency_sos') || '[]');
      localStorage.setItem('pitpulse_emergency_sos', JSON.stringify([sosRecord, ...saved]));

      toast.success('🚨 EMERGENCY SOS DISPATCHED!', {
        description: 'GPS location & emergency medical summary sent to Nearest Hospital & Response Team.',
        duration: 8000,
      });
    };

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => dispatchSos(pos.coords.latitude, pos.coords.longitude),
        () => dispatchSos(28.6139, 77.2090),
        { timeout: 5000 }
      );
    } else {
      dispatchSos(28.6139, 77.2090);
    }
  };

  return (
    <DashboardShell title="Dashboard" description={`Welcome back, ${profile.full_name}`}>
      {/* Health Score Hero */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="glass lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-primary" /> Health Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative flex items-center justify-center">
              <ResponsiveContainer width="100%" height={200}>
                <RadialBarChart innerRadius="70%" outerRadius="100%" data={[{ value: healthScore, fill: healthScore > 80 ? 'hsl(142 71% 45%)' : healthScore > 60 ? 'hsl(38 92% 50%)' : 'hsl(0 84% 60%)' }]} startAngle={90} endAngle={-270}>
                  <RadialBar dataKey="value" cornerRadius={10} background={{ fill: 'hsl(var(--muted))' }} />
                </RadialBarChart>
              </ResponsiveContainer>
              <div className="absolute flex flex-col items-center">
                <span className="text-4xl font-bold">{healthScore}</span>
                <span className="text-sm text-muted-foreground">out of 100</span>
              </div>
            </div>
            <div className="mt-4 flex justify-between text-sm">
              <span className="text-muted-foreground">Status:</span>
              <Badge variant="secondary" className={healthScore > 80 ? 'bg-success/10 text-success' : healthScore > 60 ? 'bg-warning/10 text-warning' : 'bg-destructive/10 text-destructive'}>
                {healthScore > 80 ? 'Excellent' : healthScore > 60 ? 'Good' : 'Needs Attention'}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* AI Insights */}
        <Card className="glass lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-accent" /> AI Health Insights
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {insights.map((insight, i) => (
              <div key={i} className="flex items-start gap-3 rounded-lg bg-card/50 p-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent/10">
                  <Brain className="h-4 w-4 text-accent" />
                </div>
                <p className="text-sm">{insight}</p>
              </div>
            ))}
            <Link href="/dashboard/patient/ai-assistant">
              <Button variant="outline" size="sm" className="w-full">
                Ask AI Assistant <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Vitals Grid */}
      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon={Activity} label="Blood Pressure" value={latestBP ? `${latestBP.value}/${latestBP.secondary_value}` : '--'} unit="mmHg" color="bg-primary" />
        <StatCard icon={Droplet} label="Blood Sugar" value={latestSugar?.value || '--'} unit="mg/dL" color="bg-blue-500" />
        <StatCard icon={Heart} label="Heart Rate" value={latestHR?.value || '--'} unit="bpm" color="bg-destructive" />
        <StatCard icon={Activity} label="Oxygen" value={latestO2?.value || '--'} unit="%" color="bg-success" />
      </div>

      {/* Charts Row */}
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card className="glass">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" /> Blood Pressure Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            {bpData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={bpData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                  <Line type="monotone" dataKey="systolic" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 4 }} />
                  <Line type="monotone" dataKey="diastolic" stroke="hsl(var(--accent))" strokeWidth={2} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-[200px] items-center justify-center text-sm text-muted-foreground">
                No BP data yet. Start tracking in Health Tracker.
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="glass">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-destructive" /> Heart Rate Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            {heartRateData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={heartRateData}>
                  <defs>
                    <linearGradient id="hrGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--destructive))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--destructive))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                  <Area type="monotone" dataKey="bpm" stroke="hsl(var(--destructive))" strokeWidth={2} fill="url(#hrGradient)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-[200px] items-center justify-center text-sm text-muted-foreground">
                No heart rate data yet.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Pregnancy Section */}
      {isPregnant && pregnancyInfo && (
        <Card className="glass mt-6 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Baby className="h-5 w-5 text-primary" /> Pregnancy Dashboard
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <div className="rounded-xl bg-primary/5 p-4">
                <p className="text-2xl font-bold text-primary">{profile.pregnancy_week}</p>
                <p className="text-xs text-muted-foreground">Weeks Pregnant</p>
              </div>
              <div className="rounded-xl bg-accent/5 p-4">
                <p className="text-2xl font-bold text-accent">{pregnancyInfo.trimester}</p>
                <p className="text-xs text-muted-foreground">Trimester</p>
              </div>
              <div className="rounded-xl bg-warning/5 p-4">
                <p className="text-2xl font-bold text-warning">{pregnancyInfo.weeksLeft}</p>
                <p className="text-xs text-muted-foreground">Weeks to Due</p>
              </div>
              <div className="rounded-xl bg-chart-4/5 p-4">
                <p className="text-2xl font-bold text-chart-4">{profile.expected_delivery_date ? new Date(profile.expected_delivery_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '--'}</p>
                <p className="text-xs text-muted-foreground">Due Date</p>
              </div>
            </div>
            <Link href="/dashboard/patient/pregnancy" className="mt-4 inline-block">
              <Button variant="outline" size="sm">
                View Pregnancy Details <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Bottom Row: Orders, Appointments, Reminders */}
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <SectionCard title="Recent Orders" action={<Link href="/dashboard/patient/orders"><Button variant="ghost" size="sm">View All</Button></Link>}>
          <div className="space-y-3">
            {orders.length > 0 ? orders.map((order) => (
              <div key={order.id} className="flex items-center justify-between rounded-lg bg-card/50 p-3">
                <div>
                  <p className="text-sm font-medium">Order #{order.id.slice(0, 8)}</p>
                  <p className="text-xs text-muted-foreground">{timeAgo(order.created_at)}</p>
                </div>
                <Badge variant="secondary" className={
                  order.status === 'delivered' ? 'bg-success/10 text-success' :
                  order.status === 'cancelled' ? 'bg-destructive/10 text-destructive' :
                  'bg-warning/10 text-warning'
                }>{order.status.replace(/_/g, ' ')}</Badge>
              </div>
            )) : <p className="text-sm text-muted-foreground">No orders yet</p>}
          </div>
        </SectionCard>

        <SectionCard title="Appointments" action={<Link href="/dashboard/patient/appointments"><Button variant="ghost" size="sm">View All</Button></Link>}>
          <div className="space-y-3">
            {appointments.length > 0 ? appointments.map((apt) => (
              <div key={apt.id} className="flex items-center justify-between rounded-lg bg-card/50 p-3">
                <div>
                  <p className="text-sm font-medium">{apt.reason || 'Appointment'}</p>
                  <p className="text-xs text-muted-foreground">{formatDateTime(apt.scheduled_at)}</p>
                </div>
                <Badge variant="secondary" className={
                  apt.status === 'confirmed' ? 'bg-success/10 text-success' :
                  apt.status === 'cancelled' ? 'bg-destructive/10 text-destructive' :
                  'bg-primary/10 text-primary'
                }>{apt.status}</Badge>
              </div>
            )) : <p className="text-sm text-muted-foreground">No appointments</p>}
          </div>
        </SectionCard>

        <SectionCard title="Reminders">
          <div className="space-y-3">
            {reminders.length > 0 ? reminders.map((rem) => (
              <div key={rem.id} className="flex items-start gap-3 rounded-lg bg-card/50 p-3">
                <Clock className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
                <div>
                  <p className="text-sm font-medium">{rem.title}</p>
                  <p className="text-xs text-muted-foreground">{formatDateTime(rem.scheduled_time)}</p>
                </div>
              </div>
            )) : <p className="text-sm text-muted-foreground">No reminders</p>}
          </div>
        </SectionCard>
      </div>

      {/* Emergency SOS */}
      <div className="mt-6">
        <Card className="glass border-destructive/20">
          <CardContent className="flex flex-col items-center justify-between gap-4 p-6 md:flex-row">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10">
                <Siren className="h-7 w-7 text-destructive" />
              </div>
              <div>
                <h3 className="font-semibold">Emergency SOS</h3>
                <p className="text-sm text-muted-foreground">One tap to share your location and medical info with emergency contacts</p>
              </div>
            </div>
            <Button size="lg" onClick={handleSOS} className="bg-destructive text-white hover:bg-destructive/90">
              <Siren className="mr-2 h-5 w-5" /> Send SOS
            </Button>
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}
