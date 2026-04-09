import { NextRequest, NextResponse } from 'next/server';
import { rooms } from '../../rooms';

// Extract room code from URL pathname: /api/risk2-room/{CODE}/heartbeat
function extractCode(req: NextRequest): string | null {
  const pathname = new URL(req.url).pathname;
  const segments = pathname.split('/').filter(Boolean);
  // segments: ['api', 'risk2-room', '{CODE}', 'heartbeat']
  const code = segments[2] || null;
  return code;
}

// POST /api/risk2-room/[code]/heartbeat — Update heartbeat
export async function POST(req: NextRequest) {
  const code = extractCode(req);
  if (!code) return NextResponse.json({ error: 'Code required' }, { status: 400 });

  const room = rooms.get(code);
  if (!room) return NextResponse.json({ error: 'Room not found' }, { status: 404 });

  room.lastHeartbeat = Date.now();
  return NextResponse.json({ ok: true });
}
