'use client';

import * as React from 'react';
import { useAuth } from '@/context/auth-context';
import { DashboardShell } from '@/components/dashboard/shell';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Users, Plus, ShieldCheck, RefreshCw, KeyRound, Lock } from 'lucide-react';
import type { DiagnosticStaff, DiagnosticStaffRole } from '@/types';

export default function DiagnosticStaffPage() {
  const { profile } = useAuth();
  const centreID = profile?.centre_id || profile?.license_number || 'APOLLO-7F2K91QM';
  const staffRole = profile?.staff_role || 'centre_admin';

  const [staffList, setStaffList] = React.useState<DiagnosticStaff[]>([]);
  const [showAddModal, setShowAddModal] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [loading, setLoading] = React.useState(true);

  // Form Fields
  const [name, setName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [staffID, setStaffID] = React.useState('');
  const [role, setRole] = React.useState<DiagnosticStaffRole>('lab_technician');
  const [password, setPassword] = React.useState('');

  const fetchStaff = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/diagnostic/staff?centre_id=${centreID}`);
      const data = await res.json();
      if (data.success) {
        setStaffList(data.staff || []);
      }
    } catch {
      toast.error('Failed to load staff list.');
    } finally {
      setLoading(false);
    }
  }, [centreID]);

  React.useEffect(() => {
    fetchStaff();
  }, [fetchStaff]);

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !staffID.trim() || !password) {
      toast.error('All fields are required.');
      return;
    }
    setSubmitting(true);

    try {
      const res = await fetch('/api/diagnostic/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          centre_id: centreID,
          admin_staff_id: profile?.staff_id || 'ADMIN-1',
          admin_staff_name: profile?.full_name || 'Admin',
          name: name.trim(),
          email: email.trim(),
          staff_id: staffID.trim().toUpperCase(),
          role,
          password,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        toast.error(data.message || 'Failed to create staff account.');
        setSubmitting(false);
        return;
      }

      toast.success(`Staff account created for ${name} (${staffID.toUpperCase()})`);
      setShowAddModal(false);
      setName('');
      setEmail('');
      setStaffID('');
      setPassword('');
      fetchStaff();
    } catch {
      toast.error('Network error creating staff account.');
    } finally {
      setSubmitting(false);
    }
  };

  if (staffRole !== 'centre_admin') {
    return (
      <DashboardShell title="Staff Accounts" description="Restricted Access">
        <div className="py-12 text-center space-y-3">
          <Lock className="h-12 w-12 text-amber-500 mx-auto" />
          <h2 className="text-lg font-bold">Access Restricted</h2>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            Only Centre Admins have permission to manage staff accounts and permissions.
          </p>
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell title="Staff Accounts & Permissions" description={`Centre ID: ${centreID} • Role-Based Access Control (RBAC) Management`}>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-card/60 p-4 rounded-xl border border-border/50 backdrop-blur-md">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-indigo-500" />
            <div>
              <h2 className="text-base font-bold">Internal Staff Roster</h2>
              <p className="text-xs text-muted-foreground">Manage accounts for Centre Admins, Lab Technicians, and Receptionists</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button onClick={fetchStaff} variant="outline" size="sm" className="gap-1 text-xs">
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
            </Button>
            <Button size="sm" onClick={() => setShowAddModal(true)} className="gap-1 text-xs bg-gradient-to-r from-primary to-accent text-white">
              <Plus className="h-3.5 w-3.5" /> Create Staff Account
            </Button>
          </div>
        </div>

        <Card className="glass-strong border-border/50">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-base font-bold">Registered Staff Accounts ({staffList.length})</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-2">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {staffList.map((s) => (
                <div key={s.id} className="p-4 rounded-xl bg-card/40 border border-border/40 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="font-bold text-sm">{s.name}</span>
                      <p className="text-xs font-mono text-muted-foreground mt-0.5">Staff ID: {s.staff_id}</p>
                    </div>
                    <Badge variant="outline" className={`text-[10px] uppercase font-mono ${
                      s.role === 'centre_admin' ? 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20' :
                      s.role === 'lab_technician' ? 'bg-teal-500/10 text-teal-500 border-teal-500/20' :
                      'bg-amber-500/10 text-amber-500 border-amber-500/20'
                    }`}>
                      {s.role.replace('_', ' ')}
                    </Badge>
                  </div>

                  <p className="text-xs text-muted-foreground">✉️ {s.email}</p>
                  <p className="text-[11px] text-muted-foreground">📅 Created: {new Date(s.created_at).toLocaleDateString()}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add Staff Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create Staff Account</DialogTitle>
            <DialogDescription className="text-xs">Add a new staff member with role-based permissions</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateStaff} className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>Full Name *</Label>
              <Input placeholder="e.g. Ramesh Kumar" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Staff ID *</Label>
                <Input placeholder="e.g. LAB-02" value={staffID} onChange={(e) => setStaffID(e.target.value.toUpperCase())} required />
              </div>
              <div className="space-y-2">
                <Label>Internal Role *</Label>
                <Select value={role} onValueChange={(v) => setRole(v as DiagnosticStaffRole)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="centre_admin">Centre Admin</SelectItem>
                    <SelectItem value="lab_technician">Lab Technician</SelectItem>
                    <SelectItem value="receptionist">Receptionist</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Official Email *</Label>
              <Input type="email" placeholder="staff@diagnostic.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>

            <div className="space-y-2">
              <Label>Password *</Label>
              <Input type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setShowAddModal(false)}>Cancel</Button>
              <Button type="submit" disabled={submitting} className="bg-primary text-white">
                {submitting ? 'Creating...' : 'Create Account'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </DashboardShell>
  );
}
