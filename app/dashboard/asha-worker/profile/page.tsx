'use client';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

import * as React from 'react';
import { useAuth } from '@/context/auth-context';
import { supabase } from '@/lib/supabase';
import { DashboardShell } from '@/components/dashboard/shell';
import { getInitials } from '@/lib/health-utils';
import type { Profile } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Mail, Phone, MapPin, Heart, Edit3, Save, Loader2, Home, Shield, Activity } from 'lucide-react';
import { toast } from 'sonner';

export default function AshaProfilePage() {
  const { profile, setLocalProfile } = useAuth();
  const [editing, setEditing] = React.useState(false);
  const [saving, setSaving] = React.useState(false);

  const activeProfile = profile || {
    id: 'asha-default',
    email: 'sunita.devi@pitpulse.org',
    role: 'asha',
    full_name: 'Sunita Devi',
    assigned_village: 'Rampur Sub-Center Block 3',
    mobile_number: '+91 98765 22222',
    address: 'Sub-Center Health Office, Village Rampur',
  };

  const [fullName, setFullName] = React.useState(activeProfile.full_name || '');
  const [assignedVillage, setAssignedVillage] = React.useState(activeProfile.assigned_village || 'Rampur Sub-Center Block 3');
  const [mobileNumber, setMobileNumber] = React.useState(activeProfile.mobile_number || '');
  const [address, setAddress] = React.useState(activeProfile.address || '');

  React.useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '');
      setAssignedVillage(profile.assigned_village || 'Rampur Sub-Center Block 3');
      setMobileNumber(profile.mobile_number || '');
      setAddress(profile.address || '');
    }
  }, [profile]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const updated: Partial<Profile> = {
      full_name: fullName,
      assigned_village: assignedVillage,
      mobile_number: mobileNumber,
      address,
      updated_at: new Date().toISOString(),
    };

    try {
      if (profile && profile.id && !profile.id.startsWith('demo-')) {
        await supabase.from('profiles').update(updated).eq('id', profile.id);
      }
    } catch {
      // Fallback
    }

    setLocalProfile({ ...activeProfile, ...updated } as Profile);
    setSaving(false);
    setEditing(false);
    toast.success('ASHA Worker profile updated successfully!');
  };

  return (
    <DashboardShell title="ASHA Worker Profile" description="Manage your assigned village jurisdiction, sub-center details, and contact info">
      <div className="space-y-6 max-w-4xl mx-auto">
        {/* Banner Card */}
        <Card className="glass border-emerald-500/20 shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-emerald-500/20 via-teal-500/15 to-transparent p-6 sm:p-8 border-b border-border/50">
            <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-6">
              <div className="flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
                <Avatar className="h-24 w-24 ring-4 ring-background shadow-2xl">
                  <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white text-3xl font-extrabold">
                    {getInitials(activeProfile.full_name || 'ASHA')}
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                    <h1 className="text-2xl font-bold tracking-tight text-foreground">{activeProfile.full_name}</h1>
                    <Badge className="bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/30 text-xs">
                      <Heart className="mr-1 h-3 w-3 inline text-rose-500" /> ASHA Health Worker
                    </Badge>
                  </div>
                  <p className="text-sm font-semibold text-teal-600 dark:text-teal-400">Assigned: {activeProfile.assigned_village || 'Rampur Block 3'}</p>
                  <p className="text-xs text-muted-foreground flex items-center justify-center sm:justify-start gap-1">
                    <Mail className="h-3.5 w-3.5" /> {activeProfile.email}
                  </p>
                </div>
              </div>

              <Button
                onClick={() => setEditing(!editing)}
                variant={editing ? 'secondary' : 'default'}
                className={editing ? '' : 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md'}
              >
                {editing ? 'Cancel' : <><Edit3 className="mr-2 h-4 w-4" /> Edit ASHA Profile</>}
              </Button>
            </div>
          </div>
        </Card>

        {/* Form Details */}
        <form onSubmit={handleSave} className="space-y-6">
          <Card className="glass border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Home className="h-4 w-4 text-emerald-500" /> Village Jurisdiction & Contact Details
              </CardTitle>
              <CardDescription>Community health center assignment and phone contact</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>ASHA Worker Full Name</Label>
                  {editing ? (
                    <Input value={fullName} onChange={(e) => setFullName(e.target.value)} required />
                  ) : (
                    <p className="text-sm font-medium text-foreground bg-muted/40 p-2.5 rounded-lg">{activeProfile.full_name}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Assigned Village / Sub-Center Sector</Label>
                  {editing ? (
                    <Input value={assignedVillage} onChange={(e) => setAssignedVillage(e.target.value)} required />
                  ) : (
                    <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 p-2.5 rounded-lg">{activeProfile.assigned_village || 'Rampur Block 3'}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Contact Phone Number</Label>
                  {editing ? (
                    <Input value={mobileNumber} onChange={(e) => setMobileNumber(e.target.value)} required />
                  ) : (
                    <p className="text-sm font-medium text-foreground bg-muted/40 p-2.5 rounded-lg">{activeProfile.mobile_number || 'N/A'}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Sub-Center Health Office Address</Label>
                  {editing ? (
                    <Input value={address} onChange={(e) => setAddress(e.target.value)} />
                  ) : (
                    <p className="text-sm font-medium text-foreground bg-muted/40 p-2.5 rounded-lg">{activeProfile.address || 'Sub-Center Rampur'}</p>
                  )}
                </div>
              </div>

              {editing && (
                <div className="flex justify-end gap-3 pt-4 border-t border-border/50">
                  <Button type="button" variant="outline" onClick={() => setEditing(false)}>Cancel</Button>
                  <Button type="submit" disabled={saving} className="bg-emerald-600 text-white">
                    {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</> : <><Save className="mr-2 h-4 w-4" /> Save ASHA Profile</>}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </form>
      </div>
    </DashboardShell>
  );
}
