import { createClient, Client } from '@libsql/client';

// ─── Types ────────────────────────────────────────────────────────────

export interface GameConfig {
  id: string;
  gameSlug: string;
  gameName: string;
  isEnabled: boolean;
  order: number;
  playerRange: string;
  description: string;
  icon: string;
  color: string;
  isComingSoon: boolean;
  isFree: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Subscription {
  id: string;
  name: string;
  email: string;
  phone: string;
  telegram: string;
  subscriptionCode: string;
  plan: string; // 'free' | 'trial' | 'paid'
  isActive: boolean;
  allowedGames: string[]; // parsed from JSON
  startDate: string;
  endDate: string | null;
  startedAt: string;
  expiresAt: string | null;
  createdAt: string;
  // Trial-specific fields
  isTrial: boolean;
  trialSessionsUsed: number;
  trialExpiresAt: string | null;
  gemsBalance: number;
  // Level/XP system fields
  level: number;
  xp: number;
  playerId: string | null;
  purchasedItems: string[];
}

export interface XPRecord {
  id: string;
  subscriptionId: string;
  subscriptionCode: string;
  amount: number;
  reason: string;
  createdAt: string;
}

export type XPReason = 'game_play' | 'game_win' | 'event_complete' | 'purchase' | 'invite' | 'daily_login';

export const MAX_LEVEL = 100;

export interface GameSession {
  id: string;
  gameSlug: string;
  hostName: string;
  playersCount: number;
  duration: number | null;
  createdAt: string;
}

export interface SiteConfig {
  id: string;
  allowDirectRegistration: boolean;
  telegramLink: string;
  whatsappLink: string;
  subscriptionPrice: string;
  contactMessage: string;
  updatedAt: string;
  // Trial settings
  trialGameSlugs: string[];
  maxTrialSessions: number;
  trialDurationDays: number;
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export interface Event {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  eventType: 'promotion' | 'tournament' | 'seasonal' | 'special';
  gameSlug: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  sortOrder: number;
  badge: string;
  badgeColor: 'amber' | 'rose' | 'emerald' | 'blue' | 'purple';
  rewardType?: string; // 'xp', 'gems', 'frame', 'cover', 'dice', 'none'
  rewardAmount?: number;
  rewardDescription?: string;
  createdAt: string;
  updatedAt: string;
}

export interface GemChargeRequest {
  id: string;
  subscriptionCode: string;
  subscriberName: string;
  gemsAmount: number;
  packageType: 'small' | 'medium' | 'large' | 'mega';
  status: 'pending' | 'approved' | 'rejected';
  paymentMethod: string;
  createdAt: string;
}

// ─── PlayerFrame types ──────────────────────────────────────────────

export interface PlayerFrame {
  id: string;
  name: string;
  nameAr: string;
  description: string;
  imageUrl: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  gradientFrom: string;
  gradientTo: string;
  borderColor: string;
  glowColor: string;
  pattern: 'solid' | 'gradient' | 'animated' | 'dotted' | 'double';
  price: number;
  isFree: boolean;
  isActive: boolean;
  sortOrder: number;
  totalOwned: number;
  createdAt: string;
  updatedAt: string;
}

export interface UserFrame {
  id: string;
  userId: string;
  subscriptionId: string | null;
  frameId: string;
  isEquipped: boolean;
  obtainedFrom: 'gift' | 'purchase' | 'level' | 'event' | 'admin' | 'achievement';
  obtainedNote: string;
  obtainedAt: string;
}

// ─── AppUser types ────────────────────────────────────────────────────

export interface AppUser {
  id: string;
  username: string;
  email: string;
  passwordHash: string;
  displayName: string;
  phone: string;
  avatar: string;
  role: 'user' | 'moderator' | 'admin';
  isActive: boolean;
  subscriptionId: string | null;
  lastLoginAt: string | null;
  createdAt: string;
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

// ─── SQL value converter ──────────────────────────────────────────────

function sqlVal(val: unknown): unknown {
  if (val instanceof Date) return val.toISOString();
  if (typeof val === 'boolean') return val ? 1 : 0;
  return val;
}

// ─── Table creation + seeding ─────────────────────────────────────────

async function ensureAdminTables(): Promise<void> {
  if (_tablesReady) return;
  const c = getClient();

  await c.execute(`
    CREATE TABLE IF NOT EXISTS GameConfig (
      id TEXT PRIMARY KEY,
      gameSlug TEXT UNIQUE NOT NULL,
      gameName TEXT NOT NULL,
      isEnabled INTEGER DEFAULT 1,
      "order" INTEGER DEFAULT 0,
      playerRange TEXT DEFAULT '',
      description TEXT DEFAULT '',
      icon TEXT DEFAULT '',
      color TEXT DEFAULT '',
      isComingSoon INTEGER DEFAULT 0,
      isFree INTEGER DEFAULT 0,
      createdAt TEXT DEFAULT (datetime('now')),
      updatedAt TEXT DEFAULT (datetime('now'))
    )
  `);

  // Migration: add isFree column if it doesn't exist
  try {
    const cols = await c.execute("PRAGMA table_info(GameConfig)");
    const hasIsFree = cols.rows.some((r) => r.name === 'isFree');
    if (!hasIsFree) {
      await c.execute('ALTER TABLE GameConfig ADD COLUMN isFree INTEGER DEFAULT 0');
    }
  } catch {
    // Column may already exist, ignore
  }

  // Subscription table - use CREATE IF NOT EXISTS + migrations (never DROP in production)
  await c.execute(`
    CREATE TABLE IF NOT EXISTS Subscription (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT DEFAULT '',
      telegram TEXT DEFAULT '',
      subscriptionCode TEXT UNIQUE NOT NULL,
      plan TEXT DEFAULT 'free',
      isActive INTEGER DEFAULT 1,
      allowedGames TEXT DEFAULT '[]',
      startDate TEXT NOT NULL,
      endDate TEXT,
      startedAt TEXT DEFAULT (datetime('now')),
      expiresAt TEXT,
      createdAt TEXT DEFAULT (datetime('now'))
    )
  `);

  // Migration: add missing columns to Subscription table
  try {
    const subCols = await c.execute('PRAGMA table_info(Subscription)');
    const subColNames = subCols.rows.map((r) => r.name);
    if (!subColNames.includes('telegram')) {
      await c.execute('ALTER TABLE Subscription ADD COLUMN telegram TEXT DEFAULT ""');
    }
    if (!subColNames.includes('expiresAt')) {
      await c.execute('ALTER TABLE Subscription ADD COLUMN expiresAt TEXT');
    }
    if (!subColNames.includes('startedAt')) {
      await c.execute('ALTER TABLE Subscription ADD COLUMN startedAt TEXT DEFAULT (datetime(\'now\'))');
    }
    if (!subColNames.includes('isTrial')) {
      await c.execute('ALTER TABLE Subscription ADD COLUMN isTrial INTEGER DEFAULT 0');
    }
    if (!subColNames.includes('trialSessionsUsed')) {
      await c.execute('ALTER TABLE Subscription ADD COLUMN trialSessionsUsed INTEGER DEFAULT 0');
    }
    if (!subColNames.includes('trialExpiresAt')) {
      await c.execute('ALTER TABLE Subscription ADD COLUMN trialExpiresAt TEXT');
    }
  } catch {
    // Columns may already exist, ignore
  }

  // Migration: add trial columns to SiteConfig table
  try {
    const scCols = await c.execute('PRAGMA table_info(SiteConfig)');
    const scColNames = scCols.rows.map((r) => r.name);
    if (!scColNames.includes('trialGameSlugs')) {
      await c.execute('ALTER TABLE SiteConfig ADD COLUMN trialGameSlugs TEXT DEFAULT "[]"');
    }
    if (!scColNames.includes('maxTrialSessions')) {
      await c.execute('ALTER TABLE SiteConfig ADD COLUMN maxTrialSessions INTEGER DEFAULT 1');
    }
    if (!scColNames.includes('trialDurationDays')) {
      await c.execute('ALTER TABLE SiteConfig ADD COLUMN trialDurationDays INTEGER DEFAULT 3');
    }
  } catch {
    // Columns may already exist, ignore
  }

  await c.execute(`
    CREATE TABLE IF NOT EXISTS GameSession (
      id TEXT PRIMARY KEY,
      gameSlug TEXT NOT NULL,
      hostName TEXT NOT NULL,
      playersCount INTEGER DEFAULT 0,
      duration INTEGER,
      createdAt TEXT DEFAULT (datetime('now'))
    )
  `);

  await c.execute(`
    CREATE TABLE IF NOT EXISTS ContactMessage (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      message TEXT NOT NULL,
      isRead INTEGER DEFAULT 0,
      createdAt TEXT DEFAULT (datetime('now'))
    )
  `);

  await c.execute(`
    CREATE TABLE IF NOT EXISTS SiteConfig (
      id TEXT PRIMARY KEY DEFAULT 'main',
      allowDirectRegistration INTEGER DEFAULT 1,
      telegramLink TEXT DEFAULT '',
      whatsappLink TEXT DEFAULT '',
      subscriptionPrice TEXT DEFAULT '',
      contactMessage TEXT DEFAULT '',
      trialGameSlugs TEXT DEFAULT '[]',
      maxTrialSessions INTEGER DEFAULT 1,
      trialDurationDays INTEGER DEFAULT 3,
      updatedAt TEXT DEFAULT (datetime('now'))
    )
  `);

  // Event table
  await c.execute(`
    CREATE TABLE IF NOT EXISTS Event (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT DEFAULT '',
      imageUrl TEXT DEFAULT '',
      eventType TEXT DEFAULT 'promotion',
      gameSlug TEXT DEFAULT '',
      startDate TEXT NOT NULL,
      endDate TEXT NOT NULL,
      isActive INTEGER DEFAULT 1,
      sortOrder INTEGER DEFAULT 0,
      badge TEXT DEFAULT '🔥',
      badgeColor TEXT DEFAULT 'amber',
      createdAt TEXT DEFAULT (datetime('now')),
      updatedAt TEXT DEFAULT (datetime('now'))
    )
  `);

  // Migration: add gemsBalance column to Subscription
  try {
    const subCols2 = await c.execute('PRAGMA table_info(Subscription)');
    const subColNames2 = subCols2.rows.map((r) => r.name);
    if (!subColNames2.includes('gemsBalance')) {
      await c.execute('ALTER TABLE Subscription ADD COLUMN gemsBalance INTEGER DEFAULT 0');
    }
  } catch {
    // Column may already exist, ignore
  }

  // Migration: add reward columns to Event table
  try {
    const evtCols = await c.execute('PRAGMA table_info(Event)');
    const evtColNames = evtCols.rows.map((r) => r.name);
    if (!evtColNames.includes('rewardType')) {
      await c.execute("ALTER TABLE Event ADD COLUMN rewardType TEXT DEFAULT 'none'");
    }
    if (!evtColNames.includes('rewardAmount')) {
      await c.execute('ALTER TABLE Event ADD COLUMN rewardAmount INTEGER DEFAULT 0');
    }
    if (!evtColNames.includes('rewardDescription')) {
      await c.execute("ALTER TABLE Event ADD COLUMN rewardDescription TEXT DEFAULT ''");
    }
  } catch {
    // Columns may already exist, ignore
  }

  // Migration: add Level/XP columns to Subscription
  try {
    const lvlCols = await c.execute('PRAGMA table_info(Subscription)');
    const lvlColNames = lvlCols.rows.map((r) => r.name);
    if (!lvlColNames.includes('level')) {
      await c.execute('ALTER TABLE Subscription ADD COLUMN level INTEGER DEFAULT 1');
    }
    if (!lvlColNames.includes('xp')) {
      await c.execute('ALTER TABLE Subscription ADD COLUMN xp INTEGER DEFAULT 0');
    }
    if (!lvlColNames.includes('playerId')) {
      await c.execute('ALTER TABLE Subscription ADD COLUMN playerId TEXT');
    }
    if (!lvlColNames.includes('purchasedItems')) {
      await c.execute("ALTER TABLE Subscription ADD COLUMN purchasedItems TEXT DEFAULT '[]'");
    }
  } catch {
    // Columns may already exist, ignore
  }

  // XPHistory table for tracking XP awards
  await c.execute(`
    CREATE TABLE IF NOT EXISTS XPHistory (
      id TEXT PRIMARY KEY,
      subscriptionId TEXT NOT NULL,
      subscriptionCode TEXT NOT NULL,
      amount INTEGER NOT NULL,
      reason TEXT NOT NULL,
      createdAt TEXT DEFAULT (datetime('now'))
    )
  `);

  // GemChargeRequest table for gem charging/purchase requests
  await c.execute(`
    CREATE TABLE IF NOT EXISTS GemChargeRequest (
      id TEXT PRIMARY KEY,
      subscriptionCode TEXT NOT NULL,
      subscriberName TEXT DEFAULT '',
      gemsAmount INTEGER NOT NULL,
      packageType TEXT DEFAULT 'small',
      status TEXT DEFAULT 'pending',
      paymentMethod TEXT DEFAULT '',
      createdAt TEXT DEFAULT (datetime('now'))
    )
  `);

  // AppUser table for user accounts
  await c.execute(`
    CREATE TABLE IF NOT EXISTS AppUser (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      passwordHash TEXT NOT NULL,
      displayName TEXT DEFAULT '',
      phone TEXT DEFAULT '',
      avatar TEXT DEFAULT '',
      role TEXT DEFAULT 'user',
      isActive INTEGER DEFAULT 1,
      subscriptionId TEXT,
      lastLoginAt TEXT,
      createdAt TEXT DEFAULT (datetime('now')),
      updatedAt TEXT DEFAULT (datetime('now'))
    )
  `);

  // PlayerFrame table - frame catalog
  await c.execute(`
    CREATE TABLE IF NOT EXISTS PlayerFrame (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      nameAr TEXT NOT NULL,
      description TEXT DEFAULT '',
      imageUrl TEXT DEFAULT '',
      rarity TEXT DEFAULT 'common',
      gradientFrom TEXT DEFAULT '#f59e0b',
      gradientTo TEXT DEFAULT '#eab308',
      borderColor TEXT DEFAULT 'rgba(245, 158, 11, 0.6)',
      glowColor TEXT DEFAULT 'rgba(245, 158, 11, 0.3)',
      pattern TEXT DEFAULT 'gradient',
      price INTEGER DEFAULT 0,
      isFree INTEGER DEFAULT 0,
      isActive INTEGER DEFAULT 1,
      sortOrder INTEGER DEFAULT 0,
      totalOwned INTEGER DEFAULT 0,
      createdAt TEXT DEFAULT (datetime('now')),
      updatedAt TEXT DEFAULT (datetime('now'))
    )
  `);

  // UserFrame table - user ownership of frames
  await c.execute(`
    CREATE TABLE IF NOT EXISTS UserFrame (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      subscriptionId TEXT,
      frameId TEXT NOT NULL,
      isEquipped INTEGER DEFAULT 0,
      obtainedFrom TEXT DEFAULT 'gift',
      obtainedNote TEXT DEFAULT '',
      obtainedAt TEXT DEFAULT (datetime('now')),
      UNIQUE(userId, frameId)
    )
  `);

  // FriendRequest table
  await c.execute(`
    CREATE TABLE IF NOT EXISTS FriendRequest (
      id TEXT PRIMARY KEY, fromUserId TEXT NOT NULL, toUserId TEXT NOT NULL,
      status TEXT DEFAULT 'pending', createdAt TEXT DEFAULT (datetime('now')), updatedAt TEXT DEFAULT (datetime('now')))
  `);

  // VoiceRoom table
  await c.execute(`
    CREATE TABLE IF NOT EXISTS VoiceRoom (
      id TEXT PRIMARY KEY, name TEXT NOT NULL, description TEXT DEFAULT '',
      hostId TEXT NOT NULL, hostName TEXT DEFAULT '', maxParticipants INTEGER DEFAULT 10,
      isPrivate INTEGER DEFAULT 0, createdAt TEXT DEFAULT (datetime('now')))
  `);

  // VoiceRoomParticipant table
  await c.execute(`
    CREATE TABLE IF NOT EXISTS VoiceRoomParticipant (
      id TEXT PRIMARY KEY, roomId TEXT NOT NULL, userId TEXT NOT NULL,
      username TEXT DEFAULT '', displayName TEXT DEFAULT '', avatar TEXT DEFAULT '',
      isMuted INTEGER DEFAULT 0, joinedAt TEXT DEFAULT (datetime('now')))
  `);

  // Gift table
  await c.execute(`
    CREATE TABLE IF NOT EXISTS Gift (
      id TEXT PRIMARY KEY, name TEXT NOT NULL, nameAr TEXT NOT NULL,
      emoji TEXT DEFAULT '', price INTEGER DEFAULT 0, isActive INTEGER DEFAULT 1)
  `);

  // GiftHistory table
  await c.execute(`
    CREATE TABLE IF NOT EXISTS GiftHistory (
      id TEXT PRIMARY KEY, giftId TEXT NOT NULL, fromUserId TEXT NOT NULL,
      toUserId TEXT NOT NULL, roomId TEXT DEFAULT '', createdAt TEXT DEFAULT (datetime('now')))
  `);

  // Migration: add level column to AppUser if missing
  try {
    const userCols = await c.execute('PRAGMA table_info(AppUser)');
    if (!userCols.rows.some(r => r.name === 'level')) {
      await c.execute('ALTER TABLE AppUser ADD COLUMN level INTEGER DEFAULT 1');
    }
  } catch { /* ignore */ }

  // Migration: add micSeatCount column to VoiceRoom if missing
  try {
    const vrCols = await c.execute('PRAGMA table_info(VoiceRoom)');
    if (!vrCols.rows.some(r => r.name === 'micSeatCount')) {
      await c.execute('ALTER TABLE VoiceRoom ADD COLUMN micSeatCount INTEGER DEFAULT 10');
    }
  } catch { /* ignore */ }

  // Migration: add new VoiceRoom columns
  try {
    const vrCols2 = await c.execute('PRAGMA table_info(VoiceRoom)');
    const vrColNames = vrCols2.rows.map(r => r.name);
    if (!vrColNames.includes('roomMode')) await c.execute("ALTER TABLE VoiceRoom ADD COLUMN roomMode TEXT DEFAULT 'public'");
    if (!vrColNames.includes('roomPassword')) await c.execute("ALTER TABLE VoiceRoom ADD COLUMN roomPassword TEXT DEFAULT ''");
    if (!vrColNames.includes('roomLevel')) await c.execute('ALTER TABLE VoiceRoom ADD COLUMN roomLevel INTEGER DEFAULT 1');
    if (!vrColNames.includes('micTheme')) await c.execute("ALTER TABLE VoiceRoom ADD COLUMN micTheme TEXT DEFAULT 'default'");
    if (!vrColNames.includes('bgmEnabled')) await c.execute('ALTER TABLE VoiceRoom ADD COLUMN bgmEnabled INTEGER DEFAULT 0');
    if (!vrColNames.includes('chatMuted')) await c.execute('ALTER TABLE VoiceRoom ADD COLUMN chatMuted INTEGER DEFAULT 0');
    if (!vrColNames.includes('announcement')) await c.execute("ALTER TABLE VoiceRoom ADD COLUMN announcement TEXT DEFAULT ''");
    if (!vrColNames.includes('giftSplit')) await c.execute('ALTER TABLE VoiceRoom ADD COLUMN giftSplit INTEGER DEFAULT 70');
    if (!vrColNames.includes('isAutoMode')) await c.execute('ALTER TABLE VoiceRoom ADD COLUMN isAutoMode INTEGER DEFAULT 1');
  } catch { /* ignore */ }

  // Migration: add new VoiceRoomParticipant columns
  try {
    const vrpCols = await c.execute('PRAGMA table_info(VoiceRoomParticipant)');
    const vrpColNames = vrpCols.rows.map(r => r.name);
    if (!vrpColNames.includes('role')) await c.execute("ALTER TABLE VoiceRoomParticipant ADD COLUMN role TEXT DEFAULT 'visitor'");
    if (!vrpColNames.includes('seatIndex')) await c.execute('ALTER TABLE VoiceRoomParticipant ADD COLUMN seatIndex INTEGER DEFAULT -1');
    if (!vrpColNames.includes('seatStatus')) await c.execute("ALTER TABLE VoiceRoomParticipant ADD COLUMN seatStatus TEXT DEFAULT 'open'");
    if (!vrpColNames.includes('micFrozen')) await c.execute('ALTER TABLE VoiceRoomParticipant ADD COLUMN micFrozen INTEGER DEFAULT 0');
    if (!vrpColNames.includes('vipLevel')) await c.execute('ALTER TABLE VoiceRoomParticipant ADD COLUMN vipLevel INTEGER DEFAULT 0');
  } catch { /* ignore */ }

  // Migration: add vipLevel to AppUser
  try {
    const auCols = await c.execute('PRAGMA table_info(AppUser)');
    if (!auCols.rows.some(r => r.name === 'vipLevel')) {
      await c.execute('ALTER TABLE AppUser ADD COLUMN vipLevel INTEGER DEFAULT 0');
    }
  } catch { /* ignore */ }

  // RoomBan table
  await c.execute(`
    CREATE TABLE IF NOT EXISTS RoomBan (
      id TEXT PRIMARY KEY, roomId TEXT NOT NULL, userId TEXT NOT NULL,
      bannedBy TEXT NOT NULL, reason TEXT DEFAULT '', createdAt TEXT DEFAULT (datetime('now')))
  `);

  // RoomWaitlist table
  await c.execute(`
    CREATE TABLE IF NOT EXISTS RoomWaitlist (
      id TEXT PRIMARY KEY, roomId TEXT NOT NULL, userId TEXT NOT NULL,
      username TEXT DEFAULT '', displayName TEXT DEFAULT '', avatar TEXT DEFAULT '',
      vipLevel INTEGER DEFAULT 0, requestedSeat INTEGER DEFAULT -1, createdAt TEXT DEFAULT (datetime('now')))
  `);

  // RoomActionLog table
  await c.execute(`
    CREATE TABLE IF NOT EXISTS RoomActionLog (
      id TEXT PRIMARY KEY, roomId TEXT NOT NULL, actorId TEXT NOT NULL,
      actorName TEXT DEFAULT '', action TEXT NOT NULL, targetId TEXT DEFAULT '',
      targetName TEXT DEFAULT '', details TEXT DEFAULT '', createdAt TEXT DEFAULT (datetime('now')))
  `);

  _tablesReady = true;
}

// ─── Seed data ────────────────────────────────────────────────────────

const defaultGames: Omit<GameConfig, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    gameSlug: 'mafia',
    gameName: 'المافيا',
    isEnabled: true,
    order: 0,
    playerRange: '4-14',
    description: 'لعبة المافيا الكلاسيكية مع أدوار متعددة! اكتشف من هو المافيا قبل أن يسيطروا على المدينة.',
    icon: '🕵️',
    color: 'red',
    isComingSoon: false,
  },
  {
    gameSlug: 'tobol',
    gameName: 'طبول الحرب',
    isEnabled: true,
    order: 1,
    playerRange: '2-8',
    description: 'حرب استراتيجية حقيقية مع 64 سلاح و60 زر هجوم! خطط واستولِ على أراضي العدو.',
    icon: '🥁',
    color: 'orange',
    isComingSoon: false,
  },
  {
    gameSlug: 'tabot',
    gameName: 'الهروب من التابوت',
    isEnabled: true,
    order: 2,
    playerRange: '4-16',
    description: 'هل تستطيع الهروب من التابوت قبل فوات الأوان؟ لعبة مليئة بالمفاجآت والرعب!',
    icon: '🪦',
    color: 'purple',
    isComingSoon: false,
  },
  {
    gameSlug: 'prison',
    gameName: 'السجن',
    isEnabled: true,
    order: 3,
    playerRange: '4-16',
    description: 'سجن مليء بالمفاجآت! حبس خصومك، حرر أصدقائك، وتجنب الإعدام في لعبة الاستراتيجية والحظ.',
    icon: '🔒',
    color: 'amber',
    isComingSoon: false,
  },
  {
    gameSlug: 'risk',
    gameName: 'المجازفة',
    isEnabled: true,
    order: 4,
    playerRange: '2-8',
    description: 'ادفع حظك! اسحب البطاقات واجمع النقاط، لكن احذر القنابل! لعبة استراتيجية ومجازفة ممتعة.',
    icon: '💣',
    color: 'violet',
    isComingSoon: false,
  },
  {
    gameSlug: 'risk2',
    gameName: 'المجازفة 2',
    isEnabled: true,
    order: 5,
    playerRange: '2-10',
    description: 'كاشف البطاقات! اختر أرقام مختلفة واحفظ نقاطك. 50 بطاقة و5 بطاقات خاصة ذهبية مضاعفة.',
    icon: '🎴',
    color: 'orange',
    isComingSoon: false,
  },
  {
    gameSlug: 'familyfeud',
    gameName: 'فاميلي فيود',
    isEnabled: true,
    order: 6,
    playerRange: '2-10',
    description: 'لعبة فاميلي فيود الكلاسيكية! المستضيف يتحكم باللعبة ويرى الإجابات.',
    icon: '🏆',
    color: 'amber',
    isComingSoon: false,
  },
  {
    gameSlug: 'baharharb',
    gameName: 'بحر و حرب',
    isEnabled: true,
    order: 7,
    playerRange: '2-20',
    description: 'لعبة ذكاء وكلمات عربية! أجب على الأسئلة واكشف الكلمات المشتركة.',
    icon: '🌊⚔️',
    color: 'teal',
    isComingSoon: false,
  },
];

export async function seedGameConfigs(): Promise<void> {
  await ensureAdminTables();
  const c = getClient();

  const result = await c.execute('SELECT COUNT(*) as count FROM GameConfig');
  const count = Number(result.rows[0]?.count ?? 0);

  if (count === 0) {
    for (const game of defaultGames) {
      await c.execute({
        sql: `INSERT INTO GameConfig (id, gameSlug, gameName, isEnabled, "order", playerRange, description, icon, color, isComingSoon)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          crypto.randomUUID(),
          game.gameSlug,
          game.gameName,
          game.isEnabled ? 1 : 0,
          game.order,
          game.playerRange,
          game.description,
          game.icon,
          game.color,
          game.isComingSoon ? 1 : 0,
        ],
      });
    }
  }
}

// ─── Row mappers ──────────────────────────────────────────────────────

function toGameConfig(row: Record<string, unknown>): GameConfig {
  return {
    id: row.id as string,
    gameSlug: row.gameSlug as string,
    gameName: row.gameName as string,
    isEnabled: !!(row.isEnabled && row.isEnabled !== 0),
    order: (row.order as number) ?? 0,
    playerRange: (row.playerRange as string) ?? '',
    description: (row.description as string) ?? '',
    icon: (row.icon as string) ?? '',
    color: (row.color as string) ?? '',
    isComingSoon: !!(row.isComingSoon && row.isComingSoon !== 0),
    isFree: !!(row.isFree && row.isFree !== 0),
    createdAt: (row.createdAt as string) ?? new Date().toISOString(),
    updatedAt: (row.updatedAt as string) ?? new Date().toISOString(),
  };
}

function parseAllowedGames(val: unknown): string[] {
  if (!val) return [];
  if (Array.isArray(val)) return val as string[];
  try {
    const parsed = JSON.parse(val as string);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function parsePurchasedItems(val: unknown): string[] {
  if (!val) return [];
  if (Array.isArray(val)) return val as string[];
  try {
    const parsed = JSON.parse(val as string);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function toSubscription(row: Record<string, unknown>): Subscription {
  return {
    id: row.id as string,
    name: (row.name as string) ?? '',
    email: (row.email as string) ?? '',
    phone: (row.phone as string) ?? '',
    telegram: (row.telegram as string) ?? '',
    subscriptionCode: (row.subscriptionCode as string) ?? '',
    plan: (row.plan as string) ?? 'free',
    isActive: !!(row.isActive && row.isActive !== 0),
    allowedGames: parseAllowedGames(row.allowedGames),
    startDate: (row.startDate as string) ?? new Date().toISOString(),
    endDate: (row.endDate as string) ?? null,
    startedAt: (row.startedAt as string) ?? new Date().toISOString(),
    expiresAt: (row.expiresAt as string) ?? null,
    createdAt: (row.createdAt as string) ?? new Date().toISOString(),
    isTrial: !!(row.isTrial && row.isTrial !== 0),
    trialSessionsUsed: Number(row.trialSessionsUsed ?? 0),
    trialExpiresAt: (row.trialExpiresAt as string) ?? null,
    gemsBalance: Number(row.gemsBalance ?? 0),
    level: Number(row.level ?? 1),
    xp: Number(row.xp ?? 0),
    playerId: (row.playerId as string) ?? null,
    purchasedItems: parsePurchasedItems(row.purchasedItems),
  };
}

function toGameSession(row: Record<string, unknown>): GameSession {
  return {
    id: row.id as string,
    gameSlug: row.gameSlug as string,
    hostName: row.hostName as string,
    playersCount: (row.playersCount as number) ?? 0,
    duration: row.duration != null ? (row.duration as number) : null,
    createdAt: (row.createdAt as string) ?? new Date().toISOString(),
  };
}

function toContactMessage(row: Record<string, unknown>): ContactMessage {
  return {
    id: row.id as string,
    name: row.name as string,
    email: row.email as string,
    message: row.message as string,
    isRead: !!(row.isRead && row.isRead !== 0),
    createdAt: (row.createdAt as string) ?? new Date().toISOString(),
  };
}

function toEvent(row: Record<string, unknown>): Event {
  return {
    id: row.id as string,
    title: (row.title as string) ?? '',
    description: (row.description as string) ?? '',
    imageUrl: (row.imageUrl as string) ?? '',
    eventType: (row.eventType as Event['eventType']) ?? 'promotion',
    gameSlug: (row.gameSlug as string) ?? '',
    startDate: (row.startDate as string) ?? '',
    endDate: (row.endDate as string) ?? '',
    isActive: !!(row.isActive && row.isActive !== 0),
    sortOrder: (row.sortOrder as number) ?? 0,
    badge: (row.badge as string) ?? '🔥',
    badgeColor: (row.badgeColor as Event['badgeColor']) ?? 'amber',
    rewardType: (row.rewardType as string) ?? 'none',
    rewardAmount: row.rewardAmount != null ? Number(row.rewardAmount) : undefined,
    rewardDescription: (row.rewardDescription as string) ?? undefined,
    createdAt: (row.createdAt as string) ?? new Date().toISOString(),
    updatedAt: (row.updatedAt as string) ?? new Date().toISOString(),
  };
}

function toAppUser(row: Record<string, unknown>): AppUser {
  return {
    id: row.id as string,
    username: (row.username as string) ?? '',
    email: (row.email as string) ?? '',
    passwordHash: (row.passwordHash as string) ?? '',
    displayName: (row.displayName as string) ?? '',
    phone: (row.phone as string) ?? '',
    avatar: (row.avatar as string) ?? '',
    role: ((row.role as string) ?? 'user') as AppUser['role'],
    isActive: !!(row.isActive && row.isActive !== 0),
    subscriptionId: (row.subscriptionId as string) ?? null,
    lastLoginAt: (row.lastLoginAt as string) ?? null,
    createdAt: (row.createdAt as string) ?? new Date().toISOString(),
    updatedAt: (row.updatedAt as string) ?? new Date().toISOString(),
  };
}

// ─── Frame row mappers ────────────────────────────────────────────────

function toPlayerFrame(row: Record<string, unknown>): PlayerFrame {
  return {
    id: row.id as string,
    name: (row.name as string) ?? '',
    nameAr: (row.nameAr as string) ?? '',
    description: (row.description as string) ?? '',
    imageUrl: (row.imageUrl as string) ?? '',
    rarity: (row.rarity as PlayerFrame['rarity']) ?? 'common',
    gradientFrom: (row.gradientFrom as string) ?? '#f59e0b',
    gradientTo: (row.gradientTo as string) ?? '#eab308',
    borderColor: (row.borderColor as string) ?? 'rgba(245, 158, 11, 0.6)',
    glowColor: (row.glowColor as string) ?? 'rgba(245, 158, 11, 0.3)',
    pattern: (row.pattern as PlayerFrame['pattern']) ?? 'gradient',
    price: Number(row.price ?? 0),
    isFree: !!(row.isFree && row.isFree !== 0),
    isActive: !!(row.isActive && row.isActive !== 0),
    sortOrder: Number(row.sortOrder ?? 0),
    totalOwned: Number(row.totalOwned ?? 0),
    createdAt: (row.createdAt as string) ?? new Date().toISOString(),
    updatedAt: (row.updatedAt as string) ?? new Date().toISOString(),
  };
}

function toUserFrame(row: Record<string, unknown>): UserFrame {
  return {
    id: row.id as string,
    userId: (row.userId as string) ?? '',
    subscriptionId: (row.subscriptionId as string) ?? null,
    frameId: (row.frameId as string) ?? '',
    isEquipped: !!(row.isEquipped && row.isEquipped !== 0),
    obtainedFrom: (row.obtainedFrom as UserFrame['obtainedFrom']) ?? 'gift',
    obtainedNote: (row.obtainedNote as string) ?? '',
    obtainedAt: (row.obtainedAt as string) ?? new Date().toISOString(),
  };
}

// ─── GameConfig operations ────────────────────────────────────────────

export async function getAllGames(): Promise<GameConfig[]> {
  await ensureAdminTables();
  await seedGameConfigs();
  const c = getClient();

  const result = await c.execute({
    sql: 'SELECT * FROM GameConfig ORDER BY "order" ASC',
    args: [],
  });

  return result.rows.map((r) => toGameConfig(r as Record<string, unknown>));
}

export async function getEnabledGames(): Promise<GameConfig[]> {
  await ensureAdminTables();
  await seedGameConfigs();
  const c = getClient();

  const result = await c.execute({
    sql: 'SELECT * FROM GameConfig WHERE isEnabled = 1 ORDER BY "order" ASC',
    args: [],
  });

  return result.rows.map((r) => toGameConfig(r as Record<string, unknown>));
}

export async function getGameBySlug(slug: string): Promise<GameConfig | null> {
  await ensureAdminTables();
  const c = getClient();

  const result = await c.execute({
    sql: 'SELECT * FROM GameConfig WHERE gameSlug = ?',
    args: [slug],
  });

  if (result.rows.length === 0) return null;
  return toGameConfig(result.rows[0] as Record<string, unknown>);
}

export async function updateGameConfig(
  slug: string,
  data: Partial<Omit<GameConfig, 'id' | 'createdAt'>>
): Promise<GameConfig | null> {
  await ensureAdminTables();
  const c = getClient();

  const entries = Object.entries(data).filter(([, v]) => v !== undefined);
  if (entries.length === 0) return getGameBySlug(slug);

  const setClauses: string[] = ["updatedAt = datetime('now')"];
  const values: unknown[] = [];

  for (const [key, val] of entries) {
    // Map isEnabled/isComingSoon to integers
    if (key === 'isEnabled' || key === 'isComingSoon') {
      setClauses.push(`${key} = ?`);
      values.push(val ? 1 : 0);
    } else if (key === 'order') {
      setClauses.push(`"order" = ?`);
      values.push(val);
    } else {
      setClauses.push(`${key} = ?`);
      values.push(sqlVal(val));
    }
  }

  values.push(slug);

  await c.execute({
    sql: `UPDATE GameConfig SET ${setClauses.join(', ')} WHERE gameSlug = ?`,
    args: values,
  });

  return getGameBySlug(slug);
}

function toSiteConfig(row: Record<string, unknown>): SiteConfig {
  return {
    id: (row.id as string) ?? 'main',
    allowDirectRegistration: !!(row.allowDirectRegistration && row.allowDirectRegistration !== 0),
    telegramLink: (row.telegramLink as string) ?? '',
    whatsappLink: (row.whatsappLink as string) ?? '',
    subscriptionPrice: (row.subscriptionPrice as string) ?? '',
    contactMessage: (row.contactMessage as string) ?? '',
    updatedAt: (row.updatedAt as string) ?? new Date().toISOString(),
    trialGameSlugs: parseAllowedGames(row.trialGameSlugs),
    maxTrialSessions: Number(row.maxTrialSessions ?? 1),
    trialDurationDays: Number(row.trialDurationDays ?? 3),
  };
}

// ─── Subscription operations ──────────────────────────────────────────

export async function generateSubscriptionCode(): Promise<string> {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = 'GG-';
  for (let i = 0; i < 4; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

export async function createSubscriber(data: {
  name: string;
  email: string;
  phone?: string;
  telegram?: string;
  plan?: string;
  allowedGames?: string[];
  startDate?: string;
  endDate?: string;
  isTrial?: boolean;
  trialSessionsUsed?: number;
  trialExpiresAt?: string;
}): Promise<Subscription> {
  await ensureAdminTables();
  const c = getClient();

  const id = crypto.randomUUID();
  let code = await generateSubscriptionCode();

  // Ensure uniqueness
  for (let attempts = 0; attempts < 10; attempts++) {
    const existing = await c.execute({
      sql: 'SELECT id FROM Subscription WHERE subscriptionCode = ?',
      args: [code],
    });
    if (existing.rows.length === 0) break;
    code = await generateSubscriptionCode();
  }

  const startDate = data.startDate || new Date().toISOString();

  await c.execute({
    sql: `INSERT INTO Subscription (id, name, email, phone, telegram, subscriptionCode, plan, allowedGames, startDate, endDate, isTrial, trialSessionsUsed, trialExpiresAt)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      id,
      data.name,
      data.email,
      data.phone ?? '',
      data.telegram ?? '',
      code,
      data.plan ?? 'free',
      JSON.stringify(data.allowedGames ?? []),
      startDate,
      data.endDate ?? null,
      data.isTrial ? 1 : 0,
      data.trialSessionsUsed ?? 0,
      data.trialExpiresAt ?? null,
    ],
  });

  const result = await c.execute({
    sql: 'SELECT * FROM Subscription WHERE id = ?',
    args: [id],
  });

  return toSubscription(result.rows[0] as Record<string, unknown>);
}

export async function validateSubscriptionCode(code: string): Promise<Subscription | null> {
  await ensureAdminTables();
  const c = getClient();

  const result = await c.execute({
    sql: 'SELECT * FROM Subscription WHERE subscriptionCode = ?',
    args: [code],
  });

  if (result.rows.length === 0) return null;
  return toSubscription(result.rows[0] as Record<string, unknown>);
}

export async function checkGameAccess(subscriptionCode: string, gameSlug: string, options?: { incrementTrialUsage?: boolean }): Promise<{
  allowed: boolean;
  reason: string;
  subscriber?: Subscription;
  trialInfo?: { sessionsUsed: number; maxSessions: number; expiresAt: string | null; daysLeft: number };
}> {
  await ensureAdminTables();
  const c = getClient();

  // First check if the game itself is free
  const gameResult = await c.execute({
    sql: 'SELECT isFree FROM GameConfig WHERE gameSlug = ? AND isEnabled = 1',
    args: [gameSlug],
  });

  if (gameResult.rows.length === 0) {
    return { allowed: false, reason: 'game_not_found' };
  }

  const gameRow = gameResult.rows[0] as Record<string, unknown>;
  if (gameRow.isFree && gameRow.isFree !== 0) {
    return { allowed: true, reason: 'free_game' };
  }

  // Check subscription
  const subResult = await c.execute({
    sql: 'SELECT * FROM Subscription WHERE subscriptionCode = ?',
    args: [subscriptionCode],
  });

  if (subResult.rows.length === 0) {
    return { allowed: false, reason: 'not_subscribed' };
  }

  const subscriber = toSubscription(subResult.rows[0] as Record<string, unknown>);

  // Check if active
  if (!subscriber.isActive) {
    return { allowed: false, reason: 'inactive', subscriber };
  }

  // ─── Trial subscriber checks ──────────────────────────────────
  if (subscriber.isTrial) {
    // Check trial expiry
    if (subscriber.trialExpiresAt) {
      const now = new Date();
      const trialExpiry = new Date(subscriber.trialExpiresAt);
      if (now > trialExpiry) {
        return { allowed: false, reason: 'trial_expired', subscriber };
      }
    }

    // Get max trial sessions from site config
    const siteConfig = await getSiteConfig();
    const maxSessions = siteConfig.maxTrialSessions || 1;

    // Check if trial game slugs are configured
    const trialGames = siteConfig.trialGameSlugs || [];

    // Check if the requested game is in the trial games list
    if (trialGames.length > 0 && !trialGames.includes(gameSlug)) {
      return { allowed: false, reason: 'trial_game_not_included', subscriber };
    }

    // Check if trial sessions are used up
    if (subscriber.trialSessionsUsed >= maxSessions) {
      const daysLeft = subscriber.trialExpiresAt
        ? Math.max(0, Math.ceil((new Date(subscriber.trialExpiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
        : 0;
      return {
        allowed: false,
        reason: 'trial_sessions_exceeded',
        subscriber,
        trialInfo: {
          sessionsUsed: subscriber.trialSessionsUsed,
          maxSessions,
          expiresAt: subscriber.trialExpiresAt,
          daysLeft,
        },
      };
    }

    // Trial is valid — increment usage if requested
    if (options?.incrementTrialUsage) {
      await c.execute({
        sql: 'UPDATE Subscription SET trialSessionsUsed = trialSessionsUsed + 1 WHERE id = ?',
        args: [subscriber.id],
      });
      subscriber.trialSessionsUsed += 1;
    }

    const daysLeft = subscriber.trialExpiresAt
      ? Math.max(0, Math.ceil((new Date(subscriber.trialExpiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
      : 0;

    return {
      allowed: true,
      reason: 'trial_active',
      subscriber,
      trialInfo: {
        sessionsUsed: subscriber.trialSessionsUsed,
        maxSessions,
        expiresAt: subscriber.trialExpiresAt,
        daysLeft,
      },
    };
  }

  // ─── Paid subscriber checks ───────────────────────────────────
  // Check if expired
  if (subscriber.endDate) {
    const now = new Date();
    const endDate = new Date(subscriber.endDate);
    if (now > endDate) {
      return { allowed: false, reason: 'expired', subscriber };
    }
  }

  if (subscriber.expiresAt) {
    const now = new Date();
    const expiresAt = new Date(subscriber.expiresAt);
    if (now > expiresAt) {
      return { allowed: false, reason: 'expired', subscriber };
    }
  }

  // Check if game is in allowed list
  // - For paid subscribers: if allowedGames is non-empty, the game must be in it
  // - For paid subscribers: if allowedGames is empty, DENY access (admin must explicitly assign games)
  // - For trial subscribers: checked above using SiteConfig.trialGameSlugs
  if (subscriber.plan === 'paid') {
    if (subscriber.allowedGames.length === 0 || !subscriber.allowedGames.includes(gameSlug)) {
      return { allowed: false, reason: 'game_not_included', subscriber };
    }
  }

  // Free plan subscribers (non-trial) with no allowed games: deny access to non-free games
  if (subscriber.plan === 'free' && !subscriber.isTrial) {
    return { allowed: false, reason: 'not_subscribed', subscriber };
  }

  return { allowed: true, reason: 'subscribed', subscriber };
}

export async function getAllSubscriptions(): Promise<Subscription[]> {
  await ensureAdminTables();
  const c = getClient();

  const result = await c.execute({
    sql: 'SELECT * FROM Subscription ORDER BY createdAt DESC',
    args: [],
  });

  return result.rows.map((r) => toSubscription(r as Record<string, unknown>));
}

/**
 * @deprecated Use createSubscriber instead
 */
export async function createSubscription(data: {
  email: string;
  name: string;
  plan?: string;
}): Promise<Subscription> {
  return createSubscriber({
    name: data.name,
    email: data.email,
    plan: data.plan,
  });
}

export async function toggleSubscription(id: string): Promise<Subscription | null> {
  await ensureAdminTables();
  const c = getClient();

  await c.execute({
    sql: 'UPDATE Subscription SET isActive = CASE WHEN isActive = 1 THEN 0 ELSE 1 END WHERE id = ?',
    args: [id],
  });

  const result = await c.execute({
    sql: 'SELECT * FROM Subscription WHERE id = ?',
    args: [id],
  });

  if (result.rows.length === 0) return null;
  return toSubscription(result.rows[0] as Record<string, unknown>);
}

export async function updateSubscriber(id: string, data: Partial<Subscription>): Promise<Subscription | null> {
  await ensureAdminTables();
  const c = getClient();

  const entries = Object.entries(data).filter(([, v]) => v !== undefined);
  if (entries.length === 0) {
    const result = await c.execute({
      sql: 'SELECT * FROM Subscription WHERE id = ?',
      args: [id],
    });
    if (result.rows.length === 0) return null;
    return toSubscription(result.rows[0] as Record<string, unknown>);
  }

  const setClauses: string[] = [];
  const values: unknown[] = [];

  for (const [key, val] of entries) {
    if (key === 'isActive') {
      setClauses.push(`isActive = ?`);
      values.push(val ? 1 : 0);
    } else if (key === 'allowedGames') {
      setClauses.push(`allowedGames = ?`);
      values.push(JSON.stringify(val));
    } else if (key === 'id' || key === 'startedAt' || key === 'createdAt') {
      // Skip immutable fields
      continue;
    } else {
      setClauses.push(`${key} = ?`);
      values.push(sqlVal(val));
    }
  }

  if (setClauses.length === 0) {
    const result = await c.execute({
      sql: 'SELECT * FROM Subscription WHERE id = ?',
      args: [id],
    });
    if (result.rows.length === 0) return null;
    return toSubscription(result.rows[0] as Record<string, unknown>);
  }

  values.push(id);

  await c.execute({
    sql: `UPDATE Subscription SET ${setClauses.join(', ')} WHERE id = ?`,
    args: values,
  });

  const result = await c.execute({
    sql: 'SELECT * FROM Subscription WHERE id = ?',
    args: [id],
  });

  if (result.rows.length === 0) return null;
  return toSubscription(result.rows[0] as Record<string, unknown>);
}

export async function deleteSubscriber(id: string): Promise<void> {
  await ensureAdminTables();
  const c = getClient();
  await c.execute({
    sql: 'DELETE FROM Subscription WHERE id = ?',
    args: [id],
  });
}

// ─── SiteConfig operations ────────────────────────────────────────────

export async function getSiteConfig(): Promise<SiteConfig> {
  await ensureAdminTables();
  const c = getClient();

  const result = await c.execute({
    sql: 'SELECT * FROM SiteConfig WHERE id = ?',
    args: ['main'],
  });

  if (result.rows.length === 0) {
    // Insert default row
    await c.execute({
      sql: `INSERT OR IGNORE INTO SiteConfig (id) VALUES ('main')`,
      args: [],
    });
    const fresh = await c.execute({
      sql: 'SELECT * FROM SiteConfig WHERE id = ?',
      args: ['main'],
    });
    return toSiteConfig(fresh.rows[0] as Record<string, unknown>);
  }

  return toSiteConfig(result.rows[0] as Record<string, unknown>);
}

export async function updateSiteConfig(data: Partial<SiteConfig>): Promise<SiteConfig> {
  await ensureAdminTables();
  const c = getClient();

  const entries = Object.entries(data).filter(([, v]) => v !== undefined);
  const setClauses: string[] = ["updatedAt = datetime('now')"];
  const values: unknown[] = [];

  for (const [key, val] of entries) {
    if (key === 'id' || key === 'updatedAt') continue;
    if (key === 'allowDirectRegistration') {
      setClauses.push(`allowDirectRegistration = ?`);
      values.push(val ? 1 : 0);
    } else if (key === 'trialGameSlugs' && Array.isArray(val)) {
      setClauses.push(`trialGameSlugs = ?`);
      values.push(JSON.stringify(val));
    } else {
      setClauses.push(`${key} = ?`);
      values.push(sqlVal(val));
    }
  }

  // Ensure row exists
  await c.execute({ sql: `INSERT OR IGNORE INTO SiteConfig (id) VALUES ('main')`, args: [] });

  values.push('main');
  await c.execute({
    sql: `UPDATE SiteConfig SET ${setClauses.join(', ')} WHERE id = ?`,
    args: values,
  });

  const result = await c.execute({
    sql: 'SELECT * FROM SiteConfig WHERE id = ?',
    args: ['main'],
  });

  return toSiteConfig(result.rows[0] as Record<string, unknown>);
}

// ─── Public subscriber registration (Free Trial) ─────────────────────

export async function registerSubscriber(data: {
  name: string;
  email: string;
  phone?: string;
}): Promise<Subscription> {
  const siteConfig = await getSiteConfig();
  const trialDurationDays = siteConfig.trialDurationDays || 3;
  const trialGameSlugs = siteConfig.trialGameSlugs || [];

  // Calculate trial expiry
  const trialExpiresAt = new Date();
  trialExpiresAt.setDate(trialExpiresAt.getDate() + trialDurationDays);

  return createSubscriber({
    name: data.name,
    email: data.email,
    phone: data.phone,
    plan: 'trial',
    allowedGames: trialGameSlugs,
    isTrial: true,
    trialSessionsUsed: 0,
    trialExpiresAt: trialExpiresAt.toISOString(),
    endDate: trialExpiresAt.toISOString(),
  });
}

// ─── GameSession operations ───────────────────────────────────────────

export async function getAllSessions(limit = 50): Promise<GameSession[]> {
  await ensureAdminTables();
  const c = getClient();

  const result = await c.execute({
    sql: 'SELECT * FROM GameSession ORDER BY createdAt DESC LIMIT ?',
    args: [limit],
  });

  return result.rows.map((r) => toGameSession(r as Record<string, unknown>));
}

export async function getSessionsByGame(gameSlug: string): Promise<GameSession[]> {
  await ensureAdminTables();
  const c = getClient();

  const result = await c.execute({
    sql: 'SELECT * FROM GameSession WHERE gameSlug = ? ORDER BY createdAt DESC LIMIT 50',
    args: [gameSlug],
  });

  return result.rows.map((r) => toGameSession(r as Record<string, unknown>));
}

export async function createSession(data: {
  gameSlug: string;
  hostName: string;
  playersCount: number;
  duration?: number;
}): Promise<GameSession> {
  await ensureAdminTables();
  const c = getClient();

  const id = crypto.randomUUID();

  await c.execute({
    sql: `INSERT INTO GameSession (id, gameSlug, hostName, playersCount, duration)
          VALUES (?, ?, ?, ?, ?)`,
    args: [id, data.gameSlug, data.hostName, data.playersCount, data.duration ?? null],
  });

  const result = await c.execute({
    sql: 'SELECT * FROM GameSession WHERE id = ?',
    args: [id],
  });

  return toGameSession(result.rows[0] as Record<string, unknown>);
}

// ─── ContactMessage operations ────────────────────────────────────────

export async function getAllMessages(): Promise<ContactMessage[]> {
  await ensureAdminTables();
  const c = getClient();

  const result = await c.execute({
    sql: 'SELECT * FROM ContactMessage ORDER BY createdAt DESC',
    args: [],
  });

  return result.rows.map((r) => toContactMessage(r as Record<string, unknown>));
}

export async function getUnreadMessageCount(): Promise<number> {
  await ensureAdminTables();
  const c = getClient();

  const result = await c.execute({
    sql: 'SELECT COUNT(*) as count FROM ContactMessage WHERE isRead = 0',
    args: [],
  });

  return Number(result.rows[0]?.count ?? 0);
}

export async function markMessageAsRead(id: string): Promise<void> {
  await ensureAdminTables();
  const c = getClient();

  await c.execute({
    sql: 'UPDATE ContactMessage SET isRead = 1 WHERE id = ?',
    args: [id],
  });
}

export async function deleteMessage(id: string): Promise<void> {
  await ensureAdminTables();
  const c = getClient();

  await c.execute({
    sql: 'DELETE FROM ContactMessage WHERE id = ?',
    args: [id],
  });
}

export async function createContactMessage(data: {
  name: string;
  email: string;
  message: string;
}): Promise<ContactMessage> {
  await ensureAdminTables();
  const c = getClient();

  const id = crypto.randomUUID();

  await c.execute({
    sql: `INSERT INTO ContactMessage (id, name, email, message)
          VALUES (?, ?, ?, ?)`,
    args: [id, data.name, data.email, data.message],
  });

  const result = await c.execute({
    sql: 'SELECT * FROM ContactMessage WHERE id = ?',
    args: [id],
  });

  return toContactMessage(result.rows[0] as Record<string, unknown>);
}

// ─── Stats ────────────────────────────────────────────────────────────

export async function getDashboardStats(): Promise<{
  totalGames: number;
  enabledGames: number;
  comingSoonGames: number;
  totalSubscriptions: number;
  activeSubscriptions: number;
  totalSessions: number;
  sessionsToday: number;
  totalPlayers: number;
  unreadMessages: number;
  gameStats: { slug: string; name: string; sessions: number; players: number }[];
}> {
  await ensureAdminTables();
  await seedGameConfigs();
  const c = getClient();

  const totalGames = await c.execute('SELECT COUNT(*) as count FROM GameConfig');
  const enabledGames = await c.execute('SELECT COUNT(*) as count FROM GameConfig WHERE isEnabled = 1');
  const comingSoonGames = await c.execute('SELECT COUNT(*) as count FROM GameConfig WHERE isComingSoon = 1');
  const totalSubs = await c.execute('SELECT COUNT(*) as count FROM Subscription');
  const activeSubs = await c.execute('SELECT COUNT(*) as count FROM Subscription WHERE isActive = 1');
  const totalSessions = await c.execute('SELECT COUNT(*) as count FROM GameSession');
  const todayStart = new Date().toISOString().split('T')[0] + 'T00:00:00';
  const sessionsToday = await c.execute({
    sql: 'SELECT COUNT(*) as count FROM GameSession WHERE createdAt >= ?',
    args: [todayStart],
  });
  const totalPlayers = await c.execute('SELECT COALESCE(SUM(playersCount), 0) as total FROM GameSession');
  const unreadMsgs = await c.execute('SELECT COUNT(*) as count FROM ContactMessage WHERE isRead = 0');

  const gameStatsResult = await c.execute(`
    SELECT gs.gameSlug, gc.gameName, COUNT(*) as sessions, SUM(gs.playersCount) as players
    FROM GameSession gs
    JOIN GameConfig gc ON gs.gameSlug = gc.gameSlug
    GROUP BY gs.gameSlug
    ORDER BY sessions DESC
  `);

  return {
    totalGames: Number(totalGames.rows[0]?.count ?? 0),
    enabledGames: Number(enabledGames.rows[0]?.count ?? 0),
    comingSoonGames: Number(comingSoonGames.rows[0]?.count ?? 0),
    totalSubscriptions: Number(totalSubs.rows[0]?.count ?? 0),
    activeSubscriptions: Number(activeSubs.rows[0]?.count ?? 0),
    totalSessions: Number(totalSessions.rows[0]?.count ?? 0),
    sessionsToday: Number(sessionsToday.rows[0]?.count ?? 0),
    totalPlayers: Number(totalPlayers.rows[0]?.total ?? 0),
    unreadMessages: Number(unreadMsgs.rows[0]?.count ?? 0),
    gameStats: gameStatsResult.rows.map((r) => ({
      slug: r.gameSlug as string,
      name: r.gameName as string,
      sessions: Number(r.sessions ?? 0),
      players: Number(r.players ?? 0),
    })),
  };
}

// ─── Event operations ──────────────────────────────────────────────────

export async function getAllEvents(): Promise<Event[]> {
  await ensureAdminTables();
  const c = getClient();

  const result = await c.execute({
    sql: 'SELECT * FROM Event ORDER BY sortOrder ASC, createdAt DESC',
    args: [],
  });

  return result.rows.map((r) => toEvent(r as Record<string, unknown>));
}

export async function getActiveEvents(): Promise<Event[]> {
  await ensureAdminTables();
  const c = getClient();
  const now = new Date().toISOString();

  const result = await c.execute({
    sql: 'SELECT * FROM Event WHERE isActive = 1 AND startDate <= ? AND endDate >= ? ORDER BY sortOrder ASC',
    args: [now, now],
  });

  return result.rows.map((r) => toEvent(r as Record<string, unknown>));
}

export async function getEventsByGame(gameSlug: string): Promise<Event[]> {
  await ensureAdminTables();
  const c = getClient();
  const now = new Date().toISOString();

  const result = await c.execute({
    sql: "SELECT * FROM Event WHERE isActive = 1 AND startDate <= ? AND endDate >= ? AND (gameSlug = ? OR gameSlug = '') ORDER BY sortOrder ASC",
    args: [now, now, gameSlug],
  });

  return result.rows.map((r) => toEvent(r as Record<string, unknown>));
}

export async function createEvent(data: {
  title: string;
  description?: string;
  imageUrl?: string;
  eventType?: string;
  gameSlug?: string;
  startDate: string;
  endDate: string;
  badge?: string;
  badgeColor?: string;
  sortOrder?: number;
  rewardType?: string;
  rewardAmount?: number;
  rewardDescription?: string;
}): Promise<Event> {
  await ensureAdminTables();
  const c = getClient();

  const id = crypto.randomUUID();

  await c.execute({
    sql: `INSERT INTO Event (id, title, description, imageUrl, eventType, gameSlug, startDate, endDate, badge, badgeColor, sortOrder, rewardType, rewardAmount, rewardDescription)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      id,
      data.title,
      data.description ?? '',
      data.imageUrl ?? '',
      data.eventType ?? 'promotion',
      data.gameSlug ?? '',
      data.startDate,
      data.endDate,
      data.badge ?? '🔥',
      data.badgeColor ?? 'amber',
      data.sortOrder ?? 0,
      data.rewardType ?? 'none',
      data.rewardAmount ?? 0,
      data.rewardDescription ?? '',
    ],
  });

  const result = await c.execute({
    sql: 'SELECT * FROM Event WHERE id = ?',
    args: [id],
  });

  return toEvent(result.rows[0] as Record<string, unknown>);
}

export async function updateEvent(id: string, data: Partial<Omit<Event, 'id' | 'createdAt'>>): Promise<Event | null> {
  await ensureAdminTables();
  const c = getClient();

  const entries = Object.entries(data).filter(([, v]) => v !== undefined);
  if (entries.length === 0) {
    const result = await c.execute({ sql: 'SELECT * FROM Event WHERE id = ?', args: [id] });
    if (result.rows.length === 0) return null;
    return toEvent(result.rows[0] as Record<string, unknown>);
  }

  const setClauses: string[] = ["updatedAt = datetime('now')"];
  const values: unknown[] = [];

  for (const [key, val] of entries) {
    if (key === 'isActive') {
      setClauses.push('isActive = ?');
      values.push(val ? 1 : 0);
    } else {
      setClauses.push(`${key} = ?`);
      values.push(sqlVal(val));
    }
  }

  values.push(id);
  await c.execute({ sql: `UPDATE Event SET ${setClauses.join(', ')} WHERE id = ?`, args: values });

  const result = await c.execute({ sql: 'SELECT * FROM Event WHERE id = ?', args: [id] });
  if (result.rows.length === 0) return null;
  return toEvent(result.rows[0] as Record<string, unknown>);
}

export async function deleteEvent(id: string): Promise<void> {
  await ensureAdminTables();
  const c = getClient();
  await c.execute({ sql: 'DELETE FROM Event WHERE id = ?', args: [id] });
}

// ─── Gems operations ──────────────────────────────────────────────────

export async function deductGems(subscriptionCode: string, amount: number): Promise<{ success: boolean; newBalance: number; error?: string }> {
  await ensureAdminTables();
  const c = getClient();

  const result = await c.execute({
    sql: 'SELECT * FROM Subscription WHERE subscriptionCode = ? AND isActive = 1',
    args: [subscriptionCode],
  });

  if (result.rows.length === 0) {
    return { success: false, newBalance: 0, error: 'كود الاشتراك غير صالح' };
  }

  const sub = toSubscription(result.rows[0] as Record<string, unknown>);

  if (sub.gemsBalance < amount) {
    return { success: false, newBalance: sub.gemsBalance, error: 'رصيد غير كافٍ' };
  }

  const newBalance = sub.gemsBalance - amount;
  await c.execute({
    sql: 'UPDATE Subscription SET gemsBalance = gemsBalance - ? WHERE id = ?',
    args: [amount, sub.id],
  });

  return { success: true, newBalance };
}

// ─── Add Gems ──────────────────────────────────────────────────────────

export async function addGems(subscriptionCode: string, amount: number): Promise<{ success: boolean; newBalance: number; error?: string }> {
  await ensureAdminTables();
  const c = getClient();

  const result = await c.execute({
    sql: 'SELECT * FROM Subscription WHERE subscriptionCode = ? AND isActive = 1',
    args: [subscriptionCode],
  });

  if (result.rows.length === 0) {
    return { success: false, newBalance: 0, error: 'كود الاشتراك غير صالح' };
  }

  const sub = toSubscription(result.rows[0] as Record<string, unknown>);

  const newBalance = sub.gemsBalance + amount;
  await c.execute({
    sql: 'UPDATE Subscription SET gemsBalance = gemsBalance + ? WHERE id = ?',
    args: [amount, sub.id],
  });

  return { success: true, newBalance };
}

// ─── GemChargeRequest operations ────────────────────────────────────────

function toGemChargeRequest(row: Record<string, unknown>): GemChargeRequest {
  return {
    id: row.id as string,
    subscriptionCode: (row.subscriptionCode as string) ?? '',
    subscriberName: (row.subscriberName as string) ?? '',
    gemsAmount: Number(row.gemsAmount ?? 0),
    packageType: (row.packageType as GemChargeRequest['packageType']) ?? 'small',
    status: (row.status as GemChargeRequest['status']) ?? 'pending',
    paymentMethod: (row.paymentMethod as string) ?? '',
    createdAt: (row.createdAt as string) ?? new Date().toISOString(),
  };
}

export async function createChargeRequest(data: {
  subscriptionCode: string;
  subscriberName?: string;
  gemsAmount: number;
  packageType: 'small' | 'medium' | 'large' | 'mega';
  paymentMethod: string;
}): Promise<GemChargeRequest> {
  await ensureAdminTables();
  const c = getClient();

  const id = crypto.randomUUID();

  await c.execute({
    sql: `INSERT INTO GemChargeRequest (id, subscriptionCode, subscriberName, gemsAmount, packageType, status, paymentMethod)
          VALUES (?, ?, ?, ?, ?, 'pending', ?)`,
    args: [
      id,
      data.subscriptionCode,
      data.subscriberName ?? '',
      data.gemsAmount,
      data.packageType,
      data.paymentMethod,
    ],
  });

  const result = await c.execute({
    sql: 'SELECT * FROM GemChargeRequest WHERE id = ?',
    args: [id],
  });

  return toGemChargeRequest(result.rows[0] as Record<string, unknown>);
}

export async function getAllChargeRequests(limit = 50): Promise<GemChargeRequest[]> {
  await ensureAdminTables();
  const c = getClient();

  const result = await c.execute({
    sql: 'SELECT * FROM GemChargeRequest ORDER BY createdAt DESC LIMIT ?',
    args: [limit],
  });

  return result.rows.map((r) => toGemChargeRequest(r as Record<string, unknown>));
}

export async function updateChargeRequestStatus(
  requestId: string,
  newStatus: 'pending' | 'approved' | 'rejected'
): Promise<{ success: boolean; newBalance?: number; error?: string }> {
  await ensureAdminTables();
  const c = getClient();

  // Fetch the charge request
  const reqResult = await c.execute({
    sql: 'SELECT * FROM GemChargeRequest WHERE id = ?',
    args: [requestId],
  });

  if (reqResult.rows.length === 0) {
    return { success: false, error: 'طلب الشحن غير موجود' };
  }

  const request = toGemChargeRequest(reqResult.rows[0] as Record<string, unknown>);

  if (request.status === 'approved') {
    return { success: false, error: 'تم الموافقة على هذا الطلب مسبقاً' };
  }

  // Update status
  await c.execute({
    sql: 'UPDATE GemChargeRequest SET status = ? WHERE id = ?',
    args: [newStatus, requestId],
  });

  // If approved, add gems to subscriber
  if (newStatus === 'approved') {
    const gemsResult = await addGems(request.subscriptionCode, request.gemsAmount);
    if (!gemsResult.success) {
      return { success: false, error: gemsResult.error };
    }
    return { success: true, newBalance: gemsResult.newBalance };
  }

  return { success: true };
}

// ─── Level / XP System ────────────────────────────────────────────────

/**
 * Calculate the XP needed to go from `level` to `level + 1`.
 * Formula: ((level + (level + 1)) * 1000) / 2
 */
export function calculateXPForLevel(level: number): number {
  return Math.floor(((level + (level + 1)) * 1000) / 2);
}

/**
 * Calculate total XP needed from level 1 to level `level` (exclusive).
 * This is the total XP a player would have accumulated reaching level `level`.
 */
export function calculateTotalXPForLevel(level: number): number {
  let total = 0;
  for (let i = 1; i < level; i++) {
    total += calculateXPForLevel(i);
  }
  return total;
}

/**
 * Get the current level based on total accumulated XP.
 */
export function getLevelFromXP(totalXP: number): number {
  let level = 1;
  let accumulatedXP = 0;

  while (level < MAX_LEVEL) {
    const needed = calculateXPForLevel(level);
    if (accumulatedXP + needed > totalXP) {
      break;
    }
    accumulatedXP += needed;
    level++;
  }

  return level;
}

/**
 * Get detailed XP progress for a given total XP.
 */
export function getXPProgress(totalXP: number): {
  currentLevel: number;
  currentLevelXP: number;
  nextLevelXP: number;
  progress: number;
  isMaxLevel: boolean;
} {
  const currentLevel = getLevelFromXP(totalXP);
  const isMaxLevel = currentLevel >= MAX_LEVEL;

  if (isMaxLevel) {
    return {
      currentLevel: MAX_LEVEL,
      currentLevelXP: 0,
      nextLevelXP: 0,
      progress: 100,
      isMaxLevel: true,
    };
  }

  // Calculate how much XP was needed to reach currentLevel
  const totalForCurrentLevel = calculateTotalXPForLevel(currentLevel);
  // XP earned within the current level
  const currentLevelXP = totalXP - totalForCurrentLevel;
  // XP needed to reach next level
  const nextLevelXP = calculateXPForLevel(currentLevel);
  // Progress percentage
  const progress = nextLevelXP > 0 ? Math.min(100, Math.floor((currentLevelXP / nextLevelXP) * 100)) : 0;

  return {
    currentLevel,
    currentLevelXP,
    nextLevelXP,
    progress,
    isMaxLevel: false,
  };
}

// ─── Player ID Generation ─────────────────────────────────────────────

const SPECIAL_IDS = new Set([
  '11111', '22222', '33333', '44444', '55555',
  '66666', '77777', '88888', '99999', '00000',
  '12345', '54321', '13579', '97531', '24680',
  '08642', '11223', '33445', '55667', '77889',
]);

/**
 * Check if a player ID is a special/premium ID.
 */
export function isSpecialId(id: string): boolean {
  return SPECIAL_IDS.has(id);
}

/**
 * Generate a unique random 5-digit player ID (10000-99999).
 */
export async function generatePlayerId(): Promise<string> {
  await ensureAdminTables();
  const c = getClient();

  for (let attempts = 0; attempts < 50; attempts++) {
    const id = String(Math.floor(10000 + Math.random() * 90000));

    // Check uniqueness in DB
    const existing = await c.execute({
      sql: 'SELECT id FROM Subscription WHERE playerId = ?',
      args: [id],
    });

    if (existing.rows.length === 0) {
      return id;
    }
  }

  // Fallback: use timestamp-based approach
  return String(Date.now()).slice(-5);
}

// ─── XP Awarding ───────────────────────────────────────────────────────

/**
 * Award XP to a player and update their level accordingly.
 */
export async function awardXP(
  subscriptionCode: string,
  amount: number,
  reason: string
): Promise<{
  success: boolean;
  newLevel: number;
  newXPTotal: number;
  leveledUp: boolean;
  error?: string;
}> {
  await ensureAdminTables();
  const c = getClient();

  // Validate reason
  const validReasons: string[] = ['game_play', 'game_win', 'event_complete', 'purchase', 'invite', 'daily_login'];
  if (!validReasons.includes(reason)) {
    return { success: false, newLevel: 0, newXPTotal: 0, leveledUp: false, error: 'Invalid XP reason' };
  }

  // Validate amount
  if (!Number.isInteger(amount) || amount <= 0) {
    return { success: false, newLevel: 0, newXPTotal: 0, leveledUp: false, error: 'Invalid XP amount' };
  }

  // Find subscriber
  const result = await c.execute({
    sql: 'SELECT * FROM Subscription WHERE subscriptionCode = ? AND isActive = 1',
    args: [subscriptionCode],
  });

  if (result.rows.length === 0) {
    return { success: false, newLevel: 0, newXPTotal: 0, leveledUp: false, error: 'Subscriber not found' };
  }

  const sub = toSubscription(result.rows[0] as Record<string, unknown>);

  // Calculate new XP and level
  const currentTotalXP = sub.xp;
  const newTotalXP = currentTotalXP + amount;
  const oldLevel = sub.level;
  const newLevel = getLevelFromXP(newTotalXP);
  const leveledUp = newLevel > oldLevel;

  // Update XP and level in DB
  await c.execute({
    sql: 'UPDATE Subscription SET xp = ?, level = ? WHERE id = ?',
    args: [newTotalXP, newLevel, sub.id],
  });

  // Record XP history
  const historyId = crypto.randomUUID();
  await c.execute({
    sql: `INSERT INTO XPHistory (id, subscriptionId, subscriptionCode, amount, reason)
          VALUES (?, ?, ?, ?, ?)`,
    args: [historyId, sub.id, subscriptionCode, amount, reason],
  });

  return { success: true, newLevel, newXPTotal: newTotalXP, leveledUp };
}

/**
 * Get XP history for a subscriber.
 */
export async function getXPHistory(subscriptionCode: string, limit = 20): Promise<XPRecord[]> {
  await ensureAdminTables();
  const c = getClient();

  const result = await c.execute({
    sql: 'SELECT * FROM XPHistory WHERE subscriptionCode = ? ORDER BY createdAt DESC LIMIT ?',
    args: [subscriptionCode, limit],
  });

  return result.rows.map((r) => ({
    id: r.id as string,
    subscriptionId: r.subscriptionId as string,
    subscriptionCode: r.subscriptionCode as string,
    amount: Number(r.amount ?? 0),
    reason: r.reason as string,
    createdAt: (r.createdAt as string) ?? new Date().toISOString(),
  }));
}

/**
 * Assign a player ID to a subscriber.
 */
export async function assignPlayerId(subscriptionCode: string): Promise<{ success: boolean; playerId?: string; error?: string }> {
  await ensureAdminTables();
  const c = getClient();

  const result = await c.execute({
    sql: 'SELECT * FROM Subscription WHERE subscriptionCode = ? AND isActive = 1',
    args: [subscriptionCode],
  });

  if (result.rows.length === 0) {
    return { success: false, error: 'Subscriber not found' };
  }

  const sub = toSubscription(result.rows[0] as Record<string, unknown>);

  if (sub.playerId) {
    return { success: true, playerId: sub.playerId };
  }

  const playerId = await generatePlayerId();

  await c.execute({
    sql: 'UPDATE Subscription SET playerId = ? WHERE id = ?',
    args: [playerId, sub.id],
  });

  return { success: true, playerId };
}

/**
 * Get leaderboard - top players by XP/level.
 */
export async function getLeaderboard(limit = 50): Promise<{
  rank: number;
  playerId: string;
  name: string;
  level: number;
  xp: number;
  isSpecialId: boolean;
}[]> {
  await ensureAdminTables();
  const c = getClient();

  const result = await c.execute({
    sql: `SELECT playerId, name, level, xp FROM Subscription
          WHERE isActive = 1 AND playerId IS NOT NULL AND playerId != ''
          ORDER BY xp DESC, level DESC
          LIMIT ?`,
    args: [limit],
  });

  return result.rows.map((r, index) => ({
    rank: index + 1,
    playerId: r.playerId as string,
    name: r.name as string,
    level: Number(r.level ?? 1),
    xp: Number(r.xp ?? 0),
    isSpecialId: isSpecialId(r.playerId as string),
  }));
}

// ─── AppUser operations ───────────────────────────────────────────────

export { hashPassword, verifyPassword } from '@/lib/admin-auth';

export async function createUser(data: {
  username: string;
  email: string;
  password: string;
  displayName?: string;
  phone?: string;
}): Promise<Omit<AppUser, 'passwordHash'>> {
  const { hashPassword } = await import('@/lib/admin-auth');
  await ensureAdminTables();
  const c = getClient();

  // Check uniqueness
  const existingEmail = await c.execute({
    sql: 'SELECT id FROM AppUser WHERE email = ?',
    args: [data.email],
  });
  if (existingEmail.rows.length > 0) {
    throw new Error('البريد الإلكتروني مستخدم بالفعل');
  }

  const existingUsername = await c.execute({
    sql: 'SELECT id FROM AppUser WHERE username = ?',
    args: [data.username],
  });
  if (existingUsername.rows.length > 0) {
    throw new Error('اسم المستخدم مستخدم بالفعل');
  }

  const id = crypto.randomUUID();
  const passwordHash = hashPassword(data.password);

  await c.execute({
    sql: `INSERT INTO AppUser (id, username, email, passwordHash, displayName, phone)
          VALUES (?, ?, ?, ?, ?, ?)`,
    args: [
      id,
      data.username,
      data.email,
      passwordHash,
      data.displayName || '',
      data.phone || '',
    ],
  });

  const result = await c.execute({
    sql: 'SELECT * FROM AppUser WHERE id = ?',
    args: [id],
  });

  const user = toAppUser(result.rows[0] as Record<string, unknown>);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { passwordHash: _, ...safeUser } = user;
  return safeUser;
}

export async function getUserById(id: string): Promise<Omit<AppUser, 'passwordHash'> | null> {
  await ensureAdminTables();
  const c = getClient();

  const result = await c.execute({
    sql: 'SELECT * FROM AppUser WHERE id = ? AND isActive = 1',
    args: [id],
  });

  if (result.rows.length === 0) return null;
  const user = toAppUser(result.rows[0] as Record<string, unknown>);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { passwordHash: _, ...safeUser } = user;
  return safeUser;
}

export async function getUserByEmail(email: string): Promise<Omit<AppUser, 'passwordHash'> | null> {
  await ensureAdminTables();
  const c = getClient();

  const result = await c.execute({
    sql: 'SELECT * FROM AppUser WHERE email = ? AND isActive = 1',
    args: [email],
  });

  if (result.rows.length === 0) return null;
  const user = toAppUser(result.rows[0] as Record<string, unknown>);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { passwordHash: _, ...safeUser } = user;
  return safeUser;
}

export async function getUserByUsername(username: string): Promise<Omit<AppUser, 'passwordHash'> | null> {
  await ensureAdminTables();
  const c = getClient();

  const result = await c.execute({
    sql: 'SELECT * FROM AppUser WHERE username = ? AND isActive = 1',
    args: [username],
  });

  if (result.rows.length === 0) return null;
  const user = toAppUser(result.rows[0] as Record<string, unknown>);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { passwordHash: _, ...safeUser } = user;
  return safeUser;
}

export async function updateUser(
  id: string,
  data: Partial<Omit<AppUser, 'id' | 'passwordHash' | 'createdAt'>>
): Promise<Omit<AppUser, 'passwordHash'> | null> {
  await ensureAdminTables();
  const c = getClient();

  const entries = Object.entries(data).filter(([, v]) => v !== undefined);
  if (entries.length === 0) return getUserById(id);

  const setClauses: string[] = ["updatedAt = datetime('now')"];
  const values: unknown[] = [];

  for (const [key, val] of entries) {
    if (key === 'isActive') {
      setClauses.push(`isActive = ?`);
      values.push(val ? 1 : 0);
    } else if (key === 'role') {
      setClauses.push(`role = ?`);
      values.push(val);
    } else {
      setClauses.push(`${key} = ?`);
      values.push(sqlVal(val));
    }
  }

  values.push(id);

  await c.execute({
    sql: `UPDATE AppUser SET ${setClauses.join(', ')} WHERE id = ?`,
    args: values,
  });

  return getUserById(id);
}

export async function deleteUser(id: string): Promise<void> {
  await ensureAdminTables();
  const c = getClient();

  await c.execute({
    sql: 'UPDATE AppUser SET isActive = 0, updatedAt = datetime(\'now\') WHERE id = ?',
    args: [id],
  });
}

export async function getAllUsers(): Promise<Omit<AppUser, 'passwordHash'>[]> {
  await ensureAdminTables();
  const c = getClient();

  const result = await c.execute({
    sql: 'SELECT * FROM AppUser ORDER BY createdAt DESC',
    args: [],
  });

  return result.rows.map((r) => {
    const user = toAppUser(r as Record<string, unknown>);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash: _, ...safeUser } = user;
    return safeUser;
  });
}

// ─── PlayerFrame operations ──────────────────────────────────────────

export async function getAllFrames(): Promise<PlayerFrame[]> {
  await ensureAdminTables();
  await seedDefaultFrames();
  const c = getClient();
  const result = await c.execute({
    sql: 'SELECT * FROM PlayerFrame ORDER BY sortOrder ASC, createdAt ASC',
    args: [],
  });
  return result.rows.map((r) => toPlayerFrame(r as Record<string, unknown>));
}

export async function getActiveFrames(): Promise<PlayerFrame[]> {
  await ensureAdminTables();
  await seedDefaultFrames();
  const c = getClient();
  const result = await c.execute({
    sql: 'SELECT * FROM PlayerFrame WHERE isActive = 1 ORDER BY sortOrder ASC',
    args: [],
  });
  return result.rows.map((r) => toPlayerFrame(r as Record<string, unknown>));
}

export async function getFrameById(id: string): Promise<PlayerFrame | null> {
  await ensureAdminTables();
  const c = getClient();
  const result = await c.execute({
    sql: 'SELECT * FROM PlayerFrame WHERE id = ?',
    args: [id],
  });
  if (result.rows.length === 0) return null;
  return toPlayerFrame(result.rows[0] as Record<string, unknown>);
}

export async function createFrame(data: {
  name: string;
  nameAr: string;
  description?: string;
  imageUrl?: string;
  rarity?: PlayerFrame['rarity'];
  gradientFrom?: string;
  gradientTo?: string;
  borderColor?: string;
  glowColor?: string;
  pattern?: PlayerFrame['pattern'];
  price?: number;
  isFree?: boolean;
  isActive?: boolean;
  sortOrder?: number;
}): Promise<PlayerFrame> {
  await ensureAdminTables();
  const c = getClient();
  const id = crypto.randomUUID();
  await c.execute({
    sql: `INSERT INTO PlayerFrame (id, name, nameAr, description, imageUrl, rarity, gradientFrom, gradientTo, borderColor, glowColor, pattern, price, isFree, isActive, sortOrder)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      id, data.name, data.nameAr, data.description ?? '', data.imageUrl ?? '',
      data.rarity ?? 'common', data.gradientFrom ?? '#f59e0b', data.gradientTo ?? '#eab308',
      data.borderColor ?? 'rgba(245, 158, 11, 0.6)', data.glowColor ?? 'rgba(245, 158, 11, 0.3)',
      data.pattern ?? 'gradient', data.price ?? 0, data.isFree ? 1 : 0,
      data.isActive !== false ? 1 : 0, data.sortOrder ?? 0,
    ],
  });
  const result = await c.execute({ sql: 'SELECT * FROM PlayerFrame WHERE id = ?', args: [id] });
  return toPlayerFrame(result.rows[0] as Record<string, unknown>);
}

export async function updateFrame(id: string, data: Partial<PlayerFrame>): Promise<PlayerFrame | null> {
  await ensureAdminTables();
  const c = getClient();
  const entries = Object.entries(data).filter(([, v]) => v !== undefined);
  if (entries.length === 0) return getFrameById(id);

  const setClauses: string[] = ["updatedAt = datetime('now')"];
  const values: unknown[] = [];

  for (const [key, val] of entries) {
    if (key === 'id' || key === 'createdAt' || key === 'totalOwned') continue;
    if (key === 'isActive' || key === 'isFree' || key === 'isEquipped') {
      setClauses.push(`${key} = ?`);
      values.push(val ? 1 : 0);
    } else {
      setClauses.push(`${key} = ?`);
      values.push(sqlVal(val));
    }
  }

  values.push(id);
  await c.execute({
    sql: `UPDATE PlayerFrame SET ${setClauses.join(', ')} WHERE id = ?`,
    args: values,
  });
  return getFrameById(id);
}

export async function deleteFrame(id: string): Promise<void> {
  await ensureAdminTables();
  const c = getClient();
  await c.execute({ sql: 'DELETE FROM UserFrame WHERE frameId = ?', args: [id] });
  await c.execute({ sql: 'DELETE FROM PlayerFrame WHERE id = ?', args: [id] });
}

// ─── UserFrame operations ────────────────────────────────────────────

export async function getUserFrames(userId: string): Promise<(UserFrame & { frame: PlayerFrame })[]> {
  await ensureAdminTables();
  const c = getClient();
  const result = await c.execute({
    sql: `SELECT uf.*, pf.name, pf.nameAr, pf.description as frameDesc, pf.imageUrl, pf.rarity,
          pf.gradientFrom, pf.gradientTo, pf.borderColor, pf.glowColor, pf.pattern, pf.price,
          pf.isFree, pf.isActive as frameActive, pf.sortOrder as frameSortOrder
          FROM UserFrame uf
          JOIN PlayerFrame pf ON uf.frameId = pf.id
          WHERE uf.userId = ?
          ORDER BY uf.isEquipped DESC, pf.sortOrder ASC`,
    args: [userId],
  });
  return result.rows.map((r) => {
    const row = r as Record<string, unknown>;
    return {
      ...toUserFrame(row),
      frame: {
        id: row.frameId as string,
        name: row.name as string,
        nameAr: row.nameAr as string,
        description: row.frameDesc as string,
        imageUrl: row.imageUrl as string,
        rarity: row.rarity as PlayerFrame['rarity'],
        gradientFrom: row.gradientFrom as string,
        gradientTo: row.gradientTo as string,
        borderColor: row.borderColor as string,
        glowColor: row.glowColor as string,
        pattern: row.pattern as PlayerFrame['pattern'],
        price: Number(row.price ?? 0),
        isFree: !!(row.isFree && row.isFree !== 0),
        isActive: !!(row.frameActive && row.frameActive !== 0),
        sortOrder: Number(row.frameSortOrder ?? 0),
        totalOwned: 0,
        createdAt: '',
        updatedAt: '',
      },
    };
  });
}

export async function grantFrameToUser(data: {
  userId: string;
  subscriptionId?: string;
  frameId: string;
  obtainedFrom?: UserFrame['obtainedFrom'];
  obtainedNote?: string;
}): Promise<UserFrame | null> {
  await ensureAdminTables();
  const c = getClient();

  const existing = await c.execute({
    sql: 'SELECT id FROM UserFrame WHERE userId = ? AND frameId = ?',
    args: [data.userId, data.frameId],
  });
  if (existing.rows.length > 0) return null;

  const id = crypto.randomUUID();
  await c.execute({
    sql: `INSERT INTO UserFrame (id, userId, subscriptionId, frameId, isEquipped, obtainedFrom, obtainedNote)
          VALUES (?, ?, ?, ?, 0, ?, ?)`,
    args: [id, data.userId, data.subscriptionId ?? null, data.frameId, data.obtainedFrom ?? 'gift', data.obtainedNote ?? ''],
  });

  await c.execute({
    sql: 'UPDATE PlayerFrame SET totalOwned = totalOwned + 1 WHERE id = ?',
    args: [data.frameId],
  });

  const result = await c.execute({ sql: 'SELECT * FROM UserFrame WHERE id = ?', args: [id] });
  if (result.rows.length === 0) return null;
  return toUserFrame(result.rows[0] as Record<string, unknown>);
}

export async function equipFrame(userId: string, frameId: string | null): Promise<void> {
  await ensureAdminTables();
  const c = getClient();
  await c.execute({ sql: 'UPDATE UserFrame SET isEquipped = 0 WHERE userId = ?', args: [userId] });
  if (frameId) {
    await c.execute({ sql: 'UPDATE UserFrame SET isEquipped = 1 WHERE userId = ? AND frameId = ?', args: [userId, frameId] });
  }
}

export async function removeFrameFromUser(userId: string, frameId: string): Promise<void> {
  await ensureAdminTables();
  const c = getClient();
  await c.execute({ sql: 'DELETE FROM UserFrame WHERE userId = ? AND frameId = ?', args: [userId, frameId] });
  await c.execute({ sql: 'UPDATE PlayerFrame SET totalOwned = MAX(0, totalOwned - 1) WHERE id = ?', args: [frameId] });
}

export async function getEquippedFrame(userId: string): Promise<(UserFrame & { frame: PlayerFrame }) | null> {
  await ensureAdminTables();
  const c = getClient();
  const result = await c.execute({
    sql: `SELECT uf.*, pf.name, pf.nameAr, pf.description as frameDesc, pf.imageUrl, pf.rarity,
          pf.gradientFrom, pf.gradientTo, pf.borderColor, pf.glowColor, pf.pattern, pf.price,
          pf.isFree, pf.isActive as frameActive, pf.sortOrder as frameSortOrder
          FROM UserFrame uf
          JOIN PlayerFrame pf ON uf.frameId = pf.id
          WHERE uf.userId = ? AND uf.isEquipped = 1
          LIMIT 1`,
    args: [userId],
  });
  if (result.rows.length === 0) return null;
  const row = result.rows[0] as Record<string, unknown>;
  return {
    ...toUserFrame(row),
    frame: {
      id: row.frameId as string, name: row.name as string, nameAr: row.nameAr as string,
      description: row.frameDesc as string, imageUrl: row.imageUrl as string,
      rarity: row.rarity as PlayerFrame['rarity'], gradientFrom: row.gradientFrom as string,
      gradientTo: row.gradientTo as string, borderColor: row.borderColor as string,
      glowColor: row.glowColor as string, pattern: row.pattern as PlayerFrame['pattern'],
      price: Number(row.price ?? 0), isFree: !!(row.isFree && row.isFree !== 0),
      isActive: !!(row.frameActive && row.frameActive !== 0),
      sortOrder: Number(row.frameSortOrder ?? 0), totalOwned: 0, createdAt: '', updatedAt: '',
    },
  };
}

// ─── Seed default frames ─────────────────────────────────────────────

export async function seedDefaultFrames(): Promise<void> {
  await ensureAdminTables();
  const c = getClient();
  const result = await c.execute('SELECT COUNT(*) as count FROM PlayerFrame');
  const count = Number(result.rows[0]?.count ?? 0);
  if (count > 0) return;

  const defaults = [
    { name: 'golden_classic', nameAr: 'ذهبي كلاسيكي', description: 'إطار ذهبي أنيق للملف الشخصي', rarity: 'common', gradientFrom: '#f59e0b', gradientTo: '#eab308', borderColor: 'rgba(245, 158, 11, 0.7)', glowColor: 'rgba(245, 158, 11, 0.4)', pattern: 'gradient', price: 0, isFree: true, sortOrder: 0 },
    { name: 'silver_moon', nameAr: 'فضة القمر', description: 'إطار فضي هادئ كضوء القمر', rarity: 'common', gradientFrom: '#94a3b8', gradientTo: '#cbd5e1', borderColor: 'rgba(148, 163, 184, 0.7)', glowColor: 'rgba(148, 163, 184, 0.3)', pattern: 'gradient', price: 0, isFree: true, sortOrder: 1 },
    { name: 'emerald_royal', nameAr: 'زمرد ملكي', description: 'إطار أخضر لامع بلمسة ملكية', rarity: 'rare', gradientFrom: '#10b981', gradientTo: '#059669', borderColor: 'rgba(16, 185, 129, 0.7)', glowColor: 'rgba(16, 185, 129, 0.4)', pattern: 'gradient', price: 200, isFree: false, sortOrder: 2 },
    { name: 'ruby_fire', nameAr: 'ياقوت ناري', description: 'إطار أحمر متوهج كالنار', rarity: 'rare', gradientFrom: '#ef4444', gradientTo: '#dc2626', borderColor: 'rgba(239, 68, 68, 0.7)', glowColor: 'rgba(239, 68, 68, 0.4)', pattern: 'gradient', price: 200, isFree: false, sortOrder: 3 },
    { name: 'sapphire_ocean', nameAr: 'ياقوت الأزرق المحيط', description: 'إطار أزرق كأعماق المحيط', rarity: 'rare', gradientFrom: '#06b6d4', gradientTo: '#0891b2', borderColor: 'rgba(6, 182, 212, 0.7)', glowColor: 'rgba(6, 182, 212, 0.4)', pattern: 'gradient', price: 250, isFree: false, sortOrder: 4 },
    { name: 'purple_mystic', nameAr: 'بنفسجي غامض', description: 'إطار بنفسجي بسحر الأساطير', rarity: 'epic', gradientFrom: '#8b5cf6', gradientTo: '#7c3aed', borderColor: 'rgba(139, 92, 246, 0.7)', glowColor: 'rgba(139, 92, 246, 0.4)', pattern: 'gradient', price: 500, isFree: false, sortOrder: 5 },
    { name: 'rose_elegant', nameAr: 'وردي أنيق', description: 'إطار وردي بلمسة فاخرة', rarity: 'epic', gradientFrom: '#f43f5e', gradientTo: '#e11d48', borderColor: 'rgba(244, 63, 94, 0.7)', glowColor: 'rgba(244, 63, 94, 0.4)', pattern: 'gradient', price: 500, isFree: false, sortOrder: 6 },
    { name: 'diamond_legend', nameAr: 'أسطورة الماس', description: 'إطار الماس الأسطوري - للأسياد فقط', rarity: 'legendary', gradientFrom: '#e2e8f0', gradientTo: '#f8fafc', borderColor: 'rgba(226, 232, 240, 0.9)', glowColor: 'rgba(255, 255, 255, 0.5)', pattern: 'animated', price: 1000, isFree: false, sortOrder: 7 },
    { name: 'phoenix_flame', nameAr: 'لهيب العنقاء', description: 'إطار ناري أسطوري من ريش العنقاء', rarity: 'legendary', gradientFrom: '#f97316', gradientTo: '#fbbf24', borderColor: 'rgba(249, 115, 22, 0.8)', glowColor: 'rgba(251, 191, 36, 0.5)', pattern: 'animated', price: 1000, isFree: false, sortOrder: 8 },
    { name: 'neon_cyber', nameAr: 'نيون سايبر', description: 'إطار نيون عصري بتقنية المستقبل', rarity: 'epic', gradientFrom: '#22d3ee', gradientTo: '#a78bfa', borderColor: 'rgba(34, 211, 238, 0.7)', glowColor: 'rgba(167, 139, 250, 0.4)', pattern: 'animated', price: 600, isFree: false, sortOrder: 9 },
    { name: 'chocolate_warm', nameAr: 'شوكولاتة دافئة', description: 'إطار بني دافئ ومريح', rarity: 'common', gradientFrom: '#a16207', gradientTo: '#854d0e', borderColor: 'rgba(161, 98, 7, 0.6)', glowColor: 'rgba(161, 98, 7, 0.3)', pattern: 'solid', price: 100, isFree: false, sortOrder: 10 },
    { name: 'double_gold', nameAr: 'ذهبي مزدوج', description: 'إطار ذهبي مزدوج بحدود فاخرة', rarity: 'rare', gradientFrom: '#fbbf24', gradientTo: '#f59e0b', borderColor: 'rgba(251, 191, 36, 0.8)', glowColor: 'rgba(245, 158, 11, 0.4)', pattern: 'double', price: 300, isFree: false, sortOrder: 11 },
  ];

  for (const frame of defaults) {
    await createFrame(frame);
  }
}

export async function authenticateUser(
  email: string,
  password: string
): Promise<Omit<AppUser, 'passwordHash'> | null> {
  const { verifyPassword } = await import('@/lib/admin-auth');
  await ensureAdminTables();
  const c = getClient();

  const result = await c.execute({
    sql: 'SELECT * FROM AppUser WHERE email = ? AND isActive = 1',
    args: [email],
  });

  if (result.rows.length === 0) return null;

  const row = result.rows[0] as Record<string, unknown>;
  const passwordHash = row.passwordHash as string;

  if (!verifyPassword(password, passwordHash)) return null;

  // Update last login
  await c.execute({
    sql: "UPDATE AppUser SET lastLoginAt = datetime('now') WHERE id = ?",
    args: [row.id as string],
  });

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { passwordHash: _, ...safeUser } = toAppUser(row);
  return safeUser;
}

export async function linkUserToSubscription(
  userId: string,
  subscriptionId: string
): Promise<void> {
  await ensureAdminTables();
  const c = getClient();

  await c.execute({
    sql: 'UPDATE AppUser SET subscriptionId = ?, updatedAt = datetime(\'now\') WHERE id = ?',
    args: [subscriptionId, userId],
  });
}

export async function getUserBySubscriptionId(
  subscriptionId: string
): Promise<Omit<AppUser, 'passwordHash'> | null> {
  await ensureAdminTables();
  const c = getClient();

  const result = await c.execute({
    sql: 'SELECT * FROM AppUser WHERE subscriptionId = ? AND isActive = 1',
    args: [subscriptionId],
  });

  if (result.rows.length === 0) return null;
  const user = toAppUser(result.rows[0] as Record<string, unknown>);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { passwordHash: _, ...safeUser } = user;
  return safeUser;
}

// ─── Friends & Voice Rooms types ──────────────────────────────────────

export interface FriendRequest {
  id: string;
  fromUserId: string;
  toUserId: string;
  status: 'pending' | 'accepted' | 'rejected';
  fromUsername?: string;
  fromDisplayName?: string;
  fromAvatar?: string;
  createdAt: string;
  updatedAt: string;
}

export interface FriendWithUser {
  friendshipId: string;
  userId: string;
  username: string;
  displayName: string;
  avatar: string;
  level: number;
  createdAt: string;
}

export interface VoiceRoom {
  id: string;
  name: string;
  description: string;
  hostId: string;
  hostName: string;
  maxParticipants: number;
  isPrivate: boolean;
  micSeatCount: number;
  roomMode: 'public' | 'key' | 'private';
  roomPassword: string;
  roomLevel: number;
  micTheme: string;
  bgmEnabled: boolean;
  chatMuted: boolean;
  announcement: string;
  giftSplit: number;
  isAutoMode: boolean;
  participantCount?: number;
  createdAt: string;
}

export type RoomRole = 'owner' | 'coowner' | 'admin' | 'member' | 'visitor';
export type SeatStatus = 'open' | 'locked' | 'request' | 'reserved';

export interface VoiceRoomParticipant {
  id: string;
  roomId: string;
  userId: string;
  username: string;
  displayName: string;
  avatar: string;
  isMuted: boolean;
  micFrozen: boolean;
  role: RoomRole;
  seatIndex: number;
  seatStatus: SeatStatus;
  vipLevel: number;
  joinedAt: string;
}

export interface RoomBan {
  id: string;
  roomId: string;
  userId: string;
  bannedBy: string;
  reason: string;
  createdAt: string;
}

export interface RoomWaitlist {
  id: string;
  roomId: string;
  userId: string;
  username: string;
  displayName: string;
  avatar: string;
  vipLevel: number;
  requestedSeat: number;
  createdAt: string;
}

export interface RoomActionLog {
  id: string;
  roomId: string;
  actorId: string;
  actorName: string;
  action: string;
  targetId: string;
  targetName: string;
  details: string;
  createdAt: string;
}

export const ROLE_HIERARCHY: Record<RoomRole, number> = {
  owner: 5,
  coowner: 4,
  admin: 3,
  member: 2,
  visitor: 1,
};

export interface Gift {
  id: string;
  name: string;
  nameAr: string;
  emoji: string;
  price: number;
  isActive: boolean;
}

// ─── Friends functions ────────────────────────────────────────────────

export async function sendFriendRequest(fromUserId: string, toUsername: string): Promise<{ success: boolean; error?: string }> {
  const c = getClient();
  await ensureAdminTables();
  const targetResult = await c.execute({ sql: 'SELECT id FROM AppUser WHERE username = ?', args: [toUsername] });
  if (targetResult.rows.length === 0) return { success: false, error: 'المستخدم غير موجود' };
  const toUserId = targetResult.rows[0].id as string;
  if (fromUserId === toUserId) return { success: false, error: 'لا يمكنك إرسال طلب لنفسك' };
  const existing = await c.execute({ sql: 'SELECT id, status FROM FriendRequest WHERE (fromUserId = ? AND toUserId = ?) OR (fromUserId = ? AND toUserId = ?)', args: [fromUserId, toUserId, toUserId, fromUserId] });
  if (existing.rows.length > 0) {
    const status = existing.rows[0].status as string;
    if (status === 'pending') return { success: false, error: 'يوجد طلب معلق بالفعل' };
    if (status === 'accepted') return { success: false, error: 'أصدقاء بالفعل' };
    await c.execute({ sql: 'DELETE FROM FriendRequest WHERE id = ?', args: [existing.rows[0].id] });
  }
  await c.execute({ sql: 'INSERT INTO FriendRequest (id, fromUserId, toUserId, status) VALUES (?, ?, ?, ?)', args: [crypto.randomUUID(), fromUserId, toUserId, 'pending'] });
  return { success: true };
}

export async function acceptFriendRequest(requestId: string): Promise<boolean> {
  const c = getClient();
  await ensureAdminTables();
  const result = await c.execute({ sql: "UPDATE FriendRequest SET status = 'accepted', updatedAt = datetime('now') WHERE id = ? AND status = 'pending'", args: [requestId] });
  return result.rowsAffected > 0;
}

export async function rejectFriendRequest(requestId: string): Promise<boolean> {
  const c = getClient();
  await ensureAdminTables();
  const result = await c.execute({ sql: "UPDATE FriendRequest SET status = 'rejected', updatedAt = datetime('now') WHERE id = ? AND status = 'pending'", args: [requestId] });
  return result.rowsAffected > 0;
}

export async function removeFriend(friendshipId: string, userId: string): Promise<boolean> {
  const c = getClient();
  await ensureAdminTables();
  const result = await c.execute({ sql: "DELETE FROM FriendRequest WHERE id = ? AND status = 'accepted' AND (fromUserId = ? OR toUserId = ?)", args: [friendshipId, userId, userId] });
  return result.rowsAffected > 0;
}

export async function getFriendsList(userId: string): Promise<FriendWithUser[]> {
  const c = getClient();
  await ensureAdminTables();
  const result = await c.execute({ sql: `SELECT f.id as friendshipId, u.id as userId, u.username, COALESCE(u.displayName, u.username) as displayName, u.avatar, COALESCE(u.level,1) as level, f.createdAt
    FROM FriendRequest f JOIN AppUser u ON CASE WHEN f.fromUserId = ? THEN u.id = f.toUserId ELSE u.id = f.fromUserId END
    WHERE f.status = 'accepted' AND (f.fromUserId = ? OR f.toUserId = ?) ORDER BY f.updatedAt DESC`, args: [userId, userId, userId] });
  return result.rows.map(row => ({
    friendshipId: row.friendshipId as string, userId: row.userId as string, username: row.username as string,
    displayName: row.displayName as string, avatar: (row.avatar as string) || '', level: Number(row.level) || 1,
    createdAt: row.createdAt as string,
  }));
}

export async function getPendingRequests(userId: string): Promise<FriendRequest[]> {
  const c = getClient();
  await ensureAdminTables();
  const result = await c.execute({ sql: `SELECT f.*, u.username as fromUsername, COALESCE(u.displayName, u.username) as fromDisplayName, u.avatar as fromAvatar
    FROM FriendRequest f JOIN AppUser u ON u.id = f.fromUserId WHERE f.toUserId = ? AND f.status = 'pending' ORDER BY f.createdAt DESC`, args: [userId] });
  return result.rows.map(row => ({
    id: row.id as string, fromUserId: row.fromUserId as string, toUserId: row.toUserId as string,
    status: 'pending' as const, fromUsername: row.fromUsername as string,
    fromDisplayName: row.fromDisplayName as string, fromAvatar: (row.fromAvatar as string) || '',
    createdAt: row.createdAt as string, updatedAt: row.updatedAt as string,
  }));
}

export async function searchUsers(query: string, currentUserId: string): Promise<{ id: string; username: string; displayName: string; avatar: string }[]> {
  const c = getClient();
  await ensureAdminTables();
  const result = await c.execute({ sql: `SELECT id, username, COALESCE(displayName, username) as displayName, avatar FROM AppUser WHERE (username LIKE ? OR displayName LIKE ?) AND id != ? LIMIT 20`, args: [`%${query}%`, `%${query}%`, currentUserId] });
  return result.rows.map(row => ({ id: row.id as string, username: row.username as string, displayName: row.displayName as string, avatar: (row.avatar as string) || '' }));
}

// ─── Voice Rooms functions ────────────────────────────────────────────

// Helper: insert action log
async function logAction(roomId: string, actorId: string, actorName: string, action: string, targetId: string, targetName: string, details: string = ''): Promise<void> {
  const c = getClient();
  await c.execute({
    sql: 'INSERT INTO RoomActionLog (id, roomId, actorId, actorName, action, targetId, targetName, details) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    args: [crypto.randomUUID(), roomId, actorId, actorName, action, targetId, targetName, details],
  });
}

// Helper: get user VIP level from AppUser
async function getUserVipLevel(userId: string): Promise<number> {
  const c = getClient();
  const result = await c.execute({ sql: 'SELECT vipLevel FROM AppUser WHERE id = ?', args: [userId] });
  if (result.rows.length === 0) return 0;
  return Number(result.rows[0].vipLevel) || 0;
}

// 23. getRoomById - Return full room details including password
export async function getRoomById(roomId: string): Promise<VoiceRoom | null> {
  const c = getClient();
  await ensureAdminTables();
  const result = await c.execute({ sql: 'SELECT * FROM VoiceRoom WHERE id = ?', args: [roomId] });
  if (result.rows.length === 0) return null;
  const row = result.rows[0];
  return {
    id: row.id as string, name: row.name as string, description: (row.description as string) || '',
    hostId: row.hostId as string, hostName: (row.hostName as string) || '',
    maxParticipants: Number(row.maxParticipants) || 10, isPrivate: Boolean(row.isPrivate),
    micSeatCount: Number(row.micSeatCount) || 10,
    roomMode: (row.roomMode as VoiceRoom['roomMode']) || 'public',
    roomPassword: (row.roomPassword as string) || '',
    roomLevel: Number(row.roomLevel) || 1,
    micTheme: (row.micTheme as string) || 'default',
    bgmEnabled: Boolean(row.bgmEnabled),
    chatMuted: Boolean(row.chatMuted),
    announcement: (row.announcement as string) || '',
    giftSplit: Number(row.giftSplit) || 70,
    isAutoMode: Boolean(row.isAutoMode),
    createdAt: row.createdAt as string,
  };
}

// 1. createVoiceRoom - Updated with new fields
export async function createVoiceRoom(
  hostId: string, hostName: string, name: string, description: string,
  maxParticipants: number, isPrivate: boolean, micSeatCount: number = 10,
  roomMode: 'public' | 'key' | 'private' = 'public', roomPassword: string = '',
  micTheme: string = 'default', isAutoMode: boolean = true
): Promise<VoiceRoom> {
  const c = getClient();
  await ensureAdminTables();
  const id = crypto.randomUUID();
  await c.execute({
    sql: `INSERT INTO VoiceRoom (id, name, description, hostId, hostName, maxParticipants, isPrivate, micSeatCount, roomMode, roomPassword, micTheme, isAutoMode)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [id, name, description, hostId, hostName, maxParticipants, isPrivate ? 1 : 0, micSeatCount, roomMode, roomPassword, micTheme, isAutoMode ? 1 : 0],
  });
  // Insert host as owner on seat 0
  const hostVip = await getUserVipLevel(hostId);
  await c.execute({
    sql: `INSERT INTO VoiceRoomParticipant (id, roomId, userId, username, displayName, avatar, isMuted, role, seatIndex, seatStatus, micFrozen, vipLevel)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [crypto.randomUUID(), id, hostId, hostName, hostName, '', 0, 'owner', 0, 'locked', 0, hostVip],
  });
  await logAction(id, hostId, hostName, 'create_room', '', '', `Created room: ${name}`);
  return {
    id, name, description, hostId, hostName, maxParticipants, isPrivate, micSeatCount,
    roomMode, roomPassword, roomLevel: 1, micTheme, bgmEnabled: false, chatMuted: false,
    announcement: '', giftSplit: 70, isAutoMode, createdAt: new Date().toISOString(),
  };
}

// 2. getAllVoiceRooms - Only return public/key rooms, hide password
export async function getAllVoiceRooms(): Promise<VoiceRoom[]> {
  const c = getClient();
  await ensureAdminTables();
  const result = await c.execute({
    sql: `SELECT vr.*, COUNT(vrp.id) as participantCount
          FROM VoiceRoom vr LEFT JOIN VoiceRoomParticipant vrp ON vr.id = vrp.roomId
          WHERE vr.roomMode IN ('public', 'key')
          GROUP BY vr.id ORDER BY vr.createdAt DESC`,
    args: [],
  });
  return result.rows.map(row => ({
    id: row.id as string, name: row.name as string, description: (row.description as string) || '',
    hostId: row.hostId as string, hostName: (row.hostName as string) || '',
    maxParticipants: Number(row.maxParticipants) || 10, isPrivate: Boolean(row.isPrivate),
    micSeatCount: Number(row.micSeatCount) || 10,
    roomMode: (row.roomMode as VoiceRoom['roomMode']) || 'public',
    roomPassword: '', // Never expose password in list
    roomLevel: Number(row.roomLevel) || 1,
    micTheme: (row.micTheme as string) || 'default',
    bgmEnabled: Boolean(row.bgmEnabled),
    chatMuted: Boolean(row.chatMuted),
    announcement: (row.announcement as string) || '',
    giftSplit: Number(row.giftSplit) || 70,
    isAutoMode: Boolean(row.isAutoMode),
    participantCount: Number(row.participantCount) || 0,
    createdAt: row.createdAt as string,
  }));
}

// 4. getVoiceRoomParticipants - Include all new fields, exclude banned users, mic first
export async function getVoiceRoomParticipants(roomId: string): Promise<VoiceRoomParticipant[]> {
  const c = getClient();
  await ensureAdminTables();
  const result = await c.execute({
    sql: `SELECT vrp.* FROM VoiceRoomParticipant vrp
          WHERE vrp.roomId = ? AND vrp.userId NOT IN (SELECT userId FROM RoomBan WHERE roomId = ?)
          ORDER BY CASE WHEN vrp.seatIndex >= 0 THEN 0 ELSE 1 END, vrp.seatIndex ASC, vrp.joinedAt ASC`,
    args: [roomId, roomId],
  });
  return result.rows.map(row => ({
    id: row.id as string, roomId: row.roomId as string, userId: row.userId as string,
    username: row.username as string, displayName: (row.displayName as string) || '',
    avatar: (row.avatar as string) || '', isMuted: Boolean(row.isMuted),
    micFrozen: Boolean(row.micFrozen),
    role: (row.role as RoomRole) || 'visitor',
    seatIndex: Number(row.seatIndex) ?? -1,
    seatStatus: (row.seatStatus as SeatStatus) || 'open',
    vipLevel: Number(row.vipLevel) || 0,
    joinedAt: row.joinedAt as string,
  }));
}

// 3. joinVoiceRoom - Check ban, roomMode, password
export async function joinVoiceRoom(roomId: string, userId: string, username: string, displayName: string, avatar: string, password?: string): Promise<{ success: boolean; error?: string }> {
  const c = getClient();
  await ensureAdminTables();

  // Check if banned
  const banned = await c.execute({ sql: 'SELECT id FROM RoomBan WHERE roomId = ? AND userId = ?', args: [roomId, userId] });
  if (banned.rows.length > 0) return { success: false, error: 'محظور من هذه الغرفة' };

  // Check if already in room
  const existing = await c.execute({ sql: 'SELECT id FROM VoiceRoomParticipant WHERE roomId = ? AND userId = ?', args: [roomId, userId] });
  if (existing.rows.length > 0) return { success: true };

  // Check room mode
  const roomResult = await c.execute({ sql: 'SELECT roomMode, roomPassword FROM VoiceRoom WHERE id = ?', args: [roomId] });
  if (roomResult.rows.length === 0) return { success: false, error: 'الغرفة غير موجودة' };
  const room = roomResult.rows[0];
  const mode = room.roomMode as string;

  if (mode === 'private') return { success: false, error: 'الغرفة خاصة - دعوة فقط' };
  if (mode === 'key') {
    if (!password || password !== room.roomPassword) return { success: false, error: 'كلمة المرور غير صحيحة' };
  }

  // Get VIP level
  const vipLevel = await getUserVipLevel(userId);

  await c.execute({
    sql: `INSERT INTO VoiceRoomParticipant (id, roomId, userId, username, displayName, avatar, isMuted, role, seatIndex, seatStatus, micFrozen, vipLevel)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [crypto.randomUUID(), roomId, userId, username, displayName, avatar, 0, 'visitor', -1, 'open', 0, vipLevel],
  });
  await logAction(roomId, userId, username, 'join_room', '', '', '');
  return { success: true };
}

// 5. leaveVoiceRoom - Remove from waitlist, transfer ownership
export async function leaveVoiceRoom(roomId: string, userId: string): Promise<boolean> {
  const c = getClient();
  await ensureAdminTables();

  // Get participant info before leaving
  const partResult = await c.execute({ sql: 'SELECT * FROM VoiceRoomParticipant WHERE roomId = ? AND userId = ?', args: [roomId, userId] });
  const participant = partResult.rows[0] as Record<string, unknown> | undefined;
  const leavingRole = participant?.role as string || 'visitor';
  const leavingName = (participant?.username as string) || (participant?.displayName as string) || '';

  // Remove from waitlist
  await c.execute({ sql: 'DELETE FROM RoomWaitlist WHERE roomId = ? AND userId = ?', args: [roomId, userId] });

  // Remove participant
  await c.execute({ sql: 'DELETE FROM VoiceRoomParticipant WHERE roomId = ? AND userId = ?', args: [roomId, userId] });

  await logAction(roomId, userId, leavingName, 'leave_room', '', '', '');

  // Transfer ownership if owner left
  if (leavingRole === 'owner') {
    const roomResult = await c.execute({ sql: 'SELECT hostId, hostName FROM VoiceRoom WHERE id = ?', args: [roomId] });
    if (roomResult.rows.length > 0) {
      const room = roomResult.rows[0];
      if (room.hostId === userId) {
        // Find successor: oldest coowner > oldest admin > oldest member
        const successor = await c.execute({
          sql: `SELECT * FROM VoiceRoomParticipant WHERE roomId = ? AND role IN ('coowner', 'admin', 'member')
                ORDER BY CASE role WHEN 'coowner' THEN 0 WHEN 'admin' THEN 1 WHEN 'member' THEN 2 END, joinedAt ASC LIMIT 1`,
          args: [roomId],
        });
        if (successor.rows.length > 0) {
          const s = successor.rows[0] as Record<string, unknown>;
          await c.execute({ sql: "UPDATE VoiceRoomParticipant SET role = 'coowner' WHERE roomId = ? AND userId = ?", args: [roomId, userId] });
          // Note: userId already left, so we update the new owner
          await c.execute({ sql: "UPDATE VoiceRoomParticipant SET role = 'owner' WHERE roomId = ? AND userId = ?", args: [roomId, s.userId] });
          await c.execute({ sql: 'UPDATE VoiceRoom SET hostId = ?, hostName = ? WHERE id = ?', args: [s.userId, s.username || s.displayName || '', roomId] });
          await logAction(roomId, userId, leavingName, 'transfer_ownership', s.userId as string, (s.username as string) || '', 'Auto-transfer on leave');
        }
      }
    }
  }

  // Clean up empty room
  const participants = await c.execute({ sql: 'SELECT COUNT(*) as c FROM VoiceRoomParticipant WHERE roomId = ?', args: [roomId] });
  if (Number(participants.rows[0].c) === 0) {
    await c.execute({ sql: 'DELETE FROM VoiceRoom WHERE id = ?', args: [roomId] });
    await c.execute({ sql: 'DELETE FROM RoomWaitlist WHERE roomId = ?', args: [roomId] });
    await c.execute({ sql: 'DELETE FROM RoomBan WHERE roomId = ?', args: [roomId] });
    await c.execute({ sql: 'DELETE FROM RoomActionLog WHERE roomId = ?', args: [roomId] });
  }

  return true;
}

export async function toggleMicInRoom(roomId: string, userId: string): Promise<boolean> {
  const c = getClient();
  await ensureAdminTables();
  const result = await c.execute({ sql: 'SELECT isMuted, micFrozen FROM VoiceRoomParticipant WHERE roomId = ? AND userId = ?', args: [roomId, userId] });
  if (result.rows.length === 0) return false;
  const current = Boolean(result.rows[0].isMuted);
  const frozen = Boolean(result.rows[0].micFrozen);
  if (!current && frozen) return current; // Can't unmute if frozen
  await c.execute({ sql: 'UPDATE VoiceRoomParticipant SET isMuted = ? WHERE roomId = ? AND userId = ?', args: [current ? 0 : 1, roomId, userId] });
  return !current;
}

export async function sendGiftInRoom(roomId: string, giftId: string, fromUserId: string, toUserId: string): Promise<boolean> {
  const c = getClient();
  await ensureAdminTables();
  await c.execute({ sql: 'INSERT INTO GiftHistory (id, giftId, fromUserId, toUserId, roomId) VALUES (?, ?, ?, ?, ?)', args: [crypto.randomUUID(), giftId, fromUserId, toUserId, roomId] });
  return true;
}

export async function deleteVoiceRoom(roomId: string, hostId: string): Promise<boolean> {
  const c = getClient();
  await ensureAdminTables();
  const result = await c.execute({ sql: 'DELETE FROM VoiceRoom WHERE id = ? AND hostId = ?', args: [roomId, hostId] });
  if (result.rowsAffected > 0) {
    await c.execute({ sql: 'DELETE FROM VoiceRoomParticipant WHERE roomId = ?', args: [roomId] });
    await c.execute({ sql: 'DELETE FROM RoomWaitlist WHERE roomId = ?', args: [roomId] });
    await c.execute({ sql: 'DELETE FROM RoomBan WHERE roomId = ?', args: [roomId] });
    await c.execute({ sql: 'DELETE FROM RoomActionLog WHERE roomId = ?', args: [roomId] });
    return true;
  }
  return false;
}

export async function getGifts(): Promise<Gift[]> {
  const c = getClient();
  await ensureAdminTables();
  await seedGifts();
  const result = await c.execute({ sql: 'SELECT * FROM Gift WHERE isActive = 1 ORDER BY price', args: [] });
  return result.rows.map(row => ({ id: row.id as string, name: row.name as string, nameAr: row.nameAr as string, emoji: (row.emoji as string) || '', price: Number(row.price) || 0, isActive: Boolean(row.isActive) }));
}

async function seedGifts(): Promise<void> {
  const c = getClient();
  const count = await c.execute({ sql: 'SELECT COUNT(*) as c FROM Gift', args: [] });
  if (Number(count.rows[0].c) > 0) return;
  const gifts = [
    { name: 'Rose', nameAr: 'وردة', emoji: '🌹', price: 10 },
    { name: 'Heart', nameAr: 'قلب', emoji: '❤️', price: 20 },
    { name: 'Star', nameAr: 'نجمة', emoji: '⭐', price: 30 },
    { name: 'Crown', nameAr: 'تاج', emoji: '👑', price: 50 },
    { name: 'Diamond', nameAr: 'ماسة', emoji: '💎', price: 100 },
    { name: 'Fire', nameAr: 'نار', emoji: '🔥', price: 40 },
    { name: 'Gift Box', nameAr: 'صندوق هدايا', emoji: '🎁', price: 60 },
    { name: 'Rocket', nameAr: 'صاروخ', emoji: '🚀', price: 80 },
  ];
  for (const g of gifts) {
    await c.execute({ sql: 'INSERT INTO Gift (id, name, nameAr, emoji, price) VALUES (?, ?, ?, ?, ?)', args: [crypto.randomUUID(), g.name, g.nameAr, g.emoji, g.price] });
  }
}

// 6. banUserFromRoom
export async function banUserFromRoom(roomId: string, targetUserId: string, actorId: string, reason: string = ''): Promise<boolean> {
  const c = getClient();
  await ensureAdminTables();

  // Get actor name
  const actorResult = await c.execute({ sql: 'SELECT username, displayName FROM VoiceRoomParticipant WHERE roomId = ? AND userId = ?', args: [roomId, actorId] });
  const actorName = (actorResult.rows[0]?.username || actorResult.rows[0]?.displayName || '') as string;

  // Get target name
  const targetResult = await c.execute({ sql: 'SELECT username, displayName FROM VoiceRoomParticipant WHERE roomId = ? AND userId = ?', args: [roomId, targetUserId] });
  const targetName = (targetResult.rows[0]?.username || targetResult.rows[0]?.displayName || '') as string;

  // Check not already banned
  const existing = await c.execute({ sql: 'SELECT id FROM RoomBan WHERE roomId = ? AND userId = ?', args: [roomId, targetUserId] });
  if (existing.rows.length > 0) return true;

  await c.execute({
    sql: 'INSERT INTO RoomBan (id, roomId, userId, bannedBy, reason) VALUES (?, ?, ?, ?, ?)',
    args: [crypto.randomUUID(), roomId, targetUserId, actorId, reason],
  });

  // Remove from participants
  await c.execute({ sql: 'DELETE FROM VoiceRoomParticipant WHERE roomId = ? AND userId = ?', args: [roomId, targetUserId] });
  // Remove from waitlist
  await c.execute({ sql: 'DELETE FROM RoomWaitlist WHERE roomId = ? AND userId = ?', args: [roomId, targetUserId] });

  await logAction(roomId, actorId, actorName, 'ban', targetUserId, targetName, reason);
  return true;
}

// 7. unbanUserFromRoom
export async function unbanUserFromRoom(roomId: string, targetUserId: string): Promise<boolean> {
  const c = getClient();
  await ensureAdminTables();
  await c.execute({ sql: 'DELETE FROM RoomBan WHERE roomId = ? AND userId = ?', args: [roomId, targetUserId] });
  return true;
}

// 8. getBannedUsers
export async function getBannedUsers(roomId: string): Promise<RoomBan[]> {
  const c = getClient();
  await ensureAdminTables();
  const result = await c.execute({ sql: 'SELECT * FROM RoomBan WHERE roomId = ? ORDER BY createdAt DESC', args: [roomId] });
  return result.rows.map(row => ({
    id: row.id as string, roomId: row.roomId as string, userId: row.userId as string,
    bannedBy: row.bannedBy as string, reason: (row.reason as string) || '',
    createdAt: row.createdAt as string,
  }));
}

// 9. isUserBanned
export async function isUserBanned(roomId: string, userId: string): Promise<boolean> {
  const c = getClient();
  await ensureAdminTables();
  const result = await c.execute({ sql: 'SELECT id FROM RoomBan WHERE roomId = ? AND userId = ?', args: [roomId, userId] });
  return result.rows.length > 0;
}

// 10. kickFromMic
export async function kickFromMic(roomId: string, targetUserId: string, actorId: string): Promise<boolean> {
  const c = getClient();
  await ensureAdminTables();

  const actorResult = await c.execute({ sql: 'SELECT username, displayName FROM VoiceRoomParticipant WHERE roomId = ? AND userId = ?', args: [roomId, actorId] });
  const actorName = (actorResult.rows[0]?.username || actorResult.rows[0]?.displayName || '') as string;

  const targetResult = await c.execute({ sql: 'SELECT username, displayName FROM VoiceRoomParticipant WHERE roomId = ? AND userId = ?', args: [roomId, targetUserId] });
  if (targetResult.rows.length === 0) return false;
  const targetName = (targetResult.rows[0]?.username || targetResult.rows[0]?.displayName || '') as string;

  await c.execute({
    sql: 'UPDATE VoiceRoomParticipant SET seatIndex = -1, seatStatus = \'open\', isMuted = 0 WHERE roomId = ? AND userId = ?',
    args: [roomId, targetUserId],
  });

  await logAction(roomId, actorId, actorName, 'kick_from_mic', targetUserId, targetName, '');
  return true;
}

// 11. freezeSeat
export async function freezeSeat(roomId: string, targetUserId: string, actorId: string): Promise<boolean> {
  const c = getClient();
  await ensureAdminTables();

  const actorResult = await c.execute({ sql: 'SELECT username, displayName, role FROM VoiceRoomParticipant WHERE roomId = ? AND userId = ?', args: [roomId, actorId] });
  const actor = actorResult.rows[0] as Record<string, unknown> | undefined;
  if (!actor) return false;
  const actorRole = actor.role as RoomRole;
  // Only owner/coowner can freeze
  if (ROLE_HIERARCHY[actorRole] < ROLE_HIERARCHY.coowner) return false;

  const actorName = (actor.username || actor.displayName || '') as string;
  const targetResult = await c.execute({ sql: 'SELECT username, displayName FROM VoiceRoomParticipant WHERE roomId = ? AND userId = ?', args: [roomId, targetUserId] });
  if (targetResult.rows.length === 0) return false;
  const targetName = (targetResult.rows[0]?.username || targetResult.rows[0]?.displayName || '') as string;

  await c.execute({ sql: 'UPDATE VoiceRoomParticipant SET micFrozen = 1 WHERE roomId = ? AND userId = ?', args: [roomId, targetUserId] });
  await logAction(roomId, actorId, actorName, 'freeze_seat', targetUserId, targetName, '');
  return true;
}

// 12. unfreezeSeat
export async function unfreezeSeat(roomId: string, targetUserId: string): Promise<boolean> {
  const c = getClient();
  await ensureAdminTables();
  await c.execute({ sql: 'UPDATE VoiceRoomParticipant SET micFrozen = 0 WHERE roomId = ? AND userId = ?', args: [roomId, targetUserId] });
  return true;
}

// 13. muteUserChat
export async function muteUserChat(roomId: string, targetUserId: string, actorId: string): Promise<boolean> {
  const c = getClient();
  await ensureAdminTables();

  const actorResult = await c.execute({ sql: 'SELECT username, displayName FROM VoiceRoomParticipant WHERE roomId = ? AND userId = ?', args: [roomId, actorId] });
  const actorName = (actorResult.rows[0]?.username || actorResult.rows[0]?.displayName || '') as string;

  const targetResult = await c.execute({ sql: 'SELECT username, displayName FROM VoiceRoomParticipant WHERE roomId = ? AND userId = ?', args: [roomId, targetUserId] });
  if (targetResult.rows.length === 0) return false;
  const targetName = (targetResult.rows[0]?.username || targetResult.rows[0]?.displayName || '') as string;

  await logAction(roomId, actorId, actorName, 'mute_chat', targetUserId, targetName, '');
  return true;
}

// 14. assignSeat
export async function assignSeat(roomId: string, userId: string, seatIndex: number, actorId: string): Promise<boolean> {
  const c = getClient();
  await ensureAdminTables();

  const actorResult = await c.execute({ sql: 'SELECT username, displayName FROM VoiceRoomParticipant WHERE roomId = ? AND userId = ?', args: [roomId, actorId] });
  const actorName = (actorResult.rows[0]?.username || actorResult.rows[0]?.displayName || '') as string;

  // Kick anyone currently on that seat
  await c.execute({
    sql: "UPDATE VoiceRoomParticipant SET seatIndex = -1, seatStatus = 'open', isMuted = 0 WHERE roomId = ? AND seatIndex = ?",
    args: [roomId, seatIndex],
  });

  // Assign the user to the seat
  const result = await c.execute({
    sql: "UPDATE VoiceRoomParticipant SET seatIndex = ?, seatStatus = 'locked' WHERE roomId = ? AND userId = ?",
    args: [seatIndex, roomId, userId],
  });

  const targetResult = await c.execute({ sql: 'SELECT username, displayName FROM VoiceRoomParticipant WHERE roomId = ? AND userId = ?', args: [roomId, userId] });
  const targetName = (targetResult.rows[0]?.username || targetResult.rows[0]?.displayName || '') as string;

  await logAction(roomId, actorId, actorName, 'assign_seat', userId, targetName, `Seat ${seatIndex}`);
  return result.rowsAffected > 0;
}

// 15. requestSeat
export async function requestSeat(roomId: string, userId: string, username: string, displayName: string, avatar: string, vipLevel: number, requestedSeat: number = -1): Promise<{ success: boolean; autoAssigned?: boolean; seatIndex?: number }> {
  const c = getClient();
  await ensureAdminTables();

  // Check if user is on a seat already
  const existing = await c.execute({ sql: 'SELECT seatIndex FROM VoiceRoomParticipant WHERE roomId = ? AND userId = ?', args: [roomId, userId] });
  if (existing.rows.length > 0 && Number(existing.rows[0].seatIndex) >= 0) {
    return { success: false };
  }

  // Check if auto mode is on
  const roomResult = await c.execute({ sql: 'SELECT micSeatCount, isAutoMode FROM VoiceRoom WHERE id = ?', args: [roomId] });
  if (roomResult.rows.length === 0) return { success: false };
  const room = roomResult.rows[0];
  const micCount = Number(room.micSeatCount) || 10;
  const isAutoMode = Boolean(room.isAutoMode);

  if (isAutoMode) {
    // Find an open seat
    const occupiedSeats = await c.execute({ sql: 'SELECT seatIndex FROM VoiceRoomParticipant WHERE roomId = ? AND seatIndex >= 0', args: [roomId] });
    const occupied = new Set(occupiedSeats.rows.map(r => Number(r.seatIndex)));

    let targetSeat = requestedSeat >= 0 ? requestedSeat : -1;
    if (targetSeat < 0 || occupied.has(targetSeat)) {
      targetSeat = -1;
      for (let i = 0; i < micCount; i++) {
        if (!occupied.has(i)) { targetSeat = i; break; }
      }
    }

    if (targetSeat >= 0) {
      await c.execute({
        sql: "UPDATE VoiceRoomParticipant SET seatIndex = ?, seatStatus = 'locked' WHERE roomId = ? AND userId = ?",
        args: [targetSeat, roomId, userId],
      });
      return { success: true, autoAssigned: true, seatIndex: targetSeat };
    }
  }

  // Add to waitlist
  const existingWaitlist = await c.execute({ sql: 'SELECT id FROM RoomWaitlist WHERE roomId = ? AND userId = ?', args: [roomId, userId] });
  if (existingWaitlist.rows.length > 0) return { success: false };

  await c.execute({
    sql: 'INSERT INTO RoomWaitlist (id, roomId, userId, username, displayName, avatar, vipLevel, requestedSeat) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    args: [crypto.randomUUID(), roomId, userId, username, displayName, avatar, vipLevel, requestedSeat],
  });

  return { success: true, autoAssigned: false };
}

// 16. approveWaitlist
export async function approveWaitlist(waitlistId: string, actorId: string): Promise<boolean> {
  const c = getClient();
  await ensureAdminTables();

  const wlResult = await c.execute({ sql: 'SELECT * FROM RoomWaitlist WHERE id = ?', args: [waitlistId] });
  if (wlResult.rows.length === 0) return false;
  const wl = wlResult.rows[0] as Record<string, unknown>;

  const actorResult = await c.execute({ sql: 'SELECT username, displayName FROM VoiceRoomParticipant WHERE roomId = ? AND userId = ?', args: [wl.roomId, actorId] });
  const actorName = (actorResult.rows[0]?.username || actorResult.rows[0]?.displayName || '') as string;

  // Find an open seat for the user
  const roomResult = await c.execute({ sql: 'SELECT micSeatCount FROM VoiceRoom WHERE id = ?', args: [wl.roomId] });
  if (roomResult.rows.length === 0) return false;
  const micCount = Number(roomResult.rows[0].micSeatCount) || 10;

  const occupiedSeats = await c.execute({ sql: 'SELECT seatIndex FROM VoiceRoomParticipant WHERE roomId = ? AND seatIndex >= 0', args: [wl.roomId] });
  const occupied = new Set(occupiedSeats.rows.map(r => Number(r.seatIndex)));

  let targetSeat = Number(wl.requestedSeat) >= 0 ? Number(wl.requestedSeat) : -1;
  if (targetSeat < 0 || occupied.has(targetSeat)) {
    targetSeat = -1;
    for (let i = 0; i < micCount; i++) {
      if (!occupied.has(i)) { targetSeat = i; break; }
    }
  }

  if (targetSeat < 0) return false; // No seats available

  // Assign seat
  await c.execute({
    sql: "UPDATE VoiceRoomParticipant SET seatIndex = ?, seatStatus = 'locked' WHERE roomId = ? AND userId = ?",
    args: [targetSeat, wl.roomId, wl.userId],
  });

  // Remove from waitlist
  await c.execute({ sql: 'DELETE FROM RoomWaitlist WHERE id = ?', args: [waitlistId] });

  await logAction(wl.roomId as string, actorId, actorName, 'approve_waitlist', wl.userId as string, (wl.username || wl.displayName || '') as string, `Seat ${targetSeat}`);
  return true;
}

// 17. rejectWaitlist
export async function rejectWaitlist(waitlistId: string, actorId: string): Promise<boolean> {
  const c = getClient();
  await ensureAdminTables();

  const wlResult = await c.execute({ sql: 'SELECT * FROM RoomWaitlist WHERE id = ?', args: [waitlistId] });
  if (wlResult.rows.length === 0) return false;
  const wl = wlResult.rows[0] as Record<string, unknown>;

  const actorResult = await c.execute({ sql: 'SELECT username, displayName FROM VoiceRoomParticipant WHERE roomId = ? AND userId = ?', args: [wl.roomId, actorId] });
  const actorName = (actorResult.rows[0]?.username || actorResult.rows[0]?.displayName || '') as string;

  await c.execute({ sql: 'DELETE FROM RoomWaitlist WHERE id = ?', args: [waitlistId] });

  await logAction(wl.roomId as string, actorId, actorName, 'reject_waitlist', wl.userId as string, (wl.username || wl.displayName || '') as string, '');
  return true;
}

// 18. getWaitlist
export async function getWaitlist(roomId: string): Promise<RoomWaitlist[]> {
  const c = getClient();
  await ensureAdminTables();
  const result = await c.execute({
    sql: 'SELECT * FROM RoomWaitlist WHERE roomId = ? ORDER BY vipLevel DESC, createdAt ASC',
    args: [roomId],
  });
  return result.rows.map(row => ({
    id: row.id as string, roomId: row.roomId as string, userId: row.userId as string,
    username: row.username as string, displayName: row.displayName as string, avatar: row.avatar as string,
    vipLevel: Number(row.vipLevel) || 0, requestedSeat: Number(row.requestedSeat) ?? -1,
    createdAt: row.createdAt as string,
  }));
}

// 19. changeUserRole
export async function changeUserRole(roomId: string, targetUserId: string, newRole: RoomRole, actorId: string): Promise<boolean> {
  const c = getClient();
  await ensureAdminTables();

  // Get actor info
  const actorResult = await c.execute({ sql: 'SELECT username, displayName, role FROM VoiceRoomParticipant WHERE roomId = ? AND userId = ?', args: [roomId, actorId] });
  if (actorResult.rows.length === 0) return false;
  const actor = actorResult.rows[0] as Record<string, unknown>;
  const actorRole = actor.role as RoomRole;
  const actorName = (actor.username || actor.displayName || '') as string;

  // Get target info
  const targetResult = await c.execute({ sql: 'SELECT username, displayName, role FROM VoiceRoomParticipant WHERE roomId = ? AND userId = ?', args: [roomId, targetUserId] });
  if (targetResult.rows.length === 0) return false;
  const target = targetResult.rows[0] as Record<string, unknown>;
  const targetRole = target.role as RoomRole;
  const targetName = (target.username || target.displayName || '') as string;

  // Cannot change role of someone with higher or equal role
  if (ROLE_HIERARCHY[targetRole] >= ROLE_HIERARCHY[actorRole]) return false;

  // Only owner can set coowner
  if (newRole === 'coowner' && ROLE_HIERARCHY[actorRole] < ROLE_HIERARCHY.owner) return false;

  // Owner/coowner can set admin/member
  if ((newRole === 'admin' || newRole === 'member') && ROLE_HIERARCHY[actorRole] < ROLE_HIERARCHY.coowner) return false;

  // Can set to visitor or member (demote) if you're higher rank
  if (ROLE_HIERARCHY[newRole] >= ROLE_HIERARCHY[actorRole]) return false;

  await c.execute({ sql: 'UPDATE VoiceRoomParticipant SET role = ? WHERE roomId = ? AND userId = ?', args: [newRole, roomId, targetUserId] });
  await logAction(roomId, actorId, actorName, 'change_role', targetUserId, targetName, `${targetRole} -> ${newRole}`);
  return true;
}

// 20. transferOwnership
export async function transferOwnership(roomId: string, newOwnerId: string, currentOwnerId: string): Promise<boolean> {
  const c = getClient();
  await ensureAdminTables();

  // Verify current owner
  const ownerResult = await c.execute({ sql: 'SELECT username, displayName, role FROM VoiceRoomParticipant WHERE roomId = ? AND userId = ?', args: [roomId, currentOwnerId] });
  if (ownerResult.rows.length === 0) return false;
  const owner = ownerResult.rows[0] as Record<string, unknown>;
  if (owner.role !== 'owner') return false;
  const ownerName = (owner.username || owner.displayName || '') as string;

  // Get new owner info
  const newOwnerResult = await c.execute({ sql: 'SELECT username, displayName FROM VoiceRoomParticipant WHERE roomId = ? AND userId = ?', args: [roomId, newOwnerId] });
  if (newOwnerResult.rows.length === 0) return false;
  const newOwner = newOwnerResult.rows[0] as Record<string, unknown>;
  const newOwnerName = (newOwner.username || newOwner.displayName || '') as string;

  // Demote current owner to coowner
  await c.execute({ sql: "UPDATE VoiceRoomParticipant SET role = 'coowner' WHERE roomId = ? AND userId = ?", args: [roomId, currentOwnerId] });

  // Promote new owner
  await c.execute({ sql: "UPDATE VoiceRoomParticipant SET role = 'owner' WHERE roomId = ? AND userId = ?", args: [roomId, newOwnerId] });

  // Update VoiceRoom host
  await c.execute({ sql: 'UPDATE VoiceRoom SET hostId = ?, hostName = ? WHERE id = ?', args: [newOwnerId, newOwnerName, roomId] });

  await logAction(roomId, currentOwnerId, ownerName, 'transfer_ownership', newOwnerId, newOwnerName, '');
  return true;
}

// 21. updateRoomSettings
export async function updateRoomSettings(roomId: string, settings: Partial<VoiceRoom>, userId: string): Promise<VoiceRoom | null> {
  const c = getClient();
  await ensureAdminTables();

  // Get actor role
  const actorResult = await c.execute({ sql: 'SELECT role, username, displayName FROM VoiceRoomParticipant WHERE roomId = ? AND userId = ?', args: [roomId, userId] });
  if (actorResult.rows.length === 0) return null;
  const actor = actorResult.rows[0] as Record<string, unknown>;
  const actorRole = actor.role as RoomRole;
  const actorName = (actor.username || actor.displayName || '') as string;

  // Owner-only settings
  const ownerOnlyKeys = ['roomMode', 'roomPassword', 'micTheme', 'giftSplit'];
  // Owner/coowner settings
  const adminKeys = ['chatMuted', 'bgmEnabled', 'announcement', 'isAutoMode', 'roomLevel'];

  const setClauses: string[] = [];
  const values: unknown[] = [];

  for (const [key, val] of Object.entries(settings)) {
    if (val === undefined) continue;

    // Check permissions
    if (ownerOnlyKeys.includes(key) && ROLE_HIERARCHY[actorRole] < ROLE_HIERARCHY.owner) continue;
    if (adminKeys.includes(key) && ROLE_HIERARCHY[actorRole] < ROLE_HIERARCHY.coowner) continue;

    // Handle boolean to integer conversion
    if (key === 'chatMuted' || key === 'bgmEnabled' || key === 'isAutoMode') {
      setClauses.push(`${key} = ?`);
      values.push(val ? 1 : 0);
    } else if (key === 'roomMode') {
      setClauses.push(`${key} = ?`);
      values.push(val as string);
    } else {
      setClauses.push(`${key} = ?`);
      values.push(val);
    }
  }

  if (setClauses.length === 0) return getRoomById(roomId);

  values.push(roomId);
  await c.execute({ sql: `UPDATE VoiceRoom SET ${setClauses.join(', ')} WHERE id = ?`, args: values });

  await logAction(roomId, userId, actorName, 'update_settings', '', '', JSON.stringify(settings));
  return getRoomById(roomId);
}

// 22. getActionLog
export async function getActionLog(roomId: string, limit: number = 50): Promise<RoomActionLog[]> {
  const c = getClient();
  await ensureAdminTables();
  const result = await c.execute({
    sql: 'SELECT * FROM RoomActionLog WHERE roomId = ? ORDER BY createdAt DESC LIMIT ?',
    args: [roomId, limit],
  });
  return result.rows.map(row => ({
    id: row.id as string, roomId: row.roomId as string, actorId: row.actorId as string,
    actorName: (row.actorName as string) || '', action: row.action as string,
    targetId: (row.targetId as string) || '', targetName: (row.targetName as string) || '',
    details: (row.details as string) || '', createdAt: row.createdAt as string,
  }));
}

// 24. kickFromRoom
export async function kickFromRoom(roomId: string, targetUserId: string, actorId: string): Promise<boolean> {
  const c = getClient();
  await ensureAdminTables();

  const actorResult = await c.execute({ sql: 'SELECT username, displayName FROM VoiceRoomParticipant WHERE roomId = ? AND userId = ?', args: [roomId, actorId] });
  const actorName = (actorResult.rows[0]?.username || actorResult.rows[0]?.displayName || '') as string;

  const targetResult = await c.execute({ sql: 'SELECT username, displayName FROM VoiceRoomParticipant WHERE roomId = ? AND userId = ?', args: [roomId, targetUserId] });
  if (targetResult.rows.length === 0) return false;
  const targetName = (targetResult.rows[0]?.username || targetResult.rows[0]?.displayName || '') as string;

  // Remove participant
  await c.execute({ sql: 'DELETE FROM VoiceRoomParticipant WHERE roomId = ? AND userId = ?', args: [roomId, targetUserId] });
  // Remove from waitlist
  await c.execute({ sql: 'DELETE FROM RoomWaitlist WHERE roomId = ? AND userId = ?', args: [roomId, targetUserId] });

  await logAction(roomId, actorId, actorName, 'kick_from_room', targetUserId, targetName, '');
  return true;
}

// 25. setSeatStatus
export async function setSeatStatus(roomId: string, seatIndex: number, status: SeatStatus, actorId: string): Promise<boolean> {
  const c = getClient();
  await ensureAdminTables();

  const actorResult = await c.execute({ sql: 'SELECT username, displayName FROM VoiceRoomParticipant WHERE roomId = ? AND userId = ?', args: [roomId, actorId] });
  const actorName = (actorResult.rows[0]?.username || actorResult.rows[0]?.displayName || '') as string;

  // Find participant on that seat
  const seatResult = await c.execute({ sql: 'SELECT * FROM VoiceRoomParticipant WHERE roomId = ? AND seatIndex = ?', args: [roomId, seatIndex] });
  if (seatResult.rows.length > 0) {
    // If status is 'open' and there's someone on the seat, kick them from mic
    if (status === 'open') {
      await c.execute({
        sql: "UPDATE VoiceRoomParticipant SET seatIndex = -1, seatStatus = 'open', isMuted = 0 WHERE roomId = ? AND seatIndex = ?",
        args: [roomId, seatIndex],
      });
    } else {
      // Just update the seat status
      await c.execute({ sql: 'UPDATE VoiceRoomParticipant SET seatStatus = ? WHERE roomId = ? AND seatIndex = ?', args: [status, roomId, seatIndex] });
    }
  }

  await logAction(roomId, actorId, actorName, 'set_seat_status', '', '', `Seat ${seatIndex} -> ${status}`);
  return true;
}

// Get participant by roomId and userId
export async function getParticipant(roomId: string, userId: string): Promise<VoiceRoomParticipant | null> {
  const c = getClient();
  await ensureAdminTables();
  const result = await c.execute({ sql: 'SELECT * FROM VoiceRoomParticipant WHERE roomId = ? AND userId = ?', args: [roomId, userId] });
  if (result.rows.length === 0) return null;
  const row = result.rows[0];
  return {
    id: row.id as string, roomId: row.roomId as string, userId: row.userId as string,
    username: row.username as string, displayName: (row.displayName as string) || '',
    avatar: (row.avatar as string) || '', isMuted: Boolean(row.isMuted),
    micFrozen: Boolean(row.micFrozen),
    role: (row.role as RoomRole) || 'visitor',
    seatIndex: Number(row.seatIndex) ?? -1,
    seatStatus: (row.seatStatus as SeatStatus) || 'open',
    vipLevel: Number(row.vipLevel) || 0,
    joinedAt: row.joinedAt as string,
  };
}
