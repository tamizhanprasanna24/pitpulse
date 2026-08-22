import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { getCentreReports, getCentreBookings, diagnosticReportsStore, diagnosticBookingsStore, logAuditEvent } from '@/lib/diagnostic-service';
import type { DiagnosticReport, ReportStatus } from '@/types';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const centre_id = searchParams.get('centre_id')?.trim().toUpperCase();
  const patient_id = searchParams.get('patient_id')?.trim();
  const doctor_id = searchParams.get('doctor_id')?.trim();

  // 1. Diagnostic Centre Scoped Query
  if (centre_id) {
    const reports = getCentreReports(centre_id);
    return NextResponse.json({ success: true, reports });
  }

  // 2. Patient Scoped Query (Only reports owned by patient)
  if (patient_id) {
    const patientReports: DiagnosticReport[] = [];
    diagnosticReportsStore.forEach((list) => {
      patientReports.push(...list.filter((r) => r.patient_id === patient_id));
    });
    return NextResponse.json({ success: true, reports: patientReports });
  }

  // 3. Doctor Scoped Query (Only reports for doctor's assigned patients)
  if (doctor_id) {
    const doctorReports: DiagnosticReport[] = [];
    diagnosticReportsStore.forEach((list) => {
      doctorReports.push(...list.filter((r) => r.doctor_id === doctor_id));
    });
    return NextResponse.json({ success: true, reports: doctorReports });
  }

  return NextResponse.json({ success: false, message: 'centre_id, patient_id, or doctor_id is required' }, { status: 400 });
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const centre_id = (formData.get('centre_id') as string | null)?.trim().toUpperCase();
    const booking_id = formData.get('booking_id') as string | null;
    const staff_id = (formData.get('staff_id') as string | null) || 'LAB_TECH';
    const staff_name = (formData.get('staff_name') as string | null) || 'Lab Technician';

    if (!centre_id || !booking_id) {
      return NextResponse.json({ success: false, message: 'centre_id and booking_id are required.' }, { status: 400 });
    }

    const bookings = getCentreBookings(centre_id);
    const booking = bookings.find((b) => b.id === booking_id);

    if (!booking) {
      return NextResponse.json({ success: false, message: 'Booking not found.' }, { status: 404 });
    }

    // Default parameters if file upload payload is text metadata or mock file
    let fileName = file?.name || `Diagnostic_Report_${booking.booking_code}.pdf`;
    let fileType: 'pdf' | 'jpg' | 'png' = 'pdf';
    let fileSize = file?.size || 154200;

    if (file) {
      const ext = fileName.split('.').pop()?.toLowerCase();
      if (!['pdf', 'jpg', 'jpeg', 'png'].includes(ext || '')) {
        return NextResponse.json(
          { success: false, message: 'Invalid file format. Only PDF, JPG, and PNG files are allowed.' },
          { status: 400 }
        );
      }
      fileType = (ext === 'jpeg' ? 'jpg' : ext) as 'pdf' | 'jpg' | 'png';

      // 10 MB Max Size Validation
      if (fileSize > 10 * 1024 * 1024) {
        return NextResponse.json(
          { success: false, message: 'File size exceeds maximum limit of 10MB.' },
          { status: 400 }
        );
      }
    }

    // Cryptographically generate secure file key (No public file paths exposed)
    const secureFileKey = 'sec-doc-' + crypto.randomBytes(16).toString('hex');
    const secureFileUrl = `/api/diagnostic/reports/download?key=${secureFileKey}`;

    const report: DiagnosticReport = {
      id: 'rep-' + Date.now(),
      booking_id: booking.id,
      centre_id,
      centre_name: 'Diagnostic Centre',
      patient_id: booking.patient_id,
      patient_name: booking.patient_name,
      doctor_id: booking.doctor_id,
      doctor_name: booking.doctor_name,
      test_name: booking.test_names.join(', '),
      file_name: fileName,
      file_type: fileType,
      file_size: fileSize,
      secure_file_key: secureFileKey,
      file_url: secureFileUrl,
      status: 'Uploaded',
      uploaded_by_staff_id: staff_id,
      uploaded_by_name: staff_name,
      created_at: new Date().toISOString(),
    };

    const centreReports = getCentreReports(centre_id);
    centreReports.unshift(report);
    diagnosticReportsStore.set(centre_id, centreReports);

    // Update Booking status to Report Ready
    booking.booking_status = 'Report Ready';
    booking.updated_at = new Date().toISOString();
    diagnosticBookingsStore.set(centre_id, bookings);

    await logAuditEvent(
      centre_id,
      staff_id,
      staff_name,
      'REPORT_UPLOADED',
      report.id,
      `Uploaded diagnostic report for booking ${booking.booking_code} (Patient: ${booking.patient_name})`
    );

    return NextResponse.json({
      success: true,
      message: 'Diagnostic report uploaded and linked securely to patient & doctor records!',
      report,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error?.message || 'Failed to upload report.' }, { status: 500 });
  }
}
