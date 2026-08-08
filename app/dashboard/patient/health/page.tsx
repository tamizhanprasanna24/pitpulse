'use client';

import * as React from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/auth-context';
import { DashboardShell } from '@/components/dashboard/shell';
import type { HealthRecord, HealthRecordType } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Activity, Heart, Droplet, Moon, Footprints, Scale, Plus, TrendingUp,
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar,
} from 'recharts';
import { toast } from 'sonner';

const trackerTypes: { value: HealthRecordType; label: string; unit: string; icon: typeof Activity; color: string }[] = [
  { value: 'blood_pressure', label: 'Blood Pressure', unit: 'mmHg', icon: Activity, color: 'bg-primary' },
  { value: 'blood_sugar', label: 'Blood Sugar', unit: 'mg/dL', icon: Droplet, color: 'bg-blue-500' },
  { value: 'heart_rate', label: 'Heart Rate', unit: 'bpm', icon: Heart, color: 'bg-destructive' },
  { value: 'oxygen_saturation', label: 'Oxygen Saturation', unit: '%', icon: Activity, color: 'bg-success' },
  { value: 'weight', label: 'Weight', unit: 'kg', icon: Scale, color: 'bg-purple-500' },
  { value: 'water_intake', label: 'Water Intake', unit: 'glasses', icon: Droplet, color: 'bg-cyan-500' },
  { value: 'sleep', label: 'Sleep', unit: 'hours', icon: Moon, color: 'bg-indigo-500' },
  { value: 'exercise', label: 'Exercise', unit: 'minutes', icon: Footprints, color: 'bg-orange-500' },
];

export default function HealthTrackerPage() {
  const { profile } = useAuth();
  const [records, setRecords] = React.useState<HealthRecord[]>([]);
  const [selectedType, setSelectedType] = React.useState<HealthRecordType>('blood_pressure');
  const [value, setValue] = React.useState('');
  const [secondaryValue, setSecondaryValue] = React.useState('');
  const [notes, setNotes] = React.useState('');
  const [loading, setLoading] = React.useState(true);

  const fetchRecords = React.useCallback(async () => {
    if (!profile) return;
    const { data } = await supabase
      .from('health_records')
      .select('*')
      .eq('user_id', profile.id)
      .order('recorded_at', { ascending: false });
    setRecords(data as HealthRecord[] || []);
    setLoading(false);
  }, [profile]);

  React.useEffect(() => { fetchRecords(); }, [fetchRecords]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || !value) return;
    const tracker = trackerTypes.find(t => t.value === selectedType)!;
    const { error } = await supabase.from('health_records').insert({
      user_id: profile.id,
      type: selectedType,
      value: Number(value),
      secondary_value: selectedType === 'blood_pressure' ? Number(secondaryValue) : null,
      unit: tracker.unit,
      notes: notes || null,
    });
    if (error) {
      toast.error('Failed to add record');
    } else {
      toast.success('Health record added');
      setValue('');
      setSecondaryValue('');
      setNotes('');
      fetchRecords();
    }
  };

  const currentTracker = trackerTypes.find(t => t.value === selectedType)!;
  const chartData = records
    .filter(r => r.type === selectedType)
    .slice(0, 14)
    .reverse()
    .map(r => ({
      date: new Date(r.recorded_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
      value: r.value,
      secondary: r.secondary_value,
    }));

  return (
    <DashboardShell title="Health Tracker" description="Track your vitals and health metrics">
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Add Record Form */}
        <Card className="glass">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-primary" /> Add Record
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAdd} className="space-y-4">
              <div className="space-y-2">
                <Label>Metric Type</Label>
                <Select value={selectedType} onValueChange={(v) => setSelectedType(v as HealthRecordType)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {trackerTypes.map(t => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Value ({currentTracker.unit})</Label>
                <Input type="number" step="0.1" placeholder="Enter value" value={value} onChange={(e) => setValue(e.target.value)} required />
              </div>
              {selectedType === 'blood_pressure' && (
                <div className="space-y-2">
                  <Label>Diastolic (mmHg)</Label>
                  <Input type="number" placeholder="e.g. 80" value={secondaryValue} onChange={(e) => setSecondaryValue(e.target.value)} required />
                </div>
              )}
              <div className="space-y-2">
                <Label>Notes (optional)</Label>
                <Input placeholder="Any notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
              </div>
              <Button type="submit" className="w-full bg-gradient-to-r from-primary to-accent text-white">
                Add Record
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Chart */}
        <Card className="glass lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" /> {currentTracker.label} Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                {selectedType === 'blood_pressure' ? (
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                    <Line type="monotone" dataKey="value" name="Systolic" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 4 }} />
                    <Line type="monotone" dataKey="secondary" name="Diastolic" stroke="hsl(var(--accent))" strokeWidth={2} dot={{ r: 4 }} />
                  </LineChart>
                ) : (
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                    <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                )}
              </ResponsiveContainer>
            ) : (
              <div className="flex h-[300px] items-center justify-center text-sm text-muted-foreground">
                No data for {currentTracker.label} yet. Add a record to see your trend.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Stats */}
      <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        {trackerTypes.slice(0, 4).map(t => {
          const latest = records.find(r => r.type === t.value);
          return (
            <div key={t.value} className="glass rounded-xl p-4">
              <div className={`mb-2 flex h-8 w-8 items-center justify-center rounded-lg ${t.color}`}>
                <t.icon className="h-4 w-4 text-white" />
              </div>
              <p className="text-xl font-bold">
                {latest ? (t.value === 'blood_pressure' ? `${latest.value}/${latest.secondary_value}` : latest.value) : '--'}
                <span className="text-sm font-normal text-muted-foreground"> {t.unit}</span>
              </p>
              <p className="text-xs text-muted-foreground">{t.label}</p>
            </div>
          );
        })}
      </div>

      {/* Recent Records */}
      <Card className="glass mt-6">
        <CardHeader>
          <CardTitle>Recent Records</CardTitle>
        </CardHeader>
        <CardContent>
          {records.length > 0 ? (
            <div className="space-y-2">
              {records.slice(0, 10).map(r => (
                <div key={r.id} className="flex items-center justify-between rounded-lg bg-card/50 p-3">
                  <div>
                    <p className="text-sm font-medium">{trackerTypes.find(t => t.value === r.type)?.label || r.type}</p>
                    <p className="text-xs text-muted-foreground">{new Date(r.recorded_at).toLocaleString('en-IN')}</p>
                  </div>
                  <p className="text-sm font-semibold">
                    {r.type === 'blood_pressure' ? `${r.value}/${r.secondary_value}` : r.value} {r.unit}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No records yet. Start tracking your health above.</p>
          )}
        </CardContent>
      </Card>
    </DashboardShell>
  );
}
