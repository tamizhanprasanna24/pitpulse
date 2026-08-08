'use client';

import * as React from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/auth-context';
import { DashboardShell } from '@/components/dashboard/shell';
import type { LabReport } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FileText, Upload, Download, Trash2, Plus, FlaskConical } from 'lucide-react';
import { formatDate } from '@/lib/health-utils';
import { toast } from 'sonner';

export default function LabReportsPage() {
  const { profile } = useAuth();
  const [reports, setReports] = React.useState<LabReport[]>([]);
  const [showForm, setShowForm] = React.useState(false);
  const [title, setTitle] = React.useState('');
  const [reportType, setReportType] = React.useState('');
  const [notes, setNotes] = React.useState('');
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!profile) return;
    (async () => {
      const { data } = await supabase.from('lab_reports').select('*').eq('user_id', profile.id).order('uploaded_at', { ascending: false });
      setReports(data as LabReport[] || []);
      setLoading(false);
    })();
  }, [profile]);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || !title) return;
    const { data, error } = await supabase.from('lab_reports').insert({
      user_id: profile.id,
      title,
      report_type: reportType || null,
      notes: notes || null,
    }).select().single();
    if (error) {
      toast.error('Failed to upload report');
    } else {
      toast.success('Lab report uploaded');
      setReports(prev => [data as LabReport, ...prev]);
      setShowForm(false);
      setTitle('');
      setReportType('');
      setNotes('');
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('lab_reports').delete().eq('id', id);
    if (error) {
      toast.error('Failed to delete report');
    } else {
      toast.success('Report deleted');
      setReports(prev => prev.filter(r => r.id !== id));
    }
  };

  return (
    <DashboardShell title="Lab Reports" description="Upload and manage your lab reports">
      <div className="space-y-6">
        {!showForm ? (
          <Button onClick={() => setShowForm(true)} className="bg-gradient-to-r from-primary to-accent text-white">
            <Plus className="mr-2 h-4 w-4" /> Upload Report
          </Button>
        ) : (
          <Card className="glass">
            <CardHeader>
              <CardTitle>Upload Lab Report</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpload} className="space-y-4">
                <div className="space-y-2">
                  <Label>Report Title</Label>
                  <Input placeholder="e.g. Complete Blood Count" value={title} onChange={(e) => setTitle(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label>Report Type</Label>
                  <Input placeholder="e.g. Blood Test, X-Ray, MRI" value={reportType} onChange={(e) => setReportType(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Notes (optional)</Label>
                  <Input placeholder="Any notes about the report" value={notes} onChange={(e) => setNotes(e.target.value)} />
                </div>
                <div className="flex gap-2">
                  <Button type="submit" className="bg-gradient-to-r from-primary to-accent text-white">Upload</Button>
                  <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {loading ? (
          <p className="text-sm text-muted-foreground">Loading reports...</p>
        ) : reports.length === 0 ? (
          <Card className="glass">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FlaskConical className="h-12 w-12 text-muted-foreground" />
              <p className="mt-4 text-sm text-muted-foreground">No lab reports uploaded yet.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {reports.map(report => (
              <Card key={report.id} className="glass">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                        <FileText className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{report.title}</h3>
                        {report.report_type && <Badge variant="secondary" className="mt-1 text-xs">{report.report_type}</Badge>}
                      </div>
                    </div>
                    <Button size="icon" variant="ghost" onClick={() => handleDelete(report.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <p className="text-xs text-muted-foreground">{formatDate(report.uploaded_at)}</p>
                    <Button size="sm" variant="outline" onClick={() => toast.info('Downloading...')}>
                      <Download className="mr-1 h-4 w-4" /> Download
                    </Button>
                  </div>
                  {report.notes && <p className="mt-2 text-sm text-muted-foreground">{report.notes}</p>}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
