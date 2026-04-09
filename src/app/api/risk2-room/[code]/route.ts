import { NextRequest, NextResponse } from 'next/server';
import { rooms } from '../rooms';

// Extract room code from URL pathname: /api/risk2-room/{CODE}
function extractCode(req: NextRequest): string | null {
  const pathname = new URL(req.url).pathname;
  const segments = pathname.split('/').filter(Boolean);
  // segments: ['api', 'risk2-room', '{CODE}']
  const code = segments[2] || null;
  return code;
}

// GET /api/risk2-room/[code] — Get room state
export async function GET(req: NextRequest) {
  const code = extractCode(req);
  if (!code) return NextResponse.json({ error: 'Code required' }, { status: 400 });

  const room = rooms.get(code);
  if (!room) return NextResponse.json({ error: 'Room not found' }, { status: 404 });

  return NextResponse.json({ ok: true, room });
}

// PUT /api/risk2-room/[code] — Update room state
export async function PUT(req: NextRequest) {
  const code = extractCode(req);
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
  const code = extractCode(req);
  if (!code) return NextResponse.json({ error: 'Code required' }, { status: 400 });

  rooms.delete(code);
  return NextResponse.json({ ok: true });
}
