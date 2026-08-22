'use client';

import * as React from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/auth-context';
import { DashboardShell } from '@/components/dashboard/shell';
import type { LabReport, DiagnosticBooking, DiagnosticReport, DiagnosticTest } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { FileText, Download, Plus, Activity, Calendar, Clock, MapPin, ShieldCheck, CheckCircle2, Truck } from 'lucide-react';
import { toast } from 'sonner';

export default function LabReportsPage() {
  const { profile } = useAuth();
  const [reports, setReports] = React.useState<LabReport[]>([]);
  const [diagnosticReports, setDiagnosticReports] = React.useState<DiagnosticReport[]>([]);
  const [diagnosticBookings, setDiagnosticBookings] = React.useState<DiagnosticBooking[]>([]);
  const [availableTests, setAvailableTests] = React.useState<DiagnosticTest[]>([]);

  const [showBookModal, setShowBookModal] = React.useState(false);
  const [selectedTestIDs, setSelectedTestIDs] = React.useState<string[]>([]);
  const [scheduledDate, setScheduledDate] = React.useState(new Date().toISOString().split('T')[0]);
  const [scheduledSlot, setScheduledSlot] = React.useState('09:00 AM - 10:00 AM');
  const [isHomeCollection, setIsHomeCollection] = React.useState(false);
  const [collectionAddress, setCollectionAddress] = React.useState(profile?.address || '');
  const [submittingBooking, setSubmittingBooking] = React.useState(false);
  const [loading, setLoading] = React.useState(true);

  const fetchPatientData = React.useCallback(async () => {
    if (!profile) return;
    setLoading(true);
    try {
      const [resDb, resB, resR, resT] = await Promise.all([
        supabase.from('lab_reports').select('*').eq('user_id', profile.id).order('uploaded_at', { ascending: false }),
        fetch(`/api/diagnostic/bookings?patient_id=${profile.id}`).then((r) => r.json()),
        fetch(`/api/diagnostic/reports?patient_id=${profile.id}`).then((r) => r.json()),
        fetch(`/api/diagnostic/tests?centre_id=APOLLO-7F2K91QM`).then((r) => r.json()),
      ]);

      if (resDb.data) setReports(resDb.data as LabReport[]);
      if (resB.success) setDiagnosticBookings(resB.bookings || []);
      if (resR.success) setDiagnosticReports(resR.reports || []);
      if (resT.success) setAvailableTests(resT.tests || []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [profile]);

  React.useEffect(() => {
    fetchPatientData();
  }, [fetchPatientData]);

  const handleBookTestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedTestIDs.length === 0) {
      toast.error('Please select at least one diagnostic test.');
      return;
    }
    setSubmittingBooking(true);

    try {
      const selectedTests = availableTests.filter((t) => selectedTestIDs.includes(t.id));
      const testNames = selectedTests.map((t) => t.name);
      const totalPrice = selectedTests.reduce((sum, t) => sum + t.price, 0);

      const res = await fetch('/api/diagnostic/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          centre_id: 'APOLLO-7F2K91QM',
          patient_id: profile?.id || 'usr-pat-1',
          patient_name: profile?.full_name || 'Patient',
          patient_phone: profile?.mobile_number || '+91 98765 43210',
          patient_age: profile?.age || 32,
          patient_gender: profile?.gender || 'male',
          patient_address: collectionAddress || profile?.address || 'Chennai',
          test_ids: selectedTestIDs,
          test_names: testNames,
          total_price: totalPrice,
          is_home_collection: isHomeCollection,
          collection_address: isHomeCollection ? collectionAddress : null,
          scheduled_date: scheduledDate,
          scheduled_slot: scheduledSlot,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        toast.error(data.message || 'Failed to book diagnostic test.');
        setSubmittingBooking(false);
        return;
      }

      toast.success(`🎉 Diagnostic test booked successfully! Code: ${data.booking.booking_code}`);
      setShowBookModal(false);
      setSelectedTestIDs([]);
      fetchPatientData();
    } catch {
      toast.error('Network error creating test booking.');
    } finally {
      setSubmittingBooking(false);
    }
  };

  return (
    <DashboardShell title="Lab Reports & Diagnostic Bookings" description="Book lab tests, track sample status, and view authenticated diagnostic reports">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-card/60 p-4 rounded-xl border border-border/50 backdrop-blur-md">
          <div>
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" /> Diagnostic Services & Lab Portal
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Book NABL accredited tests, schedule home sample pickups, and download verified reports.
            </p>
          </div>

          <Button onClick={() => setShowBookModal(true)} className="bg-gradient-to-r from-primary to-accent text-white gap-2">
            <Plus className="h-4 w-4" /> Book Diagnostic Test
          </Button>
        </div>

        {/* Live Patient Diagnostic Bookings */}
        <Card className="glass-strong border-border/50">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary" /> My Diagnostic Test Bookings ({diagnosticBookings.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-2">
            {diagnosticBookings.length === 0 ? (
              <div className="py-8 text-center text-xs text-muted-foreground">
                No active diagnostic test bookings. Click &apos;Book Diagnostic Test&apos; to schedule a lab test.
              </div>
            ) : (
              <div className="space-y-3">
                {diagnosticBookings.map((b) => (
                  <div key={b.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-xl bg-card/40 border border-border/40 gap-3">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-sm">{b.test_names.join(', ')}</span>
                        <Badge variant="outline" className="font-mono text-[10px]">
                          {b.booking_code}
                        </Badge>
                        {b.is_home_collection && (
                          <Badge variant="secondary" className="text-[10px] bg-violet-500/10 text-violet-500 border-violet-500/20 gap-1">
                            <Truck className="h-3 w-3" /> Home Collection
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        📅 {b.scheduled_date} ({b.scheduled_slot}) • 🧪 Sample: <span className="font-semibold text-foreground">{b.sample_status}</span>
                      </p>
                    </div>

                    <div className="text-start sm:text-end">
                      <Badge
                        variant="outline"
                        className={`text-xs uppercase font-mono ${
                          b.booking_status === 'Report Ready' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                          b.booking_status === 'Processing' ? 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20' :
                          'bg-amber-500/10 text-amber-500 border-amber-500/20'
                        }`}
                      >
                        {b.booking_status}
                      </Badge>
                      <p className="font-bold text-xs mt-1">Total: ₹{b.total_price}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Verified Diagnostic Reports Downloads */}
        <Card className="glass-strong border-border/50">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-500" /> Authenticated Diagnostic Reports ({diagnosticReports.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-2">
            {diagnosticReports.length === 0 ? (
              <div className="py-8 text-center text-xs text-muted-foreground">
                No diagnostic test reports generated yet. Reports uploaded by Diagnostic Centres will appear here.
              </div>
            ) : (
              <div className="space-y-3">
                {diagnosticReports.map((r) => (
                  <div key={r.id} className="flex items-center justify-between p-4 rounded-xl bg-card/40 border border-border/40">
                    <div>
                      <span className="font-bold text-sm block">{r.test_name}</span>
                      <span className="text-xs text-muted-foreground block mt-0.5">📄 {r.file_name} • {(r.file_size / 1024).toFixed(1)} KB</span>
                      <span className="text-[10px] text-muted-foreground block mt-0.5">🏥 Centre: {r.centre_name} • 📅 {new Date(r.created_at).toLocaleDateString()}</span>
                    </div>

                    <a href={r.file_url} download={r.file_name} target="_blank" rel="noopener noreferrer">
                      <Button size="sm" variant="outline" className="gap-1 text-xs">
                        <Download className="h-3.5 w-3.5" /> Download Report
                      </Button>
                    </a>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Book Test Modal */}
      <Dialog open={showBookModal} onOpenChange={setShowBookModal}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Book Diagnostic Lab Test</DialogTitle>
            <DialogDescription className="text-xs">
              Select tests from licensed diagnostic centres for home pickup or lab visit
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleBookTestSubmit} className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>Select Diagnostic Tests *</Label>
              <div className="max-h-48 overflow-y-auto space-y-2 border border-border/40 p-2 rounded-lg bg-card/40">
                {availableTests.map((t) => {
                  const selected = selectedTestIDs.includes(t.id);
                  return (
                    <div
                      key={t.id}
                      onClick={() => {
                        if (selected) setSelectedTestIDs(selectedTestIDs.filter((id) => id !== t.id));
                        else setSelectedTestIDs([...selectedTestIDs, t.id]);
                      }}
                      className={`flex items-center justify-between p-2.5 rounded-md cursor-pointer border transition-all text-xs ${
                        selected ? 'border-primary bg-primary/10 font-medium' : 'border-border/30 hover:bg-card/80'
                      }`}
                    >
                      <div>
                        <span className="font-semibold">{t.name}</span>
                        <span className="text-[10px] text-muted-foreground block">Category: {t.category}</span>
                      </div>
                      <div className="text-end">
                        <span className="font-bold text-primary">₹{t.price}</span>
                        {selected && <CheckCircle2 className="h-4 w-4 text-primary ml-auto mt-0.5" />}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Scheduled Date *</Label>
                <Input type="date" value={scheduledDate} onChange={(e) => setScheduledDate(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label>Time Slot *</Label>
                <Select value={scheduledSlot} onValueChange={setScheduledSlot}>
                  <SelectTrigger><SelectValue placeholder="Slot" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="07:00 AM - 08:00 AM">07:00 AM - 08:00 AM</SelectItem>
                    <SelectItem value="09:00 AM - 10:00 AM">09:00 AM - 10:00 AM</SelectItem>
                    <SelectItem value="11:00 AM - 12:00 PM">11:00 AM - 12:00 PM</SelectItem>
                    <SelectItem value="02:00 PM - 03:00 PM">02:00 PM - 03:00 PM</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs">Home Sample Collection?</Label>
                <input
                  type="checkbox"
                  checked={isHomeCollection}
                  onChange={(e) => setIsHomeCollection(e.target.checked)}
                  className="h-4 w-4 rounded border-border text-primary"
                />
              </div>

              {isHomeCollection && (
                <Input
                  placeholder="Enter full home address for sample collection..."
                  value={collectionAddress}
                  onChange={(e) => setCollectionAddress(e.target.value)}
                  className="text-xs"
                />
              )}
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setShowBookModal(false)}>Cancel</Button>
              <Button type="submit" disabled={submittingBooking} className="bg-primary text-white">
                {submittingBooking ? 'Booking...' : 'Confirm Diagnostic Booking'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </DashboardShell>
  );
}
