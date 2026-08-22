import { NextResponse } from 'next/server';
import { authenticateDiagnosticStaff } from '@/lib/diagnostic-service';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { centre_id, staff_id, password } = body;

    if (!centre_id || !staff_id || !password) {
      return NextResponse.json(
        { success: false, message: 'Centre ID, Staff ID, and Password are required.' },
        { status: 400 }
      );
    }

    const authResult = await authenticateDiagnosticStaff(centre_id, staff_id, password);

    if (!authResult.success || !authResult.centre || !authResult.staff) {
      return NextResponse.json(
        { success: false, message: authResult.message || 'Authentication failed.' },
        { status: 401 }
      );
    }

    const profile = {
      id: authResult.staff.id,
      madiID: authResult.staff.staff_id,
      email: authResult.staff.email,
      role: 'diagnostic' as const,
      full_name: authResult.staff.name,
      date_of_birth: null,
      age: null,
      gender: 'others' as const,
      blood_group: null,
      mobile_number: authResult.centre.contact_number,
      address: authResult.centre.address,
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
      assigned_village: authResult.centre.location,
      specialization: 'Diagnostic Laboratory Services',
      license_number: authResult.centre.centre_id,
      pharmacy_id: null,
      centre_id: authResult.centre.centre_id,
      staff_id: authResult.staff.staff_id,
      staff_role: authResult.staff.role,
      vehicle_number: null,
      vehicle_type: null,
      is_active: true,
      created_at: authResult.staff.created_at,
      updated_at: new Date().toISOString(),
    };

    const response = NextResponse.json({
      success: true,
      message: 'Diagnostic Centre staff signed in successfully!',
      centre: authResult.centre,
      staff: {
        id: authResult.staff.id,
        staff_id: authResult.staff.staff_id,
        name: authResult.staff.name,
        role: authResult.staff.role,
      },
      profile,
    });

    response.cookies.set('pitpulse_logged_in', 'true', { path: '/' });
    response.cookies.set('auth_token', 'diagnostic-token-' + Date.now(), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    });

    return response;
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error?.message || 'Diagnostic authentication error.' },
      { status: 500 }
    );
  }
}
