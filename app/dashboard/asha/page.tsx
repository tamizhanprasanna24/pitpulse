'use client';

import * as React from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/auth-context';
import { DashboardShell, StatCard, SectionCard } from '@/components/dashboard/shell';
import type { AshaVisit, Profile } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Users, Home, Baby, ClipboardList, MapPin, Plus, Heart,
  Activity, Stethoscope, AlertCircle, FileText, Wifi, WifiOff,
} from 'lucide-react';
import { formatDateTime, timeAgo } from '@/lib/health-utils';
import { toast } from 'sonner';

export default function AshaDashboard() {
  const { profile } = useAuth();
  const [visits, setVisits] = React.useState<AshaVisit[]>([]);
  const [patients, setPatients] = React.useState<Profile[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [showForm, setShowForm] = React.useState(false);
  const [isOnline, setIsOnline] = React.useState(true);
  const [visitForm, setVisitForm] = React.useState({
    patient_name: '', village: profile?.assigned_village || '', visit_type: 'home_visit', notes: '',
  });

  React.useEffect(() => {
    if (!profile) return;
    (async () => {
      const [v, p] = await Promise.all([
        supabase.from('asha_visits').select('*').eq('asha_id', profile.id).order('visit_date', { ascending: false }).limit(10),
        supabase.from('profiles').select('*').eq('role', 'patient').limit(10),
      ]);
      setVisits(v.data as AshaVisit[] || []);
      setPatients(p.data as Profile[] || []);
      setLoading(false);
    })();
  }, [profile]);

  const handleLogVisit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || !visitForm.patient_name) return;
    const { data, error } = await supabase.from('asha_visits').insert({
      asha_id: profile.id,
      patient_name: visitForm.patient_name,
      village: visitForm.village || null,
      visit_type: visitForm.visit_type,
      notes: visitForm.notes || null,
      status: 'completed',
    }).select().single();
    if (error) { toast.error('Failed to log visit'); }
    else { toast.success('Visit logged'); setVisits(prev => [data as AshaVisit, ...prev]); setShowForm(false); setVisitForm({ patient_name: '', village: profile?.assigned_village || '', visit_type: 'home_visit', notes: '' }); }
  };

  const visitTypeIcons: Record<string, typeof Home> = {
    home_visit: Home,
    survey: ClipboardList,
    vaccination: Baby,
    medicine_distribution: Activity,
    emergency: AlertCircle,
  };

  return (
    <DashboardShell title="ASHA Worker Dashboard" description={profile?.assigned_village ? `Village: ${profile.assigned_village}` : 'Community Health Worker'}>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon={Users} label="Registered Patients" value={patients.length} color="bg-primary" />
        <StatCard icon={Home} label="Home Visits" value={visits.filter(v => v.visit_type === 'home_visit').length} color="bg-accent" />
        <StatCard icon={Baby} label="Vaccinations" value={visits.filter(v => v.visit_type === 'vaccination').length} color="bg-warning" />
        <StatCard icon={ClipboardList} label="Surveys" value={visits.filter(v => v.visit_type === 'survey').length} color="bg-chart-4" />
      </div>

      <Card className="glass mt-6">
        <CardContent className="flex items-center justify-between p-6">
          <div className="flex items-center gap-4">
            <div className={`flex h-12 w-12 items-center justify-center rounded-full ${isOnline ? 'bg-success/10' : 'bg-muted'}`}>
              {isOnline ? <Wifi className="h-6 w-6 text-success" /> : <WifiOff className="h-6 w-6 text-muted-foreground" />}
            </div>
            <div>
              <h3 className="font-semibold">Sync Status</h3>
              <p className="text-sm text-muted-foreground">{isOnline ? 'Online - data synced in real-time' : 'Offline - data will sync when connection restored'}</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={() => { setIsOnline(!isOnline); toast.success(isOnline ? 'Working offline' : 'Back online - syncing data'); }}>
            {isOnline ? 'Go Offline' : 'Go Online'}
          </Button>
        </CardContent>
      </Card>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Recent Visits</h2>
            <Button size="sm" onClick={() => setShowForm(!showForm)} className="bg-gradient-to-r from-primary to-accent text-white">
              <Plus className="mr-1 h-4 w-4" /> Log Visit
            </Button>
          </div>

          {showForm && (
            <Card className="glass">
              <CardContent className="pt-6">
                <form onSubmit={handleLogVisit} className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Patient Name</Label>
                      <Input placeholder="Patient name" value={visitForm.patient_name} onChange={(e) => setVisitForm({ ...visitForm, patient_name: e.target.value })} required />
                    </div>
                    <div className="space-y-2">
                      <Label>Village</Label>
                      <Input placeholder="Village" value={visitForm.village} onChange={(e) => setVisitForm({ ...visitForm, village: e.target.value })} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Visit Type</Label>
                    <Select value={visitForm.visit_type} onValueChange={(v) => setVisitForm({ ...visitForm, visit_type: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="home_visit">Home Visit</SelectItem>
                        <SelectItem value="survey">Health Survey</SelectItem>
                        <SelectItem value="vaccination">Vaccination</SelectItem>
                        <SelectItem value="medicine_distribution">Medicine Distribution</SelectItem>
                        <SelectItem value="emergency">Emergency</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Notes</Label>
                    <Input placeholder="Visit notes" value={visitForm.notes} onChange={(e) => setVisitForm({ ...visitForm, notes: e.target.value })} />
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit" className="bg-gradient-to-r from-primary to-accent text-white">Save Visit</Button>
                    <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {visits.length === 0 && !showForm ? (
            <Card className="glass">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Home className="h-12 w-12 text-muted-foreground" />
                <p className="mt-4 text-sm text-muted-foreground">No visits logged yet. Start by logging a home visit.</p>
              </CardContent>
            </Card>
          ) : (
            visits.map(visit => {
              const Icon = visitTypeIcons[visit.visit_type] || Home;
              return (
                <Card key={visit.id} className="glass">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                          <Icon className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-semibold">{visit.patient_name || 'Patient'}</h3>
                          <p className="text-xs text-muted-foreground capitalize">{visit.visit_type.replace(/_/g, ' ')} - {visit.village || 'N/A'}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant="secondary" className="bg-success/10 text-success">{visit.status}</Badge>
                        <p className="mt-1 text-xs text-muted-foreground">{timeAgo(visit.visit_date)}</p>
                      </div>
                    </div>
                    {visit.notes && <p className="mt-3 text-sm text-muted-foreground">{visit.notes}</p>}
                    {visit.latitude && visit.longitude && (
                      <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3" /> GPS verified
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>

        <div className="space-y-4">
          <SectionCard title="Quick Actions">
            <div className="grid grid-cols-2 gap-3">
              <Button variant="outline" size="sm" className="h-auto flex-col gap-1 py-3">
                <Home className="h-5 w-5 text-primary" />
                <span className="text-xs">Home Visit</span>
              </Button>
              <Button variant="outline" size="sm" className="h-auto flex-col gap-1 py-3">
                <ClipboardList className="h-5 w-5 text-accent" />
                <span className="text-xs">Survey</span>
              </Button>
              <Button variant="outline" size="sm" className="h-auto flex-col gap-1 py-3">
                <Baby className="h-5 w-5 text-warning" />
                <span className="text-xs">Vaccination</span>
              </Button>
              <Button variant="outline" size="sm" className="h-auto flex-col gap-1 py-3">
                <Activity className="h-5 w-5 text-chart-4" />
                <span className="text-xs">Medicines</span>
              </Button>
            </div>
          </SectionCard>

          <SectionCard title="Village Patients">
            <div className="space-y-2">
              {patients.length > 0 ? patients.slice(0, 5).map(p => (
                <div key={p.id} className="flex items-center justify-between rounded-lg bg-card/50 p-2 text-sm">
                  <span className="font-medium">{p.full_name}</span>
                  <div className="flex items-center gap-1">
                    {p.is_pregnant && <Badge variant="secondary" className="bg-primary/10 text-primary text-xs">Pregnant</Badge>}
                    <span className="text-xs text-muted-foreground">{p.age || '?'}y</span>
                  </div>
                </div>
              )) : <p className="text-sm text-muted-foreground">No patients registered</p>}
            </div>
          </SectionCard>
        </div>
      </div>
    </DashboardShell>
  );
}
