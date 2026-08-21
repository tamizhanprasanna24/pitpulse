import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyJwtToken, findUserByMadiIDOrEmail } from '@/lib/auth-service';

export async function GET() {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) {
      return NextResponse.json({ success: false, message: 'Unauthenticated' }, { status: 401 });
    }

    const decoded = verifyJwtToken(token);
    if (!decoded) {
      return NextResponse.json({ success: false, message: 'Invalid or expired token' }, { status: 401 });
    }

    const userRecord = await findUserByMadiIDOrEmail(decoded.madiID || decoded.email);
    if (!userRecord) {
      return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
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
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error?.message || 'Server error' }, { status: 500 });
  }
}
