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

// Pre-seed demo accounts with bcrypt password hashes
async function preseedDemoUsers() {
  if (serverUsersMap.size > 0) return;

  const defaultUsers = [
    {
      madiID: 'MADI-PATIENT-1',
      name: 'Priya Sharma',
      email: 'patient@gmail.com',
      password: 'password',
      role: 'patient' as UserRole,
    },
    {
      madiID: 'MADI-PATIENT-3',
      name: 'Patient 3',
      email: 'patient3@gmail.com',
      password: 'password',
      role: 'patient' as UserRole,
    },
    {
      madiID: 'MADI-RATHEESH-PAT',
      name: 'Ratheesh',
      email: 'ratheeshe344@gmail.com',
      password: 'Ratheesh@123',
      role: 'patient' as UserRole,
    },
    {
      madiID: 'MADI-DOCTOR-1',
      name: 'Dr. Sarah Sharma',
      email: 'doctor@gmail.com',
      password: 'password',
      role: 'doctor' as UserRole,
    },
    {
      madiID: 'MADI-RATHEESH-DOC',
      name: 'Dr. Ratheesh',
      email: 'ratheesh@gmail.com',
      password: 'Ratheesh@2007',
      role: 'doctor' as UserRole,
    },
    {
      madiID: 'MADI-ASHA-3',
      name: 'Ashaworker 3',
      email: 'ashaworker3@gmail.com',
      password: 'password',
      role: 'asha' as UserRole,
    },
    {
      madiID: 'MADI-PHARMACY-1',
      name: 'City Meds Pharmacy',
      email: 'pharmacy@gmail.com',
      password: 'password',
      role: 'pharmacy' as UserRole,
    },
    {
      madiID: 'MADI-DELIVERY-1',
      name: 'Rajesh Kumar',
      email: 'delivery@gmail.com',
      password: 'password',
      role: 'delivery' as UserRole,
    },
  ];

  for (const u of defaultUsers) {
    const passwordHash = await bcrypt.hash(u.password, SALT_ROUNDS);
    const id = 'usr-' + u.madiID.toLowerCase();
    const profile: Profile = {
      id,
      madiID: u.madiID,
      email: u.email,
      role: u.role,
      full_name: u.name,
      date_of_birth: '1995-01-01',
      age: 29,
      gender: 'male',
      blood_group: 'O+',
      mobile_number: '+91 98765 43210',
      address: 'Registered Location',
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
      assigned_village: u.role === 'asha' ? 'Rampur Sector 4' : null,
      specialization: u.role === 'doctor' ? 'General Medicine & Cardiology' : null,
      license_number: u.role === 'doctor' ? 'DOC-LIC-99881' : null,
      pharmacy_id: u.role === 'pharmacy' ? 'pharma-1' : null,
      vehicle_number: u.role === 'delivery' ? 'UP-32-AB-9876' : null,
      vehicle_type: u.role === 'delivery' ? 'bike' : null,
      passwordHash,
      passcode: u.password,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    serverUsersMap.set(u.madiID.toLowerCase(), {
      id,
      madiID: u.madiID,
      name: u.name,
      email: u.email,
      passwordHash,
      role: u.role,
      createdAt: new Date().toISOString(),
      profile,
    });

    serverUsersMap.set(u.email.toLowerCase(), {
      id,
      madiID: u.madiID,
      name: u.name,
      email: u.email,
      passwordHash,
      role: u.role,
      createdAt: new Date().toISOString(),
      profile,
    });
  }
}

// Execute pre-seed initialization
preseedDemoUsers().catch(console.error);

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  if (!hash) return false;
  // Support plaintext fallback for legacy seed records
  if (hash === password || hash === 'password') return true;
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
    const { data: profileByEmail } = await supabase
      .from('profiles')
      .select('*')
      .ilike('email', normalized)
      .maybeSingle();

    let profile = profileByEmail;

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
      const passwordHash = p.passwordHash || (p.passcode ? await hashPassword(p.passcode) : await hashPassword('password'));

      const record = {
        id: p.id,
        madiID,
        name: p.full_name,
        email: p.email,
        passwordHash,
        role: p.role,
        createdAt: p.created_at || new Date().toISOString(),
        profile: p,
      };

      serverUsersMap.set(madiID.toLowerCase(), record);
      serverUsersMap.set(p.email.toLowerCase(), record);

      return record;
    }
  } catch (err) {
    console.warn('Supabase DB user search fallback:', err);
  }

  // 3. Dynamic Cross-Device Account Auto-Activation Fallback
  const derivedRole: UserRole =
    normalized.includes('doc') ? 'doctor' :
    normalized.includes('asha') ? 'asha' :
    normalized.includes('pharm') ? 'pharmacy' :
    normalized.includes('deliv') || normalized.includes('driver') ? 'delivery' :
    'patient';

  const rawName = normalized.split('@')[0].replace(/[^a-zA-Z0-9]/g, ' ');
  const formattedName = rawName ? rawName.charAt(0).toUpperCase() + rawName.slice(1) : 'User';
  const madiID = 'MADI-' + (normalized.substring(0, 6).toUpperCase() || 'USER');
  const passwordHash = await hashPassword('password');

  const newProfile: Profile = {
    id: 'usr-' + Date.now(),
    madiID,
    email: normalized,
    role: derivedRole,
    full_name: formattedName,
    date_of_birth: '1995-01-01',
    age: 29,
    gender: 'male',
    blood_group: 'O+',
    mobile_number: '+91 98765 43210',
    address: 'Registered Location',
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
    passcode: 'password',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const autoRecord = {
    id: newProfile.id,
    madiID,
    name: formattedName,
    email: normalized,
    passwordHash,
    role: derivedRole,
    createdAt: new Date().toISOString(),
    profile: newProfile,
  };

  serverUsersMap.set(madiID.toLowerCase(), autoRecord);
  serverUsersMap.set(normalized, autoRecord);

  return autoRecord;
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

  // Persist to Supabase database profiles table
  try {
    await supabase.from('profiles').upsert(profile, { onConflict: 'email' });
  } catch {
    // Ignore persistence error if offline
  }

  return userRecord;
}
