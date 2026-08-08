'use client';
import * as React from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/auth-context';
import { DashboardShell } from '@/components/dashboard/shell';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UserPlus, Check } from 'lucide-react';
import { calculateAge, calculateBMI } from '@/lib/health-utils';
import { toast } from 'sonner';

export default function AshaRegisterPage() {
  const { profile } = useAuth();
  const [form, setForm] = React.useState({ full_name: '', email: '', mobile: '', gender: 'female', age: '', village: '', is_pregnant: false });
  const [submitting, setSubmitting] = React.useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.full_name || !form.mobile) { toast.error('Please fill required fields'); return; }
    setSubmitting(true);
    const { error } = await supabase.from('profiles').insert({
      full_name: form.full_name,
      email: form.email || form.mobile + '@asha.register',
      role: 'patient',
      mobile_number: form.mobile,
      gender: form.gender,
      age: form.age ? Number(form.age) : null,
      assigned_village: form.village || profile?.assigned_village || null,
      is_pregnant: form.gender === 'female' && form.is_pregnant,
    });
    if (error) { toast.error('Failed to register patient: ' + error.message); }
    else { toast.success('Patient registered successfully'); setForm({ full_name: '', email: '', mobile: '', gender: 'female', age: '', village: '', is_pregnant: false }); }
    setSubmitting(false);
  };

  return (
    <DashboardShell title="Patient Registration" description="Register new patients from your community">
      <Card className="glass max-w-2xl mx-auto">
        <CardContent className="pt-6">
          <form onSubmit={handleRegister} className="space-y-4">
            <div className="flex items-center gap-2 mb-4"><UserPlus className="h-5 w-5 text-primary" /><h2 className="text-lg font-semibold">New Patient</h2></div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2"><Label>Full Name *</Label><Input placeholder="Patient name" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} required /></div>
              <div className="space-y-2"><Label>Mobile Number *</Label><Input placeholder="+91 98765 43210" value={form.mobile} onChange={(e) => setForm({ ...form, mobile: e.target.value })} required /></div>
              <div className="space-y-2"><Label>Email (optional)</Label><Input placeholder="email@example.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
              <div className="space-y-2"><Label>Age</Label><Input type="number" placeholder="Age in years" value={form.age} onChange={(e) => setForm({ ...form, age: e.target.value })} /></div>
              <div className="space-y-2"><Label>Gender</Label><Select value={form.gender} onValueChange={(v) => setForm({ ...form, gender: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="male">Male</SelectItem><SelectItem value="female">Female</SelectItem><SelectItem value="others">Others</SelectItem></SelectContent></Select></div>
              <div className="space-y-2"><Label>Village</Label><Input placeholder="Village name" value={form.village} onChange={(e) => setForm({ ...form, village: e.target.value })} /></div>
            </div>
            {form.gender === 'female' && (
              <div className="flex items-center gap-2 rounded-lg bg-primary/5 p-3">
                <input type="checkbox" id="preg" checked={form.is_pregnant} onChange={(e) => setForm({ ...form, is_pregnant: e.target.checked })} />
                <Label htmlFor="preg" className="cursor-pointer text-sm">Is currently pregnant</Label>
              </div>
            )}
            <Button type="submit" disabled={submitting} className="w-full bg-gradient-to-r from-primary to-accent text-white">{submitting ? 'Registering...' : 'Register Patient'}</Button>
          </form>
        </CardContent>
      </Card>
    </DashboardShell>
  );
}
