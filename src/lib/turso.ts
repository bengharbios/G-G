import { createClient, Client } from '@libsql/client';

// ─── Types ────────────────────────────────────────────────────────────

export interface RoomRow {
  id: string;
  code: string;
  phase: string;
  round: number;
  gameWinner: string | null;
  hostName: string;
  playerCount: number;
  createdAt: string;
  updatedAt: string;
  stateJson: string;
  resultsJson: string | null;
  gameType: string | null;
  hostLastSeen: string;
}

export interface RoomPlayerRow {
  id: string;
  roomId: string;
  name: string;
  role: string | null;
  isAlive: boolean;
  isSilenced: boolean;
  hasRevealedMayor: boolean;
  eliminatedBy: string | null;
  eliminatedRound: number | null;
  voteTarget: string | null;
  nightActionTarget: string | null;
  nightActionType: string | null;
  hasJoined: boolean;
  joinedAt: string;
  updatedAt: string;
}

// ─── Client singleton ─────────────────────────────────────────────────

let _client: Client | null = null;
let _tablesReady = false;

function getClient(): Client {
  if (_client) return _client;

  const dbUrl =
    process.env.TURSO_DATABASE_URL ||
    process.env.DATABASE_URL ||
    'file:db/data.db';

  const isRemote = dbUrl.startsWith('libsql://');

  _client = createClient({
    url: dbUrl,
    ...(isRemote ? { authToken: process.env.TURSO_AUTH_TOKEN || '' } : {}),
  });

  return _client;
}

// ─── Table creation ───────────────────────────────────────────────────

async function ensureTables(): Promise<void> {
  if (_tablesReady) return;
  const c = getClient();

  await c.execute(`
    CREATE TABLE IF NOT EXISTS Room (
      id TEXT PRIMARY KEY,
      code TEXT UNIQUE NOT NULL,
      phase TEXT DEFAULT 'waiting',
      round INTEGER DEFAULT 0,
      gameWinner TEXT,
      hostName TEXT NOT NULL,
      playerCount INTEGER DEFAULT 14,
      createdAt TEXT DEFAULT (datetime('now')),
      updatedAt TEXT DEFAULT (datetime('now')),
      stateJson TEXT DEFAULT '{}',
      resultsJson TEXT,
      gameType TEXT,
      hostLastSeen TEXT DEFAULT (datetime('now'))
    )
  `);

  await c.execute(`
    CREATE TABLE IF NOT EXISTS RoomPlayer (
      id TEXT PRIMARY KEY,
      roomId TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT,
      isAlive INTEGER DEFAULT 1,
      isSilenced INTEGER DEFAULT 0,
      hasRevealedMayor INTEGER DEFAULT 0,
      eliminatedBy TEXT,
      eliminatedRound INTEGER,
      voteTarget TEXT,
      nightActionTarget TEXT,
      nightActionType TEXT,
      hasJoined INTEGER DEFAULT 0,
      joinedAt TEXT DEFAULT (datetime('now')),
      updatedAt TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (roomId) REFERENCES Room(id) ON DELETE CASCADE
    )
  `);

  _tablesReady = true;
}

// ─── Row mappers ──────────────────────────────────────────────────────

function toRoomRow(row: Record<string, unknown>): RoomRow {
  return {
    id: row.id as string,
    code: row.code as string,
    phase: row.phase as string,
    round: (row.round as number) ?? 0,
    gameWinner: (row.gameWinner as string) ?? null,
    hostName: row.hostName as string,
    playerCount: (row.playerCount as number) ?? 14,
    createdAt: (row.createdAt as string) ?? new Date().toISOString(),
    updatedAt: (row.updatedAt as string) ?? new Date().toISOString(),
    stateJson: (row.stateJson as string) ?? '{}',
    resultsJson: (row.resultsJson as string) ?? null,
    gameType: (row.gameType as string) ?? null,
    hostLastSeen: (row.hostLastSeen as string) ?? new Date().toISOString(),
  };
}

function toPlayerRow(row: Record<string, unknown>): RoomPlayerRow {
  return {
    id: row.id as string,
    roomId: row.roomId as string,
    name: row.name as string,
    role: (row.role as string) ?? null,
    isAlive: !!row.isAlive && row.isAlive !== 0,
    isSilenced: !!row.isSilenced && row.isSilenced !== 0,
    hasRevealedMayor: !!row.hasRevealedMayor && row.hasRevealedMayor !== 0,
    eliminatedBy: (row.eliminatedBy as string) ?? null,
    eliminatedRound: row.eliminatedRound != null ? (row.eliminatedRound as number) : null,
    voteTarget: (row.voteTarget as string) ?? null,
    nightActionTarget: (row.nightActionTarget as string) ?? null,
    nightActionType: (row.nightActionType as string) ?? null,
    hasJoined: !!row.hasJoined && row.hasJoined !== 0,
    joinedAt: (row.joinedAt as string) ?? new Date().toISOString(),
    updatedAt: (row.updatedAt as string) ?? new Date().toISOString(),
  };
}

// ─── ID generator ─────────────────────────────────────────────────────

export function generateId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

// ─── SQL value converter ──────────────────────────────────────────────
// Converts JS values (booleans, Dates) to SQLite-compatible values

function sqlVal(val: unknown): unknown {
  if (val instanceof Date) return val.toISOString();
  if (typeof val === 'boolean') return val ? 1 : 0;
  return val;
}

// ─── Room operations ──────────────────────────────────────────────────

export async function getRoomByCode(code: string): Promise<RoomRow | null> {
  await ensureTables();
  const c = getClient();
  const result = await c.execute({
    sql: 'SELECT * FROM Room WHERE code = ?',
    args: [code],
  });
  if (result.rows.length === 0) return null;
  return toRoomRow(result.rows[0] as Record<string, unknown>);
}

export async function getRoomWithPlayers(
  code: string
): Promise<(RoomRow & { players: RoomPlayerRow[] }) | null> {
  await ensureTables();
  const c = getClient();

  const roomResult = await c.execute({
    sql: 'SELECT * FROM Room WHERE code = ?',
    args: [code],
  });
  if (roomResult.rows.length === 0) return null;

  const room = toRoomRow(roomResult.rows[0] as Record<string, unknown>);

  const playerResult = await c.execute({
    sql: 'SELECT * FROM RoomPlayer WHERE roomId = ?',
    args: [room.id],
  });

  const players = playerResult.rows.map(
    (r) => toPlayerRow(r as Record<string, unknown>)
  );

  return { ...room, players };
}

export async function createRoom(data: {
  id: string;
  code: string;
  hostName: string;
  playerCount: number;
  phase: string;
  stateJson: string;
  gameType: string | null;
}): Promise<RoomRow> {
  await ensureTables();
  const c = getClient();
  await c.execute({
    sql: `INSERT INTO Room (id, code, phase, hostName, playerCount, stateJson, gameType)
          VALUES (?, ?, ?, ?, ?, ?, ?)`,
    args: [
      data.id,
      data.code,
      data.phase,
      data.hostName,
      data.playerCount,
      data.stateJson,
      data.gameType,
    ],
  });
  const room = await getRoomByCode(data.code);
  return room!;
}

export async function updateRoom(
  code: string,
  data: Record<string, unknown>
): Promise<RoomRow | null> {
  await ensureTables();
  const c = getClient();

  const entries = Object.entries(data).filter(
    ([, v]) => v !== undefined
  );

  if (entries.length === 0) {
    return getRoomByCode(code);
  }

  // Always update updatedAt
  const setClauses: string[] = ["updatedAt = datetime('now')"];
  const values: unknown[] = [];

  for (const [key, val] of entries) {
    setClauses.push(`${key} = ?`);
    values.push(sqlVal(val));
  }

  values.push(code);

  await c.execute({
    sql: `UPDATE Room SET ${setClauses.join(', ')} WHERE code = ?`,
    args: values,
  });

  return getRoomByCode(code);
}

export async function updateRoomWithPlayers(
  code: string,
  data: Record<string, unknown>
): Promise<(RoomRow & { players: RoomPlayerRow[] }) | null> {
  await updateRoom(code, data);
  return getRoomWithPlayers(code);
}

// ─── RoomPlayer operations ────────────────────────────────────────────

export async function createPlayer(data: {
  id: string;
  roomId: string;
  name: string;
  hasJoined: boolean;
}): Promise<RoomPlayerRow> {
  await ensureTables();
  const c = getClient();
  await c.execute({
    sql: `INSERT INTO RoomPlayer (id, roomId, name, hasJoined)
          VALUES (?, ?, ?, ?)`,
    args: [data.id, data.roomId, data.name, data.hasJoined ? 1 : 0],
  });

  const result = await c.execute({
    sql: 'SELECT * FROM RoomPlayer WHERE id = ?',
    args: [data.id],
  });
  return toPlayerRow(result.rows[0] as Record<string, unknown>);
}

export async function updatePlayer(
  id: string,
  data: Record<string, unknown>
): Promise<void> {
  await ensureTables();
  const c = getClient();

  const entries = Object.entries(data).filter(
    ([, v]) => v !== undefined
  );

  if (entries.length === 0) return;

  const setClauses: string[] = ["updatedAt = datetime('now')"];
  const values: unknown[] = [];

  for (const [key, val] of entries) {
    setClauses.push(`${key} = ?`);
    values.push(sqlVal(val));
  }

  values.push(id);

  await c.execute({
    sql: `UPDATE RoomPlayer SET ${setClauses.join(', ')} WHERE id = ?`,
    args: values,
  });
}

export async function updatePlayersByRoomId(
  roomId: string,
  data: Record<string, unknown>
): Promise<void> {
  await ensureTables();
  const c = getClient();

  const entries = Object.entries(data).filter(
    ([, v]) => v !== undefined
  );

  if (entries.length === 0) return;

  const setClauses: string[] = ["updatedAt = datetime('now')"];
  const values: unknown[] = [];

  for (const [key, val] of entries) {
    setClauses.push(`${key} = ?`);
    values.push(sqlVal(val));
  }

  values.push(roomId);

  await c.execute({
    sql: `UPDATE RoomPlayer SET ${setClauses.join(', ')} WHERE roomId = ?`,
    args: values,
  });
}

export async function updatePlayersByName(
  roomId: string,
  name: string,
  data: Record<string, unknown>
): Promise<void> {
  await ensureTables();
  const c = getClient();

  const entries = Object.entries(data).filter(
    ([, v]) => v !== undefined
  );

  if (entries.length === 0) return;

  const setClauses: string[] = ["updatedAt = datetime('now')"];
  const values: unknown[] = [];

  for (const [key, val] of entries) {
    setClauses.push(`${key} = ?`);
    values.push(sqlVal(val));
  }

  values.push(roomId, name);

  await c.execute({
    sql: `UPDATE RoomPlayer SET ${setClauses.join(', ')} WHERE roomId = ? AND name = ?`,
    args: values,
  });
}

export async function deletePlayer(id: string): Promise<void> {
  await ensureTables();
  const c = getClient();
  await c.execute({
    sql: 'DELETE FROM RoomPlayer WHERE id = ?',
    args: [id],
  });
}

export async function deleteRoomByCode(code: string): Promise<void> {
  await ensureTables();
  const c = getClient();
  await c.execute({
    sql: 'DELETE FROM RoomPlayer WHERE roomId IN (SELECT id FROM Room WHERE code = ?)',
    args: [code],
  });
  await c.execute({
    sql: 'DELETE FROM Room WHERE code = ?',
    args: [code],
  });
}
