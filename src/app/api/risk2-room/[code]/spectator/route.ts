import { NextRequest, NextResponse } from 'next/server';

const rooms = new Map<string, { spectators: { id: string; name: string; joinedAt: number }[] }>();

export async function POST(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get('code');
    if (!code) return NextResponse.json({ error: 'Code required' }, { status: 400 });

    const { name } = await req.json();
    if (!name) return NextResponse.json({ error: 'Name required' }, { status: 400 });

    const spectator = {
      id: `spec_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      name,
      joinedAt: Date.now(),
    };

    return NextResponse.json({ ok: true, spectator });
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}
