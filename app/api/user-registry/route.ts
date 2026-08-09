import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import type { Profile } from '@/types';

// Global server memory store for cross-device accounts
const globalUserRegistry: Record<string, { password: string; profile: Profile }> = {
  'ratheesh@gmail.com': {
    password: 'Ratheesh@2007',
    profile: {
      id: 'usr-ratheesh-doc-1',
      email: 'ratheesh@gmail.com',
      role: 'doctor',
      full_name: 'Dr. Ratheesh',
      date_of_birth: '1988-06-15',
      age: 36,
      gender: 'male',
      blood_group: 'O+',
      mobile_number: '+91 98765 43210',
      address: 'City General Hospital, Cardiology Wing',
      emergency_contact: null,
      medical_history: null,
      allergies: null,
      chronic_diseases: null,
      current_medications: null,
      height: 175,
      weight: 70,
      bmi: 22.8,
      profile_photo: null,
      is_pregnant: false,
      pregnancy_week: null,
      expected_delivery_date: null,
      previous_pregnancies: 0,
      maternal_health_history: null,
      assigned_village: null,
      specialization: 'Cardiologist',
      license_number: 'DOC-LIC-99881',
      pharmacy_id: null,
      vehicle_number: null,
      vehicle_type: null,
      passcode: 'Ratheesh@2007',
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  },
  'ratheeshe344@gmail.com': {
    password: 'Ratheesh@123',
    profile: {
      id: 'usr-ratheesh-1',
      email: 'ratheeshe344@gmail.com',
      role: 'patient',
      full_name: 'Ratheesh',
      date_of_birth: '1995-04-12',
      age: 29,
      gender: 'male',
      blood_group: 'O+',
      mobile_number: '+91 98765 43210',
      address: 'Main Street, Sector 4',
      passcode: 'Ratheesh@123',
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    } as Profile,
  },
  'doctor@gmail.com': {
    password: 'password',
    profile: {
      id: 'usr-doc-1',
      email: 'doctor@gmail.com',
      role: 'doctor',
      full_name: 'Dr. Sarah Sharma',
      specialization: 'Cardiologist',
      license_number: 'DOC-LIC-99881',
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    } as Profile,
  },
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get('email')?.trim().toLowerCase();

  if (!email) {
    return NextResponse.json({ success: false, error: 'Email parameter required' }, { status: 400 });
  }

  const account = globalUserRegistry[email];
  if (account) {
    return NextResponse.json({ success: true, user: account });
  }

  try {
    const { data: remoteProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', email)
      .maybeSingle();

    if (remoteProfile) {
      const fetchedUser = {
        password: remoteProfile.passcode || 'password',
        profile: remoteProfile as Profile,
      };
      globalUserRegistry[email] = fetchedUser;
      return NextResponse.json({ success: true, user: fetchedUser });
    }
  } catch {
    // ignore
  }

  return NextResponse.json({ success: false, message: 'User not found in global registry' });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, profile } = body;

    if (!email || !profile) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();
    globalUserRegistry[normalizedEmail] = { password: password || 'password', profile };

    try {
      await supabase.from('profiles').upsert(profile, { onConflict: 'email' });
    } catch {
      // ignore
    }

    return NextResponse.json({ success: true, message: 'User registered in global server registry' });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || 'Server error' }, { status: 500 });
  }
}
