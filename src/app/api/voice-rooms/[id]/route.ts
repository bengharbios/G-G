import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { getVoiceRoomParticipants, joinVoiceRoom, leaveVoiceRoom, toggleMicInRoom, deleteVoiceRoom, sendGiftInRoom, getGifts } from '@/lib/admin-db';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'gg-platform-secret-key-2024');

async function getPayload(request: NextRequest) {
  const token = request.cookies.get('auth_token')?.value;
  if (!token) return null;
  try { const { payload } = await jwtVerify(token, JWT_SECRET); return payload; }
  catch { return null; }
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    if (searchParams.get('action') === 'participants') { const p = await getVoiceRoomParticipants(id); return NextResponse.json({ success: true, participants: p }); }
    if (searchParams.get('action') === 'gifts') { const g = await getGifts(); return NextResponse.json({ success: true, gifts: g }); }
    return NextResponse.json({ error: 'طلب غير صالح' }, { status: 400 });
  } catch { return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 }); }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const p = await getPayload(request);
    if (!p) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    if (searchParams.get('action') === 'toggle-mic') { const ok = await toggleMicInRoom(id, p.userId as string); return NextResponse.json({ success: ok, isMuted: ok }); }
    return NextResponse.json({ error: 'طلب غير صالح' }, { status: 400 });
  } catch { return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 }); }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const p = await getPayload(request);
    if (!p) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    if (searchParams.get('action') === 'join') {
      const body = await request.json().catch(() => ({}));
      const ok = await joinVoiceRoom(id, p.userId as string, body.username || '', body.displayName || '', body.avatar || '');
      return NextResponse.json({ success: ok });
    }
    if (searchParams.get('action') === 'leave') { const ok = await leaveVoiceRoom(id, p.userId as string); return NextResponse.json({ success: ok }); }
    if (searchParams.get('action') === 'gift') {
      const { giftId, toUserId } = await request.json();
      const ok = await sendGiftInRoom(id, giftId, p.userId as string, toUserId);
      return NextResponse.json({ success: ok });
    }
    return NextResponse.json({ error: 'طلب غير صالح' }, { status: 400 });
  } catch { return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 }); }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const p = await getPayload(request);
    if (!p) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    const { id } = await params;
    const ok = await deleteVoiceRoom(id, p.userId as string); return NextResponse.json({ success: ok });
  } catch { return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 }); }
}
