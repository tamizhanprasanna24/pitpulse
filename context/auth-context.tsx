'use client';

import * as React from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import type { Profile, UserRole } from '@/types';
import { toast } from 'sonner';

export const DEMO_PROFILES: Record<UserRole, Profile> = {
  patient: {
    id: 'demo-patient-id-12345',
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
    profile_photo: null,
    is_pregnant: true,
    pregnancy_week: 24,
    expected_delivery_date: '2026-11-20',
    previous_pregnancies: 1,
    maternal_health_history: 'Normal previous delivery, routine prenatal care',
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
  doctor: {
    id: 'demo-doctor-id-12345',
    email: 'doctor@pitpulse.org',
    role: 'doctor',
    full_name: 'Dr. Rajesh Verma',
    date_of_birth: '1982-08-10',
    age: 44,
    gender: 'male',
    blood_group: 'B+',
    mobile_number: '+91 98765 11111',
    address: 'City General Hospital, Civil Lines, Rampur',
    emergency_contact: '+91 98765 22222',
    medical_history: null,
    allergies: null,
    chronic_diseases: null,
    current_medications: null,
    height: 175,
    weight: 72,
    bmi: 23.5,
    profile_photo: null,
    is_pregnant: false,
    pregnancy_week: null,
    expected_delivery_date: null,
    previous_pregnancies: 0,
    maternal_health_history: null,
    assigned_village: null,
    specialization: 'General Physician & Cardiology Specialist',
    license_number: 'MCI-884920-IND',
    pharmacy_id: null,
    vehicle_number: null,
    vehicle_type: null,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  asha: {
    id: 'demo-asha-id-12345',
    email: 'asha@pitpulse.org',
    role: 'asha',
    full_name: 'Sunita Devi (ASHA Worker)',
    date_of_birth: '1988-12-04',
    age: 37,
    gender: 'female',
    blood_group: 'A+',
    mobile_number: '+91 98765 33333',
    address: 'Community Health Center, Rampur Village',
    emergency_contact: '+91 98765 44444',
    medical_history: null,
    allergies: null,
    chronic_diseases: null,
    current_medications: null,
    height: 158,
    weight: 55,
    bmi: 22.0,
    profile_photo: null,
    is_pregnant: false,
    pregnancy_week: null,
    expected_delivery_date: null,
    previous_pregnancies: 2,
    maternal_health_history: null,
    assigned_village: 'Rampur Village & Nearby Hamlets',
    specialization: null,
    license_number: 'ASHA-V-9912',
    pharmacy_id: null,
    vehicle_number: null,
    vehicle_type: null,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  pharmacy: {
    id: 'demo-pharmacy-id-12345',
    email: 'pharmacy@pitpulse.org',
    role: 'pharmacy',
    full_name: 'Apollo Lifecare Pharmacy (Manager: Anil Mehta)',
    date_of_birth: '1980-03-22',
    age: 46,
    gender: 'male',
    blood_group: 'AB+',
    mobile_number: '+91 98765 55555',
    address: 'Shop 12, Main Market Road, Rampur',
    emergency_contact: '+91 98765 66666',
    medical_history: null,
    allergies: null,
    chronic_diseases: null,
    current_medications: null,
    height: 170,
    weight: 68,
    bmi: 23.5,
    profile_photo: null,
    is_pregnant: false,
    pregnancy_week: null,
    expected_delivery_date: null,
    previous_pregnancies: 0,
    maternal_health_history: null,
    assigned_village: null,
    specialization: null,
    license_number: 'PHARM-LICENSE-2024-88',
    pharmacy_id: 'pharma-store-001',
    vehicle_number: null,
    vehicle_type: null,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  delivery: {
    id: 'demo-delivery-id-12345',
    email: 'delivery@pitpulse.org',
    role: 'delivery',
    full_name: 'Vikram Singh (Express Delivery)',
    date_of_birth: '1998-07-19',
    age: 28,
    gender: 'male',
    blood_group: 'O-',
    mobile_number: '+91 98765 77777',
    address: 'Transport Hub, Rampur Sector 4',
    emergency_contact: '+91 98765 88888',
    medical_history: null,
    allergies: null,
    chronic_diseases: null,
    current_medications: null,
    height: 178,
    weight: 74,
    bmi: 23.4,
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
    vehicle_type: 'Motorcycle',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
};

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
  loginAsDemoUser: (role: UserRole) => void;
  setLocalProfile: (p: Profile) => void;
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

  const setLocalProfile = (p: Profile) => {
    setProfile(p);
    setUser({ id: p.id, email: p.email } as User);
    if (typeof window !== 'undefined') {
      localStorage.setItem(LOCAL_STORAGE_PROFILE_KEY, JSON.stringify(p));
    }
  };

  const loginAsDemoUser = (role: UserRole) => {
    const p = DEMO_PROFILES[role];
    setLocalProfile(p);
    toast.success(`Signed in as ${p.full_name} (${role.toUpperCase()})`);
  };

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (!error && data?.user) {
      setUser(data.user);
      setSession(data.session);
      await fetchProfile(data.user.id);
      return { error: null };
    }

    // Fallback match against known demo email or active local profile
    const matchedDemoRole = (Object.keys(DEMO_PROFILES) as UserRole[]).find(
      (r) => DEMO_PROFILES[r].email.toLowerCase() === email.toLowerCase()
    );

    if (matchedDemoRole) {
      const demoProf = DEMO_PROFILES[matchedDemoRole];
      setLocalProfile(demoProf);
      return { error: null };
    }

    if (error) {
      return { error: error.message };
    }

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
        // Code matched! Check demo or existing local profile
        const matchedDemoRole = (Object.keys(DEMO_PROFILES) as UserRole[]).find(
          (r) => DEMO_PROFILES[r].email.toLowerCase() === email.toLowerCase()
        );

        if (matchedDemoRole) {
          setLocalProfile(DEMO_PROFILES[matchedDemoRole]);
          return { error: null };
        }

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
        loginAsDemoUser,
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
