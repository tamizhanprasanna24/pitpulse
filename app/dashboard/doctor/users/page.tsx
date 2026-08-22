'use client';
import * as React from 'react';
import { supabase } from '@/lib/supabase';
import { DashboardShell, SectionCard } from '@/components/dashboard/shell';
import type { Profile, UserRole, DiagnosticCentre } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Users, Shield, Trash2 } from 'lucide-react';
import { getInitials } from '@/lib/health-utils';
import { toast } from 'sonner';

export default function DoctorUsersPage() {
  const [users, setUsers] = React.useState<Profile[]>([]);
  const [centres, setCentres] = React.useState<DiagnosticCentre[]>([]);

  const fetchCentres = React.useCallback(async () => {
    try {
      const res = await fetch('/api/diagnostic/admin/approval');
      const data = await res.json();
      if (data.success) {
        setCentres(data.centres || []);
      }
    } catch {
      // ignore
    }
  }, []);

  React.useEffect(() => {
    (async () => {
      const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
      setUsers(data as Profile[] || []);
    })();
    fetchCentres();
  }, [fetchCentres]);

  const handleApprovalAction = async (centreID: string, action: 'approve' | 'reject') => {
    try {
      const res = await fetch('/api/diagnostic/admin/approval', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ centre_id: centreID, action, admin_id: 'DOC-ADMIN', admin_name: 'Pit Pulse Admin' }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success(`Diagnostic Centre ${action}d successfully!`);
        fetchCentres();
      }
    } catch {
      toast.error('Failed to update centre status.');
    }
  };

  const roleColors: Record<UserRole, string> = { patient: 'bg-primary/10 text-primary', doctor: 'bg-accent/10 text-accent', asha: 'bg-warning/10 text-warning', pharmacy: 'bg-chart-4/10 text-chart-4', delivery: 'bg-chart-5/10 text-chart-5', diagnostic: 'bg-emerald-500/10 text-emerald-500' };

  const handleDeactivate = async (id: string) => {
    const { error } = await supabase.from('profiles').update({ is_active: false }).eq('id', id);
    if (error) { toast.error('Failed to deactivate user'); }
    else { toast.success('User deactivated'); setUsers(prev => prev.map(u => u.id === id ? { ...u, is_active: false } : u)); }
  };

  return (
    <DashboardShell title="User & Diagnostic Centre Approvals" description="Manage platform users and approve pending Diagnostic Centres">
      <div className="space-y-6">
        <SectionCard title="Diagnostic Centre Registration Approvals">
          <div className="space-y-3">
            {centres.length > 0 ? (
              centres.map((c) => (
                <div key={c.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between rounded-lg bg-card/50 p-4 border border-border/40 gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-base">{c.centre_name}</span>
                      <Badge variant="outline" className="font-mono text-[10px] bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
                        {c.centre_id}
                      </Badge>
                      <Badge variant="outline" className={`text-[10px] uppercase font-mono ${
                        c.status === 'approved' ? 'bg-emerald-500/10 text-emerald-500' :
                        c.status === 'rejected' ? 'bg-destructive/10 text-destructive' :
                        'bg-amber-500/10 text-amber-500'
                      }`}>
                        {c.status.replace('_', ' ')}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      📍 {c.address}, {c.location} • ✉️ {c.official_email} • 📞 {c.contact_number}
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      👨‍⚕️ Admin Staff: {c.admin_staff_name} ({c.admin_staff_id})
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {c.status === 'pending_verification' && (
                      <>
                        <button
                          onClick={() => handleApprovalAction(c.centre_id, 'approve')}
                          className="px-3 py-1.5 rounded-md text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition-all"
                        >
                          Approve Centre
                        </button>
                        <button
                          onClick={() => handleApprovalAction(c.centre_id, 'reject')}
                          className="px-3 py-1.5 rounded-md text-xs font-semibold bg-destructive hover:bg-destructive/80 text-white transition-all"
                        >
                          Reject
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="py-6 text-center text-xs text-muted-foreground">
                No Diagnostic Centres pending approval.
              </div>
            )}
          </div>
        </SectionCard>

        <SectionCard title="All Platform Users">
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
      </div>
    </DashboardShell>
  );
}
