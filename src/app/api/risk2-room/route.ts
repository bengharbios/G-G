import { NextRequest, NextResponse } from 'next/server';
import { rooms } from './rooms';

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

// GET /api/risk2-room — Redirect to path-based route
export async function GET() {
  return NextResponse.json({ error: 'Use /api/risk2-room/{CODE} to get a room' }, { status: 400 });
}

// PUT /api/risk2-room — Redirect to path-based route
export async function PUT() {
  return NextResponse.json({ error: 'Use /api/risk2-room/{CODE} to update a room' }, { status: 400 });
}

// DELETE /api/risk2-room — Redirect to path-based route
export async function DELETE() {
  return NextResponse.json({ error: 'Use /api/risk2-room/{CODE} to delete a room' }, { status: 400 });
}
