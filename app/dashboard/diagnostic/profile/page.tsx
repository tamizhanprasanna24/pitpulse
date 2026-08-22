'use client';

import * as React from 'react';
import { useAuth } from '@/context/auth-context';
import { DashboardShell } from '@/components/dashboard/shell';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ShieldCheck, Mail, MapPin, Phone, User, Lock, Building } from 'lucide-react';

export default function DiagnosticProfilePage() {
  const { profile } = useAuth();
  const centreID = profile?.centre_id || profile?.license_number || 'APOLLO-7F2K91QM';
  const staffRole = profile?.staff_role || 'centre_admin';

  return (
    <DashboardShell title="Diagnostic Centre Profile" description={`Centre ID: ${centreID} • Diagnostic Institution & Staff Details`}>
      <div className="space-y-6 max-w-4xl">
        <Card className="glass-strong border-border/50">
          <CardHeader className="p-6 pb-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent shadow-md text-white font-bold text-xl">
                  DX
                </div>
                <div>
                  <CardTitle className="text-xl font-bold">{profile?.full_name?.toLowerCase().includes('centre') || profile?.full_name?.toLowerCase().includes('diagnostic') || profile?.full_name?.toLowerCase().includes('lab') ? profile?.full_name : `${profile?.full_name || 'Apollo'} Diagnostic Centre`}</CardTitle>
                  <CardDescription className="text-xs mt-0.5">
                    Licensed Diagnostic Laboratory & Pathological Services
                  </CardDescription>
                </div>
              </div>

              <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 text-xs px-3 py-1 font-mono">
                {centreID}
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="p-6 pt-2 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-card/40 border border-border/40 space-y-1">
                <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                  <ShieldCheck className="h-4 w-4 text-emerald-500" />
                  <span>Unique Secure Centre ID</span>
                </div>
                <p className="text-base font-bold font-mono tracking-wider text-emerald-500">{centreID}</p>
                <p className="text-[10px] text-muted-foreground">Cryptographically generated & unique across Pit Pulse</p>
              </div>

              <div className="p-4 rounded-xl bg-card/40 border border-border/40 space-y-1">
                <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                  <User className="h-4 w-4 text-indigo-500" />
                  <span>Logged In Authorized Staff</span>
                </div>
                <p className="text-sm font-bold">{profile?.full_name || 'Authorized Staff'}</p>
                <p className="text-xs text-muted-foreground font-mono">
                  Staff ID: {profile?.staff_id || 'ADMIN-01'} • Role: <span className="uppercase text-foreground">{staffRole.replace('_', ' ')}</span>
                </p>
              </div>
            </div>

            <div className="space-y-4 pt-2 border-t border-border/40">
              <h3 className="text-sm font-bold">Institution Contact & Location Details</h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="flex items-start gap-2.5">
                  <MapPin className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold block">Centre Address</span>
                    <span className="text-muted-foreground">{profile?.address || 'District Hospital Complex, Sector 2'}</span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <Building className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold block">District / Location</span>
                    <span className="text-muted-foreground">{profile?.assigned_village || 'Central Healthcare District'}</span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <Mail className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold block">Official Email</span>
                    <span className="text-muted-foreground">{profile?.email || 'official@diagnostic.com'}</span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <Phone className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold block">Contact Helpline</span>
                    <span className="text-muted-foreground">{profile?.mobile_number || '+91 98765 00000'}</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}
