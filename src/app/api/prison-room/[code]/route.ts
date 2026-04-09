import { NextRequest, NextResponse } from 'next/server';
import { getPrisonRoom, updatePrisonRoom, deletePrisonRoom } from '@/lib/prison-room-store';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  if (!code) {
    return NextResponse.json({ error: 'Missing code' }, { status: 400 });
  }

  const room = getPrisonRoom(code);
  if (!room) {
    return NextResponse.json({ error: 'Room not found' }, { status: 404 });
  }

  return NextResponse.json({ success: true, room });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  if (!code) {
    return NextResponse.json({ error: 'Missing code' }, { status: 400 });
  }

  try {
    const body = await request.json();
    const { phase, round, stateJson } = body;

    const updateData: Record<string, unknown> = { hostLastSeen: Date.now() };

    if (phase !== undefined) {
      updateData.phase = phase;
    }
    if (round !== undefined) {
      updateData.currentRound = round;
    }
    if (stateJson) {
      try {
        const state = JSON.parse(stateJson);
        if (state.gridSize !== undefined) updateData.gridSize = state.gridSize;
        if (state.teamAlphaName !== undefined) updateData.teamAlphaName = state.teamAlphaName;
        if (state.teamBetaName !== undefined) updateData.teamBetaName = state.teamBetaName;
        if (state.players !== undefined) updateData.players = state.players;
        if (state.currentTeam !== undefined) updateData.currentTeam = state.currentTeam;
        if (state.cells !== undefined) updateData.cells = state.cells;
        if (state.lastRevealedCell !== undefined) updateData.lastRevealedCell = state.lastRevealedCell;
        if (state.revealResult !== undefined) updateData.revealResult = state.revealResult;
        if (state.currentRound !== undefined) updateData.currentRound = state.currentRound;
        if (state.roundLog !== undefined) updateData.roundLog = state.roundLog;
        if (state.winner !== undefined) updateData.winner = state.winner;
        if (state.winReason !== undefined) updateData.winReason = state.winReason;
      } catch {
        return NextResponse.json({ error: 'Invalid stateJson' }, { status: 400 });
      }
    }

    const room = updatePrisonRoom(code, updateData);
    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, room });
  } catch {
    return NextResponse.json({ error: 'Failed to update room' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  if (!code) {
    return NextResponse.json({ error: 'Missing code' }, { status: 400 });
  }

  deletePrisonRoom(code);
  return NextResponse.json({ success: true });
}
