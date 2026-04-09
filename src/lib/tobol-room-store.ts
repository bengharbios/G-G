// ============================================================
// طبول الحرب (Tobol) - Room Store using Turso (NOT in-memory)
// Uses the Room table with gameType='tobol' and stateJson
// ============================================================

import * as turso from './turso';

export interface SpectatorInfo {
  id: string;
  name: string;
  joinedAt: number;
  lastSeen: number;
}

export interface TobolRoomState {
  code: string;
  hostName: string;
  createdAt: number;
  hostLastSeen: number;
  redName: string;
  blueName: string;
  redScore: number;
  blueScore: number;
  currentTurn: 'red' | 'blue';
  clickedBtns: string[];
  lastAction: string | null;
  battleLog: Array<{ id: number; team: string; message: string; valueChange: number }>;
  modalData: { cardImg: string; points: number; team: string } | null;
  mainBgId: number;
  phase: string;
  spectators: SpectatorInfo[];
}

const ROOM_TTL_MS = 5 * 60 * 1000; // 5 minutes

// ============================================================
// Helpers
// ============================================================

function packState(state: Partial<TobolRoomState>): string {
  return JSON.stringify(state);
}

function unpackState(json: string): Partial<TobolRoomState> {
  try { return JSON.parse(json); } catch { return {}; }
}

// ============================================================
// Room CRUD (async — Turso)
// ============================================================

export async function createTobolRoom(code: string, hostName: string): Promise<TobolRoomState> {
  const now = Date.now();
  const state: TobolRoomState = {
    code,
    hostName,
    createdAt: now,
    hostLastSeen: now,
    redName: 'الجيش الأحمر',
    blueName: 'الجيش الأزرق',
    redScore: 350,
    blueScore: 350,
    currentTurn: 'red',
    clickedBtns: [],
    lastAction: null,
    battleLog: [],
    modalData: null,
    mainBgId: 1,
    phase: 'playing',
    spectators: [],
  };

  await turso.createRoom({
    id: `tobol_${code}`,
    code,
    hostName,
    playerCount: 0,
    phase: 'playing',
    stateJson: packState(state),
    gameType: 'tobol',
  });

  return state;
}

export async function getTobolRoom(code: string): Promise<TobolRoomState | null> {
  const room = await turso.getRoomByCode(code);
  if (!room || room.gameType !== 'tobol') return null;

  // Room expires after 5 minutes without heartbeat
  const lastSeen = new Date(room.hostLastSeen).getTime();
  if (Date.now() - lastSeen > ROOM_TTL_MS) {
    await deleteTobolRoom(code);
    return null;
  }

  const state = unpackState(room.stateJson) as TobolRoomState;

  // Clean stale spectators
  if (state.spectators) {
    state.spectators = state.spectators.filter(s => Date.now() - s.lastSeen < 30000);
  }

  return state;
}

export async function updateTobolRoom(code: string, data: Partial<TobolRoomState>): Promise<TobolRoomState | null> {
  const existing = await getTobolRoom(code);
  if (!existing) return null;

  const merged: TobolRoomState = { ...existing, ...data, hostLastSeen: Date.now() };
  await turso.updateRoom(code, {
    stateJson: packState(merged),
    hostLastSeen: new Date().toISOString(),
    phase: merged.phase,
  });

  return merged;
}

export async function heartbeatTobolRoom(code: string): Promise<boolean> {
  const room = await turso.getRoomByCode(code);
  if (!room || room.gameType !== 'tobol') return false;

  await turso.updateRoom(code, { hostLastSeen: new Date().toISOString() });
  return true;
}

export async function deleteTobolRoom(code: string): Promise<boolean> {
  try {
    const room = await turso.getRoomByCode(code);
    if (!room || room.gameType !== 'tobol') return false;

    await turso.updateRoom(code, { phase: 'deleted', stateJson: '{}' });
    return true;
  } catch {
    return false;
  }
}

// ============================================================
// Spectator management
// ============================================================

export async function addSpectator(code: string, name: string): Promise<TobolRoomState | null> {
  const room = await getTobolRoom(code);
  if (!room) return null;

  const id = `spec_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  room.spectators = room.spectators.filter(s => s.name !== name);
  room.spectators.push({ id, name, joinedAt: Date.now(), lastSeen: Date.now() });

  return updateTobolRoom(code, { spectators: room.spectators });
}

export async function heartbeatSpectator(code: string, spectatorId: string): Promise<boolean> {
  const room = await getTobolRoom(code);
  if (!room) return false;

  const spec = room.spectators.find(s => s.id === spectatorId);
  if (!spec) return false;
  spec.lastSeen = Date.now();

  await updateTobolRoom(code, { spectators: room.spectators });
  return true;
}

export async function removeSpectator(code: string, spectatorId: string): Promise<boolean> {
  const room = await getTobolRoom(code);
  if (!room) return false;

  const idx = room.spectators.findIndex(s => s.id === spectatorId);
  if (idx === -1) return false;
  room.spectators.splice(idx, 1);

  await updateTobolRoom(code, { spectators: room.spectators });
  return true;
}
