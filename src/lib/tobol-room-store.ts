// ============================================================
// Shared in-memory Tobol room storage
// Uses globalThis (works in both CJS and ESM/Turbopack)
// ============================================================

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

// globalThis works in ALL JavaScript environments (CJS, ESM, browser, Turbopack)
const G = globalThis as Record<string, unknown>;
const STORAGE_KEY = '__tobol_rooms_v2';

function getRooms(): Map<string, TobolRoomState> {
  if (!G[STORAGE_KEY]) {
    G[STORAGE_KEY] = new Map<string, TobolRoomState>();
  }
  return G[STORAGE_KEY] as Map<string, TobolRoomState>;
}

// ============================================================
// Room CRUD
// ============================================================

export function createTobolRoom(code: string, hostName: string): TobolRoomState {
  const room: TobolRoomState = {
    code,
    hostName,
    createdAt: Date.now(),
    hostLastSeen: Date.now(),
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
  getRooms().set(code, room);
  return room;
}

export function getTobolRoom(code: string): TobolRoomState | null {
  const room = getRooms().get(code);
  if (!room) return null;

  // Room expires after 5 minutes without heartbeat
  if (Date.now() - room.hostLastSeen > 300000) {
    getRooms().delete(code);
    return null;
  }

  // Clean stale spectators (not seen for 30 seconds)
  room.spectators = room.spectators.filter(s => Date.now() - s.lastSeen < 30000);

  return room;
}

export function updateTobolRoom(code: string, data: Partial<TobolRoomState>): TobolRoomState | null {
  const room = getRooms().get(code);
  if (!room) return null;
  Object.assign(room, data, { hostLastSeen: Date.now() });
  return room;
}

export function heartbeatTobolRoom(code: string): boolean {
  const room = getRooms().get(code);
  if (!room) return false;
  room.hostLastSeen = Date.now();
  return true;
}

export function deleteTobolRoom(code: string): boolean {
  return getRooms().delete(code);
}

// ============================================================
// Spectator management
// ============================================================

export function addSpectator(code: string, name: string): TobolRoomState | null {
  const room = getRooms().get(code);
  if (!room) return null;

  const id = `spec_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  room.spectators = room.spectators.filter(s => s.name !== name);
  room.spectators.push({ id, name, joinedAt: Date.now(), lastSeen: Date.now() });
  return room;
}

export function heartbeatSpectator(code: string, spectatorId: string): boolean {
  const room = getRooms().get(code);
  if (!room) return false;
  const spec = room.spectators.find(s => s.id === spectatorId);
  if (!spec) return false;
  spec.lastSeen = Date.now();
  return true;
}

export function removeSpectator(code: string, spectatorId: string): boolean {
  const room = getRooms().get(code);
  if (!room) return false;
  const idx = room.spectators.findIndex(s => s.id === spectatorId);
  if (idx === -1) return false;
  room.spectators.splice(idx, 1);
  return true;
}
