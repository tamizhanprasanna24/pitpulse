'use client';

import * as React from 'react';
import { useAuth } from '@/context/auth-context';
import { DashboardShell, SectionCard } from '@/components/dashboard/shell';
import { getPregnancyWeekInfo } from '@/lib/health-utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Baby, Heart, Pill, Calendar, AlertCircle, CheckCircle2, Activity } from 'lucide-react';

export default function PregnancyPage() {
  const { profile } = useAuth();

  if (!profile) return null;
  if (!profile.is_pregnant || profile.gender !== 'female') {
    return (
      <DashboardShell title="Pregnancy" description="Maternal and child care">
        <Card className="glass">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Baby className="h-12 w-12 text-muted-foreground" />
            <p className="mt-4 text-sm text-muted-foreground">Pregnancy features are only available for users who have indicated they are pregnant.</p>
          </CardContent>
        </Card>
      </DashboardShell>
    );
  }

  const week = profile.pregnancy_week || 0;
  const info = getPregnancyWeekInfo(week);
  const progress = (week / 40) * 100;

  const babyDevelopment = [
    { week: 'Week 4-8', desc: 'Embryo develops, heart begins to beat' },
    { week: 'Week 9-12', desc: 'Fetus grows to 3 inches, facial features form' },
    { week: 'Week 13-16', desc: 'Baby can make facial expressions, bones harden' },
    { week: 'Week 17-20', desc: 'Baby can hear sounds, movements become stronger' },
    { week: 'Week 21-24', desc: 'Baby develops sleep-wake cycles, weighs about 600g' },
    { week: 'Week 25-28', desc: 'Brain develops rapidly, eyes can open' },
    { week: 'Week 29-32', desc: 'Baby gains weight rapidly, bones fully developed' },
    { week: 'Week 33-36', desc: 'Baby positions for birth, lungs mature' },
    { week: 'Week 37-40', desc: 'Baby is ready for birth, fully developed' },
  ];

  const currentDev = babyDevelopment.find(d => {
    const parts = d.week.replace('Week ', '').split('-').map(Number);
    return week >= parts[0] && week <= parts[1];
  }) || babyDevelopment[0];

  const nutritionTips = [
    'Take 400-800 mcg folic acid daily',
    'Eat iron-rich foods: spinach, lentils, dates',
    'Include calcium: milk, yogurt, paneer',
    'Protein: eggs, dal, chicken, fish',
    'Stay hydrated - 8-10 glasses water daily',
    'Avoid raw fish, unpasteurized dairy, excess caffeine',
  ];

  const exerciseTips = [
    'Walking 20-30 minutes daily',
    'Prenatal yoga and stretching',
    'Swimming for low-impact cardio',
    'Kegel exercises for pelvic strength',
    'Avoid: contact sports, heavy lifting, hot yoga',
  ];

  const vaccinationSchedule = [
    { name: 'Tetanus Toxoid (TT1)', time: 'Week 16-20', done: week >= 16 },
    { name: 'Tetanus Toxoid (TT2)', time: 'Week 24-28', done: week >= 24 },
    { name: 'Flu Vaccine', time: 'Any trimester', done: false },
    { name: 'Tdap Booster', time: 'Week 27-36', done: week >= 27 },
  ];

  const deliveryChecklist = [
    'Hospital bag packed',
    'Birth plan documented',
    'Emergency contacts updated',
    'Transportation arranged',
    'Post-delivery care planned',
    'Baby essentials ready',
  ];

  return (
    <DashboardShell title="Pregnancy Dashboard" description={`${week} weeks - Trimester ${info.trimester}`}>
      <Card className="glass border-primary/20">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold gradient-text">Week {week}</h2>
              <p className="text-sm text-muted-foreground">{info.weeksLeft} weeks until your due date</p>
            </div>
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <Baby className="h-8 w-8 text-primary" />
            </div>
          </div>
          <div className="mt-4">
            <Progress value={progress} className="h-3" />
            <div className="mt-1 flex justify-between text-xs text-muted-foreground">
              <span>Week 1</span>
              <span>Week 40</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card className="glass">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Baby className="h-5 w-5 text-primary" /> Baby Development
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-xl bg-primary/5 p-4">
              <Badge variant="secondary" className="mb-2 bg-primary/10 text-primary">{currentDev.week}</Badge>
              <p className="text-sm">{currentDev.desc}</p>
            </div>
            <div className="mt-4 space-y-2">
              <h4 className="text-sm font-semibold">Timeline:</h4>
              {babyDevelopment.map((d, i) => (
                <div key={i} className={'flex items-center gap-2 text-xs ' + (d.week === currentDev.week ? 'font-medium text-primary' : 'text-muted-foreground')}>
                  <div className={'h-2 w-2 rounded-full ' + (d.week === currentDev.week ? 'bg-primary' : 'bg-muted')} />
                  <span>{d.week}: {d.desc}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="glass">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-destructive" /> Mother&apos;s Health
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-xl bg-card/50 p-3">
              <p className="text-sm font-medium">Trimester {info.trimester}</p>
              <p className="text-xs text-muted-foreground">
                {info.trimester === 1 && 'Focus on rest, folic acid, and avoiding stress. Morning sickness is common.'}
                {info.trimester === 2 && 'Energy returns. Focus on nutrition, gentle exercise, and prenatal checkups.'}
                {info.trimester === 3 && 'Prepare for delivery. Monitor baby movements and pack your hospital bag.'}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-card/50 p-3 text-center">
                <p className="text-lg font-bold text-primary">{info.weeksLeft}</p>
                <p className="text-xs text-muted-foreground">Weeks to go</p>
              </div>
              <div className="rounded-xl bg-card/50 p-3 text-center">
                <p className="text-lg font-bold text-accent">{profile.previous_pregnancies}</p>
                <p className="text-xs text-muted-foreground">Previous pregnancies</p>
              </div>
            </div>
            {profile.expected_delivery_date && (
              <div className="flex items-center gap-2 rounded-xl bg-accent/5 p-3">
                <Calendar className="h-4 w-4 text-accent" />
                <div>
                  <p className="text-xs text-muted-foreground">Expected Delivery Date</p>
                  <p className="text-sm font-semibold">{new Date(profile.expected_delivery_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <SectionCard title="Nutrition Guidance">
          <div className="space-y-2">
            {nutritionTips.map((tip, i) => (
              <div key={i} className="flex items-start gap-2 rounded-lg bg-card/50 p-2 text-sm">
                <Pill className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                <span>{tip}</span>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Exercise Guidance">
          <div className="space-y-2">
            {exerciseTips.map((tip, i) => (
              <div key={i} className="flex items-start gap-2 rounded-lg bg-card/50 p-2 text-sm">
                <Activity className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span>{tip}</span>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <SectionCard title="Vaccination Schedule">
          <div className="space-y-2">
            {vaccinationSchedule.map((vax, i) => (
              <div key={i} className="flex items-center justify-between rounded-lg bg-card/50 p-3">
                <div>
                  <p className="text-sm font-medium">{vax.name}</p>
                  <p className="text-xs text-muted-foreground">{vax.time}</p>
                </div>
                {vax.done ? (
                  <Badge variant="secondary" className="bg-success/10 text-success"><CheckCircle2 className="mr-1 h-3 w-3" /> Done</Badge>
                ) : (
                  <Badge variant="secondary" className="bg-warning/10 text-warning">Pending</Badge>
                )}
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Delivery Preparation Checklist">
          <div className="space-y-2">
            {deliveryChecklist.map((item, i) => (
              <div key={i} className="flex items-center gap-2 rounded-lg bg-card/50 p-2 text-sm">
                <div className="flex h-5 w-5 items-center justify-center rounded-full border-2 border-border">
                  <CheckCircle2 className="h-3 w-3 text-muted-foreground" />
                </div>
                <span>{item}</span>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

      <Card className="glass mt-6 border-warning/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-warning" /> Pregnancy Risk Assessment
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="rounded-xl bg-success/5 p-4">
              <p className="text-sm font-semibold text-success">Low Risk</p>
              <p className="text-xs text-muted-foreground">Gestational Diabetes</p>
            </div>
            <div className="rounded-xl bg-success/5 p-4">
              <p className="text-sm font-semibold text-success">Low Risk</p>
              <p className="text-xs text-muted-foreground">Preeclampsia</p>
            </div>
            <div className="rounded-xl bg-warning/5 p-4">
              <p className="text-sm font-semibold text-warning">Monitor</p>
              <p className="text-xs text-muted-foreground">Anemia - increase iron intake</p>
            </div>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">AI risk assessment based on your health data. Consult your doctor for professional medical advice.</p>
        </CardContent>
      </Card>
    </DashboardShell>
  );
}
