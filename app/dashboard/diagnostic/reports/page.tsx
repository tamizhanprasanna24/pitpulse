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
import { FileUp, FileText, Download, CheckCircle2, Search, RefreshCw, ShieldCheck, Lock } from 'lucide-react';
import type { DiagnosticReport, DiagnosticBooking } from '@/types';

export default function DiagnosticReportsPage() {
  const { profile } = useAuth();
  const centreID = profile?.centre_id || profile?.license_number || 'APOLLO-7F2K91QM';

  const [reports, setReports] = React.useState<DiagnosticReport[]>([]);
  const [bookings, setBookings] = React.useState<DiagnosticBooking[]>([]);
  const [selectedBookingID, setSelectedBookingID] = React.useState<string>('');
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const [showUploadModal, setShowUploadModal] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [loading, setLoading] = React.useState(true);

  const fetchData = React.useCallback(async () => {
    setLoading(true);
    try {
      const [resR, resB] = await Promise.all([
        fetch(`/api/diagnostic/reports?centre_id=${centreID}`).then((r) => r.json()),
        fetch(`/api/diagnostic/bookings?centre_id=${centreID}`).then((r) => r.json()),
      ]);

      if (resR.success) setReports(resR.reports || []);
      if (resB.success) setBookings(resB.bookings || []);
    } catch {
      toast.error('Failed to load reports.');
    } finally {
      setLoading(false);
    }
  }, [centreID]);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleUploadReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBookingID) {
      toast.error('Please select a booking record.');
      return;
    }
    setSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('centre_id', centreID);
      formData.append('booking_id', selectedBookingID);
      formData.append('staff_id', profile?.staff_id || 'LAB_TECH_1');
      formData.append('staff_name', profile?.full_name || 'Lab Technician');
      if (selectedFile) {
        formData.append('file', selectedFile);
      }

      const res = await fetch('/api/diagnostic/reports', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        toast.error(data.message || 'Failed to upload report.');
        setSubmitting(false);
        return;
      }

      toast.success('🔒 Report uploaded & linked securely to Patient and Doctor dashboards!');
      setShowUploadModal(false);
      setSelectedBookingID('');
      setSelectedFile(null);
      fetchData();
    } catch {
      toast.error('Network error uploading report.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardShell title="Secure Diagnostic Reports" description={`Centre ID: ${centreID} • Authenticated report storage & patient notification`}>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-card/60 p-4 rounded-xl border border-border/50 backdrop-blur-md">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-teal-500" />
            <div>
              <h2 className="text-base font-bold">Diagnostic Reports Registry</h2>
              <p className="text-xs text-muted-foreground">Encrypted file key reference — No public URLs exposed</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button onClick={fetchData} variant="outline" size="sm" className="gap-1 text-xs">
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
            </Button>
            <Button size="sm" onClick={() => setShowUploadModal(true)} className="gap-1 text-xs bg-gradient-to-r from-primary to-accent text-white">
              <FileUp className="h-3.5 w-3.5" /> Upload Test Report
            </Button>
          </div>
        </div>

        <Card className="glass-strong border-border/50">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-base font-bold">Uploaded Diagnostic Reports ({reports.length})</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-2">
            {reports.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground text-xs">
                No reports uploaded yet. Click &apos;Upload Test Report&apos; to link a report to a booking.
              </div>
            ) : (
              <div className="space-y-3">
                {reports.map((r) => (
                  <div key={r.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-xl bg-card/40 border border-border/40 hover:bg-card/70 transition-all gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <FileText className="h-4 w-4 text-teal-500" />
                        <span className="font-bold text-sm">{r.patient_name}</span>
                        <Badge variant="outline" className="font-mono text-[10px]">
                          {r.test_name}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        📄 {r.file_name} • {(r.file_size / 1024).toFixed(1)} KB • Format: {r.file_type.toUpperCase()}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        👨‍⚕️ Uploaded by: {r.uploaded_by_name} ({r.uploaded_by_staff_id}) • 📅 {new Date(r.created_at).toLocaleString()}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
                      <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 text-xs">
                        🔒 Authenticated Only
                      </Badge>
                      <a href={r.file_url} download={r.file_name} target="_blank" rel="noopener noreferrer">
                        <Button size="sm" variant="outline" className="gap-1 text-xs h-8">
                          <Download className="h-3.5 w-3.5" /> Download
                        </Button>
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Upload Modal */}
      <Dialog open={showUploadModal} onOpenChange={setShowUploadModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Upload Diagnostic Report</DialogTitle>
            <DialogDescription className="text-xs">
              Upload PDF, JPG, or PNG reports (Max 10MB). Automatically notifies Patient & Doctor.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleUploadReport} className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>Select Test Booking *</Label>
              <Select value={selectedBookingID} onValueChange={setSelectedBookingID}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose booking..." />
                </SelectTrigger>
                <SelectContent>
                  {bookings.map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.patient_name} ({b.booking_code}) - {b.test_names.join(', ')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Report File (PDF, JPG, PNG - Max 10MB) *</Label>
              <Input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
              />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setShowUploadModal(false)}>Cancel</Button>
              <Button type="submit" disabled={submitting} className="bg-primary text-white">
                {submitting ? 'Uploading...' : 'Upload & Notify'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </DashboardShell>
  );
}
