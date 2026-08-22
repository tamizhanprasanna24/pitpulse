import { NextResponse } from 'next/server';
import { registerDiagnosticCentre } from '@/lib/diagnostic-service';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      centre_name,
      address,
      location,
      contact_number,
      official_email,
      admin_staff_name,
      admin_staff_id,
      password,
    } = body;

    if (
      !centre_name ||
      !address ||
      !location ||
      !contact_number ||
      !official_email ||
      !admin_staff_name ||
      !admin_staff_id ||
      !password
    ) {
      return NextResponse.json(
        { success: false, message: 'All required fields must be provided.' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { success: false, message: 'Password must be at least 6 characters long.' },
        { status: 400 }
      );
    }

    const { centre, adminStaff } = await registerDiagnosticCentre({
      centre_name,
      address,
      location,
      contact_number,
      official_email,
      admin_staff_name,
      admin_staff_id,
      password,
    });

    return NextResponse.json({
      success: true,
      message: 'Diagnostic Centre registered successfully! Pending Pit Pulse Admin verification.',
      centre: {
        centre_name: centre.centre_name,
        centre_id: centre.centre_id, // Unpredictable secure Centre ID
        official_email: centre.official_email,
        status: centre.status,
        admin_staff_name: centre.admin_staff_name,
        admin_staff_id: centre.admin_staff_id,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error?.message || 'Failed to register Diagnostic Centre.' },
      { status: 500 }
    );
  }
}
