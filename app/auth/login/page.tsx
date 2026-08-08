'use client';

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
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
import { cn } from '@/lib/utils';

const portalTypes: { role: UserRole; name: string; icon: typeof Heart; label: string }[] = [
  { role: 'patient', name: 'Patient Portal', icon: Heart, label: 'Patient' },
  { role: 'doctor', name: 'Doctor Portal', icon: Stethoscope, label: 'Doctor' },
  { role: 'asha', name: 'ASHA Portal', icon: Users, label: 'ASHA Worker' },
  { role: 'pharmacy', name: 'Pharmacy Portal', icon: Pill, label: 'Pharmacy' },
  { role: 'delivery', name: 'Delivery Portal', icon: Truck, label: 'Delivery' },
];

export default function LoginPage() {
  const router = useRouter();
  const { signIn, sendOtp, verifyOtp, user, profile, loading } = useAuth();

  const [selectedRole, setSelectedRole] = React.useState<UserRole>('patient');
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

    // Call Supabase auth directly to control the flow and avoid OTP triggering on success
    const { data: authData, error } = await supabase.auth.signInWithPassword({ email, password });
    
    if (!error && authData?.user) {
      // 1. Immediately query the database profiles table to get the logged-in user's role
      const { data: profileData } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', authData.user.id)
        .single();
        
      toast.success('Signed in successfully!');
      
      // 2. Use a router switch case to redirect to the exact dashboard matching that role string
      switch(profileData?.role) {
        case 'doctor': router.push('/dashboard/doctor'); break;
        case 'patient': router.push('/dashboard/patient'); break;
        case 'asha':
        case 'asha worker': router.push('/dashboard/asha-worker'); break;
        case 'pharmacy': router.push('/dashboard/pharmacy'); break;
        case 'delivery': router.push('/dashboard/delivery'); break;
        default: router.push('/dashboard/patient');
      }
      return; // Do NOT trigger OTP
    } else {
      console.warn('Password auth notice, proceeding with Email OTP:', error);
      const success = await triggerOtpSend(email);
      setSubmitting(false);
      if (!success) {
        otpPending.current = false;
      }
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
    const { error } = await verifyOtp(email, otp, selectedRole);

    if (error) {
      toast.error(error);
      setSubmitting(false);
      return;
    }

    otpPending.current = false;
    toast.success('Authentication verified successfully!');

    if (profile) {
      switch(profile.role) {
        case 'doctor': router.push('/dashboard/doctor'); break;
        case 'patient': router.push('/dashboard/patient'); break;
        case 'asha':
        case 'asha worker': router.push('/dashboard/asha-worker'); break;
        case 'pharmacy': router.push('/dashboard/pharmacy'); break;
        case 'delivery': router.push('/dashboard/delivery'); break;
        default: router.push('/dashboard/patient');
      }
    } else {
      const { data } = await supabase.from('profiles').select('role').eq('id', user?.id ?? '').single();
      switch(data?.role) {
        case 'doctor': router.push('/dashboard/doctor'); break;
        case 'patient': router.push('/dashboard/patient'); break;
        case 'asha':
        case 'asha worker': router.push('/dashboard/asha-worker'); break;
        case 'pharmacy': router.push('/dashboard/pharmacy'); break;
        case 'delivery': router.push('/dashboard/delivery'); break;
        default: router.push('/dashboard/patient');
      }
    }
    setSubmitting(false);
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
          <Link href="/" className="inline-flex items-center gap-2.5">
            <div className="relative flex h-12 w-12 overflow-hidden rounded-xl shadow-lg ring-1 ring-primary/20">
              <Image src="/logo.png" alt="Pit Pulse Logo" width={48} height={48} className="h-full w-full object-cover" />
            </div>
            <span className="text-2xl font-bold tracking-tight">Pit Pulse</span>
          </Link>
          <p className="mt-1 text-sm text-muted-foreground">Smart Healthcare Management System</p>
        </div>

        {/* Quick Demo Login Cards */}
        {/* Portal Selection Cards */}
        <Card className="border-primary/20 bg-primary/5 shadow-sm">
          <CardHeader className="py-3 px-4">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-xs font-semibold text-primary">
                <Users className="h-4 w-4" /> Select Your Portal
              </span>
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-3">
            <div className="grid grid-cols-5 gap-1.5">
              {portalTypes.map((portal) => (
                <button
                  key={portal.role}
                  type="button"
                  onClick={() => setSelectedRole(portal.role)}
                  className={cn(
                    "flex flex-col items-center gap-1 rounded-lg border p-2 text-center transition-all hover:border-primary hover:shadow-sm",
                    selectedRole === portal.role 
                      ? "border-primary bg-primary/10 shadow-sm" 
                      : "border-border/60 bg-background/80 hover:bg-primary/5"
                  )}
                  title={`Log in to ${portal.name}`}
                >
                  <portal.icon className={cn("h-4 w-4", selectedRole === portal.role ? "text-primary" : "text-muted-foreground")} />
                  <span className={cn("text-[11px] font-medium leading-none mt-1", selectedRole === portal.role ? "text-primary" : "text-muted-foreground")}>{portal.label}</span>
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
                <CardTitle className="text-2xl font-bold">{portalTypes.find(p => p.role === selectedRole)?.name} Login</CardTitle>
                <CardDescription>Sign in to access your {portalTypes.find(p => p.role === selectedRole)?.label} account</CardDescription>
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
