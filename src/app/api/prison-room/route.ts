import { NextRequest, NextResponse } from 'next/server';
import { createPrisonRoom, getPrisonRoom, updatePrisonRoom } from '@/lib/prison-room-store';

export async function POST(request: NextRequest) {
  try {
    const { hostName, gridSize } = await request.json();
    if (!hostName) {
      return NextResponse.json({ error: 'Missing hostName' }, { status: 400 });
    }

    // Generate a 6-char random code
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars[Math.floor(Math.random() * chars.length)];
    }

    const room = createPrisonRoom(code, hostName || 'المضيف');

    // Update gridSize if provided
    if (gridSize && typeof gridSize === 'number') {
      updatePrisonRoom(code, { gridSize });
    }

    return NextResponse.json({ success: true, code: room.code, room });
  } catch {
    return NextResponse.json({ error: 'Failed to create room' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');

  if (!code) {
    return NextResponse.json({ error: 'Missing code' }, { status: 400 });
  }

  const room = getPrisonRoom(code);
  if (!room) {
    return NextResponse.json({ error: 'Room not found' }, { status: 404 });
  }

  return NextResponse.json({ success: true, room });
}
