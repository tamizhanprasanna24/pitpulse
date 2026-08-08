'use client';
import * as React from 'react';
import { supabase } from '@/lib/supabase';
import { DashboardShell, SectionCard } from '@/components/dashboard/shell';
import type { Profile, UserRole } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Users, Shield, Trash2 } from 'lucide-react';
import { getInitials } from '@/lib/health-utils';
import { toast } from 'sonner';

export default function DoctorUsersPage() {
  const [users, setUsers] = React.useState<Profile[]>([]);
  React.useEffect(() => {
    (async () => {
      const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
      setUsers(data as Profile[] || []);
    })();
  }, []);

  const roleColors: Record<UserRole, string> = { patient: 'bg-primary/10 text-primary', doctor: 'bg-accent/10 text-accent', asha: 'bg-warning/10 text-warning', pharmacy: 'bg-chart-4/10 text-chart-4', delivery: 'bg-chart-5/10 text-chart-5' };

  const handleDeactivate = async (id: string) => {
    const { error } = await supabase.from('profiles').update({ is_active: false }).eq('id', id);
    if (error) { toast.error('Failed to deactivate user'); }
    else { toast.success('User deactivated'); setUsers(prev => prev.map(u => u.id === id ? { ...u, is_active: false } : u)); }
  };

  return (
    <DashboardShell title="User Management" description="Manage all platform users">
      <SectionCard title="All Users">
        <div className="space-y-3">
          {users.length > 0 ? users.map(u => (
            <div key={u.id} className="flex items-center justify-between rounded-lg bg-card/50 p-3">
              <div className="flex items-center gap-3">
                <Avatar className="h-9 w-9"><AvatarFallback className="bg-gradient-to-br from-primary to-accent text-white text-xs">{getInitials(u.full_name)}</AvatarFallback></Avatar>
                <div>
                  <p className="text-sm font-medium">{u.full_name}</p>
                  <p className="text-xs text-muted-foreground">{u.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className={'capitalize ' + (roleColors[u.role] || '')}>{u.role}</Badge>
                {u.is_active ? <Badge variant="secondary" className="bg-success/10 text-success">Active</Badge> : <Badge variant="secondary" className="bg-destructive/10 text-destructive">Inactive</Badge>}
                {u.is_active && <button onClick={() => handleDeactivate(u.id)} className="text-destructive hover:opacity-70"><Trash2 className="h-4 w-4" /></button>}
              </div>
            </div>
          )) : <div className="flex flex-col items-center py-12"><Users className="h-12 w-12 text-muted-foreground" /><p className="mt-4 text-sm text-muted-foreground">No users registered yet.</p></div>}
        </div>
      </SectionCard>
    </DashboardShell>
  );
}
