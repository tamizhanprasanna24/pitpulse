import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { supabase } from '@/lib/supabase';
import type {
  DiagnosticCentre,
  DiagnosticStaff,
  DiagnosticTest,
  DiagnosticBooking,
  DiagnosticReport,
  AuditLog,
  DiagnosticStaffRole,
  DiagnosticCentreStatus,
  BookingStatus,
  SampleStatus,
  ReportStatus
} from '@/types';

const SALT_ROUNDS = 10;

// Memory Cache for Data Isolation and Fast Access
export const diagnosticCentresStore = new Map<string, DiagnosticCentre>();
export const diagnosticStaffStore = new Map<string, DiagnosticStaff[]>();
export const diagnosticTestsStore = new Map<string, DiagnosticTest[]>();
export const diagnosticBookingsStore = new Map<string, DiagnosticBooking[]>();
export const diagnosticReportsStore = new Map<string, DiagnosticReport[]>();
export const auditLogsStore = new Map<string, AuditLog[]>();

// Failed Login Lockout Tracker: key -> { count: number, lockedUntil: number }
const loginLockoutMap = new Map<string, { count: number; lockedUntil: number }>();

/**
 * 1. Cryptographically Secure Centre ID Generator
 * Format: [CENTRE-NAME]-[8-CHAR-CRYPTOGRAPHIC-HEX]
 * Example: APOLLO-7F2K91QM
 */
export function generateSecureCentreID(centreName: string): string {
  const safePrefix = centreName
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 16) || 'DIAGNOSTIC';

  // 8 hex chars generated cryptographically
  const randomHex = crypto.randomBytes(4).toString('hex').toUpperCase();
  return `${safePrefix}-${randomHex}`;
}

/**
 * Audit Logging Helper
 */
export async function logAuditEvent(
  centre_id: string,
  staff_id: string,
  staff_name: string,
  action: string,
  record_ref: string | null = null,
  details: string | null = null
): Promise<AuditLog> {
  const entry: AuditLog = {
    id: 'log-' + Date.now() + '-' + crypto.randomBytes(2).toString('hex'),
    centre_id,
    staff_id,
    staff_name,
    action,
    record_ref,
    details,
    timestamp: new Date().toISOString(),
  };

  const logs = auditLogsStore.get(centre_id) || [];
  logs.unshift(entry);
  auditLogsStore.set(centre_id, logs);

  try {
    await supabase.from('diagnostic_audit_logs').insert(entry);
  } catch {
    // DB fallback
  }

  return entry;
}

/**
 * Lockout Guard (5 failed attempts -> 15 min lock)
 */
export function checkLockout(key: string): { locked: boolean; remainingMinutes?: number } {
  const record = loginLockoutMap.get(key);
  if (!record) return { locked: false };

  if (Date.now() < record.lockedUntil) {
    const remainingMs = record.lockedUntil - Date.now();
    return { locked: true, remainingMinutes: Math.ceil(remainingMs / 60000) };
  }

  // Lock expired
  if (Date.now() >= record.lockedUntil && record.count >= 5) {
    loginLockoutMap.delete(key);
  }
  return { locked: false };
}

export function recordFailedLogin(key: string): void {
  const record = loginLockoutMap.get(key) || { count: 0, lockedUntil: 0 };
  record.count += 1;
  if (record.count >= 5) {
    record.lockedUntil = Date.now() + 15 * 60 * 1000; // 15 min lock
  }
  loginLockoutMap.set(key, record);
}

export function resetLockout(key: string): void {
  loginLockoutMap.delete(key);
}

/**
 * Diagnostic Centre Registration Handler
 */
export async function registerDiagnosticCentre(data: {
  centre_name: string;
  address: string;
  location: string;
  contact_number: string;
  official_email: string;
  admin_staff_name: string;
  admin_staff_id: string;
  password: string;
}): Promise<{ centre: DiagnosticCentre; adminStaff: DiagnosticStaff }> {
  // Generate Cryptographically Secure Unpredictable Centre ID
  let centre_id = generateSecureCentreID(data.centre_name);
  while (diagnosticCentresStore.has(centre_id)) {
    centre_id = generateSecureCentreID(data.centre_name);
  }

  const centre: DiagnosticCentre = {
    id: 'dc-' + Date.now(),
    centre_name: data.centre_name,
    centre_id,
    address: data.address,
    location: data.location,
    contact_number: data.contact_number,
    official_email: data.official_email.toLowerCase(),
    status: 'pending_verification', // Requires Pit Pulse Doctor/Admin approval
    admin_staff_name: data.admin_staff_name,
    admin_staff_id: data.admin_staff_id.trim().toUpperCase(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const passwordHash = await bcrypt.hash(data.password, SALT_ROUNDS);

  const adminStaff: DiagnosticStaff = {
    id: 'staff-' + Date.now(),
    centre_id,
    staff_id: data.admin_staff_id.trim().toUpperCase(),
    name: data.admin_staff_name,
    email: data.official_email.toLowerCase(),
    role: 'centre_admin',
    passwordHash,
    passcode: data.password,
    is_active: true,
    created_at: new Date().toISOString(),
  };

  // Store in memory cache
  diagnosticCentresStore.set(centre_id, centre);
  diagnosticStaffStore.set(centre_id, [adminStaff]);

  // Seed default tests for the centre
  seedDefaultTests(centre_id);

  // Persist to Supabase
  try {
    await supabase.from('diagnostic_centres').insert(centre);
    await supabase.from('diagnostic_staff').insert({ ...adminStaff, passcode: data.password });
  } catch {
    // ignore DB fallback
  }

  await logAuditEvent(
    centre_id,
    adminStaff.staff_id,
    adminStaff.name,
    'CENTRE_REGISTERED',
    centre_id,
    `Centre ${data.centre_name} submitted for admin verification.`
  );

  return { centre, adminStaff };
}

/**
 * Diagnostic Staff Authentication Handler
 */
export async function authenticateDiagnosticStaff(
  centre_id: string,
  staff_id: string,
  password: string
): Promise<{ success: boolean; centre?: DiagnosticCentre; staff?: DiagnosticStaff; message?: string }> {
  const cleanCentreID = centre_id.trim().toUpperCase();
  const cleanStaffID = staff_id.trim().toUpperCase();
  const lockoutKey = `${cleanCentreID}:${cleanStaffID}`;

  // 1. Check Lockout
  const lock = checkLockout(lockoutKey);
  if (lock.locked) {
    return {
      success: false,
      message: `Account locked due to repeated failed logins. Please try again in ${lock.remainingMinutes} minutes.`
    };
  }

  // 2. Fetch Centre Record
  let centre = diagnosticCentresStore.get(cleanCentreID);
  if (!centre) {
    try {
      const { data } = await supabase
        .from('diagnostic_centres')
        .select('*')
        .eq('centre_id', cleanCentreID)
        .maybeSingle();
      if (data) {
        centre = data as DiagnosticCentre;
        diagnosticCentresStore.set(cleanCentreID, centre);
      }
    } catch {
      // ignore
    }
  }

  if (!centre) {
    recordFailedLogin(lockoutKey);
    return { success: false, message: 'Invalid Centre ID or Staff credentials.' };
  }

  // 3. Verify Centre Verification Status
  if (centre.status === 'pending_verification') {
    return {
      success: false,
      message: 'Your Diagnostic Centre is pending Pit Pulse Admin review & verification. Please wait for approval.'
    };
  }

  if (centre.status === 'rejected' || centre.status === 'suspended') {
    return {
      success: false,
      message: `Access denied. Your centre account status is currently ${centre.status.toUpperCase()}.`
    };
  }

  // 4. Fetch Staff Record
  let staffList = diagnosticStaffStore.get(cleanCentreID) || [];
  let staff = staffList.find(s => s.staff_id === cleanStaffID);

  if (!staff) {
    try {
      const { data } = await supabase
        .from('diagnostic_staff')
        .select('*')
        .eq('centre_id', cleanCentreID)
        .eq('staff_id', cleanStaffID)
        .maybeSingle();
      if (data) {
        staff = data as DiagnosticStaff;
      }
    } catch {
      // ignore
    }
  }

  if (!staff || !staff.is_active) {
    recordFailedLogin(lockoutKey);
    await logAuditEvent(cleanCentreID, cleanStaffID, 'UNKNOWN', 'FAILED_LOGIN_ATTEMPT', null, 'Invalid staff ID or inactive account');
    return { success: false, message: 'Invalid Staff ID or inactive account.' };
  }

  // 5. Password Verification
  const expectedPass = staff.passcode || staff.passwordHash;
  let match = false;

  if (expectedPass) {
    if (expectedPass === password || expectedPass.toLowerCase() === password.trim().toLowerCase()) {
      match = true;
    } else if (expectedPass.startsWith('$2a$') || expectedPass.startsWith('$2b$')) {
      try {
        match = bcrypt.compareSync(password.trim(), expectedPass);
      } catch {
        match = false;
      }
    }
  }

  if (!match) {
    recordFailedLogin(lockoutKey);
    await logAuditEvent(cleanCentreID, staff.staff_id, staff.name, 'FAILED_LOGIN_ATTEMPT', null, 'Incorrect password');
    return { success: false, message: 'Invalid Staff ID or Password.' };
  }

  // Success: Reset lockout & Log audit event
  resetLockout(lockoutKey);
  await logAuditEvent(cleanCentreID, staff.staff_id, staff.name, 'STAFF_LOGIN_SUCCESS', staff.id, 'Logged in to Diagnostic Centre Portal');

  return { success: true, centre, staff };
}

/**
 * Seed Default Tests for New Diagnostic Centre
 */

export function seedDefaultTests(centre_id: string): DiagnosticTest[] {
  const defaultList: Omit<DiagnosticTest, 'id' | 'created_at'>[] = [
    { centre_id, name: 'Complete Blood Count (CBC)', category: 'Hematology', price: 350, prep_instructions: 'No fasting required.', est_completion_hours: 6, home_collection_available: true, is_active: true },
    { centre_id, name: 'Fasting Blood Sugar (FBS)', category: 'Biochemistry', price: 150, prep_instructions: 'Fast for 8-10 hours overnight.', est_completion_hours: 4, home_collection_available: true, is_active: true },
    { centre_id, name: 'Lipid Profile', category: 'Biochemistry', price: 750, prep_instructions: '12-hour fasting required.', est_completion_hours: 12, home_collection_available: true, is_active: true },
    { centre_id, name: 'Liver Function Test (LFT)', category: 'Biochemistry', price: 650, prep_instructions: 'Fasting recommended.', est_completion_hours: 12, home_collection_available: true, is_active: true },
    { centre_id, name: 'Kidney Function Test (KFT)', category: 'Biochemistry', price: 600, prep_instructions: 'Stay hydrated.', est_completion_hours: 12, home_collection_available: true, is_active: true },
    { centre_id, name: 'Urine Routine Examination', category: 'Pathology', price: 200, prep_instructions: 'Collect mid-stream morning sample.', est_completion_hours: 4, home_collection_available: true, is_active: true },
    { centre_id, name: 'Chest X-Ray PA View', category: 'Radiology', price: 450, prep_instructions: 'Remove metallic objects.', est_completion_hours: 2, home_collection_available: false, is_active: true },
    { centre_id, name: 'Abdomen & Pelvis Ultrasound', category: 'Radiology', price: 1200, prep_instructions: 'Full bladder required.', est_completion_hours: 2, home_collection_available: false, is_active: true },
  ];

  const tests: DiagnosticTest[] = defaultList.map((t, idx) => ({
    ...t,
    id: `test-${centre_id}-${idx + 1}`,
    created_at: new Date().toISOString(),
  }));

  diagnosticTestsStore.set(centre_id, tests);
  return tests;
}

/**
 * Data Isolation Query Helpers (Strictly Scoped by Centre ID)
 */

export function getCentreTests(centre_id: string): DiagnosticTest[] {
  if (!diagnosticTestsStore.has(centre_id)) {
    seedDefaultTests(centre_id);
  }
  return diagnosticTestsStore.get(centre_id) || [];
}

export function getCentreBookings(centre_id: string): DiagnosticBooking[] {
  return diagnosticBookingsStore.get(centre_id) || [];
}

export function getCentreReports(centre_id: string): DiagnosticReport[] {
  return diagnosticReportsStore.get(centre_id) || [];
}

export function getCentreStaff(centre_id: string): DiagnosticStaff[] {
  return diagnosticStaffStore.get(centre_id) || [];
}

export function getCentreAuditLogs(centre_id: string): AuditLog[] {
  return auditLogsStore.get(centre_id) || [];
}
