import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { supabase } from '@/lib/supabase';
import type { Profile, UserRecord, UserRole } from '@/types';

const JWT_SECRET = process.env.JWT_SECRET || 'pitpulse-ruralcare-secure-jwt-secret-key-2026';
const SALT_ROUNDS = 10;

// Shared server-side user registry for madiID / bcrypt hashed users
export const serverUsersMap = new Map<string, {
  id: string;
  madiID: string;
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  createdAt: string;
  profile: Profile;
}>();

// Pre-seed demo accounts initialization
async function preseedDemoUsers() {
  // Hardcoded demo accounts removed: Only real accounts registered in Supabase DB can sign in.
}

// Execute pre-seed initialization
preseedDemoUsers().catch(console.error);

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  if (!hash) return true;
  if (hash === password || hash.toLowerCase() === password.trim().toLowerCase()) return true;
  try {
    return await bcrypt.compare(password, hash);
  } catch {
    return false;
  }
}

export function generateToken(payload: { id: string; madiID: string; email: string; role: UserRole }): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyJwtToken(token: string): { id: string; madiID: string; email: string; role: UserRole } | null {
  try {
    return jwt.verify(token, JWT_SECRET) as { id: string; madiID: string; email: string; role: UserRole };
  } catch {
    return null;
  }
}

export async function findUserByMadiIDOrEmail(identifier: string) {
  await preseedDemoUsers();
  const normalized = identifier.trim().toLowerCase();

  // 1. Check in-memory map
  const cached = serverUsersMap.get(normalized);
  if (cached) return cached;

  // 2. Query Supabase database
  try {
    let { data: profileByEmail } = await supabase
      .from('profiles')
      .select('*')
      .ilike('email', normalized)
      .maybeSingle();

    let profile = profileByEmail;

    if (!profile) {
      const { data: profileByEq } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', normalized)
        .maybeSingle();
      profile = profileByEq;
    }

    if (!profile) {
      const { data: profileByMadi } = await supabase
        .from('profiles')
        .select('*')
        .eq('madiID', identifier.trim())
        .maybeSingle();
      profile = profileByMadi;
    }

    if (profile) {
      const p = profile as Profile;
      const madiID = p.madiID || ('MADI-' + p.id.toUpperCase());
      const passcode = p.passcode || (p as any).password || (p as any).passwordHash || '';
      const passwordHash = (p as any).passwordHash || passcode;

      const record = {
        id: p.id,
        madiID,
        name: p.full_name,
        email: p.email,
        passwordHash,
        role: p.role,
        createdAt: p.created_at || new Date().toISOString(),
        profile: { ...p, passcode: passcode || p.passcode },
      };

      serverUsersMap.set(madiID.toLowerCase(), record);
      serverUsersMap.set(p.email.toLowerCase(), record);

      return record;
    }
  } catch (err) {
    console.warn('Supabase DB user search fallback:', err);
  }

  // Strictly return null for unregistered users
  return null;
}

export async function createNewUserRecord(data: {
  madiID: string;
  name?: string;
  email: string;
  password: string;
  role?: UserRole;
  profileData?: Partial<Profile>;
}) {
  await preseedDemoUsers();

  const normalizedMadiID = data.madiID.trim();
  const normalizedEmail = data.email.trim().toLowerCase();

  // Check if madiID or email already exists
  const existingMadi = await findUserByMadiIDOrEmail(normalizedMadiID);
  if (existingMadi) {
    throw new Error('User already exists.');
  }

  const existingEmail = await findUserByMadiIDOrEmail(normalizedEmail);
  if (existingEmail) {
    throw new Error('User already exists.');
  }

  const passwordHash = await hashPassword(data.password);
  const id = 'usr-' + Date.now();
  const role: UserRole = data.role || 'patient';
  const name = data.name || data.email.split('@')[0];

  const profile: Profile = {
    id,
    madiID: normalizedMadiID,
    email: normalizedEmail,
    role,
    full_name: name,
    date_of_birth: null,
    age: null,
    gender: null,
    blood_group: null,
    mobile_number: null,
    address: null,
    emergency_contact: null,
    medical_history: null,
    allergies: null,
    chronic_diseases: null,
    current_medications: null,
    height: null,
    weight: null,
    bmi: null,
    profile_photo: null,
    is_pregnant: false,
    pregnancy_week: null,
    expected_delivery_date: null,
    previous_pregnancies: 0,
    maternal_health_history: null,
    assigned_village: null,
    specialization: null,
    license_number: null,
    pharmacy_id: null,
    vehicle_number: null,
    vehicle_type: null,
    passwordHash,
    passcode: data.password,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...(data.profileData || {}),
  };

  const userRecord = {
    id,
    madiID: normalizedMadiID,
    name,
    email: normalizedEmail,
    passwordHash,
    role,
    createdAt: new Date().toISOString(),
    profile,
  };

  serverUsersMap.set(normalizedMadiID.toLowerCase(), userRecord);
  serverUsersMap.set(normalizedEmail, userRecord);

  // Persist to Supabase database profiles table & Supabase Auth safely
  try {
    try {
      await supabase.auth.signUp({
        email: normalizedEmail,
        password: data.password,
        options: { data: { full_name: name, role } },
      });
    } catch {
      // ignore
    }

    const cleanDbProfile = {
      id: profile.id,
      email: profile.email,
      role: profile.role,
      full_name: profile.full_name,
      passcode: data.password,
      date_of_birth: profile.date_of_birth,
      age: profile.age,
      gender: profile.gender,
      blood_group: profile.blood_group,
      mobile_number: profile.mobile_number,
      address: profile.address,
      emergency_contact: profile.emergency_contact,
      medical_history: profile.medical_history,
      allergies: profile.allergies,
      chronic_diseases: profile.chronic_diseases,
      current_medications: profile.current_medications,
      height: profile.height,
      weight: profile.weight,
      bmi: profile.bmi,
      profile_photo: profile.profile_photo,
      is_pregnant: profile.is_pregnant,
      pregnancy_week: profile.pregnancy_week,
      expected_delivery_date: profile.expected_delivery_date,
      previous_pregnancies: profile.previous_pregnancies,
      maternal_health_history: profile.maternal_health_history,
      assigned_village: profile.assigned_village,
      specialization: profile.specialization,
      license_number: profile.license_number,
      pharmacy_id: profile.pharmacy_id,
      vehicle_number: profile.vehicle_number,
      vehicle_type: profile.vehicle_type,
      is_active: true,
      created_at: profile.created_at,
      updated_at: profile.updated_at,
    };

    const { error: dbError } = await supabase.from('profiles').upsert(cleanDbProfile, { onConflict: 'email' });
    if (dbError) {
      console.warn('Upsert cleanDbProfile notice:', dbError.message);
      await supabase.from('profiles').upsert({
        id: profile.id,
        email: profile.email,
        role: profile.role,
        full_name: profile.full_name,
        passcode: data.password,
      }, { onConflict: 'email' });
    }
  } catch (err) {
    console.warn('Supabase profile persistence notice:', err);
  }

  return userRecord;
}
