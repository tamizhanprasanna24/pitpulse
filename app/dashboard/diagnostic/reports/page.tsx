'use client';

import * as React from 'react';
import { useAuth } from '@/context/auth-context';
import { DashboardShell } from '@/components/dashboard/shell';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { FileUp, FileText, Download, CheckCircle2, Search, RefreshCw, ShieldCheck, User, Phone, MapPin, Calendar, Clock, Activity } from 'lucide-react';
import type { DiagnosticReport, DiagnosticBooking } from '@/types';

export default function DiagnosticReportsPage() {
  const { profile } = useAuth();
  const centreID = profile?.centre_id || profile?.license_number || 'APOLLO-7F2K91QM';

  const [reports, setReports] = React.useState<DiagnosticReport[]>([]);
  const [bookings, setBookings] = React.useState<DiagnosticBooking[]>([]);
  const [patientSearchID, setPatientSearchID] = React.useState('');
  const [uploadingBookingID, setUploadingBookingID] = React.useState<string | null>(null);
  const [selectedFileMap, setSelectedFileMap] = React.useState<Record<string, File | null>>({});
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
      toast.error('Failed to load reports & bookings.');
    } finally {
      setLoading(false);
    }
  }, [centreID]);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRowFileUpload = async (booking: DiagnosticBooking) => {
    const file = selectedFileMap[booking.id];
    setUploadingBookingID(booking.id);

    try {
      const formData = new FormData();
      formData.append('centre_id', centreID);
      formData.append('booking_id', booking.id);
      formData.append('patient_id', booking.patient_id);
      formData.append('test_name', booking.test_names.join(', '));
      formData.append('staff_id', profile?.staff_id || 'LAB_TECH_1');
      formData.append('staff_name', profile?.full_name || 'Lab Technician');
      if (file) {
        formData.append('file', file);
      }

      const res = await fetch('/api/diagnostic/reports', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        toast.error(data.message || 'Failed to upload report.');
        setUploadingBookingID(null);
        return;
      }

      // Also update booking status to 'Report Ready'
      await fetch('/api/diagnostic/bookings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          centre_id: centreID,
          booking_id: booking.id,
          booking_status: 'Report Ready',
        }),
      });

      toast.success(`🔒 Report released securely to Patient ${booking.patient_name} (${booking.patient_id})!`);
      setSelectedFileMap((prev) => ({ ...prev, [booking.id]: null }));
      fetchData();
    } catch {
      toast.error('Network error uploading report.');
    } finally {
      setUploadingBookingID(null);
    }
  };

  const filteredBookings = bookings.filter((b) => {
    if (!patientSearchID.trim()) return true;
    const query = patientSearchID.toLowerCase().trim();
    return (
      b.patient_id.toLowerCase().includes(query) ||
      b.booking_code.toLowerCase().includes(query) ||
      b.patient_name.toLowerCase().includes(query) ||
      b.patient_phone.includes(query)
    );
  });

  const searchedPatient = filteredBookings.length > 0 && patientSearchID.trim() ? filteredBookings[0] : null;

  return (
    <DashboardShell title="Patient Search & Row-Type Report Upload" description={`Centre ID: ${centreID} • Search Patient ID and release diagnostic lab reports`}>
      <div className="space-y-6">
        {/* Patient Search ID Tab / Bar */}
        <Card className="glass-strong border-border/50">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Search className="h-4 w-4 text-primary" /> Search Patient by Patient ID / Booking Code
            </CardTitle>
            <CardDescription className="text-xs">
              Enter Patient ID (e.g. usr-pat-1), Booking Code (e.g. DXB-883920), Name, or Phone number to fetch patient details & upload report rows
            </CardDescription>
          </CardHeader>

          <CardContent className="p-4 pt-2 space-y-4">
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <div className="relative flex-1 w-full">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Type Patient ID (e.g. usr-pat-1), Booking Code (e.g. DXB-1002), Name..."
                  value={patientSearchID}
                  onChange={(e) => setPatientSearchID(e.target.value)}
                  className="pl-9 font-mono text-sm"
                />
              </div>

              {patientSearchID && (
                <Button variant="outline" size="sm" onClick={() => setPatientSearchID('')} className="text-xs">
                  Clear Search
                </Button>
              )}

              <Button variant="secondary" size="sm" onClick={fetchData} className="gap-1 text-xs">
                <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
              </Button>
            </div>

            {/* Fetched Patient Detail Header Box */}
            {searchedPatient && (
              <div className="p-4 rounded-xl bg-gradient-to-r from-primary/10 via-accent/5 to-primary/10 border border-primary/20 space-y-2">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-primary" />
                    <span className="font-bold text-sm text-foreground">{searchedPatient.patient_name}</span>
                    <Badge variant="outline" className="font-mono text-[10px]">
                      ID: {searchedPatient.patient_id}
                    </Badge>
                  </div>
                  <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 font-mono text-xs">
                    Code: {searchedPatient.booking_code}
                  </Badge>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-xs pt-1">
                  <div>
                    <span className="text-muted-foreground block">Age / Gender</span>
                    <span className="font-semibold">{searchedPatient.patient_age ? `${searchedPatient.patient_age} Yrs` : '32 Yrs'} • <span className="capitalize">{searchedPatient.patient_gender || 'male'}</span></span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block">Mobile Number</span>
                    <span className="font-semibold font-mono">{searchedPatient.patient_phone}</span>
                  </div>
                  <div className="sm:col-span-2">
                    <span className="text-muted-foreground block">Address</span>
                    <span className="font-semibold">{searchedPatient.patient_address || searchedPatient.collection_address || 'Central Health Zone'}</span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Row-Type Patient Details & Report Upload Table */}
        <Card className="glass-strong border-border/50">
          <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <FileUp className="h-4 w-4 text-primary" /> Patient Bookings & Row-Type Report Upload ({filteredBookings.length})
              </CardTitle>
              <CardDescription className="text-xs">
                Row-by-row patient lab test details fetched directly from diagnostic booking registry
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="p-4 pt-2 overflow-x-auto">
            {filteredBookings.length === 0 ? (
              <div className="py-12 text-center text-xs text-muted-foreground">
                No patient bookings found matching Patient ID &apos;{patientSearchID}&apos;.
              </div>
            ) : (
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-border/50 text-muted-foreground font-semibold bg-card/40">
                    <th className="p-3">Patient ID & Code</th>
                    <th className="p-3">Patient Details</th>
                    <th className="p-3">Booked Test Name(s)</th>
                    <th className="p-3">Booking Status</th>
                    <th className="p-3 text-right">Row Upload & Release Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {filteredBookings.map((b) => {
                    const isUploading = uploadingBookingID === b.id;
                    const hasReport = b.booking_status === 'Report Ready';

                    return (
                      <tr key={b.id} className="hover:bg-card/50 transition-all">
                        {/* Column 1: Patient ID & Booking Code */}
                        <td className="p-3 font-mono">
                          <span className="font-bold text-foreground block">{b.booking_code}</span>
                          <span className="text-[10px] text-muted-foreground block">ID: {b.patient_id}</span>
                        </td>

                        {/* Column 2: Patient Name, Age, Gender, Mobile, Address */}
                        <td className="p-3 space-y-0.5">
                          <span className="font-bold text-foreground block">{b.patient_name}</span>
                          <span className="text-[10px] text-muted-foreground block">
                            {b.patient_age ? `${b.patient_age} yrs` : '32 yrs'} • <span className="capitalize">{b.patient_gender || 'male'}</span> • 📞 {b.patient_phone}
                          </span>
                          <span className="text-[10px] text-muted-foreground block truncate max-w-[180px]">
                            📍 {b.patient_address || b.collection_address || 'Central District'}
                          </span>
                        </td>

                        {/* Column 3: Booked Tests */}
                        <td className="p-3">
                          <span className="font-semibold text-primary block">{b.test_names.join(', ')}</span>
                          <span className="text-[10px] text-muted-foreground block">
                            📅 {b.scheduled_date} ({b.scheduled_slot})
                          </span>
                        </td>

                        {/* Column 4: Booking Status */}
                        <td className="p-3">
                          <Badge
                            variant="outline"
                            className={`text-[10px] uppercase font-mono ${
                              hasReport ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                              b.booking_status === 'Processing' ? 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20' :
                              'bg-amber-500/10 text-amber-500 border-amber-500/20'
                            }`}
                          >
                            {b.booking_status}
                          </Badge>
                        </td>

                        {/* Column 5: Inline Row Report Upload Action */}
                        <td className="p-3 text-right space-y-1">
                          <div className="flex items-center justify-end gap-2">
                            <input
                              type="file"
                              accept=".pdf,.png,.jpg,.jpeg"
                              onChange={(e) => {
                                const file = e.target.files?.[0] || null;
                                setSelectedFileMap((prev) => ({ ...prev, [b.id]: file }));
                              }}
                              className="text-[11px] max-w-[160px] file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-[10px] file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                            />
                            <Button
                              size="sm"
                              disabled={isUploading}
                              onClick={() => handleRowFileUpload(b)}
                              className={`text-xs h-8 gap-1.5 ${hasReport ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : 'bg-primary text-white'}`}
                            >
                              <FileUp className="h-3.5 w-3.5" />
                              {isUploading ? 'Uploading...' : hasReport ? 'Re-upload Report' : 'Upload Report'}
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>

        {/* Existing Uploaded Reports Archive Table */}
        <Card className="glass-strong border-border/50">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-500" /> Released Diagnostic Reports Registry ({reports.length})
            </CardTitle>
          </CardHeader>

          <CardContent className="p-4 pt-2">
            {reports.length === 0 ? (
              <div className="py-8 text-center text-xs text-muted-foreground">
                No diagnostic test reports generated yet. Use the table above to upload patient reports.
              </div>
            ) : (
              <div className="space-y-3">
                {reports.map((r) => (
                  <div key={r.id} className="flex items-center justify-between p-3.5 rounded-xl bg-card/40 border border-border/40 text-xs">
                    <div>
                      <span className="font-bold text-foreground block">{r.test_name}</span>
                      <span className="text-[11px] text-muted-foreground block mt-0.5">
                        📄 {r.file_name} • {(r.file_size / 1024).toFixed(1)} KB • Patient ID: <span className="font-mono text-foreground">{r.patient_id}</span>
                      </span>
                      <span className="text-[10px] text-muted-foreground block mt-0.5">
                        📅 {new Date(r.created_at).toLocaleString()} • Uploaded by {r.uploaded_by_name || 'Lab Staff'}
                      </span>
                    </div>

                    <a href={r.file_url} download={r.file_name} target="_blank" rel="noopener noreferrer">
                      <Button size="sm" variant="outline" className="gap-1 text-xs">
                        <Download className="h-3.5 w-3.5" /> View Report
                      </Button>
                    </a>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}
