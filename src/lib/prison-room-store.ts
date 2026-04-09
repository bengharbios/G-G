// ============================================================
// Shared in-memory Prison room storage
// Uses globalThis (works in both CJS and ESM/Turbopack)
// ============================================================

export interface SpectatorInfo {
  id: string;
  name: string;
  joinedAt: number;
  lastSeen: number;
}

export interface PrisonRoomState {
  code: string;
  hostName: string;
  createdAt: number;
  hostLastSeen: number;
  gridSize: number;
  cols: number;
  phase: string; // 'waiting' | 'playing' | 'game_over'
  currentTeam: string; // 'alpha' | 'beta'
  currentRound: number;
  cells: Array<{ id: number; type: string; status: string }>;
  players: Array<{
    id: string;
    name: string;
    team: string;
    role: string;
    status: string;
    avatar: string;
    originalTeam?: string;
  }>;
  teamAlphaName: string;
  teamBetaName: string;
  lastRevealedCell: { id: number; type: string; status: string } | null;
  revealResult: {
    cellType: string;
    targetPlayer: { id: string; name: string } | null;
    message: string;
    teamName: string;
  } | null;
  roundLog: Array<{ round: number; message: string; timestamp: number; type: string }>;
  winner: string | null; // 'alpha' | 'beta' | 'draw' | null
  winReason: string;
  spectators: SpectatorInfo[];
}

// globalThis works in ALL JavaScript environments (CJS, ESM, browser, Turbopack)
const G = globalThis as Record<string, unknown>;
const STORAGE_KEY = '__prison_rooms_v1';

function getRooms(): Map<string, PrisonRoomState> {
  if (!G[STORAGE_KEY]) {
    G[STORAGE_KEY] = new Map<string, PrisonRoomState>();
  }
  return G[STORAGE_KEY] as Map<string, PrisonRoomState>;
}

// ============================================================
// Room CRUD
// ============================================================

export function createPrisonRoom(code: string, hostName: string): PrisonRoomState {
  const room: PrisonRoomState = {
    code,
    hostName,
    createdAt: Date.now(),
    hostLastSeen: Date.now(),
    gridSize: 9,
    cols: 3,
    phase: 'waiting',
    currentTeam: 'alpha',
    currentRound: 1,
    cells: [],
    players: [],
    teamAlphaName: 'فريق السجناء',
    teamBetaName: 'فريق الحراس',
    lastRevealedCell: null,
    revealResult: null,
    roundLog: [],
    winner: null,
    winReason: '',
    spectators: [],
  };
  getRooms().set(code, room);
  return room;
}

export function getPrisonRoom(code: string): PrisonRoomState | null {
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

export function updatePrisonRoom(code: string, data: Partial<PrisonRoomState>): PrisonRoomState | null {
  const room = getRooms().get(code);
  if (!room) return null;
  Object.assign(room, data, { hostLastSeen: Date.now() });
  return room;
}

export function heartbeatPrisonRoom(code: string): boolean {
  const room = getRooms().get(code);
  if (!room) return false;
  room.hostLastSeen = Date.now();
  return true;
}

export function deletePrisonRoom(code: string): boolean {
  return getRooms().delete(code);
}

// ============================================================
// Spectator management
// ============================================================

export function addSpectator(code: string, name: string): PrisonRoomState | null {
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
