// ============================================================
// السجن (The Prison) - In-memory Room Store (الديوانية mode)
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
  alphaName: string;
  betaName: string;
  currentTeam: 'alpha' | 'beta';
  players: Array<{
    id: string;
    name: string;
    team: string;
    status: string;
    uniformCount: number;
  }>;
  gridSize: number;
  grid: Array<{
    id: string;
    index: number;
    type: string;
    status: string;
  }>;
  interactionState: string;
  revealedCell: {
    id: string;
    index: number;
    type: string;
    status: string;
  } | null;
  selectedTargetId: string | null;
  currentPlayerId: string | null;
  gameLog: Array<{
    id: number;
    team: string;
    playerName: string;
    action: string;
    itemType: string;
    timestamp: number;
  }>;
  winner: string | null;
  winReason: string;
  phase: string;
  spectators: SpectatorInfo[];
}

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
    alphaName: 'فريق أ',
    betaName: 'فريق ب',
    currentTeam: 'alpha',
    players: [],
    gridSize: 16,
    grid: [],
    interactionState: 'waiting_for_player',
    revealedCell: null,
    selectedTargetId: null,
    currentPlayerId: null,
    gameLog: [],
    winner: null,
    winReason: '',
    phase: 'playing',
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
