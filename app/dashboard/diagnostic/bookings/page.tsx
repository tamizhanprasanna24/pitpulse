'use client';

import * as React from 'react';
import { useAuth } from '@/context/auth-context';
import { DashboardShell } from '@/components/dashboard/shell';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Activity, Search, RefreshCw, CheckCircle2, Clock, Truck, ShieldCheck, Filter } from 'lucide-react';
import type { DiagnosticBooking, BookingStatus, SampleStatus } from '@/types';

export default function DiagnosticBookingsPage() {
  const { profile } = useAuth();
  const centreID = profile?.centre_id || profile?.license_number || 'APOLLO-7F2K91QM';
  const staffRole = profile?.staff_role || 'centre_admin';

  const [bookings, setBookings] = React.useState<DiagnosticBooking[]>([]);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState<string>('all');
  const [loading, setLoading] = React.useState(true);

  const fetchBookings = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/diagnostic/bookings?centre_id=${centreID}`);
      const data = await res.json();
      if (data.success) {
        setBookings(data.bookings || []);
      }
    } catch {
      toast.error('Failed to fetch bookings.');
    } finally {
      setLoading(false);
    }
  }, [centreID]);

  React.useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const handleUpdateStatus = async (bookingID: string, newBookingStatus: BookingStatus, newSampleStatus?: SampleStatus) => {
    try {
      const res = await fetch('/api/diagnostic/bookings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          centre_id: centreID,
          staff_id: profile?.staff_id || 'STAFF-1',
          staff_name: profile?.full_name || 'Staff Member',
          booking_id: bookingID,
          booking_status: newBookingStatus,
          sample_status: newSampleStatus,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        toast.error(data.message || 'Failed to update status.');
        return;
      }

      toast.success(`Booking status updated to ${newBookingStatus}`);
      fetchBookings();
    } catch {
      toast.error('Network error updating status.');
    }
  };

  const filteredBookings = bookings.filter((b) => {
    const matchesSearch =
      b.patient_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.booking_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.test_names.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus = statusFilter === 'all' || b.booking_status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <DashboardShell title="Test Bookings Management" description={`Centre ID: ${centreID} • Diagnostic Workflow Status Center`}>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-card/60 p-4 rounded-xl border border-border/50 backdrop-blur-md">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-80">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search patient, code, test..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-44">
                <SelectValue placeholder="Filter status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="Pending">Pending</SelectItem>
                <SelectItem value="Sample Collected">Sample Collected</SelectItem>
                <SelectItem value="Processing">Processing</SelectItem>
                <SelectItem value="Completed">Completed</SelectItem>
                <SelectItem value="Report Ready">Report Ready</SelectItem>
                <SelectItem value="Cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button onClick={fetchBookings} variant="outline" size="sm" className="gap-1 text-xs">
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh Bookings
          </Button>
        </div>

        <Card className="glass-strong border-border/50">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-base font-bold">Diagnostic Bookings Queue ({filteredBookings.length})</CardTitle>
            <CardDescription className="text-xs">Update test processing stages and sample collection progress</CardDescription>
          </CardHeader>
          <CardContent className="p-4 pt-2">
            {filteredBookings.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground text-xs">
                No test bookings found matching your search criteria.
              </div>
            ) : (
              <div className="space-y-3">
                {filteredBookings.map((b) => (
                  <div
                    key={b.id}
                    className="flex flex-col md:flex-row items-start md:items-center justify-between p-4 rounded-xl bg-card/40 border border-border/40 hover:bg-card/70 transition-all gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-sm">{b.patient_name}</span>
                        <Badge variant="outline" className="font-mono text-[10px]">
                          {b.booking_code}
                        </Badge>
                        {b.is_home_collection && (
                          <Badge variant="secondary" className="text-[10px] bg-violet-500/10 text-violet-500 border-violet-500/20 gap-1">
                            <Truck className="h-3 w-3" /> Home Collection
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs font-medium text-foreground">{b.test_names.join(', ')}</p>
                      <p className="text-xs text-muted-foreground">
                        📞 {b.patient_phone} • 📅 {b.scheduled_date} ({b.scheduled_slot})
                      </p>
                      {b.collection_address && (
                        <p className="text-[11px] text-muted-foreground">📍 Address: {b.collection_address}</p>
                      )}
                    </div>

                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full md:w-auto">
                      <div className="text-left md:text-right">
                        <p className="text-xs text-muted-foreground font-mono">Sample: {b.sample_status}</p>
                        <Badge
                          variant="outline"
                          className={`text-xs uppercase font-mono mt-0.5 ${
                            b.booking_status === 'Report Ready' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                            b.booking_status === 'Processing' ? 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20' :
                            'bg-amber-500/10 text-amber-500 border-amber-500/20'
                          }`}
                        >
                          {b.booking_status}
                        </Badge>
                        <p className="font-bold text-xs mt-0.5">₹{b.total_price}</p>
                      </div>

                      <div className="flex items-center gap-1.5 flex-wrap">
                        {b.booking_status === 'Pending' && (
                          <Button
                            size="sm"
                            onClick={() => handleUpdateStatus(b.id, 'Processing', 'Sample Collected')}
                            className="text-xs h-8 bg-indigo-600 hover:bg-indigo-700 text-white"
                          >
                            Accept & Process
                          </Button>
                        )}

                        {b.booking_status === 'Processing' && (
                          <Button
                            size="sm"
                            onClick={() => handleUpdateStatus(b.id, 'Completed')}
                            className="text-xs h-8 bg-emerald-600 hover:bg-emerald-700 text-white"
                          >
                            Mark Completed
                          </Button>
                        )}

                        {b.booking_status !== 'Cancelled' && b.booking_status !== 'Report Ready' && (
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleUpdateStatus(b.id, 'Cancelled')}
                            className="text-xs h-8"
                          >
                            Cancel
                          </Button>
                        )}
                      </div>
                    </div>
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
