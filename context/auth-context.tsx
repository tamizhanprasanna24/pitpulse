'use client';

import * as React from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import type { Profile, UserRole } from '@/types';
import { toast } from 'sonner';


interface AuthContextValue {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
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

  const fetchProfile = React.useCallback(async (uid: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', uid)
        .maybeSingle();

      if (!error && data) {
        setProfile(data as Profile);
        if (typeof window !== 'undefined') {
          localStorage.setItem(LOCAL_STORAGE_PROFILE_KEY, JSON.stringify(data));
        }
        return;
      }
    } catch (e) {
      console.warn('Supabase profile fetch error, checking local fallback profile:', e);
    }

    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(LOCAL_STORAGE_PROFILE_KEY);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed && parsed.id === uid) {
            setProfile(parsed);
            return;
          }
        } catch {
          // ignore parsing error
        }
      }
    }
  }, []);

  React.useEffect(() => {
    // Check initial local session & profile
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(LOCAL_STORAGE_PROFILE_KEY);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed && parsed.id) {
            setProfile(parsed);
            setUser({ id: parsed.id, email: parsed.email } as User);
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
        fetchProfile(session.user.id).finally(() => setLoading(false));
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
          await fetchProfile(session.user.id);
          setLoading(false);
        })();
      } else {
        // Clear all state and local storage when session ends
        setSession(null);
        setUser(null);
        setProfile(null);
        if (typeof window !== 'undefined') {
          localStorage.removeItem(LOCAL_STORAGE_PROFILE_KEY);
        }
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
}

  const setLocalProfile = (p: Profile, password?: string) => {
    setProfile(p);
    setUser({ id: p.id, email: p.email } as User);
    if (typeof window !== 'undefined') {
      localStorage.setItem(LOCAL_STORAGE_PROFILE_KEY, JSON.stringify(p));
      saveUserToRegistry(p.email, password || 'password', p);
    }
  };

  const signIn = async (email: string, password: string) => {
    const normalizedEmail = email.trim().toLowerCase();

    // 1. Try Supabase Auth
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email: normalizedEmail, password });
      if (!error && data?.user) {
        setUser(data.user);
        setSession(data.session);
        await fetchProfile(data.user.id);
        return { error: null };
      }
    } catch {
      // ignore & check local registry
    }

    // 2. Check local user registry for registered account
    const registeredUsers = getStoredUsers();
    const existingAccount = registeredUsers[normalizedEmail];

    // Restrict login if account was not registered
    if (!existingAccount) {
      return { error: 'Invalid login credentials' };
    }

    if (!password || password.length < 1) {
      return { error: 'Please enter your password' };
    }

    // Update saved password to user's active password and log in
    existingAccount.password = password;
    saveUserToRegistry(normalizedEmail, password, existingAccount.profile);
    setLocalProfile(existingAccount.profile, password);
    return { error: null };
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
    }
    toast.info('You have signed out');
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
