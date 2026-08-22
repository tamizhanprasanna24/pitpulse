import { NextResponse } from 'next/server';
import { getCentreTests, diagnosticTestsStore, logAuditEvent } from '@/lib/diagnostic-service';
import type { DiagnosticTest } from '@/types';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const centre_id = searchParams.get('centre_id')?.trim().toUpperCase();

  if (!centre_id) {
    return NextResponse.json({ success: false, message: 'centre_id is required' }, { status: 400 });
  }

  const tests = getCentreTests(centre_id);
  return NextResponse.json({ success: true, tests });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      centre_id,
      staff_id,
      staff_name,
      name,
      category,
      price,
      prep_instructions,
      est_completion_hours,
      home_collection_available,
    } = body;

    if (!centre_id || !name || !price) {
      return NextResponse.json({ success: false, message: 'Missing required test fields.' }, { status: 400 });
    }

    const cleanCentreID = centre_id.trim().toUpperCase();
    const tests = getCentreTests(cleanCentreID);

    const newTest: DiagnosticTest = {
      id: 'test-' + Date.now(),
      centre_id: cleanCentreID,
      name,
      category: category || 'General Pathology',
      price: Number(price),
      prep_instructions: prep_instructions || 'None',
      est_completion_hours: Number(est_completion_hours) || 12,
      home_collection_available: Boolean(home_collection_available),
      is_active: true,
      created_at: new Date().toISOString(),
    };

    tests.push(newTest);
    diagnosticTestsStore.set(cleanCentreID, tests);

    await logAuditEvent(
      cleanCentreID,
      staff_id || 'ADMIN',
      staff_name || 'Staff',
      'TEST_CREATED',
      newTest.id,
      `Added new test: ${name} (Price: ₹${price})`
    );

    return NextResponse.json({ success: true, test: newTest, message: 'Diagnostic test added successfully!' });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error?.message || 'Failed to add test.' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { centre_id, staff_id, staff_name, test_id, name, price, is_active, home_collection_available } = body;

    if (!centre_id || !test_id) {
      return NextResponse.json({ success: false, message: 'centre_id and test_id required.' }, { status: 400 });
    }

    const cleanCentreID = centre_id.trim().toUpperCase();
    const tests = getCentreTests(cleanCentreID);
    const testIndex = tests.findIndex((t) => t.id === test_id);

    if (testIndex === -1) {
      return NextResponse.json({ success: false, message: 'Test not found.' }, { status: 404 });
    }

    if (name !== undefined) tests[testIndex].name = name;
    if (price !== undefined) tests[testIndex].price = Number(price);
    if (is_active !== undefined) tests[testIndex].is_active = Boolean(is_active);
    if (home_collection_available !== undefined) tests[testIndex].home_collection_available = Boolean(home_collection_available);

    diagnosticTestsStore.set(cleanCentreID, tests);

    await logAuditEvent(
      cleanCentreID,
      staff_id || 'ADMIN',
      staff_name || 'Staff',
      'TEST_UPDATED',
      test_id,
      `Updated test ${tests[testIndex].name}`
    );

    return NextResponse.json({ success: true, test: tests[testIndex], message: 'Test updated successfully!' });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error?.message || 'Failed to update test.' }, { status: 500 });
  }
}
