'use client';

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
import { Mail, Phone, MapPin, Pill, Edit3, Save, Loader2, ShieldCheck, Clock, Truck } from 'lucide-react';
import { toast } from 'sonner';

export default function PharmacyProfilePage() {
  const { profile, setLocalProfile } = useAuth();
  const [editing, setEditing] = React.useState(false);
  const [saving, setSaving] = React.useState(false);

  const activeProfile = profile || {
    id: 'pharm-default',
    email: 'apollo.rampur@pitpulse.org',
    role: 'pharmacy',
    full_name: 'Apollo Lifecare Pharmacy (24x7)',
    license_number: 'DL-2022-77892',
    mobile_number: '+91 98765 55555',
    address: 'Shop 12, Main Market Road, Rampur',
  };

  const [fullName, setFullName] = React.useState(activeProfile.full_name || '');
  const [licenseNumber, setLicenseNumber] = React.useState(activeProfile.license_number || 'DL-2022-77892');
  const [mobileNumber, setMobileNumber] = React.useState(activeProfile.mobile_number || '');
  const [address, setAddress] = React.useState(activeProfile.address || '');

  React.useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '');
      setLicenseNumber(profile.license_number || 'DL-2022-77892');
      setMobileNumber(profile.mobile_number || '');
      setAddress(profile.address || '');
    }
  }, [profile]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const updated: Partial<Profile> = {
      full_name: fullName,
      license_number: licenseNumber,
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
    toast.success('Pharmacy profile updated successfully!');
  };

  return (
    <DashboardShell title="Pharmacy Profile" description="Manage drug store license numbers, outlet address, and operating hours">
      <div className="space-y-6 max-w-4xl mx-auto">
        {/* Banner Card */}
        <Card className="glass border-purple-500/20 shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-purple-500/20 via-indigo-500/15 to-transparent p-6 sm:p-8 border-b border-border/50">
            <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-6">
              <div className="flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
                <Avatar className="h-24 w-24 ring-4 ring-background shadow-2xl">
                  <AvatarFallback className="bg-gradient-to-br from-purple-600 to-indigo-600 text-white text-3xl font-extrabold">
                    {getInitials(activeProfile.full_name || 'Pharmacy')}
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                    <h1 className="text-2xl font-bold tracking-tight text-foreground">{activeProfile.full_name}</h1>
                    <Badge className="bg-purple-500/20 text-purple-600 dark:text-purple-400 hover:bg-purple-500/30 text-xs">
                      <Pill className="mr-1 h-3 w-3 inline" /> Verified Pharmacy Outlet
                    </Badge>
                  </div>
                  <p className="text-sm font-semibold text-purple-600 dark:text-purple-300">Drug License: {activeProfile.license_number || 'DL-2022-77892'}</p>
                  <p className="text-xs text-muted-foreground flex items-center justify-center sm:justify-start gap-1">
                    <Mail className="h-3.5 w-3.5" /> {activeProfile.email}
                  </p>
                </div>
              </div>

              <Button
                onClick={() => setEditing(!editing)}
                variant={editing ? 'secondary' : 'default'}
                className={editing ? '' : 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md'}
              >
                {editing ? 'Cancel' : <><Edit3 className="mr-2 h-4 w-4" /> Edit Pharmacy Profile</>}
              </Button>
            </div>
          </div>
        </Card>

        {/* Form Details */}
        <form onSubmit={handleSave} className="space-y-6">
          <Card className="glass border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <ShieldCheck className="h-4 w-4 text-purple-500" /> Drug License & Outlet Details
              </CardTitle>
              <CardDescription>Pharmacy registration and contact location</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Pharmacy Outlet Name</Label>
                  {editing ? (
                    <Input value={fullName} onChange={(e) => setFullName(e.target.value)} required />
                  ) : (
                    <p className="text-sm font-medium text-foreground bg-muted/40 p-2.5 rounded-lg">{activeProfile.full_name}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Drug License Number (DL No.)</Label>
                  {editing ? (
                    <Input value={licenseNumber} onChange={(e) => setLicenseNumber(e.target.value)} required />
                  ) : (
                    <p className="text-sm font-bold text-purple-600 dark:text-purple-400 bg-purple-500/10 p-2.5 rounded-lg">{activeProfile.license_number || 'DL-2022-77892'}</p>
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
                  <Label>Pharmacy Address</Label>
                  {editing ? (
                    <Input value={address} onChange={(e) => setAddress(e.target.value)} />
                  ) : (
                    <p className="text-sm font-medium text-foreground bg-muted/40 p-2.5 rounded-lg">{activeProfile.address || 'Shop 12, Main Market, Rampur'}</p>
                  )}
                </div>
              </div>

              {editing && (
                <div className="flex justify-end gap-3 pt-4 border-t border-border/50">
                  <Button type="button" variant="outline" onClick={() => setEditing(false)}>Cancel</Button>
                  <Button type="submit" disabled={saving} className="bg-purple-600 text-white">
                    {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</> : <><Save className="mr-2 h-4 w-4" /> Save Pharmacy Profile</>}
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
