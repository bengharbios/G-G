import { NextRequest, NextResponse } from 'next/server';

const rooms = new Map<string, { data: Record<string, unknown>; spectators: { id: string; name: string; joinedAt: number }[]; lastHeartbeat: number }>();

// POST /api/risk2-room — Create room
export async function POST(req: NextRequest) {
  try {
    const { code, hostName } = await req.json();
    if (!code) return NextResponse.json({ error: 'Code required' }, { status: 400 });

    rooms.set(code, {
      data: {},
      spectators: [],
      lastHeartbeat: Date.now(),
    });

    return NextResponse.json({ ok: true, code });
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}

// GET /api/risk2-room/[code] — Get room state
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');
  if (!code) return NextResponse.json({ error: 'Code required' }, { status: 400 });

  const room = rooms.get(code);
  if (!room) return NextResponse.json({ error: 'Room not found' }, { status: 404 });

  return NextResponse.json({ room });
}

// PUT /api/risk2-room/[code] — Update room state
export async function PUT(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');
  if (!code) return NextResponse.json({ error: 'Code required' }, { status: 400 });

  const room = rooms.get(code);
  if (!room) return NextResponse.json({ error: 'Room not found' }, { status: 404 });

  try {
    const data = await req.json();
    room.data = { ...room.data, ...data };
    room.lastHeartbeat = Date.now();
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}

// DELETE /api/risk2-room/[code] — Delete room
export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');
  if (!code) return NextResponse.json({ error: 'Code required' }, { status: 400 });

  rooms.delete(code);
  return NextResponse.json({ ok: true });
}
