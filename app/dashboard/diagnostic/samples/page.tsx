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
import { Truck, CheckCircle2, Search, RefreshCw, UserCheck, AlertCircle } from 'lucide-react';
import type { SampleCollectionRecord, SampleStatus } from '@/types';

export default function DiagnosticSamplesPage() {
  const { profile } = useAuth();
  const centreID = profile?.centre_id || profile?.license_number || 'APOLLO-7F2K91QM';

  const [samples, setSamples] = React.useState<SampleCollectionRecord[]>([]);
  const [collectorInput, setCollectorInput] = React.useState<Record<string, string>>({});
  const [loading, setLoading] = React.useState(true);

  const fetchSamples = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/diagnostic/samples?centre_id=${centreID}`);
      const data = await res.json();
      if (data.success) {
        setSamples(data.samples || []);
      }
    } catch {
      toast.error('Failed to load sample collections.');
    } finally {
      setLoading(false);
    }
  }, [centreID]);

  React.useEffect(() => {
    fetchSamples();
  }, [fetchSamples]);

  const handleUpdateSample = async (bookingID: string, status: SampleStatus) => {
    const collector = collectorInput[bookingID] || undefined;
    try {
      const res = await fetch('/api/diagnostic/samples', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          centre_id: centreID,
          staff_id: profile?.staff_id || 'STAFF-1',
          staff_name: profile?.full_name || 'Staff Member',
          booking_id: bookingID,
          status,
          collector_name: collector,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        toast.error(data.message || 'Failed to update sample status.');
        return;
      }

      toast.success(`Sample status updated to ${status}`);
      fetchSamples();
    } catch {
      toast.error('Network error updating sample status.');
    }
  };

  return (
    <DashboardShell title="Sample & Home Collection Management" description={`Centre ID: ${centreID} • Phlebotomist & Laboratory Sample Tracking`}>
      <div className="space-y-6">
        <div className="flex items-center justify-between bg-card/60 p-4 rounded-xl border border-border/50 backdrop-blur-md">
          <div className="flex items-center gap-2">
            <Truck className="h-5 w-5 text-violet-500" />
            <div>
              <h2 className="text-base font-bold">Sample Collection Tasks</h2>
              <p className="text-xs text-muted-foreground">Manage home sample collection requests and lab specimen intake</p>
            </div>
          </div>

          <Button onClick={fetchSamples} variant="outline" size="sm" className="gap-1 text-xs">
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </Button>
        </div>

        <Card className="glass-strong border-border/50">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-base font-bold">Active Sample Collections ({samples.length})</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-2">
            {samples.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground text-xs">
                No active sample collection records found.
              </div>
            ) : (
              <div className="space-y-4">
                {samples.map((s) => (
                  <div key={s.id} className="p-4 rounded-xl bg-card/40 border border-border/40 space-y-3">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                      <div>
                        <span className="font-bold text-sm">{s.patient_name}</span>
                        <span className="text-xs text-muted-foreground ml-2">📞 {s.patient_phone}</span>
                        <p className="text-xs text-muted-foreground mt-0.5">🧪 Tests: {s.test_names.join(', ')}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">📍 Location/Address: {s.address}</p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">🕒 Slot: {s.appointment_time}</p>
                      </div>

                      <div className="text-start sm:text-end">
                        <Badge
                          variant="outline"
                          className={`text-xs uppercase font-mono ${
                            s.status === 'Sample Collected' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                            s.status === 'Collector Assigned' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' :
                            'bg-amber-500/10 text-amber-500 border-amber-500/20'
                          }`}
                        >
                          {s.status}
                        </Badge>
                        {s.collector_name && (
                          <p className="text-xs font-medium text-foreground mt-1">Collector: {s.collector_name}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-2 pt-2 border-t border-border/30">
                      <Input
                        placeholder="Assign Phlebotomist / Staff Name..."
                        value={collectorInput[s.booking_id] || ''}
                        onChange={(e) => setCollectorInput({ ...collectorInput, [s.booking_id]: e.target.value })}
                        className="text-xs h-8 sm:w-64"
                      />

                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleUpdateSample(s.booking_id, 'Collector Assigned')}
                        className="text-xs h-8 w-full sm:w-auto"
                      >
                        Assign Collector
                      </Button>

                      <Button
                        size="sm"
                        onClick={() => handleUpdateSample(s.booking_id, 'Sample Collected')}
                        className="text-xs h-8 w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white"
                      >
                        Mark Sample Collected
                      </Button>

                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleUpdateSample(s.booking_id, 'Sample Rejected')}
                        className="text-xs h-8 w-full sm:w-auto"
                      >
                        Reject Sample
                      </Button>
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
