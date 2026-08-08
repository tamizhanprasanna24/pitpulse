'use client';

import * as React from 'react';
import { useAuth } from '@/context/auth-context';
import { supabase } from '@/lib/supabase';
import { DashboardShell } from '@/components/dashboard/shell';
import { calculateAge, calculateBMI, getInitials } from '@/lib/health-utils';
import type { Profile, Gender } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  User, Mail, Phone, MapPin, Calendar, Heart, Shield,
  Edit3, Save, Loader2, AlertCircle, Baby, Activity, Pill,
} from 'lucide-react';
import { toast } from 'sonner';

export default function PatientProfilePage() {
  const { profile, setLocalProfile, refreshProfile } = useAuth();
  const [editing, setEditing] = React.useState(false);
  const [saving, setSaving] = React.useState(false);

  // Form State
  const [fullName, setFullName] = React.useState('');
  const [dateOfBirth, setDateOfBirth] = React.useState('');
  const [gender, setGender] = React.useState<Gender>('female');
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
  const [isPregnant, setIsPregnant] = React.useState(false);
  const [pregnancyWeek, setPregnancyWeek] = React.useState('');
  const [expectedDeliveryDate, setExpectedDeliveryDate] = React.useState('');

  React.useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '');
      setDateOfBirth(profile.date_of_birth || '');
      setGender(profile.gender || 'female');
      setBloodGroup(profile.blood_group || 'O+');
      setMobileNumber(profile.mobile_number || '');
      setAddress(profile.address || '');
      setEmergencyContact(profile.emergency_contact || '');
      setMedicalHistory(profile.medical_history || '');
      setAllergies(profile.allergies || '');
      setChronicDiseases(profile.chronic_diseases || '');
      setCurrentMedications(profile.current_medications || '');
      setHeight(profile.height ? String(profile.height) : '');
      setWeight(profile.weight ? String(profile.weight) : '');
      setIsPregnant(profile.is_pregnant || false);
      setPregnancyWeek(profile.pregnancy_week ? String(profile.pregnancy_week) : '');
      setExpectedDeliveryDate(profile.expected_delivery_date || '');
    }
  }, [profile]);

  const activeProfile = profile || {
    id: 'guest',
    email: 'patient@pitpulse.org',
    role: 'patient',
    full_name: 'Priya Sharma',
    date_of_birth: '1995-05-15',
    age: 31,
    gender: 'female',
    blood_group: 'O+',
    mobile_number: '+91 98765 43210',
    address: 'Flat 402, Green Valley Apartments, Rampur',
    emergency_contact: '+91 98765 00000',
    medical_history: 'Mild asthma, allergic to penicillin',
    allergies: 'Penicillin',
    chronic_diseases: 'Asthma',
    current_medications: 'Salbutamol Inhaler (as needed)',
    height: 162,
    weight: 58,
    bmi: 22.1,
    is_pregnant: true,
    pregnancy_week: 24,
    expected_delivery_date: '2026-11-20',
  };

  const age = dateOfBirth ? calculateAge(dateOfBirth) : activeProfile.age;
  const bmi = height && weight ? calculateBMI(Number(height), Number(weight)) : activeProfile.bmi;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const updatedProfileData: Partial<Profile> = {
      full_name: fullName,
      date_of_birth: dateOfBirth || null,
      age: age || null,
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
      bmi: bmi ? Number(bmi) : null,
      is_pregnant: gender === 'female' ? isPregnant : false,
      pregnancy_week: gender === 'female' && isPregnant ? Number(pregnancyWeek) || null : null,
      expected_delivery_date: gender === 'female' && isPregnant ? expectedDeliveryDate || null : null,
      updated_at: new Date().toISOString(),
    };

    try {
      if (profile && profile.id && !profile.id.startsWith('demo-')) {
        await supabase.from('profiles').update(updatedProfileData).eq('id', profile.id);
      }
    } catch {
      // Fallback
    }

    const merged = { ...activeProfile, ...updatedProfileData } as Profile;
    setLocalProfile(merged);
    setSaving(false);
    setEditing(false);
    toast.success('Patient profile updated successfully!');
  };

  return (
    <DashboardShell title="Patient Profile" description="View and manage your health records, emergency contacts, and personal information">
      <div className="space-y-6 max-w-5xl mx-auto">
        {/* Profile Overview Banner */}
        <Card className="glass-strong border-primary/20 shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-primary/20 via-accent/15 to-primary/5 p-6 sm:p-8 border-b border-border/50">
            <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-6">
              <div className="flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
                <Avatar className="h-24 w-24 ring-4 ring-background shadow-2xl">
                  <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-white text-3xl font-extrabold">
                    {getInitials(activeProfile.full_name || 'Patient')}
                  </AvatarFallback>
                </Avatar>

                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                    <h1 className="text-2xl font-bold tracking-tight text-foreground">
                      {activeProfile.full_name}
                    </h1>
                    <Badge className="bg-primary/20 text-primary hover:bg-primary/30 capitalize text-xs">
                      {activeProfile.role} Portal
                    </Badge>
                    {activeProfile.is_pregnant && (
                      <Badge className="bg-rose-500/20 text-rose-600 dark:text-rose-400 text-xs">
                        <Baby className="mr-1 h-3 w-3 inline" /> Pregnant ({activeProfile.pregnancy_week}w)
                      </Badge>
                    )}
                  </div>

                  <p className="text-sm text-muted-foreground flex items-center justify-center sm:justify-start gap-1.5">
                    <Mail className="h-3.5 w-3.5" /> {activeProfile.email}
                  </p>
                  <p className="text-xs text-muted-foreground flex items-center justify-center sm:justify-start gap-1.5">
                    <Phone className="h-3.5 w-3.5" /> {activeProfile.mobile_number || 'No mobile added'}
                  </p>
                </div>
              </div>

              <Button
                onClick={() => setEditing(!editing)}
                variant={editing ? 'secondary' : 'default'}
                className={editing ? '' : 'bg-gradient-to-r from-primary to-accent text-white shadow-md'}
              >
                {editing ? (
                  'Cancel Editing'
                ) : (
                  <>
                    <Edit3 className="mr-2 h-4 w-4" /> Edit Profile
                  </>
                )}
              </Button>
            </div>
          </div>
        </Card>

        {/* Form or View Section */}
        <form onSubmit={handleSave} className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Personal Details */}
            <Card className="glass border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <User className="h-4 w-4 text-primary" /> Personal Information
                </CardTitle>
                <CardDescription>Demographics and contact details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Full Name</Label>
                  {editing ? (
                    <Input value={fullName} onChange={(e) => setFullName(e.target.value)} required />
                  ) : (
                    <p className="text-sm font-medium text-foreground bg-muted/40 p-2.5 rounded-lg">{activeProfile.full_name || 'N/A'}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Date of Birth</Label>
                    {editing ? (
                      <Input type="date" value={dateOfBirth} onChange={(e) => setDateOfBirth(e.target.value)} />
                    ) : (
                      <p className="text-sm font-medium text-foreground bg-muted/40 p-2.5 rounded-lg">{activeProfile.date_of_birth || 'N/A'}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>Age</Label>
                    <p className="text-sm font-medium text-primary bg-primary/10 p-2.5 rounded-lg">{age ? `${age} years` : 'N/A'}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Gender</Label>
                    {editing ? (
                      <RadioGroup value={gender} onValueChange={(v) => setGender(v as Gender)} className="flex gap-3 pt-1">
                        <div className="flex items-center gap-1">
                          <RadioGroupItem value="male" id="g-male" />
                          <Label htmlFor="g-male" className="text-xs cursor-pointer">Male</Label>
                        </div>
                        <div className="flex items-center gap-1">
                          <RadioGroupItem value="female" id="g-female" />
                          <Label htmlFor="g-female" className="text-xs cursor-pointer">Female</Label>
                        </div>
                      </RadioGroup>
                    ) : (
                      <p className="text-sm font-medium text-foreground bg-muted/40 p-2.5 rounded-lg capitalize">{activeProfile.gender || 'N/A'}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Blood Group</Label>
                    {editing ? (
                      <Select value={bloodGroup} onValueChange={setBloodGroup}>
                        <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                        <SelectContent>
                          {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((bg) => (
                            <SelectItem key={bg} value={bg}>{bg}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <p className="text-sm font-bold text-destructive bg-destructive/10 p-2.5 rounded-lg">{activeProfile.blood_group || 'N/A'}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Mobile Number</Label>
                  {editing ? (
                    <Input value={mobileNumber} onChange={(e) => setMobileNumber(e.target.value)} required />
                  ) : (
                    <p className="text-sm font-medium text-foreground bg-muted/40 p-2.5 rounded-lg">{activeProfile.mobile_number || 'N/A'}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Emergency Contact</Label>
                  {editing ? (
                    <Input value={emergencyContact} onChange={(e) => setEmergencyContact(e.target.value)} />
                  ) : (
                    <p className="text-sm font-semibold text-rose-600 dark:text-rose-400 bg-rose-500/10 p-2.5 rounded-lg">{activeProfile.emergency_contact || 'N/A'}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Address</Label>
                  {editing ? (
                    <Input value={address} onChange={(e) => setAddress(e.target.value)} />
                  ) : (
                    <p className="text-sm font-medium text-foreground bg-muted/40 p-2.5 rounded-lg">{activeProfile.address || 'N/A'}</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Physical Vitals & Medical Records */}
            <div className="space-y-6">
              <Card className="glass border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Activity className="h-4 w-4 text-accent" /> Physical Measurements
                  </CardTitle>
                  <CardDescription>Body height, weight, and calculated BMI</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Height (cm)</Label>
                      {editing ? (
                        <Input type="number" value={height} onChange={(e) => setHeight(e.target.value)} />
                      ) : (
                        <p className="text-sm font-medium text-foreground bg-muted/40 p-2.5 rounded-lg">{activeProfile.height ? `${activeProfile.height} cm` : 'N/A'}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label>Weight (kg)</Label>
                      {editing ? (
                        <Input type="number" value={weight} onChange={(e) => setWeight(e.target.value)} />
                      ) : (
                        <p className="text-sm font-medium text-foreground bg-muted/40 p-2.5 rounded-lg">{activeProfile.weight ? `${activeProfile.weight} kg` : 'N/A'}</p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Calculated BMI</Label>
                    <p className="text-sm font-bold text-accent bg-accent/10 p-2.5 rounded-lg">
                      {bmi ? `${bmi} kg/m²` : 'N/A'}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Pill className="h-4 w-4 text-primary" /> Medical Information
                  </CardTitle>
                  <CardDescription>History, allergies, and current prescriptions</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Medical History</Label>
                    {editing ? (
                      <Input value={medicalHistory} onChange={(e) => setMedicalHistory(e.target.value)} />
                    ) : (
                      <p className="text-sm font-medium text-foreground bg-muted/40 p-2.5 rounded-lg">{activeProfile.medical_history || 'None reported'}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Allergies</Label>
                    {editing ? (
                      <Input value={allergies} onChange={(e) => setAllergies(e.target.value)} />
                    ) : (
                      <p className="text-sm font-medium text-destructive bg-destructive/10 p-2.5 rounded-lg">{activeProfile.allergies || 'None reported'}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Chronic Conditions</Label>
                    {editing ? (
                      <Input value={chronicDiseases} onChange={(e) => setChronicDiseases(e.target.value)} />
                    ) : (
                      <p className="text-sm font-medium text-foreground bg-muted/40 p-2.5 rounded-lg">{activeProfile.chronic_diseases || 'None reported'}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Current Medications</Label>
                    {editing ? (
                      <Input value={currentMedications} onChange={(e) => setCurrentMedications(e.target.value)} />
                    ) : (
                      <p className="text-sm font-medium text-foreground bg-muted/40 p-2.5 rounded-lg">{activeProfile.current_medications || 'None reported'}</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {editing && (
            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => setEditing(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving} className="bg-gradient-to-r from-primary to-accent text-white shadow-md">
                {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving Changes...</> : <><Save className="mr-2 h-4 w-4" /> Save Profile</>}
              </Button>
            </div>
          )}
        </form>
      </div>
    </DashboardShell>
  );
}
