'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth, getDashboardRoute } from '@/context/auth-context';
import { supabase } from '@/lib/supabase';
import { Activity, Mail, Lock, Eye, EyeOff, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from 'sonner';

export default function LoginPage() {
  const router = useRouter();
  const { signIn, setLocalProfile, user, profile, loading } = useAuth();

  const [loginType, setLoginType] = React.useState<'standard' | 'diagnostic'>('standard');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [centreID, setCentreID] = React.useState('');
  const [staffID, setStaffID] = React.useState('');
  const [showPassword, setShowPassword] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (!loading && user && profile && !email.trim() && !password.trim() && !centreID.trim()) {
      router.push(getDashboardRoute(profile.role));
    }
  }, [user, profile, loading, router, email, password, centreID]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      if (loginType === 'diagnostic') {
        if (!centreID || !staffID || !password) {
          toast.error('Please enter Centre ID, Staff ID, and Password.');
          setSubmitting(false);
          return;
        }

        const res = await fetch('/api/diagnostic/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ centre_id: centreID.trim(), staff_id: staffID.trim(), password: password.trim() }),
        });

        const data = await res.json();
        if (!res.ok || !data.success || !data.profile) {
          toast.error(data.message || 'Invalid Centre ID or Staff credentials.');
          setSubmitting(false);
          return;
        }

        setLocalProfile(data.profile, password);
        toast.success(`Signed in as ${data.staff.name} (${data.staff.role.toUpperCase()})`);
        router.push('/dashboard/diagnostic');
        return;
      }

      // Standard Login Flow
      if (!email || !email.trim() || !password || !password.trim()) {
        toast.error('Please enter your email and password.');
        setSubmitting(false);
        return;
      }

      const res = await signIn(email.trim(), password);
      if (res.error) {
        toast.error(res.error);
        setSubmitting(false);
        return;
      }

      toast.success('Signed in successfully!');
      const targetRole = res.profile?.role || profile?.role || 'patient';
      const destination = getDashboardRoute(targetRole);
      router.push(destination);
    } catch (err: any) {
      toast.error(err?.message || 'Invalid email or password.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent shadow-lg">
              <Activity className="h-7 w-7 text-white" />
            </div>
            <span className="text-2xl font-bold">Pit Pulse</span>
          </Link>
        </div>

        <Card className="glass-strong border-border/50 shadow-sm">
          <CardHeader className="space-y-1 p-6">
            <div className="flex rounded-lg bg-muted p-1 mb-2">
              <button
                type="button"
                onClick={() => setLoginType('standard')}
                className={`flex-1 rounded-md py-1.5 text-xs font-medium transition-all ${
                  loginType === 'standard' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground'
                }`}
              >
                Standard Portal
              </button>
              <button
                type="button"
                onClick={() => setLoginType('diagnostic')}
                className={`flex-1 rounded-md py-1.5 text-xs font-medium transition-all ${
                  loginType === 'diagnostic' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground'
                }`}
              >
                🔬 Diagnostic Centre
              </button>
            </div>
            <CardTitle className="text-2xl font-semibold tracking-tight">
              {loginType === 'diagnostic' ? 'Diagnostic Staff Login' : 'Welcome back'}
            </CardTitle>
            <CardDescription className="text-sm text-muted-foreground">
              {loginType === 'diagnostic'
                ? 'Sign in with your Centre ID, Staff ID, and secure password'
                : 'Sign in with your email to access your healthcare dashboard'}
            </CardDescription>
          </CardHeader>

          <CardContent className="p-6 pt-0">
            <form onSubmit={handleSubmit} className="space-y-4">
              {loginType === 'diagnostic' ? (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="centreID">Centre ID *</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="centreID"
                        type="text"
                        placeholder="e.g. APOLLO-7F2K91QM"
                        value={centreID}
                        onChange={(e) => setCentreID(e.target.value.toUpperCase())}
                        className="pl-10 uppercase tracking-wide font-mono"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="staffID">Staff ID *</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="staffID"
                        type="text"
                        placeholder="e.g. STAFF-01 / LAB-02"
                        value={staffID}
                        onChange={(e) => setStaffID(e.target.value.toUpperCase())}
                        className="pl-10 uppercase tracking-wide font-mono"
                        required
                      />
                    </div>
                  </div>
                </>
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="email">Email address *</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="password">Password *</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                disabled={submitting}
                className="w-full bg-gradient-to-r from-primary to-accent text-white"
              >
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Authenticating...
                  </>
                ) : (
                  loginType === 'diagnostic' ? 'Sign In to Diagnostic Portal' : 'Sign In'
                )}
              </Button>
            </form>

            <p className="mt-4 text-center text-sm text-muted-foreground">
              Don&apos;t have an account?{' '}
              <Link href="/auth/register" className="font-medium text-primary hover:underline">
                Sign up
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
