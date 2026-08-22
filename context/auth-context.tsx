'use client';

import * as React from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import type { Profile, UserRole } from '@/types';
import { toast } from 'sonner';
import bcrypt from 'bcryptjs';


interface AuthContextValue {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null; profile?: Profile | null }>;
  sendOtp: (email: string) => Promise<{ error: string | null; code?: string }>;
  verifyOtp: (email: string, token: string, role?: UserRole) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string) => Promise<{ error: string | null; data: { user: User | null } | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;

  setLocalProfile: (p: Profile, password?: string) => void;
}

const AuthContext = React.createContext<AuthContextValue | undefined>(undefined);

const LOCAL_STORAGE_PROFILE_KEY = 'pitpulse_active_profile';
const LOCAL_STORAGE_OTP_KEY = 'pitpulse_active_otp_codes';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<User | null>(null);
  const [session, setSession] = React.useState<Session | null>(null);
  const [profile, setProfile] = React.useState<Profile | null>(null);
  const [loading, setLoading] = React.useState(true);

  const fetchProfile = React.useCallback(async (uid: string, emailHint?: string): Promise<Profile | null> => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', uid)
        .maybeSingle();

      if (!error && data) {
        const p = data as Profile;
        setProfile(p);
        if (typeof window !== 'undefined') {
          localStorage.setItem(LOCAL_STORAGE_PROFILE_KEY, JSON.stringify(p));
        }
        return p;
      }
    } catch (e) {
      console.warn('Supabase profile fetch error by ID, checking email fallback:', e);
    }

    const targetEmail = emailHint || (uid.includes('@') ? uid : null);
    if (targetEmail) {
      try {
        const { data: pByEmail } = await supabase
          .from('profiles')
          .select('*')
          .ilike('email', targetEmail.trim().toLowerCase())
          .maybeSingle();

        if (pByEmail) {
          const p = pByEmail as Profile;
          setProfile(p);
          if (typeof window !== 'undefined') {
            localStorage.setItem(LOCAL_STORAGE_PROFILE_KEY, JSON.stringify(p));
          }
          return p;
        }
      } catch {
        // ignore
      }
    }

    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(LOCAL_STORAGE_PROFILE_KEY);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed && (parsed.id === uid || parsed.email === targetEmail)) {
            setProfile(parsed);
            return parsed;
          }
        } catch {
          // ignore parsing error
        }
      }
    }
    return null;
  }, []);

  React.useEffect(() => {
    // Check initial local session & profile
    let hasLocalSession = false;
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(LOCAL_STORAGE_PROFILE_KEY);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed && parsed.id) {
            setProfile(parsed);
            setUser({ id: parsed.id, email: parsed.email } as User);
            hasLocalSession = true;
          }
        } catch {
          // ignore parsing error
        }
      }
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setSession(session);
        setUser(session.user);
        fetchProfile(session.user.id, session.user.email).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    }).catch(() => {
      setLoading(false);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        setSession(session);
        setUser(session.user);
        (async () => {
          await fetchProfile(session.user.id, session.user.email);
          setLoading(false);
        })();
      } else if (event === 'SIGNED_OUT') {
        setSession(null);
        setUser(null);
        setProfile(null);
        if (typeof window !== 'undefined') {
          localStorage.removeItem(LOCAL_STORAGE_PROFILE_KEY);
        }
        setLoading(false);
      } else {
        // Do not wipe local custom profile session when session is null on load
        setSession(null);
        setLoading(false);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [fetchProfile]);

const LOCAL_STORAGE_USERS_KEY = 'pitpulse_registered_users';

const DEFAULT_ACCOUNTS: Record<string, { password: string; profile: Profile }> = {
  'ashaworker3@gmail.com': {
    password: 'password',
    profile: {
      id: 'usr-asha-3',
      email: 'ashaworker3@gmail.com',
      role: 'asha',
      full_name: 'Ashaworker3',
      date_of_birth: '1992-05-15',
      age: 32,
      gender: 'female',
      blood_group: 'B+',
      mobile_number: '+91 98765 43210',
      address: 'Rampur Village, Sector 4',
      emergency_contact: '+91 98765 00000',
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
      assigned_village: 'Rampur Village',
      specialization: null,
      license_number: null,
      pharmacy_id: null,
      vehicle_number: null,
      vehicle_type: null,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  },
  'doctor@gmail.com': {
    password: 'password',
    profile: {
      id: 'usr-doc-1',
      email: 'doctor@gmail.com',
      role: 'doctor',
      full_name: 'Dr. Ananya Sharma',
      date_of_birth: '1985-08-20',
      age: 39,
      gender: 'female',
      blood_group: 'A+',
      mobile_number: '+91 98765 11111',
      address: 'District Hospital, Sector 2',
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
      specialization: 'General Medicine & Cardiology',
      license_number: 'MCI-884920-IND',
      pharmacy_id: null,
      vehicle_number: null,
      vehicle_type: null,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  },
  'patient3@gmail.com': {
    password: 'password',
    profile: {
      id: 'usr-pat-3',
      email: 'patient3@gmail.com',
      role: 'patient',
      full_name: 'Patient 3',
      date_of_birth: '1995-04-12',
      age: 29,
      gender: 'female',
      blood_group: 'O+',
      mobile_number: '+91 98765 33333',
      address: 'House 12, Rampur Sector 4',
      emergency_contact: '+91 98765 99999',
      medical_history: 'Routine Checkup',
      allergies: 'None',
      chronic_diseases: 'None',
      current_medications: 'Multivitamin',
      height: 162,
      weight: 58,
      bmi: 22.1,
      profile_photo: null,
      is_pregnant: false,
      pregnancy_week: null,
      expected_delivery_date: null,
      previous_pregnancies: 0,
      maternal_health_history: null,
      assigned_village: 'Rampur Village',
      specialization: null,
      license_number: null,
      pharmacy_id: null,
      vehicle_number: null,
      vehicle_type: null,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  },
  'patient@gmail.com': {
    password: 'password',
    profile: {
      id: 'usr-pat-1',
      email: 'patient@gmail.com',
      role: 'patient',
      full_name: 'Priya Sharma',
      date_of_birth: '1996-03-10',
      age: 28,
      gender: 'female',
      blood_group: 'O+',
      mobile_number: '+91 98765 22222',
      address: 'House 42, Green Avenue',
      emergency_contact: '+91 98765 33333',
      medical_history: 'None',
      allergies: 'Penicillin',
      chronic_diseases: 'Asthma',
      current_medications: 'Inhaler',
      height: 165,
      weight: 60,
      bmi: 22,
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
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  },
  'pharmacy@gmail.com': {
    password: 'password',
    profile: {
      id: 'usr-pharma-1',
      email: 'pharmacy@gmail.com',
      role: 'pharmacy',
      full_name: 'City Meds Pharmacy',
      date_of_birth: null,
      age: null,
      gender: 'male',
      blood_group: null,
      mobile_number: '+91 98765 44444',
      address: 'Central Market, Sector 1',
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
      license_number: 'PHARM-LICENSE-2024-88',
      pharmacy_id: 'pharma-1',
      vehicle_number: null,
      vehicle_type: null,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  },
  'delivery@gmail.com': {
    password: 'password',
    profile: {
      id: 'usr-deliv-1',
      email: 'delivery@gmail.com',
      role: 'delivery',
      full_name: 'Rajesh Kumar',
      date_of_birth: '1998-11-05',
      age: 26,
      gender: 'male',
      blood_group: 'B+',
      mobile_number: '+91 98765 55555',
      address: 'Express Delivery Hub',
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
      vehicle_number: 'UP-32-AB-9876',
      vehicle_type: 'bike',
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
      emergency_contact: null,
      medical_history: null,
      allergies: null,
      chronic_diseases: null,
      current_medications: null,
      height: 172,
      weight: 68,
      bmi: 23.0,
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
      passcode: 'Ratheesh@123',
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  },
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
  'ashapit@gmail.com': {
    password: 'imashapit',
    profile: {
      id: 'usr-ashapit-1',
      email: 'ashapit@gmail.com',
      role: 'asha',
      full_name: 'Asha PIT',
      date_of_birth: '1992-05-15',
      age: 32,
      gender: 'female',
      blood_group: 'B+',
      mobile_number: '+91 98765 43210',
      address: 'Rampur Village, Sector 4',
      emergency_contact: '+91 98765 00000',
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
      assigned_village: 'Rampur Village',
      specialization: null,
      license_number: null,
      pharmacy_id: null,
      vehicle_number: null,
      vehicle_type: null,
      passcode: 'imashapit',
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  },
  'p.atient99@gmail.com': {
    password: 'password',
    profile: {
      id: 'usr-patient99-1',
      email: 'p.atient99@gmail.com',
      role: 'patient',
      full_name: 'Patient 99',
      date_of_birth: '1996-03-10',
      age: 28,
      gender: 'female',
      blood_group: 'O+',
      mobile_number: '+91 98765 22222',
      address: 'House 42, Green Avenue',
      emergency_contact: '+91 98765 33333',
      medical_history: 'None',
      allergies: null,
      chronic_diseases: null,
      current_medications: null,
      height: 165,
      weight: 60,
      bmi: 22,
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
      passcode: 'password',
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  },
  'patient99@gmail.com': {
    password: 'password',
    profile: {
      id: 'usr-patient99-2',
      email: 'patient99@gmail.com',
      role: 'patient',
      full_name: 'Patient 99',
      date_of_birth: '1996-03-10',
      age: 28,
      gender: 'female',
      blood_group: 'O+',
      mobile_number: '+91 98765 22222',
      address: 'House 42, Green Avenue',
      emergency_contact: '+91 98765 33333',
      medical_history: 'None',
      allergies: null,
      chronic_diseases: null,
      current_medications: null,
      height: 165,
      weight: 60,
      bmi: 22,
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
      passcode: 'password',
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  },
};

function getStoredUsers(): Record<string, { password: string; profile: Profile }> {
  if (typeof window === 'undefined') return DEFAULT_ACCOUNTS;
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_USERS_KEY);
    if (saved) {
      return { ...DEFAULT_ACCOUNTS, ...JSON.parse(saved) };
    }
  } catch {
    // ignore
  }
  return DEFAULT_ACCOUNTS;
}

function saveUserToRegistry(email: string, password: string, profile: Profile) {
  if (typeof window === 'undefined') return;
  try {
    const users = getStoredUsers();
    users[email.toLowerCase()] = { password, profile };
    localStorage.setItem(LOCAL_STORAGE_USERS_KEY, JSON.stringify(users));
  } catch {
    // ignore
  }
  try {
    fetch('/api/user-registry', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.toLowerCase(), password, profile }),
    }).catch(() => {});
  } catch {
    // ignore
  }
  try {
    (async () => {
      try {
        await supabase.from('profiles').upsert({ ...profile, passcode: password }, { onConflict: 'email' });
      } catch {
        // ignore
      }
    })();
  } catch {
    // ignore
  }
}

  const setLocalProfile = (p: Profile, password?: string) => {
    setProfile(p);
    setUser({ id: p.id, email: p.email } as User);
    if (typeof window !== 'undefined') {
      localStorage.setItem(LOCAL_STORAGE_PROFILE_KEY, JSON.stringify(p));
      if (password) {
        saveUserToRegistry(p.email, password, p);
      }
    }
  };

  const signIn = async (email: string, password: string) => {
    // Purge any existing session so new login attempts evaluate fresh typed credentials
    setProfile(null);
    setUser(null);
    setSession(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem(LOCAL_STORAGE_PROFILE_KEY);
    }

    const rawInput = email.trim().toLowerCase();

    // 1. Block generic role names & demo pattern usernames that are not registered
    const isGenericOrPartialName = (str: string) => {
      const val = str.toLowerCase();
      if (val.includes('@') || val.startsWith('madi-')) return false;
      return (
        val === 'patient' ||
        val === 'doctor' ||
        val === 'asha' ||
        val === 'ashaworker' ||
        val === 'asha worker' ||
        val === 'ashapit' ||
        val === 'pharmacy' ||
        val === 'delivery' ||
        val === 'delivery partner' ||
        val === 'admin' ||
        val.startsWith('patient') ||
        val.startsWith('doctor') ||
        val.startsWith('asha') ||
        val.startsWith('pharm') ||
        val.startsWith('deliv')
      );
    };

    if (isGenericOrPartialName(rawInput)) {
      return {
        error: 'Account not registered. Generic or unformatted usernames cannot be used to log in. Please sign up for an account.',
      };
    }

    const normalizedEmail = rawInput;

    const isPasswordMatch = (expected?: string | null) => {
      if (!expected || !expected.trim()) return false;
      const exp = expected.trim();
      const input = password.trim();

      if (exp === input) {
        return true;
      }
      if (exp.startsWith('$2a$') || exp.startsWith('$2b$') || exp.startsWith('$2y$')) {
        try {
          return bcrypt.compareSync(input, exp);
        } catch {
          return false;
        }
      }
      return false;
    };

    // 2. Try Supabase Auth first (for accounts created via Supabase Auth)
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email: normalizedEmail, password });
      if (!error && data?.user) {
        setUser(data.user);
        setSession(data.session);
        let fetched = await fetchProfile(data.user.id, data.user.email);

        if (fetched) {
          return { error: null, profile: fetched };
        }
      }
    } catch {
      // ignore & proceed to database lookup
    }

    // 3. Try Real bcrypt Authentication Backend API
    try {
      const apiRes = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ madiID: normalizedEmail, email: normalizedEmail, password }),
      });
      const apiData = await apiRes.json();
      if (apiRes.ok && apiData.success && apiData.user?.profile) {
        setLocalProfile(apiData.user.profile, password);
        return { error: null, profile: apiData.user.profile };
      }
    } catch {
      // ignore & proceed to fallbacks
    }

    // 4. Check local user registry (pre-seeded demo accounts & locally created accounts)
    const registeredUsers = getStoredUsers();
    const existingAccount = registeredUsers[normalizedEmail];

    if (existingAccount) {
      const storedPass = existingAccount.password || existingAccount.profile?.passcode;
      if (!isPasswordMatch(storedPass)) {
        return { error: 'Invalid email or password.' };
      }
      setLocalProfile(existingAccount.profile, password);
      return { error: null, profile: existingAccount.profile };
    }

    // 5. Check Global Server API User Registry (cross-device account registry)
    try {
      const res = await fetch(`/api/user-registry?email=${encodeURIComponent(normalizedEmail)}`);
      const data = await res.json();
      if (data?.success && data?.user) {
        const apiAccount = data.user;
        const storedPass = apiAccount.password || apiAccount.profile?.passcode;

        if (!isPasswordMatch(storedPass)) {
          return { error: 'Invalid email or password.' };
        }
        setLocalProfile(apiAccount.profile, password);
        return { error: null, profile: apiAccount.profile };
      }
    } catch {
      // ignore & check Supabase DB
    }

    // 6. Query Supabase 'profiles' table for accounts registered from any device
    try {
      let { data: remoteProfile } = await supabase
        .from('profiles')
        .select('*')
        .ilike('email', normalizedEmail)
        .maybeSingle();

      if (!remoteProfile) {
        const { data: profileEq } = await supabase
          .from('profiles')
          .select('*')
          .eq('email', normalizedEmail)
          .maybeSingle();
        remoteProfile = profileEq;
      }

      if (remoteProfile) {
        const p = remoteProfile as Profile;
        const expectedPass = p.passcode || (p as any).password || (p as any).passwordHash;
        if (expectedPass && !isPasswordMatch(expectedPass)) {
          return { error: 'Invalid email or password.' };
        }
        setLocalProfile(p, password);
        return { error: null, profile: p };
      }
    } catch {
      // Fall back
    }

    // 7. Dynamic multi-device fallback: if user typed a valid email and password, create or restore account automatically across devices
    if (normalizedEmail.includes('@') && password && password.length >= 2) {
      const derivedRole =
        normalizedEmail.includes('asha') ? 'asha' :
        normalizedEmail.includes('doctor') || normalizedEmail.includes('doc') ? 'doctor' :
        normalizedEmail.includes('pharmacy') || normalizedEmail.includes('pharma') ? 'pharmacy' :
        normalizedEmail.includes('delivery') || normalizedEmail.includes('deliv') ? 'delivery' :
        'patient';

      const emailName = normalizedEmail.split('@')[0].replace(/[^a-zA-Z0-9]/g, ' ');
      const formattedName = emailName.charAt(0).toUpperCase() + emailName.slice(1);

      const dynamicProfile: Profile = {
        id: `usr-${Date.now()}`,
        email: normalizedEmail,
        role: derivedRole as UserRole,
        full_name: formattedName || 'Registered User',
        date_of_birth: '1996-01-01',
        age: 28,
        gender: 'female',
        blood_group: 'O+',
        mobile_number: '+91 98765 43210',
        address: 'Rampur Healthcare Zone',
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
        assigned_village: derivedRole === 'asha' ? 'Rampur Village' : null,
        specialization: derivedRole === 'doctor' ? 'General Medicine' : null,
        license_number: derivedRole === 'doctor' ? 'DOC-LIC-99881' : null,
        pharmacy_id: derivedRole === 'pharmacy' ? 'pharma-1' : null,
        vehicle_number: derivedRole === 'delivery' ? 'UP-32-AB-9876' : null,
        vehicle_type: derivedRole === 'delivery' ? 'bike' : null,
        passcode: password,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      saveUserToRegistry(normalizedEmail, password, dynamicProfile);
      setLocalProfile(dynamicProfile, password);

      // Async sync to Supabase Cloud DB in background
      try {
        supabase.from('profiles').upsert({
          id: dynamicProfile.id,
          email: dynamicProfile.email,
          role: dynamicProfile.role,
          full_name: dynamicProfile.full_name,
          passcode: password,
          created_at: dynamicProfile.created_at,
          updated_at: dynamicProfile.updated_at,
        }).then(() => {});
      } catch {}

      return { error: null, profile: dynamicProfile };
    }

    // 8. Reject invalid email
    return {
      error: 'Invalid email or password.',
    };
  };

  const sendOtp = async (email: string) => {
    let supabaseErr: string | null = null;
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { shouldCreateUser: false },
      });
      if (error) supabaseErr = error.message;
    } catch (e: any) {
      supabaseErr = e.message || 'OTP request failed';
    }

    // Generate robust 6-digit OTP code fallback
    const generatedCode = Math.floor(100000 + Math.random() * 900000).toString();

    if (typeof window !== 'undefined') {
      const currentOtps = JSON.parse(localStorage.getItem(LOCAL_STORAGE_OTP_KEY) || '{}');
      currentOtps[email.toLowerCase()] = {
        code: generatedCode,
        expiresAt: Date.now() + 10 * 60 * 1000,
      };
      localStorage.setItem(LOCAL_STORAGE_OTP_KEY, JSON.stringify(currentOtps));
    }

    if (supabaseErr) {
      console.warn('Supabase OTP notification fallback active:', supabaseErr);
    }

    return { error: null, code: generatedCode };
  };

  const verifyOtp = async (email: string, token: string, requestedRole?: UserRole) => {
    // 1. Try Supabase verification
    try {
      const { data, error } = await supabase.auth.verifyOtp({ email, token, type: 'email' });
      if (!error && data?.user) {
        setUser(data.user);
        setSession(data.session);
        await fetchProfile(data.user.id);
        return { error: null };
      }
    } catch {
      // ignore & proceed to local OTP check
    }

    // 2. Check local fallback OTP
    if (typeof window !== 'undefined') {
      const currentOtps = JSON.parse(localStorage.getItem(LOCAL_STORAGE_OTP_KEY) || '{}');
      const record = currentOtps[email.toLowerCase()];

      if (record && record.code === token && record.expiresAt > Date.now()) {
        // If existing profile matches email
        if (profile && profile.email.toLowerCase() === email.toLowerCase()) {
          return { error: null };
        }

        // Default to the requested role or patient for new email OTP verification
        const newVerifiedProfile: Profile = {
          id: 'user-' + Date.now(),
          email,
          role: requestedRole || 'patient',
          full_name: email.split('@')[0],
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
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        setLocalProfile(newVerifiedProfile);
        return { error: null };
      }
    }

    return { error: 'Invalid or expired verification code' };
  };

  const signUp = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({ email, password });
      return { error: error?.message ?? null, data };
    } catch (e: any) {
      return { error: e.message || 'Failed to register', data: null };
    }
  };

  const signOut = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      await supabase.auth.signOut();
    } catch {
      // ignore
    }
    setProfile(null);
    setUser(null);
    setSession(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem(LOCAL_STORAGE_PROFILE_KEY);
      localStorage.removeItem(LOCAL_STORAGE_OTP_KEY);
      sessionStorage.clear();
    }
    toast.info('You have signed out safely');
    if (typeof window !== 'undefined') {
      window.location.href = '/auth/login';
    }
  };

  const refreshProfile = async () => {
    if (user) await fetchProfile(user.id);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        loading,
        signIn,
        sendOtp,
        verifyOtp,
        signUp,
        signOut,
        refreshProfile,
        setLocalProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = React.useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export function getDashboardRoute(role: UserRole | undefined | null): string {
  switch (role) {
    case 'patient': return '/dashboard/patient';
    case 'asha': return '/dashboard/asha-worker';
    case 'doctor': return '/dashboard/doctor';
    case 'pharmacy': return '/dashboard/pharmacy';
    case 'delivery': return '/dashboard/delivery';
    default: return '/auth/login';
  }
}
