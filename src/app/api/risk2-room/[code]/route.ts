import { NextRequest, NextResponse } from 'next/server';

// Single room operations (nested under [code])
export async function GET(req: NextRequest) {
  // Forward to parent route
  return NextResponse.json({ error: 'Use /api/risk2-room?code=XXX' }, { status: 400 });
}

export async function PUT(req: NextRequest) {
  return NextResponse.json({ error: 'Use /api/risk2-room?code=XXX' }, { status: 400 });
}

export async function DELETE(req: NextRequest) {
  return NextResponse.json({ error: 'Use /api/risk2-room?code=XXX' }, { status: 400 });
}
