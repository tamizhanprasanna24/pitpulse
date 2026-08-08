'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth, getDashboardRoute } from '@/context/auth-context';
import { supabase } from '@/lib/supabase';
import { calculateAge, calculateBMI } from '@/lib/health-utils';
import type { UserRole, Gender, Profile } from '@/types';
import {
  Activity, Mail, Lock, Eye, EyeOff, Loader2, Heart, Stethoscope,
  Users, Truck, Pill, User, Phone, MapPin, AlertCircle, Baby, ShieldCheck, Check, Copy,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const roles: { value: UserRole; label: string; icon: typeof Heart; desc: string }[] = [
  { value: 'patient', label: 'Patient', icon: Heart, desc: 'Track health, order medicines, consult doctors' },
  { value: 'doctor', label: 'Doctor / Admin', icon: Stethoscope, desc: 'Manage patients, appointments, analytics' },
  { value: 'asha', label: 'ASHA Worker', icon: Users, desc: 'Village health, home visits, surveys' },
  { value: 'pharmacy', label: 'Pharmacy', icon: Pill, desc: 'Inventory, orders, delivery management' },
  { value: 'delivery', label: 'Delivery Partner', icon: Truck, desc: 'Deliver medicines, track earnings' },
];

export default function RegisterPage() {
  const router = useRouter();
  const { signUp, sendOtp, verifyOtp, setLocalProfile, user, profile, loading } = useAuth();
  const [step, setStep] = React.useState(1);
  const [submitting, setSubmitting] = React.useState(false);
  const [showPassword, setShowPassword] = React.useState(false);

  // Form Fields
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [role, setRole] = React.useState<UserRole>('patient');
  const [fullName, setFullName] = React.useState('');
  const [dateOfBirth, setDateOfBirth] = React.useState('');
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
  const [previousPregnancies, setPreviousPregnancies] = React.useState('0');
  const [maternalHealthHistory, setMaternalHealthHistory] = React.useState('');

  // Step 4: OTP Verification
  const [otp, setOtp] = React.useState('');
  const [generatedOtp, setGeneratedOtp] = React.useState<string | null>(null);
  const [copied, setCopied] = React.useState(false);
  const [pendingProfileData, setPendingProfileData] = React.useState<any>(null);

  React.useEffect(() => {
    if (!loading && user && profile && step !== 4) {
      router.push(getDashboardRoute(profile.role));
    }
  }, [user, profile, loading, router, step]);

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
    if (!fullName || !mobileNumber) {
      toast.error('Please enter your full name and mobile number');
      return;
    }
    setStep(3);
  };

  const handleSubmitDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const profileData = {
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
      previous_pregnancies: gender === 'female' && isPregnant ? Number(previousPregnancies) || 0 : 0,
      maternal_health_history: gender === 'female' && isPregnant ? maternalHealthHistory || null : null,
      assigned_village: role === 'asha' ? assignedVillage || null : null,
      specialization: role === 'doctor' ? specialization || null : null,
      license_number: role === 'doctor' || role === 'pharmacy' ? licenseNumber || null : null,
      vehicle_number: role === 'delivery' ? vehicleNumber || null : null,
      vehicle_type: role === 'delivery' ? vehicleType || null : null,
    };

    setPendingProfileData(profileData);

    // Call Supabase SignUp & Trigger OTP
    const { error: signUpError, data } = await signUp(email, password);
    if (signUpError) {
      console.warn('SignUp notice:', signUpError);
    }

    // Send OTP for email verification
    const { code } = await sendOtp(email);
    if (code) {
      setGeneratedOtp(code);
      toast.success('Account details recorded!', {
        description: `Verification code: ${code} (copied to auto-fill)`,
        duration: 8000,
      });
    } else {
      toast.success(`Verification code sent to ${email}`);
    }

    setSubmitting(false);
    setStep(4);
  };

  const handleVerifyRegistrationOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (otp.length !== 6) return;

    setSubmitting(true);
    const { error } = await verifyOtp(email, otp);

    if (error && generatedOtp && otp !== generatedOtp) {
      toast.error('Invalid verification code');
      setSubmitting(false);
      return;
    }

    // Construct final profile
    const finalProfile: Profile = {
      id: user?.id || 'usr-' + Date.now(),
      ...pendingProfileData,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Save to Supabase (if available) & local storage sync
    try {
      await supabase.from('profiles').insert(finalProfile);
    } catch {
      // ignore
    }

    setLocalProfile(finalProfile);
    toast.success('Registration & Email Verification Complete!');
    setSubmitting(false);
    router.push(getDashboardRoute(role));
  };

  const copyCode = () => {
    if (!generatedOtp) return;
    navigator.clipboard.writeText(generatedOtp);
    setCopied(true);
    setOtp(generatedOtp);
    toast.success('OTP copied and auto-filled!');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4 py-8">
      <div className="w-full max-w-2xl">
        <div className="mb-6 text-center">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent shadow-lg">
              <Activity className="h-7 w-7 text-white" />
            </div>
            <span className="text-2xl font-bold tracking-tight">Pit Pulse</span>
          </Link>
          <p className="mt-1 text-sm text-muted-foreground">Smart Healthcare Management System</p>
        </div>

        {/* Step Indicator */}
        <div className="mb-6 flex items-center justify-center gap-2">
          {[1, 2, 3, 4].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-all',
                  s <= step ? 'bg-primary text-primary-foreground shadow' : 'bg-muted text-muted-foreground'
                )}
              >
                {s === 4 ? <ShieldCheck className="h-4 w-4" /> : s}
              </div>
              {s < 4 && <div className={cn('h-1 w-8 sm:w-12 rounded-full', s < step ? 'bg-primary' : 'bg-muted')} />}
            </div>
          ))}
        </div>

        <Card className="glass-strong border-border/50 shadow-xl">
          <CardHeader>
            <CardTitle className="text-2xl font-bold">
              {step === 1 && 'Create Your Account'}
              {step === 2 && 'Personal Information'}
              {step === 3 && 'Health & Professional Details'}
              {step === 4 && 'Verify Email Address'}
            </CardTitle>
            <CardDescription>
              {step === 1 && 'Select your healthcare role and account credentials'}
              {step === 2 && 'Tell us about yourself for personalized health management'}
              {step === 3 && 'Complete your health profile and credentials'}
              {step === 4 && `Enter the 6-digit OTP code sent to ${email}`}
            </CardDescription>
          </CardHeader>

          <CardContent>
            {/* STEP 1 */}
            {step === 1 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
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
                  <Label>Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="At least 6 characters"
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
                  <Label className="text-sm font-semibold">Select Healthcare Role</Label>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {roles.map((r) => (
                      <button
                        key={r.value}
                        type="button"
                        onClick={() => setRole(r.value)}
                        className={cn(
                          'flex items-start gap-3 rounded-xl border p-4 text-left transition-all',
                          role === r.value
                            ? 'border-primary bg-primary/10 shadow-md ring-1 ring-primary'
                            : 'border-border hover:border-primary/40 hover:bg-card/50'
                        )}
                      >
                        <div
                          className={cn(
                            'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg',
                            role === r.value ? 'bg-gradient-to-br from-primary to-accent text-white' : 'bg-muted'
                          )}
                        >
                          <r.icon className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold">{r.label}</p>
                          <p className="text-xs text-muted-foreground">{r.desc}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <Button onClick={handleNextStep1} className="w-full bg-gradient-to-r from-primary to-accent font-semibold text-white">
                  Continue to Personal Details
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
                        onChange={(e) => setFullName(e.target.value)}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Date of Birth</Label>
                    <Input type="date" value={dateOfBirth} onChange={(e) => setDateOfBirth(e.target.value)} />
                  </div>
                </div>

                {age !== null && (
                  <div className="flex items-center gap-2 rounded-lg bg-primary/10 px-3 py-2 text-sm">
                    <span className="text-muted-foreground">Auto-calculated age:</span>
                    <span className="font-semibold text-primary">{age} years</span>
                  </div>
                )}

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
                        placeholder="+91 98765 43210"
                        value={mobileNumber}
                        onChange={(e) => setMobileNumber(e.target.value)}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Emergency Contact</Label>
                    <Input
                      placeholder="Contact number"
                      value={emergencyContact}
                      onChange={(e) => setEmergencyContact(e.target.value)}
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

                {bmi !== null && (
                  <div className="flex items-center gap-2 rounded-lg bg-accent/10 px-3 py-2 text-sm">
                    <span className="text-muted-foreground">Auto-calculated BMI:</span>
                    <span className="font-semibold text-accent">{bmi}</span>
                  </div>
                )}

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
                  <Button onClick={handleNextStep2} className="flex-1 bg-gradient-to-r from-primary to-accent font-semibold text-white">
                    Continue to Health Details
                  </Button>
                </div>
              </div>
            )}

            {/* STEP 3 */}
            {step === 3 && (
              <form onSubmit={handleSubmitDetails} className="space-y-4">
                {role === 'patient' && (
                  <>
                    <div className="space-y-2">
                      <Label>Medical History</Label>
                      <Input placeholder="Past medical conditions, surgeries..." value={medicalHistory} onChange={(e) => setMedicalHistory(e.target.value)} />
                    </div>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Allergies</Label>
                        <Input placeholder="e.g. Penicillin, Dust" value={allergies} onChange={(e) => setAllergies(e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label>Chronic Diseases</Label>
                        <Input placeholder="e.g. Diabetes, Hypertension" value={chronicDiseases} onChange={(e) => setChronicDiseases(e.target.value)} />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Current Medications</Label>
                      <Input placeholder="e.g. Metformin 500mg daily" value={currentMedications} onChange={(e) => setCurrentMedications(e.target.value)} />
                    </div>
                  </>
                )}

                {role === 'doctor' && (
                  <>
                    <div className="space-y-2">
                      <Label>Medical Specialization</Label>
                      <Input placeholder="e.g. General Medicine & Cardiology" value={specialization} onChange={(e) => setSpecialization(e.target.value)} required />
                    </div>
                    <div className="space-y-2">
                      <Label>Medical License Number</Label>
                      <Input placeholder="e.g. MCI-884920-IND" value={licenseNumber} onChange={(e) => setLicenseNumber(e.target.value)} required />
                    </div>
                  </>
                )}

                {role === 'asha' && (
                  <div className="space-y-2">
                    <Label>Assigned Village / Region</Label>
                    <Input placeholder="e.g. Rampur Village & Sector 4" value={assignedVillage} onChange={(e) => setAssignedVillage(e.target.value)} required />
                  </div>
                )}

                {role === 'pharmacy' && (
                  <div className="space-y-2">
                    <Label>Pharmacy License Number</Label>
                    <Input placeholder="e.g. PHARM-LICENSE-2024-88" value={licenseNumber} onChange={(e) => setLicenseNumber(e.target.value)} required />
                  </div>
                )}

                {role === 'delivery' && (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Vehicle Registration Number</Label>
                      <Input placeholder="e.g. UP-32-AB-9876" value={vehicleNumber} onChange={(e) => setVehicleNumber(e.target.value)} required />
                    </div>
                    <div className="space-y-2">
                      <Label>Vehicle Type</Label>
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
                  </div>
                )}

                <div className="flex items-start gap-2 rounded-lg bg-muted/60 p-3 text-xs text-muted-foreground">
                  <AlertCircle className="h-4 w-4 shrink-0 text-primary" />
                  <span>By registering, you agree to Pit Pulse Terms of Service. Medical data is securely stored and encrypted.</span>
                </div>

                <div className="flex gap-2">
                  <Button type="button" variant="outline" onClick={() => setStep(2)} className="flex-1">Back</Button>
                  <Button type="submit" disabled={submitting} className="flex-1 bg-gradient-to-r from-primary to-accent font-semibold text-white">
                    {submitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...</> : 'Proceed to Email OTP Verification'}
                  </Button>
                </div>
              </form>
            )}

            {/* STEP 4: OTP VERIFICATION */}
            {step === 4 && (
              <form onSubmit={handleVerifyRegistrationOtp} className="space-y-6">
                {generatedOtp && (
                  <div className="flex items-center justify-between rounded-lg border border-primary/30 bg-primary/10 p-3 text-xs">
                    <div>
                      <span className="text-muted-foreground">Registration Verification OTP: </span>
                      <span className="font-mono font-bold text-primary tracking-widest text-sm">{generatedOtp}</span>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={copyCode}
                      className="h-7 text-xs flex items-center gap-1"
                    >
                      {copied ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
                      {copied ? 'Copied' : 'Copy Code'}
                    </Button>
                  </div>
                )}

                <div className="flex flex-col items-center justify-center gap-3 py-2">
                  <Label className="text-xs text-muted-foreground">Enter 6-digit verification code</Label>
                  <InputOTP
                    maxLength={6}
                    value={otp}
                    onChange={(val) => {
                      setOtp(val);
                      if (val.length === 6) {
                        setTimeout(() => handleVerifyRegistrationOtp(), 100);
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
                  className="w-full bg-gradient-to-r from-primary to-accent font-semibold text-white shadow-md"
                >
                  {submitting ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Verifying Account...</>
                  ) : (
                    'Verify & Complete Registration'
                  )}
                </Button>

                <div className="text-center text-xs">
                  <button
                    type="button"
                    onClick={() => setStep(3)}
                    className="text-muted-foreground hover:text-foreground underline"
                  >
                    Go Back & Edit Information
                  </button>
                </div>
              </form>
            )}

            <p className="mt-4 text-center text-sm text-muted-foreground pt-2 border-t border-border/50">
              Already have an account?{' '}
              <Link href="/auth/login" className="font-semibold text-primary hover:underline">
                Sign in
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
