import { NextResponse } from 'next/server';
import { verifyStoredOtp } from '../send-otp/route';

export async function POST(request: Request) {
  try {
    const { email, otp } = await request.json();

    if (!email || !email.trim() || !otp || !otp.trim()) {
      return NextResponse.json(
        { success: false, message: 'Email address and 6-digit verification code are required.' },
        { status: 400 }
      );
    }

    const verification = verifyStoredOtp(email, otp);

    if (!verification.valid) {
      return NextResponse.json(
        { success: false, message: verification.reason || 'Invalid verification code.' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'OTP verification successful!',
      verified: true,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error?.message || 'OTP verification failed.' },
      { status: 500 }
    );
  }
}
