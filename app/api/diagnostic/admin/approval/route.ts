import { NextResponse } from 'next/server';
import { diagnosticCentresStore, logAuditEvent } from '@/lib/diagnostic-service';
import type { DiagnosticCentre } from '@/types';

export async function GET() {
  const centres: DiagnosticCentre[] = [];
  diagnosticCentresStore.forEach((c) => centres.push(c));
  return NextResponse.json({ success: true, centres });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { centre_id, action, admin_id, admin_name } = body;

    if (!centre_id || !action || !['approve', 'reject', 'suspend'].includes(action)) {
      return NextResponse.json({ success: false, message: 'centre_id and valid action are required.' }, { status: 400 });
    }

    const cleanCentreID = centre_id.trim().toUpperCase();
    const centre = diagnosticCentresStore.get(cleanCentreID);

    if (!centre) {
      return NextResponse.json({ success: false, message: 'Diagnostic Centre not found.' }, { status: 404 });
    }

    if (action === 'approve') {
      centre.status = 'approved';
    } else if (action === 'reject') {
      centre.status = 'rejected';
    } else if (action === 'suspend') {
      centre.status = 'suspended';
    }

    centre.updated_at = new Date().toISOString();
    diagnosticCentresStore.set(cleanCentreID, centre);

    await logAuditEvent(
      cleanCentreID,
      admin_id || 'ADMIN_USER',
      admin_name || 'Pit Pulse Admin',
      `CENTRE_${action.toUpperCase()}D`,
      centre.id,
      `Diagnostic Centre status set to ${centre.status.toUpperCase()} by Admin ${admin_name || ''}`
    );

    return NextResponse.json({
      success: true,
      message: `Diagnostic Centre ${centre.centre_name} (${cleanCentreID}) has been ${action}d successfully!`,
      centre,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error?.message || 'Failed to update approval status.' }, { status: 500 });
  }
}
