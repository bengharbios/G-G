import { NextRequest, NextResponse } from 'next/server';
import { rooms } from '../../rooms';

// Extract room code from URL pathname: /api/risk2-room/{CODE}/spectator
function extractCode(req: NextRequest): string | null {
  const pathname = new URL(req.url).pathname;
  const segments = pathname.split('/').filter(Boolean);
  // segments: ['api', 'risk2-room', '{CODE}', 'spectator']
  const code = segments[2] || null;
  return code;
}

// POST /api/risk2-room/[code]/spectator — Join as spectator
export async function POST(req: NextRequest) {
  const code = extractCode(req);
  if (!code) return NextResponse.json({ error: 'Code required' }, { status: 400 });

  const room = rooms.get(code);
  if (!room) return NextResponse.json({ error: 'Room not found' }, { status: 404 });

  try {
    const { name } = await req.json();
    if (!name) return NextResponse.json({ error: 'Name required' }, { status: 400 });

    const spectator = {
      id: `spec_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      name,
      joinedAt: Date.now(),
    };

    room.spectators.push(spectator);
    room.lastHeartbeat = Date.now();

    return NextResponse.json({ ok: true, spectatorId: spectator.id, spectatorCount: room.spectators.length });
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}
