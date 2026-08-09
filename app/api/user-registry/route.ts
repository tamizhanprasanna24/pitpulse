import { NextResponse } from 'next/server';
import type { Profile } from '@/types';

// Global server memory store for cross-device accounts
const globalUserRegistry: Record<string, { password: string; profile: Profile }> = {};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get('email')?.trim().toLowerCase();

  if (!email) {
    return NextResponse.json({ success: false, error: 'Email parameter required' }, { status: 400 });
  }

  const account = globalUserRegistry[email];
  if (account) {
    return NextResponse.json({ success: true, user: account });
  }

  return NextResponse.json({ success: false, message: 'User not found in global registry' });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, profile } = body;

    if (!email || !profile) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();
    globalUserRegistry[normalizedEmail] = { password: password || 'password', profile };

    return NextResponse.json({ success: true, message: 'User registered in global server registry' });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || 'Server error' }, { status: 500 });
  }
}
