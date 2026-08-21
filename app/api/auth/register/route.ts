import { NextResponse } from 'next/server';
import { createNewUserRecord, generateToken } from '@/lib/auth-service';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { madiID, name, email, password, role, profileData } = body;

    // Validate inputs
    if (!madiID || !madiID.trim()) {
      return NextResponse.json({ success: false, message: 'madiID is required.' }, { status: 400 });
    }

    if (!password || password.length < 6) {
      return NextResponse.json({ success: false, message: 'Password must be at least 6 characters.' }, { status: 400 });
    }

    const effectiveEmail = email?.trim().toLowerCase() || `${madiID.trim().toLowerCase()}@ruralcare.org`;

    try {
      const userRecord = await createNewUserRecord({
        madiID: madiID.trim(),
        name: name?.trim() || null,
        email: effectiveEmail,
        password,
        role: role || 'patient',
        profileData,
      });

      const token = generateToken({
        id: userRecord.id,
        madiID: userRecord.madiID,
        email: userRecord.email,
        role: userRecord.role,
      });

      // Prepare response without passwordHash
      const response = NextResponse.json({
        success: true,
        message: 'Registration successful!',
        token,
        user: {
          id: userRecord.id,
          madiID: userRecord.madiID,
          name: userRecord.name,
          email: userRecord.email,
          role: userRecord.role,
          createdAt: userRecord.createdAt,
          profile: userRecord.profile,
        },
      });

      // Set secure HTTP-only auth token cookie
      response.cookies.set('auth_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60, // 7 days
        path: '/',
      });

      return response;
    } catch (err: any) {
      if (err?.message === 'User already exists.') {
        return NextResponse.json({ success: false, message: 'User already exists.' }, { status: 400 });
      }
      throw err;
    }
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error?.message || 'Registration failed due to server error.' },
      { status: 500 }
    );
  }
}
