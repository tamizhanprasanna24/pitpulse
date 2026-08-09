'use client';

import * as React from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/auth-context';
import { DashboardShell, SectionCard } from '@/components/dashboard/shell';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  ClipboardList, Heart, Activity, Baby, Plus, Loader2, Trash2, MapPin, Calendar,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';

interface Survey {
  id: string;
  patient_name: string | null;
  village: string | null;
  survey_type: 'household' | 'maternal' | 'child_health' | 'disease_surveillance' | 'nutrition';
  responses: Record<string, string> | null;
  status: 'pending' | 'completed' | 'follow_up';
  survey_date: string;
  created_at: string;
}

const surveyTypeMeta: Record<string, { label: string; icon: typeof Heart; color: string }> = {
  household: { label: 'Household', icon: ClipboardList, color: 'bg-primary/10 text-primary' },
  maternal: { label: 'Maternal Health', icon: Heart, color: 'bg-destructive/10 text-destructive' },
  child_health: { label: 'Child Health', icon: Baby, color: 'bg-primary/10 text-primary' },
  disease_surveillance: { label: 'Disease Surveillance', icon: Activity, color: 'bg-warning/10 text-warning' },
  nutrition: { label: 'Nutrition', icon: Activity, color: 'bg-accent/10 text-accent' },
};

const initialMockSurveys: Survey[] = [
  {
    id: 'srv-1',
    patient_name: 'Sunita Devi',
    village: 'Rampur Village',
    survey_type: 'maternal',
    responses: { 'Pregnancy Month': '4th Month', 'ANC Visit': 'Completed', 'Hemoglobin': '11.5 g/dL' },
    status: 'completed',
    survey_date: new Date().toISOString(),
    created_at: new Date().toISOString(),
  },
  {
    id: 'srv-2',
    patient_name: 'Rahul Kumar',
    village: 'Sector 4',
    survey_type: 'child_health',
    responses: { 'Age': '2 Years', 'Polio Vaccine': 'Given', 'Growth Status': 'Normal' },
    status: 'completed',
    survey_date: new Date().toISOString(),
    created_at: new Date().toISOString(),
  },
  {
    id: 'srv-3',
    patient_name: 'Ramesh Verma',
    village: 'Rampur Village',
    survey_type: 'disease_surveillance',
    responses: { 'Blood Pressure': '130/85', 'Blood Sugar': '110 mg/dL', 'Status': 'Stable' },
    status: 'follow_up',
    survey_date: new Date().toISOString(),
    created_at: new Date().toISOString(),
  },
];

export default function AshaSurveysPage() {
  const { profile } = useAuth();
  const [surveys, setSurveys] = React.useState<Survey[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [form, setForm] = React.useState({
    patient_name: '',
    village: '',
    survey_type: 'household' as Survey['survey_type'],
    status: 'completed' as Survey['status'],
    responses_text: '',
  });

  const fetchSurveys = React.useCallback(async () => {
    if (!profile) return;
    try {
      const { data, error } = await supabase
        .from('asha_surveys')
        .select('*')
        .eq('asha_id', profile.id)
        .order('created_at', { ascending: false });
      if (!error && data && data.length > 0) {
        setSurveys(data as Survey[]);
        setLoading(false);
        return;
      }
    } catch {
      // ignore
    }

    const saved = typeof window !== 'undefined' ? localStorage.getItem('pitpulse_asha_surveys') : null;
    if (saved) {
      try {
        setSurveys(JSON.parse(saved));
        setLoading(false);
        return;
      } catch {
        // ignore
      }
    }
    setSurveys(initialMockSurveys);
    setLoading(false);
  }, [profile]);

  React.useEffect(() => {
    fetchSurveys();
  }, [fetchSurveys]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setSubmitting(true);
    const responses: Record<string, string> = {};
    form.responses_text.split('\n').filter(Boolean).forEach((line, i) => {
      const [key, ...rest] = line.split(':');
      if (key && rest.length) responses[key.trim()] = rest.join(':').trim();
      else responses[`Q${i + 1}`] = line;
    });

    const newSurvey: Survey = {
      id: 'srv-' + Date.now(),
      patient_name: form.patient_name || null,
      village: form.village || null,
      survey_type: form.survey_type,
      status: form.status,
      responses,
      survey_date: new Date().toISOString(),
      created_at: new Date().toISOString(),
    };

    try {
      await supabase.from('asha_surveys').insert({
        asha_id: profile.id,
        ...newSurvey,
      });
    } catch {
      // ignore
    }

    const updated = [newSurvey, ...surveys];
    setSurveys(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem('pitpulse_asha_surveys', JSON.stringify(updated));
    }

    setSubmitting(false);
    toast.success('Survey recorded');
    setForm({ patient_name: '', village: '', survey_type: 'household', status: 'completed', responses_text: '' });
    setDialogOpen(false);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('asha_surveys').delete().eq('id', id);
    if (error) {
      toast.error('Failed to delete survey');
      return;
    }
    toast.success('Survey deleted');
    setSurveys(prev => prev.filter(s => s.id !== id));
  };

  return (
    <DashboardShell title="Health Surveys" description="Conduct and manage community health surveys">
      <div className="space-y-6">
        <div className="flex justify-end">
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-primary to-accent text-white">
                <Plus className="mr-2 h-4 w-4" /> New Survey
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Record Health Survey</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="patient">Patient Name</Label>
                  <Input id="patient" placeholder="Patient name (optional)" value={form.patient_name} onChange={e => setForm({ ...form, patient_name: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="village">Village</Label>
                  <Input id="village" placeholder="Village name" value={form.village} onChange={e => setForm({ ...form, village: e.target.value })} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Survey Type</Label>
                    <Select value={form.survey_type} onValueChange={v => setForm({ ...form, survey_type: v as Survey['survey_type'] })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="household">Household</SelectItem>
                        <SelectItem value="maternal">Maternal Health</SelectItem>
                        <SelectItem value="child_health">Child Health</SelectItem>
                        <SelectItem value="disease_surveillance">Disease Surveillance</SelectItem>
                        <SelectItem value="nutrition">Nutrition</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select value={form.status} onValueChange={v => setForm({ ...form, status: v as Survey['status'] })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="follow_up">Follow Up</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="responses">Survey Responses</Label>
                  <Textarea id="responses" placeholder="Blood Pressure: 120/80&#10;Hemoglobin: 11.2&#10;Nutrition status: Adequate" value={form.responses_text} onChange={e => setForm({ ...form, responses_text: e.target.value })} />
                  <p className="text-xs text-muted-foreground">One response per line, use &quot;Question: Answer&quot; format</p>
                </div>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button type="button" variant="outline">Cancel</Button>
                  </DialogClose>
                  <Button type="submit" disabled={submitting} className="bg-gradient-to-r from-primary to-accent text-white">
                    {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />} Save Survey
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : surveys.length === 0 ? (
          <Card className="glass">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <ClipboardList className="h-12 w-12 text-muted-foreground mb-3" />
              <p className="text-muted-foreground">No surveys recorded yet. Create your first survey.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {surveys.map(survey => {
              const meta = surveyTypeMeta[survey.survey_type];
              const Icon = meta.icon;
              return (
                <Card key={survey.id} className="glass">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 flex-1">
                        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${meta.color}`}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-semibold">{meta.label}</h3>
                            <Badge variant="secondary" className={
                              survey.status === 'completed' ? 'bg-success/10 text-success' :
                              survey.status === 'pending' ? 'bg-warning/10 text-warning' :
                              'bg-primary/10 text-primary'
                            }>{survey.status.replace(/_/g, ' ')}</Badge>
                          </div>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            {survey.patient_name && <span>{survey.patient_name}</span>}
                            {survey.village && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {survey.village}</span>}
                            <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {new Date(survey.survey_date).toLocaleDateString('en-IN')}</span>
                          </div>
                          {survey.responses && Object.keys(survey.responses).length > 0 && (
                            <div className="rounded-lg bg-card/50 p-3">
                              {Object.entries(survey.responses).map(([key, value]) => (
                                <div key={key} className="flex justify-between text-sm py-0.5">
                                  <span className="text-muted-foreground">{key}:</span>
                                  <span className="font-medium">{value}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                      <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(survey.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        <SectionCard title="Survey Templates">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <div className="rounded-lg bg-card/50 p-4"><Heart className="h-6 w-6 text-destructive mb-2" /><h4 className="text-sm font-semibold">Maternal Health</h4><p className="text-xs text-muted-foreground">Pregnancy, nutrition, ANC visits</p></div>
            <div className="rounded-lg bg-card/50 p-4"><Baby className="h-6 w-6 text-primary mb-2" /><h4 className="text-sm font-semibold">Child Health</h4><p className="text-xs text-muted-foreground">Immunization, growth, nutrition</p></div>
            <div className="rounded-lg bg-card/50 p-4"><Activity className="h-6 w-6 text-accent mb-2" /><h4 className="text-sm font-semibold">Chronic Disease</h4><p className="text-xs text-muted-foreground">Diabetes, hypertension screening</p></div>
          </div>
        </SectionCard>
      </div>
    </DashboardShell>
  );
}
