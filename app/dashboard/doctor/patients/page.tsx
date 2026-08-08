'use client';
import * as React from 'react';
import { supabase } from '@/lib/supabase';
import { DashboardShell, SectionCard } from '@/components/dashboard/shell';
import type { Profile } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Users, Search } from 'lucide-react';
import { getInitials } from '@/lib/health-utils';

export default function DoctorPatientsPage() {
  const [patients, setPatients] = React.useState<Profile[]>([]);
  const [search, setSearch] = React.useState('');
  React.useEffect(() => {
    (async () => {
      const { data } = await supabase.from('profiles').select('*').eq('role', 'patient').order('created_at', { ascending: false });
      setPatients(data as Profile[] || []);
    })();
  }, []);
  const filtered = patients.filter(p => p.full_name.toLowerCase().includes(search.toLowerCase()) || p.email.toLowerCase().includes(search.toLowerCase()));
  return (
    <DashboardShell title="Patients" description="Manage all registered patients">
      <div className="mb-4 relative max-w-sm">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search patients..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filtered.map(p => (
          <Card key={p.id} className="glass">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12"><AvatarFallback className="bg-gradient-to-br from-primary to-accent text-white">{getInitials(p.full_name)}</AvatarFallback></Avatar>
                <div className="flex-1">
                  <h3 className="font-semibold">{p.full_name}</h3>
                  <p className="text-xs text-muted-foreground">{p.email}</p>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2 text-xs">
                {p.gender && <Badge variant="secondary" className="capitalize">{p.gender}</Badge>}
                {p.age && <Badge variant="secondary">{p.age}y</Badge>}
                {p.blood_group && <Badge variant="secondary">{p.blood_group}</Badge>}
                {p.is_pregnant && <Badge variant="secondary" className="bg-primary/10 text-primary">Pregnant</Badge>}
                {p.chronic_diseases && <Badge variant="secondary" className="bg-warning/10 text-warning">Chronic</Badge>}
              </div>
              {p.chronic_diseases && <p className="mt-2 text-xs text-muted-foreground">Conditions: {p.chronic_diseases}</p>}
              {p.allergies && <p className="mt-1 text-xs text-muted-foreground">Allergies: {p.allergies}</p>}
            </CardContent>
          </Card>
        ))}
      </div>
      {filtered.length === 0 && <Card className="glass"><CardContent className="flex flex-col items-center py-12"><Users className="h-12 w-12 text-muted-foreground" /><p className="mt-4 text-sm text-muted-foreground">No patients found.</p></CardContent></Card>}
    </DashboardShell>
  );
}
