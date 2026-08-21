import { NextResponse } from 'next/server';
import { findUserByMadiIDOrEmail, verifyPassword, generateToken } from '@/lib/auth-service';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { madiID, email, password } = body;

    const identifier = (madiID || email || '').trim();

    if (!identifier || !password) {
      return NextResponse.json(
        { success: false, message: 'Invalid madiID or password.' },
        { status: 400 }
      );
    }

    const userRecord = await findUserByMadiIDOrEmail(identifier);

    if (!userRecord) {
      return NextResponse.json(
        { success: false, message: 'Invalid madiID or password.' },
        { status: 401 }
      );
    }

    const isMatch = await verifyPassword(password, userRecord.passwordHash);

    if (!isMatch) {
      return NextResponse.json(
        { success: false, message: 'Invalid madiID or password.' },
        { status: 401 }
      );
    }

    const token = generateToken({
      id: userRecord.id,
      madiID: userRecord.madiID,
      email: userRecord.email,
      role: userRecord.role,
    });

    // Prepare response without passwordHash
    const response = NextResponse.json({
      success: true,
      message: 'Signed in successfully!',
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

    // Set secure HTTP-only cookie
    response.cookies.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/',
    });

    return response;
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error?.message || 'Server authentication error.' },
      { status: 500 }
    );
  }
}
