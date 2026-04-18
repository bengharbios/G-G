import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { getAllVoiceRooms, createVoiceRoom } from '@/lib/admin-db';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'gg-platform-secret-key-2024');

async function getUserId(request: NextRequest): Promise<string | null> {
  const token = request.cookies.get('auth_token')?.value;
  if (!token) return null;
  try { const { payload } = await jwtVerify(token, JWT_SECRET); return payload.userId as string; }
  catch { return null; }
}

export async function GET() {
  try {
    const rooms = await getAllVoiceRooms();
    return NextResponse.json({ success: true, rooms });
  } catch (e) {
    console.error('[VR GET]', e);
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserId(request);
    if (!userId) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    const {
      name, description, hostName, maxParticipants, isPrivate, micSeatCount,
      roomMode, roomPassword, micTheme, isAutoMode,
    } = await request.json();
    if (!name) return NextResponse.json({ error: 'اسم الغرفة مطلوب' }, { status: 400 });
    const room = await createVoiceRoom(
      userId, hostName || 'مستخدم', name, description || '',
      maxParticipants || 10, isPrivate || false, micSeatCount || 10,
      roomMode || 'public', roomPassword || '', micTheme || 'default', isAutoMode !== false,
    );
    return NextResponse.json({ success: true, room });
  } catch (e) {
    console.error('[VR POST]', e);
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 });
  }
}
