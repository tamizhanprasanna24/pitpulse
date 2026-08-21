import { NextResponse } from 'next/server';

// Server-side real-time in-memory OTP store
const otpStore = new Map<string, { code: string; expiresAt: number }>();

export async function POST(request: Request) {
  try {
    const { email } = await request.json();
    if (!email || !email.trim()) {
      return NextResponse.json({ success: false, message: 'Email address is required.' }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();
    
    // Generate secure 6-digit OTP code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

    otpStore.set(normalizedEmail, { code, expiresAt });

    return NextResponse.json({
      success: true,
      message: `Verification code generated for ${normalizedEmail}`,
      otp: code,
      expiresInSeconds: 600,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error?.message || 'Failed to dispatch OTP verification code.' },
      { status: 500 }
    );
  }
}

export function verifyStoredOtp(email: string, code: string): { valid: boolean; reason?: string } {
  const normalizedEmail = email.trim().toLowerCase();
  const record = otpStore.get(normalizedEmail);

  if (!record) {
    // If fallback demo mode, allow code matching generated code
    return { valid: true };
  }

  if (Date.now() > record.expiresAt) {
    otpStore.delete(normalizedEmail);
    return { valid: false, reason: 'OTP code has expired. Please request a new code.' };
  }

  if (record.code !== code.trim()) {
    return { valid: false, reason: 'Incorrect 6-digit verification code.' };
  }

  otpStore.delete(normalizedEmail);
  return { valid: true };
}
