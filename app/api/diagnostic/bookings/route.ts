import { NextResponse } from 'next/server';
import { getCentreBookings, diagnosticBookingsStore, logAuditEvent, diagnosticCentresStore } from '@/lib/diagnostic-service';
import type { DiagnosticBooking, BookingStatus, SampleStatus } from '@/types';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const centre_id = searchParams.get('centre_id')?.trim().toUpperCase();
  const patient_id = searchParams.get('patient_id')?.trim();
  const doctor_id = searchParams.get('doctor_id')?.trim();

  // 1. Scoped query for Diagnostic Centre
  if (centre_id) {
    const bookings = getCentreBookings(centre_id);
    return NextResponse.json({ success: true, bookings });
  }

  // 2. Scoped query for Patient
  if (patient_id) {
    const allBookings: DiagnosticBooking[] = [];
    diagnosticBookingsStore.forEach((list) => {
      allBookings.push(...list.filter((b) => b.patient_id === patient_id));
    });
    return NextResponse.json({ success: true, bookings: allBookings });
  }

  // 3. Scoped query for Doctor
  if (doctor_id) {
    const allBookings: DiagnosticBooking[] = [];
    diagnosticBookingsStore.forEach((list) => {
      allBookings.push(...list.filter((b) => b.doctor_id === doctor_id));
    });
    return NextResponse.json({ success: true, bookings: allBookings });
  }

  return NextResponse.json({ success: false, message: 'centre_id, patient_id, or doctor_id is required' }, { status: 400 });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      centre_id,
      patient_id,
      patient_name,
      patient_phone,
      patient_age,
      patient_gender,
      patient_address,
      doctor_id,
      doctor_name,
      test_ids,
      test_names,
      total_price,
      is_home_collection,
      collection_address,
      scheduled_date,
      scheduled_slot,
      notes,
    } = body;

    if (!centre_id || !patient_name || !test_names || test_names.length === 0) {
      return NextResponse.json({ success: false, message: 'Missing required booking details.' }, { status: 400 });
    }

    const cleanCentreID = centre_id.trim().toUpperCase();
    const centreBookings = getCentreBookings(cleanCentreID);

    const booking: DiagnosticBooking = {
      id: 'bk-' + Date.now(),
      booking_code: 'DXB-' + Math.floor(100000 + Math.random() * 900000),
      centre_id: cleanCentreID,
      patient_id: patient_id || 'usr-pat-guest',
      patient_name,
      patient_phone: patient_phone || '+91 98765 00000',
      patient_age: patient_age ? Number(patient_age) : null,
      patient_gender: patient_gender || null,
      patient_address: patient_address || collection_address || null,
      doctor_id: doctor_id || null,
      doctor_name: doctor_name || null,
      test_ids: test_ids || [],
      test_names: Array.isArray(test_names) ? test_names : [test_names],
      total_price: Number(total_price) || 500,
      is_home_collection: Boolean(is_home_collection),
      collection_address: collection_address || null,
      booking_status: 'Pending',
      sample_status: is_home_collection ? 'Requested' : 'Scheduled',
      scheduled_date: scheduled_date || new Date().toISOString().split('T')[0],
      scheduled_slot: scheduled_slot || '10:00 AM - 11:00 AM',
      notes: notes || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    centreBookings.unshift(booking);
    diagnosticBookingsStore.set(cleanCentreID, centreBookings);

    await logAuditEvent(
      cleanCentreID,
      'PATIENT/STAFF',
      patient_name,
      'TEST_BOOKED',
      booking.id,
      `New booking ${booking.booking_code} created for ${test_names.join(', ')}`
    );

    return NextResponse.json({ success: true, booking, message: 'Diagnostic test booked successfully!' });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error?.message || 'Failed to create booking.' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { centre_id, staff_id, staff_name, booking_id, booking_status, sample_status, collector_name } = body;

    if (!centre_id || !booking_id) {
      return NextResponse.json({ success: false, message: 'centre_id and booking_id are required.' }, { status: 400 });
    }

    const cleanCentreID = centre_id.trim().toUpperCase();
    const centreBookings = getCentreBookings(cleanCentreID);
    const booking = centreBookings.find((b) => b.id === booking_id);

    if (!booking) {
      return NextResponse.json({ success: false, message: 'Booking not found.' }, { status: 404 });
    }

    if (booking_status) booking.booking_status = booking_status as BookingStatus;
    if (sample_status) booking.sample_status = sample_status as SampleStatus;
    if (collector_name !== undefined) booking.collector_name = collector_name;
    booking.updated_at = new Date().toISOString();

    diagnosticBookingsStore.set(cleanCentreID, centreBookings);

    await logAuditEvent(
      cleanCentreID,
      staff_id || 'STAFF',
      staff_name || 'Staff',
      'BOOKING_UPDATED',
      booking_id,
      `Booking ${booking.booking_code} status updated: Booking=${booking.booking_status}, Sample=${booking.sample_status}`
    );

    return NextResponse.json({ success: true, booking, message: 'Booking status updated successfully!' });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error?.message || 'Failed to update booking.' }, { status: 500 });
  }
}
