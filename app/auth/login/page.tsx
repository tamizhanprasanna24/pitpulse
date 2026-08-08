'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth, getDashboardRoute } from '@/context/auth-context';
import { supabase } from '@/lib/supabase';
import type { UserRole } from '@/types';
import {
  Activity, Mail, Lock, Eye, EyeOff, Loader2, ShieldCheck,
  Heart, Stethoscope, Users, Pill, Truck, KeyRound, Sparkles, Copy, Check
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { toast } from 'sonner';

const demoAccounts: { role: UserRole; name: string; email: string; icon: typeof Heart; label: string }[] = [
  { role: 'patient', name: 'Priya Sharma', email: 'patient@pitpulse.org', icon: Heart, label: 'Patient' },
  { role: 'doctor', name: 'Dr. Rajesh Verma', email: 'doctor@pitpulse.org', icon: Stethoscope, label: 'Doctor' },
  { role: 'asha', name: 'Sunita Devi', email: 'asha@pitpulse.org', icon: Users, label: 'ASHA Worker' },
  { role: 'pharmacy', name: 'Apollo Pharmacy', email: 'pharmacy@pitpulse.org', icon: Pill, label: 'Pharmacy' },
  { role: 'delivery', name: 'Vikram Singh', email: 'delivery@pitpulse.org', icon: Truck, label: 'Delivery' },
];

export default function LoginPage() {
  const router = useRouter();
  const { signIn, sendOtp, verifyOtp, user, profile, loading, loginAsDemoUser } = useAuth();

  const [authMode, setAuthMode] = React.useState<'credentials' | 'otp_only'>('credentials');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [showPassword, setShowPassword] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);

  const [step, setStep] = React.useState<'credentials' | 'otp'>('credentials');
  const [otp, setOtp] = React.useState('');
  const [latestCode, setLatestCode] = React.useState<string | null>(null);
  const [copied, setCopied] = React.useState(false);
  const [resendTimer, setResendTimer] = React.useState(0);

  const otpPending = React.useRef(false);

  React.useEffect(() => {
    if (!loading && user && profile && !otpPending.current) {
      router.push(getDashboardRoute(profile.role));
    }
  }, [user, profile, loading, router]);

  // Resend Timer Countdown
  React.useEffect(() => {
    if (resendTimer <= 0) return;
    const timer = setInterval(() => setResendTimer((t) => t - 1), 1000);
    return () => clearInterval(timer);
  }, [resendTimer]);

  const triggerOtpSend = async (targetEmail: string) => {
    const { error, code } = await sendOtp(targetEmail);
    if (error) {
      toast.error(error);
      return false;
    }

    if (code) {
      setLatestCode(code);
      toast.success(`Verification code sent!`, {
        description: `Your OTP is ${code} (copied to clipboard ready)`,
        duration: 8000,
      });
    } else {
      toast.success(`A verification code has been sent to ${targetEmail}`);
    }

    setResendTimer(60);
    setStep('otp');
    return true;
  };

  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please enter your email and password');
      return;
    }
    setSubmitting(true);
    otpPending.current = true;

    const { error } = await signIn(email, password);
    if (error) {
      // If password sign-in returns error, try sending OTP directly
      console.warn('Password auth notice, proceeding with Email OTP:', error);
    }

    const success = await triggerOtpSend(email);
    setSubmitting(false);
    if (!success) {
      otpPending.current = false;
    }
  };

  const handleDirectOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error('Please enter your email address');
      return;
    }
    setSubmitting(true);
    otpPending.current = true;
    const success = await triggerOtpSend(email);
    setSubmitting(false);
    if (!success) {
      otpPending.current = false;
    }
  };

  const handleOtpSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (otp.length !== 6) return;

    setSubmitting(true);
    const { error } = await verifyOtp(email, otp);

    if (error) {
      toast.error(error);
      setSubmitting(false);
      return;
    }

    otpPending.current = false;
    toast.success('Authentication verified successfully!');

    if (profile) {
      router.push(getDashboardRoute(profile.role));
    } else {
      const { data } = await supabase.from('profiles').select('*').eq('id', user?.id ?? '').maybeSingle();
      if (data) {
        router.push(getDashboardRoute((data as { role: UserRole }).role));
      } else {
        router.push('/dashboard/patient');
      }
    }
    setSubmitting(false);
  };

  const handleDemoClick = (role: UserRole) => {
    loginAsDemoUser(role);
    router.push(getDashboardRoute(role));
  };

  const copyOtpToClipboard = () => {
    if (!latestCode) return;
    navigator.clipboard.writeText(latestCode);
    setCopied(true);
    setOtp(latestCode);
    toast.success('OTP copied & auto-filled!');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4 py-8">
      <div className="w-full max-w-lg space-y-6">
        {/* Header Logo */}
        <div className="text-center">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent shadow-lg">
              <Activity className="h-7 w-7 text-white" />
            </div>
            <span className="text-2xl font-bold tracking-tight">Pit Pulse</span>
          </Link>
          <p className="mt-1 text-sm text-muted-foreground">Smart Healthcare Management System</p>
        </div>

        {/* Quick Demo Login Cards */}
        <Card className="border-primary/20 bg-primary/5 shadow-sm">
          <CardHeader className="py-3 px-4">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-xs font-semibold text-primary">
                <Sparkles className="h-4 w-4" /> Quick Demo Sign-In (1-Click Preview)
              </span>
              <span className="text-[10px] text-muted-foreground">Select any role to test</span>
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-3">
            <div className="grid grid-cols-5 gap-1.5">
              {demoAccounts.map((acc) => (
                <button
                  key={acc.role}
                  type="button"
                  onClick={() => handleDemoClick(acc.role)}
                  className="flex flex-col items-center gap-1 rounded-lg border border-border/60 bg-background/80 p-2 text-center transition-all hover:border-primary hover:bg-primary/10 hover:shadow-sm"
                  title={`Log in as ${acc.name} (${acc.label})`}
                >
                  <acc.icon className="h-4 w-4 text-primary" />
                  <span className="text-[11px] font-medium leading-none">{acc.label}</span>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Auth Card */}
        <Card className="glass-strong border-border/50 shadow-xl">
          <CardHeader className="space-y-1">
            {step === 'credentials' ? (
              <>
                <CardTitle className="text-2xl font-bold">Welcome back</CardTitle>
                <CardDescription>Sign in to access your healthcare portal</CardDescription>
              </>
            ) : (
              <>
                <CardTitle className="flex items-center gap-2 text-2xl font-bold">
                  <ShieldCheck className="h-6 w-6 text-primary" /> Enter Verification Code
                </CardTitle>
                <CardDescription>
                  Enter the 6-digit OTP code sent to <span className="font-semibold text-foreground">{email}</span>
                </CardDescription>
              </>
            )}
          </CardHeader>

          <CardContent className="space-y-4">
            {step === 'credentials' ? (
              <Tabs
                defaultValue="credentials"
                value={authMode}
                onValueChange={(v) => setAuthMode(v as 'credentials' | 'otp_only')}
                className="w-full"
              >
                <TabsList className="grid w-full grid-cols-2 mb-4">
                  <TabsTrigger value="credentials" className="flex items-center gap-1.5 text-xs">
                    <Lock className="h-3.5 w-3.5" /> Password & OTP
                  </TabsTrigger>
                  <TabsTrigger value="otp_only" className="flex items-center gap-1.5 text-xs">
                    <KeyRound className="h-3.5 w-3.5" /> Direct Email OTP
                  </TabsTrigger>
                </TabsList>

                {/* Tab 1: Credentials Form */}
                <TabsContent value="credentials">
                  <form onSubmit={handleCredentialsSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="email"
                          type="email"
                          placeholder="you@pitpulse.org"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="pl-10"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="password">Password</Label>
                      </div>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="password"
                          type={showPassword ? 'text' : 'password'}
                          placeholder="••••••••"
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
                      className="w-full bg-gradient-to-r from-primary to-accent font-semibold text-white shadow-md hover:opacity-90"
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Authenticating & Sending OTP...
                        </>
                      ) : (
                        'Continue to OTP Verification'
                      )}
                    </Button>
                  </form>
                </TabsContent>

                {/* Tab 2: Direct OTP Form */}
                <TabsContent value="otp_only">
                  <form onSubmit={handleDirectOtpSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="otp-email">Email Address</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="otp-email"
                          type="email"
                          placeholder="you@pitpulse.org"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="pl-10"
                          required
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        We will send a 6-digit OTP directly to your email address.
                      </p>
                    </div>

                    <Button
                      type="submit"
                      disabled={submitting}
                      className="w-full bg-gradient-to-r from-primary to-accent font-semibold text-white shadow-md hover:opacity-90"
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending OTP Code...
                        </>
                      ) : (
                        'Send OTP Code'
                      )}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
            ) : (
              /* OTP Verification Form */
              <form onSubmit={handleOtpSubmit} className="space-y-6">
                {latestCode && (
                  <div className="flex items-center justify-between rounded-lg border border-primary/30 bg-primary/10 p-3 text-xs">
                    <div>
                      <span className="text-muted-foreground">Your Generated OTP: </span>
                      <span className="font-mono font-bold text-primary tracking-widest text-sm">{latestCode}</span>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={copyOtpToClipboard}
                      className="h-7 text-xs flex items-center gap-1"
                    >
                      {copied ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
                      {copied ? 'Copied' : 'Copy & Auto-fill'}
                    </Button>
                  </div>
                )}

                <div className="flex flex-col items-center justify-center gap-3 py-2">
                  <Label className="text-xs text-muted-foreground">Enter 6-digit code</Label>
                  <InputOTP
                    maxLength={6}
                    value={otp}
                    onChange={(val) => {
                      setOtp(val);
                      if (val.length === 6) {
                        setTimeout(() => handleOtpSubmit(), 100);
                      }
                    }}
                  >
                    <InputOTPGroup>
                      <InputOTPSlot index={0} />
                      <InputOTPSlot index={1} />
                      <InputOTPSlot index={2} />
                      <InputOTPSlot index={3} />
                      <InputOTPSlot index={4} />
                      <InputOTPSlot index={5} />
                    </InputOTPGroup>
                  </InputOTP>
                </div>

                <Button
                  type="submit"
                  disabled={submitting || otp.length !== 6}
                  className="w-full bg-gradient-to-r from-primary to-accent font-semibold text-white shadow-md hover:opacity-90"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Verifying Code...
                    </>
                  ) : (
                    'Verify & Sign In'
                  )}
                </Button>

                <div className="flex items-center justify-between text-xs pt-2 border-t border-border">
                  <button
                    type="button"
                    disabled={resendTimer > 0}
                    onClick={() => triggerOtpSend(email)}
                    className="text-primary hover:underline disabled:text-muted-foreground disabled:no-underline font-medium"
                  >
                    {resendTimer > 0 ? `Resend OTP in ${resendTimer}s` : 'Resend OTP Code'}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setStep('credentials');
                      setOtp('');
                      setLatestCode(null);
                    }}
                    className="text-muted-foreground hover:text-foreground underline"
                  >
                    Change Email / Back
                  </button>
                </div>
              </form>
            )}

            {step === 'credentials' && (
              <p className="mt-4 text-center text-sm text-muted-foreground pt-2 border-t border-border/50">
                Don&apos;t have an account yet?{' '}
                <Link href="/auth/register" className="font-semibold text-primary hover:underline">
                  Create an account
                </Link>
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
