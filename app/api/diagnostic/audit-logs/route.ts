import { NextResponse } from 'next/server';
import { getCentreAuditLogs } from '@/lib/diagnostic-service';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const centre_id = searchParams.get('centre_id')?.trim().toUpperCase();

  if (!centre_id) {
    return NextResponse.json({ success: false, message: 'centre_id is required' }, { status: 400 });
  }

  const logs = getCentreAuditLogs(centre_id);
  return NextResponse.json({ success: true, logs });
}
