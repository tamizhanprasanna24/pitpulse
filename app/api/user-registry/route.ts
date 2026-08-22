import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import type { Profile } from '@/types';

// Global server memory store for cross-device accounts
const globalUserRegistry: Record<string, { password: string; profile: Profile }> = {};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const rawEmail = searchParams.get('email')?.trim() || '';
  const email = rawEmail.toLowerCase();

  if (!email) {
    return NextResponse.json({ success: false, error: 'Email parameter required' }, { status: 400 });
  }

  // Check in-memory registry first
  const account = globalUserRegistry[email] || globalUserRegistry[rawEmail];
  if (account) {
    return NextResponse.json({ success: true, user: account });
  }

  // Query Supabase profiles table for cross-device registered user
  try {
    const { data: remoteProfile } = await supabase
      .from('profiles')
      .select('*')
      .ilike('email', email)
      .maybeSingle();

    if (remoteProfile) {
      const fetchedUser = {
        password: remoteProfile.passcode || remoteProfile.passwordHash || null,
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
    const effectivePass = password || profile.passcode || 'password';
    const updatedProfile = { ...profile, passcode: effectivePass };

    const userAcc = { password: effectivePass, profile: updatedProfile };
    globalUserRegistry[normalizedEmail] = userAcc;

    try {
      const cleanDbProfile = {
        id: updatedProfile.id || ('usr-' + Date.now()),
        email: normalizedEmail,
        role: updatedProfile.role || 'patient',
        full_name: updatedProfile.full_name || normalizedEmail.split('@')[0],
        passcode: effectivePass,
        date_of_birth: updatedProfile.date_of_birth || null,
        age: updatedProfile.age || null,
        gender: updatedProfile.gender || null,
        blood_group: updatedProfile.blood_group || null,
        mobile_number: updatedProfile.mobile_number || null,
        address: updatedProfile.address || null,
        emergency_contact: updatedProfile.emergency_contact || null,
        medical_history: updatedProfile.medical_history || null,
        allergies: updatedProfile.allergies || null,
        chronic_diseases: updatedProfile.chronic_diseases || null,
        current_medications: updatedProfile.current_medications || null,
        height: updatedProfile.height || null,
        weight: updatedProfile.weight || null,
        bmi: updatedProfile.bmi || null,
        profile_photo: updatedProfile.profile_photo || null,
        is_pregnant: updatedProfile.is_pregnant || false,
        pregnancy_week: updatedProfile.pregnancy_week || null,
        expected_delivery_date: updatedProfile.expected_delivery_date || null,
        previous_pregnancies: updatedProfile.previous_pregnancies || 0,
        maternal_health_history: updatedProfile.maternal_health_history || null,
        assigned_village: updatedProfile.assigned_village || null,
        specialization: updatedProfile.specialization || null,
        license_number: updatedProfile.license_number || null,
        pharmacy_id: updatedProfile.pharmacy_id || null,
        vehicle_number: updatedProfile.vehicle_number || null,
        vehicle_type: updatedProfile.vehicle_type || null,
        is_active: true,
        created_at: updatedProfile.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      await supabase.from('profiles').upsert(cleanDbProfile, { onConflict: 'email' });
    } catch {
      // ignore
    }

    return NextResponse.json({ success: true, message: 'User registered in global server registry' });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || 'Server error' }, { status: 500 });
  }
}
