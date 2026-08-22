import { NextResponse } from 'next/server';
import { getCentreBookings, diagnosticBookingsStore, logAuditEvent } from '@/lib/diagnostic-service';
import type { SampleStatus, SampleCollectionRecord } from '@/types';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const centre_id = searchParams.get('centre_id')?.trim().toUpperCase();

  if (!centre_id) {
    return NextResponse.json({ success: false, message: 'centre_id is required' }, { status: 400 });
  }

  const bookings = getCentreBookings(centre_id);
  const samples: SampleCollectionRecord[] = bookings.map((b) => ({
    id: 'samp-' + b.id,
    booking_id: b.id,
    centre_id: b.centre_id,
    patient_name: b.patient_name,
    patient_phone: b.patient_phone,
    address: b.is_home_collection ? b.collection_address || 'Home Collection Address' : 'At Diagnostic Centre',
    test_names: b.test_names,
    appointment_time: `${b.scheduled_date} (${b.scheduled_slot})`,
    collector_name: b.collector_name || null,
    collector_staff_id: null,
    status: b.sample_status,
    updated_at: b.updated_at,
  }));

  return NextResponse.json({ success: true, samples });
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { centre_id, staff_id, staff_name, booking_id, status, collector_name } = body;

    if (!centre_id || !booking_id || !status) {
      return NextResponse.json({ success: false, message: 'centre_id, booking_id, and status required.' }, { status: 400 });
    }

    const cleanCentreID = centre_id.trim().toUpperCase();
    const bookings = getCentreBookings(cleanCentreID);
    const booking = bookings.find((b) => b.id === booking_id);

    if (!booking) {
      return NextResponse.json({ success: false, message: 'Booking record not found.' }, { status: 404 });
    }

    booking.sample_status = status as SampleStatus;
    if (collector_name !== undefined) booking.collector_name = collector_name;
    if (status === 'Sample Collected') {
      booking.booking_status = 'Sample Collected';
    }
    booking.updated_at = new Date().toISOString();

    diagnosticBookingsStore.set(cleanCentreID, bookings);

    await logAuditEvent(
      cleanCentreID,
      staff_id || 'LAB_STAFF',
      staff_name || 'Staff',
      'SAMPLE_STATUS_UPDATED',
      booking_id,
      `Sample status set to '${status}' for patient ${booking.patient_name}`
    );

    return NextResponse.json({ success: true, message: 'Sample status updated successfully!', booking });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error?.message || 'Failed to update sample status.' }, { status: 500 });
  }
}
