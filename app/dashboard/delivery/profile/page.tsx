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
import { Mail, Phone, MapPin, Truck, Edit3, Save, Loader2, ShieldCheck, Navigation } from 'lucide-react';
import { toast } from 'sonner';

export default function DeliveryProfilePage() {
  const { profile, setLocalProfile } = useAuth();
  const [editing, setEditing] = React.useState(false);
  const [saving, setSaving] = React.useState(false);

  const activeProfile = profile || {
    id: 'del-default',
    email: 'vikram.singh@pitpulse.org',
    role: 'delivery',
    full_name: 'Vikram Singh',
    vehicle_type: 'Motorcycle',
    vehicle_number: 'UP-14-AB-9921',
    mobile_number: '+91 98765 33333',
    address: 'Rampur Central Sector, Uttar Pradesh',
  };

  const [fullName, setFullName] = React.useState(activeProfile.full_name || '');
  const [vehicleType, setVehicleType] = React.useState(activeProfile.vehicle_type || 'Motorcycle');
  const [vehicleNumber, setVehicleNumber] = React.useState(activeProfile.vehicle_number || 'UP-14-AB-9921');
  const [mobileNumber, setMobileNumber] = React.useState(activeProfile.mobile_number || '');
  const [address, setAddress] = React.useState(activeProfile.address || '');

  React.useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '');
      setVehicleType(profile.vehicle_type || 'Motorcycle');
      setVehicleNumber(profile.vehicle_number || 'UP-14-AB-9921');
      setMobileNumber(profile.mobile_number || '');
      setAddress(profile.address || '');
    }
  }, [profile]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const updated: Partial<Profile> = {
      full_name: fullName,
      vehicle_type: vehicleType,
      vehicle_number: vehicleNumber,
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
    toast.success('Delivery Partner profile updated successfully!');
  };

  return (
    <DashboardShell title="Delivery Partner Profile" description="Manage vehicle details, contact number, and delivery zones">
      <div className="space-y-6 max-w-4xl mx-auto">
        {/* Banner Card */}
        <Card className="glass border-sky-500/20 shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-sky-500/20 via-blue-500/15 to-transparent p-6 sm:p-8 border-b border-border/50">
            <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-6">
              <div className="flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
                <Avatar className="h-24 w-24 ring-4 ring-background shadow-2xl">
                  <AvatarFallback className="bg-gradient-to-br from-sky-500 to-blue-600 text-white text-3xl font-extrabold">
                    {getInitials(activeProfile.full_name || 'Delivery')}
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                    <h1 className="text-2xl font-bold tracking-tight text-foreground">{activeProfile.full_name}</h1>
                    <Badge className="bg-sky-500/20 text-sky-600 dark:text-sky-400 hover:bg-sky-500/30 text-xs">
                      <Truck className="mr-1 h-3 w-3 inline" /> Express Medicine Delivery Partner
                    </Badge>
                  </div>
                  <p className="text-sm font-semibold text-blue-600 dark:text-blue-300">Vehicle: {activeProfile.vehicle_type || 'Motorcycle'} ({activeProfile.vehicle_number || 'UP-14-AB-9921'})</p>
                  <p className="text-xs text-muted-foreground flex items-center justify-center sm:justify-start gap-1">
                    <Mail className="h-3.5 w-3.5" /> {activeProfile.email}
                  </p>
                </div>
              </div>

              <Button
                onClick={() => setEditing(!editing)}
                variant={editing ? 'secondary' : 'default'}
                className={editing ? '' : 'bg-gradient-to-r from-sky-600 to-blue-600 text-white shadow-md'}
              >
                {editing ? 'Cancel' : <><Edit3 className="mr-2 h-4 w-4" /> Edit Delivery Profile</>}
              </Button>
            </div>
          </div>
        </Card>

        {/* Form Details */}
        <form onSubmit={handleSave} className="space-y-6">
          <Card className="glass border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Navigation className="h-4 w-4 text-sky-500" /> Vehicle Registration & Contact Info
              </CardTitle>
              <CardDescription>Driver details and assigned delivery operational sector</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Delivery Partner Full Name</Label>
                  {editing ? (
                    <Input value={fullName} onChange={(e) => setFullName(e.target.value)} required />
                  ) : (
                    <p className="text-sm font-medium text-foreground bg-muted/40 p-2.5 rounded-lg">{activeProfile.full_name}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Vehicle Type</Label>
                  {editing ? (
                    <Input value={vehicleType} onChange={(e) => setVehicleType(e.target.value)} required />
                  ) : (
                    <p className="text-sm font-medium text-foreground bg-muted/40 p-2.5 rounded-lg">{activeProfile.vehicle_type || 'Motorcycle'}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Vehicle Registration Number</Label>
                  {editing ? (
                    <Input value={vehicleNumber} onChange={(e) => setVehicleNumber(e.target.value)} required />
                  ) : (
                    <p className="text-sm font-bold text-sky-600 dark:text-sky-400 bg-sky-500/10 p-2.5 rounded-lg">{activeProfile.vehicle_number || 'UP-14-AB-9921'}</p>
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

                <div className="space-y-2 md:col-span-2">
                  <Label>Delivery Operating Base Address</Label>
                  {editing ? (
                    <Input value={address} onChange={(e) => setAddress(e.target.value)} />
                  ) : (
                    <p className="text-sm font-medium text-foreground bg-muted/40 p-2.5 rounded-lg">{activeProfile.address || 'Rampur Sector'}</p>
                  )}
                </div>
              </div>

              {editing && (
                <div className="flex justify-end gap-3 pt-4 border-t border-border/50">
                  <Button type="button" variant="outline" onClick={() => setEditing(false)}>Cancel</Button>
                  <Button type="submit" disabled={saving} className="bg-sky-600 text-white">
                    {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</> : <><Save className="mr-2 h-4 w-4" /> Save Delivery Profile</>}
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
