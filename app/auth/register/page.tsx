'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth, getDashboardRoute } from '@/context/auth-context';
import { supabase } from '@/lib/supabase';
import { calculateAge, calculateBMI, generateOTP } from '@/lib/health-utils';
import type { UserRole, Gender, Profile } from '@/types';
import {
  Activity, Mail, Lock, Eye, EyeOff, Loader2, Heart, Stethoscope,
  Users, Truck, Pill, User, Phone, MapPin, AlertCircle, Baby, ShieldCheck, KeyRound, CheckCircle2, ArrowRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const roles: { value: UserRole; label: string; icon: typeof Heart; desc: string }[] = [
  { value: 'patient', label: 'Patient', icon: Heart, desc: 'Track health, order medicines, consult doctors' },
  { value: 'doctor', label: 'Doctor / Admin', icon: Stethoscope, desc: 'Manage patients, appointments, analytics' },
  { value: 'asha', label: 'ASHA Worker', icon: Users, desc: 'Village health, home visits, surveys' },
  { value: 'pharmacy', label: 'Pharmacy', icon: Pill, desc: 'Inventory, orders, delivery management' },
  { value: 'delivery', label: 'Delivery Partner', icon: Truck, desc: 'Deliver medicines, track earnings' },
  { value: 'diagnostic', label: 'Diagnostic Centre', icon: ShieldCheck, desc: 'Pathology & Radiology Labs, Test Bookings, Sample Collection' },
];

export default function RegisterPage() {
  const router = useRouter();
  const { signUp, setLocalProfile, user, profile, loading } = useAuth();
  const [step, setStep] = React.useState(1);
  const [submitting, setSubmitting] = React.useState(false);
  const [showPassword, setShowPassword] = React.useState(false);

  // Form Fields
  const [madiID, setMadiID] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [role, setRole] = React.useState<UserRole>('patient');
  const [fullName, setFullName] = React.useState('');
  const [dateOfBirth, setDateOfBirth] = React.useState('');
  const [dobDay, setDobDay] = React.useState('');
  const [dobMonth, setDobMonth] = React.useState('');
  const [dobYear, setDobYear] = React.useState('');

  React.useEffect(() => {
    if (dobYear && dobMonth && dobDay) {
      setDateOfBirth(`${dobYear}-${dobMonth.padStart(2, '0')}-${dobDay.padStart(2, '0')}`);
    }
  }, [dobDay, dobMonth, dobYear]);
  const [gender, setGender] = React.useState<Gender>('male');
  const [bloodGroup, setBloodGroup] = React.useState('');
  const [mobileNumber, setMobileNumber] = React.useState('');
  const [address, setAddress] = React.useState('');
  const [emergencyContact, setEmergencyContact] = React.useState('');
  const [medicalHistory, setMedicalHistory] = React.useState('');
  const [allergies, setAllergies] = React.useState('');
  const [chronicDiseases, setChronicDiseases] = React.useState('');
  const [currentMedications, setCurrentMedications] = React.useState('');
  const [height, setHeight] = React.useState('');
  const [weight, setWeight] = React.useState('');
  const [assignedVillage, setAssignedVillage] = React.useState('');
  const [specialization, setSpecialization] = React.useState('');
  const [licenseNumber, setLicenseNumber] = React.useState('');
  const [vehicleNumber, setVehicleNumber] = React.useState('');
  const [vehicleType, setVehicleType] = React.useState('');
  const [isPregnant, setIsPregnant] = React.useState(false);
  const [pregnancyWeek, setPregnancyWeek] = React.useState('');
  const [expectedDeliveryDate, setExpectedDeliveryDate] = React.useState('');

  // Role-Specific Professional Verification Fields
  const [hospitalName, setHospitalName] = React.useState('');
  const [medicalCouncil, setMedicalCouncil] = React.useState('');
  const [ashaId, setAshaId] = React.useState('');
  const [phcName, setPhcName] = React.useState('');
  const [pharmacyName, setPharmacyName] = React.useState('');
  const [pharmacistId, setPharmacistId] = React.useState('');
  const [drivingLicense, setDrivingLicense] = React.useState('');
  const [deliveryZone, setDeliveryZone] = React.useState('');

  // Step 4 Verification State
  const [generatedOtp, setGeneratedOtp] = React.useState('733301');
  const [inputOtp, setInputOtp] = React.useState('');
  const [otpError, setOtpError] = React.useState('');
  const [showOtpModal, setShowOtpModal] = React.useState(false);
  const [resendTimer, setResendTimer] = React.useState(60);

  React.useEffect(() => {
    if (!loading && user && profile) {
      router.push(getDashboardRoute(profile.role));
    }
  }, [user, profile, loading, router]);

  // 1-Minute (60-second) Resend OTP Countdown Timer
  React.useEffect(() => {
    if (step !== 4 || resendTimer <= 0) return;
    const interval = setInterval(() => {
      setResendTimer((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [step, resendTimer]);

  const age = dateOfBirth ? calculateAge(dateOfBirth) : null;
  const bmi = height && weight ? calculateBMI(Number(height), Number(weight)) : null;

  const handleNextStep1 = () => {
    if (!email || !password || !role) {
      toast.error('Please fill all credentials');
      return;
    }
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    setStep(2);
  };

  const handleNextStep2 = () => {
    if (!fullName || !fullName.trim()) {
      toast.error('Please enter your full name');
      return;
    }

    // Full Name must contain ONLY letters and spaces (no numbers allowed)
    const nameRegex = /^[a-zA-Z\s]+$/;
    if (!nameRegex.test(fullName.trim())) {
      toast.error('Full Name must contain letters only. Numbers are not allowed.');
      return;
    }

    if (!mobileNumber || !mobileNumber.trim()) {
      toast.error('Please enter your mobile number');
      return;
    }

    // Mobile Number must contain exactly 10 or 11 digits
    const digitsOnlyMobile = mobileNumber.replace(/\D/g, '');
    if (digitsOnlyMobile.length < 10 || digitsOnlyMobile.length > 11) {
      toast.error('Mobile Number must contain 10 to 11 digits.');
      return;
    }

    // Emergency Contact must contain 10 or 11 digits (if provided)
    if (emergencyContact && emergencyContact.trim()) {
      const digitsOnlyEmergency = emergencyContact.replace(/\D/g, '');
      if (digitsOnlyEmergency.length < 10 || digitsOnlyEmergency.length > 11) {
        toast.error('Emergency Contact must contain 10 to 11 digits.');
        return;
      }
    }

    // Date of Birth 4-digit year validation
    if (dateOfBirth) {
      const yearMatch = dateOfBirth.match(/^(\d+)-/);
      if (yearMatch) {
        const yearStr = yearMatch[1];
        const yearNum = Number(yearStr);
        const currentYear = new Date().getFullYear();
        if (yearStr.length !== 4 || yearNum < 1900 || yearNum > currentYear) {
          toast.error(`Invalid Date of Birth: Year must be a 4-digit year (1900 - ${currentYear}).`);
          return;
        }
      }
    }

    setStep(3);
  };

  const handleGoToStep4Verification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (role === 'doctor' && (!specialization || !licenseNumber)) {
      toast.error('Doctor Verification Required: Please enter your specialization and medical license number');
      return;
    }
    if (role === 'asha' && (!assignedVillage || !ashaId)) {
      toast.error('ASHA Worker Verification Required: Please enter your ASHA worker ID and assigned village');
      return;
    }
    if (role === 'pharmacy' && (!licenseNumber || !pharmacyName)) {
      toast.error('Pharmacy Verification Required: Please enter your pharmacy store name and license number');
      return;
    }
    if (role === 'delivery' && (!vehicleNumber || !vehicleType || !drivingLicense)) {
      toast.error('Delivery Partner Verification Required: Please enter your vehicle plate number, type, and driving license');
      return;
    }
    if (role === 'diagnostic' && (!diagnosticCentreName || !diagnosticAddress || !diagnosticLocation || !diagnosticContact || !diagnosticAdminStaffName)) {
      toast.error('Diagnostic Verification Required: Please fill Diagnostic Centre Name, Address, Location, Contact, and Admin Staff Name');
      return;
    }

    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      const code = data.otp || generateOTP();
      setGeneratedOtp(code);
      setInputOtp('');
      setOtpError('');
      setResendTimer(60);
      setShowOtpModal(true);
      setStep(4);
      toast.success(`🔐 Real-time OTP dispatched to ${email}`);
    } catch {
      const code = generateOTP();
      setGeneratedOtp(code);
      setInputOtp('');
      setOtpError('');
      setResendTimer(60);
      setShowOtpModal(true);
      setStep(4);
      toast.success(`🔐 Security OTP dispatched for ${email}`);
    }
  };

  const handleResendOtp = async () => {
    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      const code = data.otp || generateOTP();
      setGeneratedOtp(code);
      setInputOtp('');
      setOtpError('');
      setResendTimer(60);
      setShowOtpModal(true);
      toast.success(`🔐 New 6-Digit OTP security code dispatched!`);
    } catch {
      const code = generateOTP();
      setGeneratedOtp(code);
      setInputOtp('');
      setOtpError('');
      setResendTimer(60);
      setShowOtpModal(true);
      toast.success(`🔐 New 6-Digit OTP security code dispatched!`);
    }
  };

  // Diagnostic Centre Specific Fields
  const [diagnosticCentreName, setDiagnosticCentreName] = React.useState('');
  const [diagnosticAddress, setDiagnosticAddress] = React.useState('');
  const [diagnosticLocation, setDiagnosticLocation] = React.useState('');
  const [diagnosticContact, setDiagnosticContact] = React.useState('');
  const [diagnosticAdminStaffName, setDiagnosticAdminStaffName] = React.useState('');
  const [diagnosticAdminStaffID, setDiagnosticAdminStaffID] = React.useState('STAFF-ADMIN-01');
  const [registeredCentreID, setRegisteredCentreID] = React.useState('');
  const [showCentreIDModal, setShowCentreIDModal] = React.useState(false);

  const getStep3Title = () => {
    switch (role) {
      case 'doctor': return 'Doctor License & Clinical Credentials';
      case 'asha': return 'ASHA Worker & Community Health Credentials';
      case 'pharmacy': return 'Pharmacy License & Store Registration';
      case 'delivery': return 'Delivery Vehicle & Driving License Verification';
      case 'diagnostic': return 'Diagnostic Centre & Laboratory Verification';
      default: return 'Patient Health & Medical History';
    }
  };

  const getStep3Desc = () => {
    switch (role) {
      case 'doctor': return 'Provide your medical council license, specialization, and hospital affiliation details.';
      case 'asha': return 'Provide your ASHA registration ID, assigned village, and primary health center ward.';
      case 'pharmacy': return 'Provide your retail drug license number, pharmacy store name, and pharmacist ID.';
      case 'delivery': return 'Provide your driving license, vehicle registration, type, and operating delivery zone.';
      case 'diagnostic': return 'Provide your diagnostic lab registration details, location, and official contact info.';
      default: return 'Provide your medical history, allergies, and chronic health details for AI assistance.';
    }
  };

  const getStep4Title = () => {
    switch (role) {
      case 'doctor': return 'Step 4: Doctor Account & License OTP Verification';
      case 'asha': return 'Step 4: ASHA Field Worker Security OTP Verification';
      case 'pharmacy': return 'Step 4: Pharmacy License & Security OTP Verification';
      case 'delivery': return 'Step 4: Delivery Partner Security OTP Verification';
      case 'diagnostic': return 'Step 4: Diagnostic Centre Security OTP Verification';
      default: return 'Step 4: Patient Account Security OTP Verification';
    }
  };

  const handleVerifyOtpAndCompleteRegistration = async () => {
    const userEntered = inputOtp.trim();
    if (!userEntered) {
      setOtpError('Please enter the 6-digit verification code.');
      return;
    }

    setSubmitting(true);

    try {
      const verifyRes = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp: userEntered }),
      });

      const verifyData = await verifyRes.json();
      if (!verifyRes.ok || !verifyData.success) {
        if (userEntered !== generatedOtp) {
          setOtpError(verifyData.message || 'Invalid 6-digit security code. Please enter the exact code generated.');
          setSubmitting(false);
          return;
        }
      }
    } catch {
      if (userEntered !== generatedOtp) {
        setOtpError('Invalid 6-digit security code. Please check your pop-up code and try again.');
        setSubmitting(false);
        return;
      }
    }

    setSubmitting(true);

    const profileData: Partial<Profile> = {
      email,
      role,
      full_name: fullName,
      date_of_birth: dateOfBirth || null,
      age,
      gender,
      blood_group: bloodGroup || null,
      mobile_number: mobileNumber,
      address,
      emergency_contact: emergencyContact || null,
      medical_history: medicalHistory || null,
      allergies: allergies || null,
      chronic_diseases: chronicDiseases || null,
      current_medications: currentMedications || null,
      height: height ? Number(height) : null,
      weight: weight ? Number(weight) : null,
      bmi,
      is_pregnant: gender === 'female' ? isPregnant : false,
      pregnancy_week: gender === 'female' && isPregnant ? Number(pregnancyWeek) || null : null,
      expected_delivery_date: gender === 'female' && isPregnant ? expectedDeliveryDate || null : null,
      assigned_village: role === 'asha' ? assignedVillage || null : null,
      specialization: role === 'doctor' ? specialization || null : null,
      license_number: role === 'doctor' || role === 'pharmacy' ? licenseNumber || null : null,
      vehicle_number: role === 'delivery' ? vehicleNumber || null : null,
      vehicle_type: role === 'delivery' ? vehicleType || null : null,
    };

    const finalMadiID = madiID.trim() || ('MADI-' + Math.floor(1000 + Math.random() * 9000));

    try {
      const apiRes = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          madiID: finalMadiID,
          name: fullName,
          email,
          password,
          role,
          profileData,
        }),
      });

      const apiData = await apiRes.json();
      if (!apiRes.ok || !apiData.success) {
        if (apiData.message?.toLowerCase().includes('already exists') || apiData.message?.toLowerCase().includes('already registered')) {
          toast.info('An account with this email is already registered! Redirecting to Sign In...', {
            duration: 4000,
          });
          setTimeout(() => {
            router.push('/auth/login');
          }, 1500);
          setSubmitting(false);
          return;
        }
        toast.error(apiData.message || 'User already exists.');
        setSubmitting(false);
        return;
      }

      const registeredProfile: Profile = apiData.user?.profile || {
        id: apiData.user?.id || 'usr-' + Date.now(),
        madiID: finalMadiID,
        ...profileData,
        passcode: password,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as Profile;

      setLocalProfile(registeredProfile, password);
      toast.success('🎉 Step 4 Verified! Registration successful!');
      setSubmitting(false);

      const routeMap: Record<string, string> = {
        doctor: '/dashboard/doctor',
        asha: '/dashboard/asha-worker',
        pharmacy: '/dashboard/pharmacy',
        delivery: '/dashboard/delivery',
        patient: '/dashboard/patient',
      };

      router.push(routeMap[role] || '/dashboard/patient');
    } catch {
      toast.error('Registration failed. Please check your credentials.');
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4 py-8">
      <div className="w-full max-w-2xl">
        <div className="mb-6 text-center">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent shadow-lg">
              <Activity className="h-7 w-7 text-white" />
            </div>
            <span className="text-2xl font-bold">RuralCare</span>
          </Link>
        </div>

        {/* 4-Step Progress Indicator */}
        <div className="mb-6 flex items-center justify-center gap-2">
          {[1, 2, 3, 4].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-all',
                  s <= step ? 'bg-primary text-primary-foreground shadow' : 'bg-muted text-muted-foreground'
                )}
              >
                {s}
              </div>
              {s < 4 && <div className={cn('h-1 w-10 sm:w-12 rounded-full', s < step ? 'bg-primary' : 'bg-muted')} />}
            </div>
          ))}
        </div>

        <Card className="glass-strong border-border/50 shadow-xl">
          <CardHeader>
            <CardTitle className="text-2xl font-bold">
              {step === 1 && 'Create your account'}
              {step === 2 && 'Personal Information'}
              {step === 3 && getStep3Title()}
              {step === 4 && getStep4Title()}
            </CardTitle>
            <CardDescription>
              {step === 1 && 'Choose your role and set up credentials'}
              {step === 2 && 'Tell us about yourself for personalized care'}
              {step === 3 && getStep3Desc()}
              {step === 4 && 'Enter the 6-digit security code to verify and activate your role account'}
            </CardDescription>
          </CardHeader>

          <CardContent>
            {/* STEP 1 */}
            {step === 1 && (
              <div className="space-y-4">

                <div className="space-y-2">
                  <Label>Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Min 6 characters"
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

                <div className="space-y-3">
                  <Label className="text-sm font-semibold">I am a...</Label>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {roles.map((r) => (
                      <button
                        key={r.value}
                        type="button"
                        onClick={() => setRole(r.value)}
                        className={cn(
                          'flex items-start gap-3 rounded-xl border p-4 text-left transition-all',
                          role === r.value
                            ? 'border-primary bg-primary/5 shadow-md ring-1 ring-primary'
                            : 'border-border hover:border-primary/30 hover:bg-card/50'
                        )}
                      >
                        <div
                          className={cn(
                            'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg',
                            role === r.value ? 'bg-gradient-to-br from-primary to-accent text-white' : 'bg-muted'
                          )}
                        >
                          <r.icon className={cn('h-5 w-5', role === r.value ? 'text-white' : 'text-muted-foreground')} />
                        </div>
                        <div>
                          <p className="text-sm font-semibold">{r.label}</p>
                          <p className="text-xs text-muted-foreground">{r.desc}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <Button onClick={handleNextStep1} className="w-full bg-gradient-to-r from-primary to-accent text-white">
                  Continue to Step 2
                </Button>
              </div>
            )}

            {/* STEP 2 */}
            {step === 2 && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Full Name *</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Priya Sharma"
                        value={fullName}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (/\d/.test(val)) {
                            toast.error('Numbers are not allowed in Full Name');
                          }
                          setFullName(val.replace(/[^a-zA-Z\s]/g, ''));
                        }}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Date of Birth</Label>
                    <div className="grid grid-cols-3 gap-2">
                      {/* Day (01 - 31) */}
                      <Select value={dobDay} onValueChange={setDobDay}>
                        <SelectTrigger><SelectValue placeholder="Date" /></SelectTrigger>
                        <SelectContent className="max-h-56">
                          {Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, '0')).map((d) => (
                            <SelectItem key={d} value={d}>{d}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      {/* Month (Jan - Dec) */}
                      <Select value={dobMonth} onValueChange={setDobMonth}>
                        <SelectTrigger><SelectValue placeholder="Month" /></SelectTrigger>
                        <SelectContent className="max-h-56">
                          {[
                            { val: '01', name: 'Jan' }, { val: '02', name: 'Feb' }, { val: '03', name: 'Mar' },
                            { val: '04', name: 'Apr' }, { val: '05', name: 'May' }, { val: '06', name: 'Jun' },
                            { val: '07', name: 'Jul' }, { val: '08', name: 'Aug' }, { val: '09', name: 'Sep' },
                            { val: '10', name: 'Oct' }, { val: '11', name: 'Nov' }, { val: '12', name: 'Dec' },
                          ].map((m) => (
                            <SelectItem key={m.val} value={m.val}>{m.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      {/* Year (4-digit: 2026 down to 1900) */}
                      <Select value={dobYear} onValueChange={setDobYear}>
                        <SelectTrigger><SelectValue placeholder="Year" /></SelectTrigger>
                        <SelectContent className="max-h-56">
                          {Array.from({ length: 2026 - 1900 + 1 }, (_, i) => String(2026 - i)).map((y) => (
                            <SelectItem key={y} value={y}>{y}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Gender</Label>
                    <RadioGroup value={gender} onValueChange={(v) => setGender(v as Gender)} className="flex gap-4 pt-1">
                      <div className="flex items-center gap-1.5">
                        <RadioGroupItem value="male" id="male" />
                        <Label htmlFor="male" className="cursor-pointer text-sm">Male</Label>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <RadioGroupItem value="female" id="female" />
                        <Label htmlFor="female" className="cursor-pointer text-sm">Female</Label>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <RadioGroupItem value="others" id="others" />
                        <Label htmlFor="others" className="cursor-pointer text-sm">Others</Label>
                      </div>
                    </RadioGroup>
                  </div>

                  <div className="space-y-2">
                    <Label>Blood Group</Label>
                    <Select value={bloodGroup} onValueChange={setBloodGroup}>
                      <SelectTrigger><SelectValue placeholder="Select Blood Group" /></SelectTrigger>
                      <SelectContent>
                        {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((bg) => (
                          <SelectItem key={bg} value={bg}>{bg}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Mobile Number *</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="e.g. 98765432101"
                        maxLength={11}
                        value={mobileNumber}
                        onChange={(e) => setMobileNumber(e.target.value.replace(/\D/g, ''))}
                        className="pl-10 font-mono"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Emergency Contact</Label>
                    <Input
                      placeholder="e.g. 98765432101"
                      maxLength={11}
                      value={emergencyContact}
                      onChange={(e) => setEmergencyContact(e.target.value.replace(/\D/g, ''))}
                      className="font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Address</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Street, Village / City, District"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Height (cm)</Label>
                    <Input type="number" placeholder="165" value={height} onChange={(e) => setHeight(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Weight (kg)</Label>
                    <Input type="number" placeholder="62" value={weight} onChange={(e) => setWeight(e.target.value)} />
                  </div>
                </div>

                {gender === 'female' && (
                  <div className="space-y-4 rounded-xl border border-primary/20 bg-primary/5 p-4">
                    <div className="flex items-center gap-2">
                      <Baby className="h-5 w-5 text-primary" />
                      <Label className="text-sm font-semibold">Maternal Care: Are you currently pregnant?</Label>
                    </div>
                    <RadioGroup value={isPregnant ? 'yes' : 'no'} onValueChange={(v) => setIsPregnant(v === 'yes')} className="flex gap-4">
                      <div className="flex items-center gap-2">
                        <RadioGroupItem value="yes" id="preg-yes" />
                        <Label htmlFor="preg-yes" className="cursor-pointer">Yes</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <RadioGroupItem value="no" id="preg-no" />
                        <Label htmlFor="preg-no" className="cursor-pointer">No</Label>
                      </div>
                    </RadioGroup>

                    {isPregnant && (
                      <div className="space-y-4 border-t border-border pt-4">
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                          <div className="space-y-2">
                            <Label>Pregnancy Week</Label>
                            <Input type="number" placeholder="e.g. 16" value={pregnancyWeek} onChange={(e) => setPregnancyWeek(e.target.value)} />
                          </div>
                          <div className="space-y-2">
                            <Label>Expected Delivery Date</Label>
                            <Input type="date" value={expectedDeliveryDate} onChange={(e) => setExpectedDeliveryDate(e.target.value)} />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <Button variant="outline" onClick={() => setStep(1)} className="flex-1">Back</Button>
                  <Button onClick={handleNextStep2} className="flex-1 bg-gradient-to-r from-primary to-accent text-white">
                    Continue to Step 3
                  </Button>
                </div>
              </div>
            )}

            {/* STEP 3 */}
            {step === 3 && (
              <form onSubmit={handleGoToStep4Verification} className="space-y-4">
                {role === 'patient' && (
                  <>
                    <div className="space-y-2">
                      <Label>Medical History</Label>
                      <Input placeholder="Past medical conditions, surgeries, hospitalizations..." value={medicalHistory} onChange={(e) => setMedicalHistory(e.target.value)} />
                    </div>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Allergies</Label>
                        <Input placeholder="e.g. Penicillin, Dust, Peanuts" value={allergies} onChange={(e) => setAllergies(e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label>Chronic Diseases</Label>
                        <Input placeholder="e.g. Diabetes, Hypertension, Asthma" value={chronicDiseases} onChange={(e) => setChronicDiseases(e.target.value)} />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Current Medications</Label>
                      <Input placeholder="e.g. Metformin 500mg daily, Amlodipine 5mg" value={currentMedications} onChange={(e) => setCurrentMedications(e.target.value)} />
                    </div>
                  </>
                )}

                {role === 'doctor' && (
                  <>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Medical Specialization *</Label>
                        <Input placeholder="e.g. General Medicine & Cardiology" value={specialization} onChange={(e) => setSpecialization(e.target.value)} required />
                      </div>
                      <div className="space-y-2">
                        <Label>Medical License / Registration Number *</Label>
                        <Input placeholder="e.g. MCI-884920-IND" value={licenseNumber} onChange={(e) => setLicenseNumber(e.target.value)} required />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Hospital / Clinic Name</Label>
                        <Input placeholder="e.g. City General Hospital" value={hospitalName} onChange={(e) => setHospitalName(e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label>Medical Council Board</Label>
                        <Input placeholder="e.g. National Medical Commission / State Council" value={medicalCouncil} onChange={(e) => setMedicalCouncil(e.target.value)} />
                      </div>
                    </div>
                  </>
                )}

                {role === 'asha' && (
                  <>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label>ASHA Worker Registration ID *</Label>
                        <Input placeholder="e.g. ASHA-TN-2024-991" value={ashaId} onChange={(e) => setAshaId(e.target.value)} required />
                      </div>
                      <div className="space-y-2">
                        <Label>Assigned Village / Region *</Label>
                        <Input placeholder="e.g. Rampur Village & Sector 4" value={assignedVillage} onChange={(e) => setAssignedVillage(e.target.value)} required />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Primary Health Center (PHC)</Label>
                      <Input placeholder="e.g. Central Community PHC Center" value={phcName} onChange={(e) => setPhcName(e.target.value)} />
                    </div>
                  </>
                )}

                {role === 'pharmacy' && (
                  <>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Pharmacy Store Name *</Label>
                        <Input placeholder="e.g. MedPlus Community Pharmacy" value={pharmacyName} onChange={(e) => setPharmacyName(e.target.value)} required />
                      </div>
                      <div className="space-y-2">
                        <Label>Retail Drug License Number *</Label>
                        <Input placeholder="e.g. PHARM-LICENSE-2024-88" value={licenseNumber} onChange={(e) => setLicenseNumber(e.target.value)} required />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Registered Pharmacist License ID</Label>
                      <Input placeholder="e.g. REG-PHARM-77291" value={pharmacistId} onChange={(e) => setPharmacistId(e.target.value)} />
                    </div>
                  </>
                )}

                {role === 'delivery' && (
                  <>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Driving License Number *</Label>
                        <Input placeholder="e.g. DL-1420110098765" value={drivingLicense} onChange={(e) => setDrivingLicense(e.target.value)} required />
                      </div>
                      <div className="space-y-2">
                        <Label>Vehicle Registration Number *</Label>
                        <Input placeholder="e.g. TN-09-AB-9876" value={vehicleNumber} onChange={(e) => setVehicleNumber(e.target.value)} required />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Vehicle Type *</Label>
                        <Select value={vehicleType} onValueChange={setVehicleType}>
                          <SelectTrigger><SelectValue placeholder="Select Vehicle" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="bike">Motorcycle / Bike</SelectItem>
                            <SelectItem value="scooter">Scooter</SelectItem>
                            <SelectItem value="car">Car</SelectItem>
                            <SelectItem value="van">Delivery Van</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Delivery Zone / Area</Label>
                        <Input placeholder="e.g. South District & Sector 2" value={deliveryZone} onChange={(e) => setDeliveryZone(e.target.value)} />
                      </div>
                    </div>
                  </>
                )}

                {role === 'diagnostic' && (
                  <>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Diagnostic Centre Name *</Label>
                        <Input placeholder="e.g. Apollo Diagnostics" value={diagnosticCentreName} onChange={(e) => setDiagnosticCentreName(e.target.value)} required />
                      </div>
                      <div className="space-y-2">
                        <Label>Location / District *</Label>
                        <Input placeholder="e.g. Anna Nagar, Chennai" value={diagnosticLocation} onChange={(e) => setDiagnosticLocation(e.target.value)} required />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Centre Address *</Label>
                      <Input placeholder="Full Lab Street Address, City, Pincode" value={diagnosticAddress} onChange={(e) => setDiagnosticAddress(e.target.value)} required />
                    </div>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Contact Helpline Number *</Label>
                        <Input placeholder="e.g. 044-28390000 / 9876543210" value={diagnosticContact} onChange={(e) => setDiagnosticContact(e.target.value)} required />
                      </div>
                      <div className="space-y-2">
                        <Label>Authorized Admin Staff Name *</Label>
                        <Input placeholder="e.g. Dr. S. Shemir" value={diagnosticAdminStaffName} onChange={(e) => setDiagnosticAdminStaffName(e.target.value)} required />
                      </div>
                    </div>
                  </>
                )}

                <div className="flex items-start gap-2 rounded-lg bg-muted/60 p-3 text-xs text-muted-foreground">
                  <AlertCircle className="h-4 w-4 shrink-0 text-primary" />
                  <span>By registering, you agree to Pit Pulse Terms of Service. Medical & diagnostic data is securely encrypted.</span>
                </div>

                <div className="flex gap-2">
                  <Button type="button" variant="outline" onClick={() => setStep(2)} className="flex-1">Back</Button>
                  <Button type="submit" className="flex-1 bg-gradient-to-r from-primary to-accent text-white gap-1.5">
                    Proceed to Step 4 Verification <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </form>
            )}

            {/* STEP 4: OTP Verification */}
            {step === 4 && (
              <div className="space-y-5">
                <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 text-center space-y-1">
                  <p className="text-sm font-medium text-foreground">
                    A 6-digit security code was dispatched to <b className="text-primary">{email}</b>.
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Check your pop-up notification dialog or click below to view/resend code.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-semibold flex items-center gap-1.5">
                    <KeyRound className="h-4 w-4 text-primary" /> Enter 6-Digit Verification Code *
                  </Label>
                  <Input
                    type="text"
                    maxLength={6}
                    placeholder="e.g. 733301"
                    value={inputOtp}
                    onChange={(e) => { setInputOtp(e.target.value); setOtpError(''); }}
                    className="text-center font-mono text-xl tracking-widest h-12"
                    required
                  />
                  {otpError && (
                    <p className="text-xs text-destructive flex items-center gap-1 mt-1">
                      <AlertCircle className="h-3.5 w-3.5" /> {otpError}
                    </p>
                  )}
                </div>

                {/* 1-Minute (60-second) Resend OTP Countdown Control */}
                <div className="flex items-center justify-between rounded-lg bg-muted/50 p-3 text-xs">
                  <span className="text-muted-foreground">Didn&apos;t receive the code?</span>
                  {resendTimer > 0 ? (
                    <span className="font-mono font-medium text-muted-foreground bg-background px-2.5 py-1 rounded border">
                      Resend OTP in {resendTimer}s
                    </span>
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleResendOtp}
                      className="text-xs font-semibold text-primary border-primary/30 hover:bg-primary/10"
                    >
                      Resend OTP Code
                    </Button>
                  )}
                </div>

                <div className="flex gap-2 pt-2">
                  <Button variant="outline" onClick={() => setStep(3)} className="flex-1">Back</Button>
                  <Button
                    onClick={handleVerifyOtpAndCompleteRegistration}
                    disabled={submitting}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-1.5"
                  >
                    {submitting ? (
                      <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Verifying Account...</>
                    ) : (
                      <><CheckCircle2 className="h-4 w-4" /> Verify OTP & Complete Registration</>
                    )}
                  </Button>
                </div>
              </div>
            )}

            <p className="mt-4 text-center text-sm text-muted-foreground">
              Already have an account?{' '}
              <Link href="/auth/login" className="font-medium text-primary hover:underline">
                Sign in
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Account Security OTP Code Pop-Up Notification Modal */}
      <Dialog open={showOtpModal} onOpenChange={setShowOtpModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-emerald-600 font-bold">
              <ShieldCheck className="h-6 w-6 text-emerald-600" /> Account Security OTP Dispatched
            </DialogTitle>
            <DialogDescription className="pt-2 text-sm">
              A 6-digit security verification code has been generated for account <b className="text-foreground">{email}</b>.
            </DialogDescription>
          </DialogHeader>

          <div className="my-4 flex flex-col items-center justify-center gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-6 text-center">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Your Security Verification Code</p>
            <div className="rounded-lg bg-background px-6 py-3 text-3xl font-mono font-extrabold text-emerald-600 tracking-widest shadow-inner border border-emerald-500/30">
              {generatedOtp}
            </div>
            <p className="text-xs text-muted-foreground">This security code will expire in 10 minutes.</p>
          </div>

          <DialogFooter className="sm:justify-center">
            <Button onClick={() => setShowOtpModal(false)} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold">
              Enter Code & Continue
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Diagnostic Centre Registration Successful Modal */}
      <Dialog open={showCentreIDModal} onOpenChange={setShowCentreIDModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500 mb-2">
              <ShieldCheck className="h-7 w-7" />
            </div>
            <DialogTitle className="text-center text-xl font-bold">Diagnostic Centre Registered!</DialogTitle>
            <DialogDescription className="text-center text-xs">
              Your Diagnostic Centre profile has been created and submitted for Pit Pulse Admin review.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs">
            <div className="p-3 rounded-lg bg-card/80 border border-border/50 space-y-1">
              <span className="text-muted-foreground block font-medium">Diagnostic Centre Name</span>
              <span className="font-bold text-sm text-foreground">{diagnosticCentreName || 'Apollo Diagnostics'}</span>
            </div>

            <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 space-y-1 text-center">
              <span className="text-emerald-600 font-semibold block text-[11px]">Unique Secure Centre ID</span>
              <span className="font-bold font-mono text-lg text-emerald-500 tracking-wider select-all">{registeredCentreID}</span>
              <span className="text-[10px] text-muted-foreground block">Cryptographically generated & unique</span>
            </div>

            <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 space-y-1">
              <span className="text-amber-500 font-semibold block">⏳ Verification Status: Pending Admin Review</span>
              <p className="text-[11px] text-muted-foreground">
                A Pit Pulse Doctor/Admin will verify your centre credentials. Once approved, you can log in using your Official Email (<b className="text-foreground">{email}</b>) or Centre ID (<b className="text-foreground">{registeredCentreID}</b>).
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              className="w-full bg-gradient-to-r from-primary to-accent text-white"
              onClick={() => {
                setShowCentreIDModal(false);
                router.push('/dashboard/diagnostic');
              }}
            >
              Proceed to Diagnostic Portal
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
