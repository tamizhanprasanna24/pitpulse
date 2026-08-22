'use client';

import * as React from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/auth-context';
import { DashboardShell } from '@/components/dashboard/shell';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Activity, ShieldCheck, FileText, CheckCircle2, Clock, Truck,
  Plus, Users, ArrowUpRight, AlertCircle, Search, RefreshCw, FileUp
} from 'lucide-react';
import type { DiagnosticBooking, DiagnosticReport, DiagnosticTest } from '@/types';

export default function DiagnosticDashboardPage() {
  const { profile } = useAuth();
  const centreID = profile?.centre_id || profile?.license_number || 'APOLLO-7F2K91QM';
  const staffRole = profile?.staff_role || 'centre_admin';

  const [bookings, setBookings] = React.useState<DiagnosticBooking[]>([]);
  const [reports, setReports] = React.useState<DiagnosticReport[]>([]);
  const [tests, setTests] = React.useState<DiagnosticTest[]>([]);
  const [loading, setLoading] = React.useState(true);

  const fetchDashboardData = React.useCallback(async () => {
    setLoading(true);
    try {
      const [resB, resR, resT] = await Promise.all([
        fetch(`/api/diagnostic/bookings?centre_id=${centreID}`).then(r => r.json()),
        fetch(`/api/diagnostic/reports?centre_id=${centreID}`).then(r => r.json()),
        fetch(`/api/diagnostic/tests?centre_id=${centreID}`).then(r => r.json()),
      ]);

      if (resB.success) setBookings(resB.bookings || []);
      if (resR.success) setReports(resR.reports || []);
      if (resT.success) setTests(resT.tests || []);
    } catch {
      // fallback
    } finally {
      setLoading(false);
    }
  }, [centreID]);

  React.useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Metrics
  const totalBookings = bookings.length;
  const pendingTests = bookings.filter(b => b.booking_status === 'Pending').length;
  const samplesCollected = bookings.filter(b => b.sample_status === 'Sample Collected').length;
  const testsInProgress = bookings.filter(b => b.booking_status === 'Processing').length;
  const completedTests = bookings.filter(b => b.booking_status === 'Completed' || b.booking_status === 'Report Ready').length;
  const reportsUploaded = reports.length;
  const homeRequests = bookings.filter(b => b.is_home_collection).length;

  return (
    <DashboardShell
      title="Diagnostic Centre Portal"
      description={`Centre ID: ${centreID} • Logged in as ${profile?.full_name || 'Staff'} (${staffRole.replace('_', ' ').toUpperCase()})`}
    >
      <div className="space-y-6">
        {/* Header Action Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-card/60 p-4 rounded-xl border border-border/50 backdrop-blur-md shadow-sm">
          <div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-emerald-500" />
              <h2 className="text-lg font-bold">Diagnostic Operations Center</h2>
              <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 font-mono text-xs">
                {centreID}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Role: <span className="font-semibold text-foreground uppercase">{staffRole.replace('_', ' ')}</span> • Server-enforced Centre Isolation active
            </p>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button onClick={fetchDashboardData} variant="outline" size="sm" className="gap-1 text-xs">
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
            </Button>

            {staffRole === 'centre_admin' && (
              <Link href="/dashboard/diagnostic/tests">
                <Button size="sm" className="gap-1 text-xs bg-gradient-to-r from-primary to-accent text-white">
                  <Plus className="h-3.5 w-3.5" /> Manage Tests
                </Button>
              </Link>
            )}

            <Link href="/dashboard/diagnostic/reports">
              <Button size="sm" variant="secondary" className="gap-1 text-xs">
                <FileUp className="h-3.5 w-3.5" /> Upload Report
              </Button>
            </Link>
          </div>
        </div>

        {/* 8 Primary Real-Time Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card className="glass-strong border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">Total Bookings</span>
                <Activity className="h-4 w-4 text-primary" />
              </div>
              <div className="mt-2 text-2xl font-bold">{totalBookings}</div>
              <p className="text-[11px] text-muted-foreground mt-1">Diagnostic Requests</p>
            </CardContent>
          </Card>

          <Card className="glass-strong border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">Pending Tests</span>
                <Clock className="h-4 w-4 text-amber-500" />
              </div>
              <div className="mt-2 text-2xl font-bold text-amber-500">{pendingTests}</div>
              <p className="text-[11px] text-muted-foreground mt-1">Awaiting confirmation</p>
            </CardContent>
          </Card>

          <Card className="glass-strong border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">Samples Collected</span>
                <CheckCircle2 className="h-4 w-4 text-blue-500" />
              </div>
              <div className="mt-2 text-2xl font-bold text-blue-500">{samplesCollected}</div>
              <p className="text-[11px] text-muted-foreground mt-1">In lab repository</p>
            </CardContent>
          </Card>

          <Card className="glass-strong border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">In Processing</span>
                <RefreshCw className="h-4 w-4 text-indigo-500" />
              </div>
              <div className="mt-2 text-2xl font-bold text-indigo-500">{testsInProgress}</div>
              <p className="text-[11px] text-muted-foreground mt-1">Under analysis</p>
            </CardContent>
          </Card>

          <Card className="glass-strong border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">Completed Tests</span>
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              </div>
              <div className="mt-2 text-2xl font-bold text-emerald-500">{completedTests}</div>
              <p className="text-[11px] text-muted-foreground mt-1">Results finalized</p>
            </CardContent>
          </Card>

          <Card className="glass-strong border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">Reports Uploaded</span>
                <FileText className="h-4 w-4 text-teal-500" />
              </div>
              <div className="mt-2 text-2xl font-bold text-teal-500">{reportsUploaded}</div>
              <p className="text-[11px] text-muted-foreground mt-1">PDF/PNG reports ready</p>
            </CardContent>
          </Card>

          <Card className="glass-strong border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">Home Collections</span>
                <Truck className="h-4 w-4 text-violet-500" />
              </div>
              <div className="mt-2 text-2xl font-bold text-violet-500">{homeRequests}</div>
              <p className="text-[11px] text-muted-foreground mt-1">Phlebotomist visits</p>
            </CardContent>
          </Card>

          <Card className="glass-strong border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">Active Tests</span>
                <ShieldCheck className="h-4 w-4 text-emerald-500" />
              </div>
              <div className="mt-2 text-2xl font-bold">{tests.length}</div>
              <p className="text-[11px] text-muted-foreground mt-1">Catalogue items</p>
            </CardContent>
          </Card>
        </div>

        {/* Diagnostic Workflow Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="glass-strong border-border/50 lg:col-span-2">
            <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold">Recent Test Bookings</CardTitle>
                <CardDescription className="text-xs">Live requests from Patients & Doctors</CardDescription>
              </div>
              <Link href="/dashboard/diagnostic/bookings">
                <Button variant="ghost" size="sm" className="text-xs gap-1 text-primary">
                  View All <ArrowUpRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="p-4 pt-2">
              {bookings.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground text-xs">
                  No diagnostic bookings received yet. Bookings from Patients & Doctors will appear here.
                </div>
              ) : (
                <div className="space-y-3">
                  {bookings.slice(0, 5).map((b) => (
                    <div key={b.id} className="flex items-center justify-between p-3 rounded-lg bg-card/40 border border-border/40 hover:bg-card/70 transition-all text-xs">
                      <div>
                        <div className="font-semibold flex items-center gap-2">
                          <span>{b.patient_name}</span>
                          <span className="font-mono text-[10px] text-muted-foreground">({b.booking_code})</span>
                        </div>
                        <p className="text-muted-foreground mt-0.5">{b.test_names.join(', ')}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">📅 {b.scheduled_date} • 🕒 {b.scheduled_slot}</p>
                      </div>
                      <div className="text-end">
                        <Badge variant="outline" className={`text-[10px] uppercase font-mono ${
                          b.booking_status === 'Report Ready' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                          b.booking_status === 'Processing' ? 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20' :
                          'bg-amber-500/10 text-amber-500 border-amber-500/20'
                        }`}>
                          {b.booking_status}
                        </Badge>
                        <p className="font-bold mt-1 text-xs">₹{b.total_price}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Shortcuts */}
          <Card className="glass-strong border-border/50">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-base font-bold">Portal Navigation</CardTitle>
              <CardDescription className="text-xs">Quick access to staff workflows</CardDescription>
            </CardHeader>
            <CardContent className="p-4 space-y-2">
              <Link href="/dashboard/diagnostic/bookings" className="block">
                <Button variant="outline" className="w-full justify-start text-xs gap-2">
                  <Activity className="h-4 w-4 text-primary" /> Test Bookings Management
                </Button>
              </Link>
              <Link href="/dashboard/diagnostic/samples" className="block">
                <Button variant="outline" className="w-full justify-start text-xs gap-2">
                  <Truck className="h-4 w-4 text-violet-500" /> Sample & Home Collection
                </Button>
              </Link>
              <Link href="/dashboard/diagnostic/reports" className="block">
                <Button variant="outline" className="w-full justify-start text-xs gap-2">
                  <FileUp className="h-4 w-4 text-teal-500" /> Secure Report Uploads
                </Button>
              </Link>

              {staffRole === 'centre_admin' && (
                <>
                  <Link href="/dashboard/diagnostic/tests" className="block">
                    <Button variant="outline" className="w-full justify-start text-xs gap-2">
                      <Plus className="h-4 w-4 text-amber-500" /> Test Catalogue & Pricing
                    </Button>
                  </Link>
                  <Link href="/dashboard/diagnostic/staff" className="block">
                    <Button variant="outline" className="w-full justify-start text-xs gap-2">
                      <Users className="h-4 w-4 text-indigo-500" /> Staff Accounts & Permissions
                    </Button>
                  </Link>
                  <Link href="/dashboard/diagnostic/audit-logs" className="block">
                    <Button variant="outline" className="w-full justify-start text-xs gap-2">
                      <ShieldCheck className="h-4 w-4 text-emerald-500" /> Security Audit Logs
                    </Button>
                  </Link>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardShell>
  );
}
