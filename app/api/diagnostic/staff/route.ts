import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getCentreStaff, diagnosticStaffStore, logAuditEvent } from '@/lib/diagnostic-service';
import type { DiagnosticStaff, DiagnosticStaffRole } from '@/types';

const SALT_ROUNDS = 10;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const centre_id = searchParams.get('centre_id')?.trim().toUpperCase();

  if (!centre_id) {
    return NextResponse.json({ success: false, message: 'centre_id is required' }, { status: 400 });
  }

  const staffList = getCentreStaff(centre_id);
  const safeStaff = staffList.map(({ passwordHash, passcode, ...rest }) => rest);

  return NextResponse.json({ success: true, staff: safeStaff });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { centre_id, admin_staff_id, admin_staff_name, name, email, staff_id, role, password } = body;

    if (!centre_id || !name || !email || !staff_id || !role || !password) {
      return NextResponse.json({ success: false, message: 'All staff details are required.' }, { status: 400 });
    }

    const cleanCentreID = centre_id.trim().toUpperCase();
    const cleanStaffID = staff_id.trim().toUpperCase();
    const staffList = getCentreStaff(cleanCentreID);

    if (staffList.some((s) => s.staff_id === cleanStaffID)) {
      return NextResponse.json({ success: false, message: 'A staff member with this Staff ID already exists in this centre.' }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    const newStaff: DiagnosticStaff = {
      id: 'staff-' + Date.now(),
      centre_id: cleanCentreID,
      staff_id: cleanStaffID,
      name,
      email: email.toLowerCase(),
      role: role as DiagnosticStaffRole,
      passwordHash,
      passcode: password,
      is_active: true,
      created_at: new Date().toISOString(),
    };

    staffList.push(newStaff);
    diagnosticStaffStore.set(cleanCentreID, staffList);

    await logAuditEvent(
      cleanCentreID,
      admin_staff_id || 'ADMIN',
      admin_staff_name || 'Admin',
      'STAFF_CREATED',
      newStaff.id,
      `Added staff ${name} (${role.toUpperCase()}, Staff ID: ${cleanStaffID})`
    );

    const { passwordHash: _, passcode: __, ...safeStaff } = newStaff;
    return NextResponse.json({ success: true, staff: safeStaff, message: 'Staff member account created successfully!' });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error?.message || 'Failed to create staff account.' }, { status: 500 });
  }
}
