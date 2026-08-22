import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { authenticateDiagnosticStaff, diagnosticCentresStore, diagnosticStaffStore } from '@/lib/diagnostic-service';
import type { DiagnosticCentre, DiagnosticStaff } from '@/types';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    let { centre_id, email, staff_id, password } = body;

    const inputIdentifier = (centre_id || email || '').trim();

    if (!inputIdentifier || !password) {
      return NextResponse.json(
        { success: false, message: 'Official Email or Centre ID and Password are required.' },
        { status: 400 }
      );
    }

    let targetCentreID = inputIdentifier.toUpperCase();
    let targetStaffID = (staff_id || '').trim().toUpperCase();

    // If identifier is an email (e.g. info@apollodiagnostics.in), resolve Centre ID and Staff ID
    if (inputIdentifier.includes('@')) {
      const cleanEmail = inputIdentifier.toLowerCase();

      // Check if this email is an ASHA Worker, Patient, Doctor, Pharmacy, or Delivery Partner account
      try {
        const { data: userProfile } = await supabase
          .from('profiles')
          .select('role, full_name')
          .eq('email', cleanEmail)
          .maybeSingle();

        if (userProfile && userProfile.role !== 'diagnostic') {
          const roleLabel =
            userProfile.role === 'asha' ? 'ASHA Worker' :
            userProfile.role === 'doctor' ? 'Doctor / Admin' :
            userProfile.role === 'pharmacy' ? 'Pharmacy' :
            userProfile.role === 'delivery' ? 'Delivery Partner' : 'Patient';

          return NextResponse.json(
            {
              success: false,
              message: `Access Denied: This account (${cleanEmail}) is registered as an ${roleLabel} account, not a Diagnostic Centre. Please switch to the "Standard Portal" tab to sign in.`
            },
            { status: 403 }
          );
        }
      } catch {
        // ignore fallback
      }

      let matchedCentre: DiagnosticCentre | undefined;
      let matchedStaff: DiagnosticStaff | undefined;

      // Find by official email in diagnostic centres
      diagnosticCentresStore.forEach((c) => {
        if (c.official_email === cleanEmail) matchedCentre = c;
      });

      if (matchedCentre) {
        targetCentreID = matchedCentre.centre_id;
        const staffList = diagnosticStaffStore.get(targetCentreID) || [];
        matchedStaff = staffList.find((s) => s.role === 'centre_admin') || staffList[0];
        if (matchedStaff) {
          targetStaffID = matchedStaff.staff_id;
        }
      } else {
        // Find staff by email
        diagnosticStaffStore.forEach((staffList, cId) => {
          const found = staffList.find((s) => s.email.toLowerCase() === cleanEmail);
          if (found) {
            targetCentreID = cId;
            targetStaffID = found.staff_id;
          }
        });
      }
    }

    // If staff ID is omitted, default to ADMIN-01 or first staff of the centre
    if (!targetStaffID && targetCentreID) {
      const staffList = diagnosticStaffStore.get(targetCentreID) || [];
      const adminStaff = staffList.find((s) => s.role === 'centre_admin') || staffList[0];
      if (adminStaff) {
        targetStaffID = adminStaff.staff_id;
      } else {
        targetStaffID = 'STAFF-ADMIN-01';
      }
    }

    const authResult = await authenticateDiagnosticStaff(targetCentreID, targetStaffID, password);

    if (!authResult.success || !authResult.centre || !authResult.staff) {
      return NextResponse.json(
        { success: false, message: authResult.message || 'Invalid Diagnostic Centre credentials or password.' },
        { status: 401 }
      );
    }

    const profile = {
      id: authResult.staff.id,
      madiID: authResult.staff.staff_id,
      email: authResult.staff.email,
      role: 'diagnostic' as const,
      full_name: authResult.centre.centre_name, // Primary display name is Diagnostic Centre Name
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
      message: 'Diagnostic Centre signed in successfully!',
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
