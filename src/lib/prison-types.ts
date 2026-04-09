// ════════════════════════════════════════════════════════════════
// PRISON GAME — TYPE SYSTEM (v1.0)
// السجن — نظام الأنواع الكامل
// ════════════════════════════════════════════════════════════════

// ── Phase ─────────────────────────────────────────────────────

export type GamePhase = 'landing' | 'setup' | 'playing' | 'game_over';
export type GameMode = 'local' | 'diwaniya';

// ── Players ────────────────────────────────────────────────────

export type PlayerRole = 'leader' | 'deputy' | 'member' | 'guest';
export type PlayerStatus = 'active' | 'imprisoned' | 'killed' | 'converted';
export type PrisonTeam = 'alpha' | 'beta';

export interface PrisonPlayer {
  id: string;
  name: string;
  team: PrisonTeam;
  role: PlayerRole;
  status: PlayerStatus;
  avatar: string;
  originalTeam?: PrisonTeam;
}

// ── Cells ─────────────────────────────────────────────────────

export type CellType = 'open' | 'uniform' | 'skull' | 'key' | 'skip';
export type CellStatus = 'hidden' | 'revealed';

export interface Cell {
  id: number;
  type: CellType;
  status: CellStatus;
}

// ── Teams ──────────────────────────────────────────────────────

export interface TeamInfo {
  id: PrisonTeam;
  name: string;
  icon: string;
  players: PrisonPlayer[];
  activeCount: number;
  imprisonedCount: number;
  killedCount: number;
  convertedCount: number;
  totalMembers: number;
  leader: PrisonPlayer | null;
  deputy: PrisonPlayer | null;
}

// ── Logs ───────────────────────────────────────────────────────

export interface GameLogEntry {
  round: number;
  message: string;
  timestamp: number;
  type: 'info' | 'action' | 'danger' | 'success' | 'system';
}

// ── Reveal Result ──────────────────────────────────────────────

export interface RevealResult {
  cellId: number;
  cellType: CellType;
  targetPlayer: PrisonPlayer | null;
  targetTeam: PrisonTeam;
  message: string;
}

// ════════════════════════════════════════════════════════════════
// CONFIGURATION
// ════════════════════════════════════════════════════════════════

export const CELL_CONFIG: Record<CellType, {
  label: string;
  description: string;
  emoji: string;
  type: 'attack' | 'defense' | 'safe';
  color: string;
  bgColor: string;
  borderColor: string;
  glowColor: string;
  needsAction: boolean;
}> = {
  open: {
    label: 'زنزانة فارغة',
    description: 'زنزانة فارغة! سيُسجن لاعب عشوائي من الفريق الخصم.',
    emoji: '🔓',
    type: 'attack',
    color: 'text-cyan-400',
    bgColor: 'bg-cyan-950/80',
    borderColor: 'border-cyan-500/50',
    glowColor: 'shadow-cyan-500/30',
    needsAction: false,
  },
  uniform: {
    label: 'ملابس السجن',
    description: 'لاعب عشوائي من الفريق الخصم سيرتدي ملابس السجن وينضم لفريقك!',
    emoji: '🚫',
    type: 'attack',
    color: 'text-red-400',
    bgColor: 'bg-red-950/80',
    borderColor: 'border-red-500/50',
    glowColor: 'shadow-red-500/30',
    needsAction: false,
  },
  skull: {
    label: 'إعدام',
    description: 'حكم الإعدام! سيُقتل لاعب عشوائي من الفريق الخصم نهائياً.',
    emoji: '💀',
    type: 'attack',
    color: 'text-rose-400',
    bgColor: 'bg-rose-950/80',
    borderColor: 'border-rose-500/50',
    glowColor: 'shadow-rose-500/30',
    needsAction: false,
  },
  key: {
    label: 'مفتاح',
    description: 'مفتاح الحرية! سيُحرر أحد أعضاء فريقك المسجونين.',
    emoji: '🔑',
    type: 'defense',
    color: 'text-amber-400',
    bgColor: 'bg-amber-950/80',
    borderColor: 'border-amber-500/50',
    glowColor: 'shadow-amber-500/30',
    needsAction: false,
  },
  skip: {
    label: 'زنزانة ممتلئة',
    description: 'الزنزانة ممتلئة... لا شيء يحدث. تخطي الدور.',
    emoji: '✋',
    type: 'safe',
    color: 'text-slate-400',
    bgColor: 'bg-slate-800/80',
    borderColor: 'border-slate-600/50',
    glowColor: 'shadow-slate-500/20',
    needsAction: false,
  },
};

// ── Grid Configurations ───────────────────────────────────────

export const GRID_CONFIGS: Record<number, { cols: number; types: Record<CellType, number> }> = {
  9:  { cols: 3, types: { open: 3, uniform: 2, skull: 1, key: 2, skip: 1 } },
  16: { cols: 4, types: { open: 5, uniform: 4, skull: 2, key: 3, skip: 2 } },
  20: { cols: 5, types: { open: 6, uniform: 5, skull: 3, key: 3, skip: 3 } },
};

// ── Roles ──────────────────────────────────────────────────────

export const ROLE_CONFIG: Record<PlayerRole, {
  label: string;
  emoji: string;
  color: string;
  bgColor: string;
  description: string;
}> = {
  leader: {
    label: 'قائد',
    emoji: '👑',
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/15',
    description: 'يختار الخلية التي تُكشف كل جولة',
  },
  deputy: {
    label: 'نائب',
    emoji: '⭐',
    color: 'text-cyan-400',
    bgColor: 'bg-cyan-500/15',
    description: 'يحل محل القائد عند السجن',
  },
  member: {
    label: 'عضو',
    emoji: '🛡️',
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/15',
    description: 'عضو فاعل في الفريق',
  },
  guest: {
    label: 'ضيف',
    emoji: '👁️',
    color: 'text-slate-500',
    bgColor: 'bg-slate-500/15',
    description: 'متفرج فقط',
  },
};

// ── Teams ──────────────────────────────────────────────────────

export const TEAM_CONFIG: Record<PrisonTeam, {
  id: PrisonTeam;
  defaultName: string;
  icon: string;
  color: string;
  borderColor: string;
  glowClass: string;
  gradient: string;
  bgLight: string;
}> = {
  alpha: {
    id: 'alpha',
    defaultName: 'فريق السجناء',
    icon: '🔒',
    color: 'text-amber-400',
    borderColor: 'border-amber-500/40',
    glowClass: 'shadow-amber-500/20',
    gradient: 'from-amber-950/50 to-amber-900/20',
    bgLight: 'bg-amber-500/10',
  },
  beta: {
    id: 'beta',
    defaultName: 'فريق الحراس',
    icon: '👮',
    color: 'text-cyan-400',
    borderColor: 'border-cyan-500/40',
    glowClass: 'shadow-cyan-500/20',
    gradient: 'from-cyan-950/50 to-cyan-900/20',
    bgLight: 'bg-cyan-500/10',
  },
};

// ── Avatar Pool ────────────────────────────────────────────────

export const AVATAR_POOL = [
  '🧑‍✈️', '🕵️', '🦹', '🔫', '🗡️', '🛡️', '⭐', '🎪', '🎭', '🎯',
  '💎', '🔮', '🧲', '🏴‍☠️', '🪖', '🎖️', '⚖️', '⛓️', '🗝️', '🚪',
];

// ════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ════════════════════════════════════════════════════════════════

export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function createCells(gridSize: number): Cell[] {
  const config = GRID_CONFIGS[gridSize];
  if (!config) return [];

  const cellArray: CellType[] = [];
  for (const [type, count] of Object.entries(config.types)) {
    for (let i = 0; i < count; i++) {
      cellArray.push(type as CellType);
    }
  }

  const shuffled = shuffleArray(cellArray);
  return shuffled.map((type, index) => ({
    id: index + 1,
    type,
    status: 'hidden' as CellStatus,
  }));
}

export function createPlayer(
  name: string,
  team: PrisonTeam,
  index: number,
  role: PlayerRole = 'member'
): PrisonPlayer {
  return {
    id: `p-${team}-${index}`,
    name,
    team,
    role,
    status: 'active',
    avatar: AVATAR_POOL[index % AVATAR_POOL.length],
  };
}

export function getTeamInfo(players: PrisonPlayer[], teamId: PrisonTeam, teamName: string): TeamInfo {
  const teamPlayers = players.filter(p => p.team === teamId);
  const config = TEAM_CONFIG[teamId];
  const members = teamPlayers.filter(p => p.role !== 'guest');
  return {
    id: teamId,
    name: teamName || config.defaultName,
    icon: config.icon,
    players: teamPlayers,
    activeCount: members.filter(p => p.status === 'active').length,
    imprisonedCount: members.filter(p => p.status === 'imprisoned').length,
    killedCount: members.filter(p => p.status === 'killed').length,
    convertedCount: members.filter(p => p.status === 'converted').length,
    totalMembers: members.length,
    leader: teamPlayers.find(p => p.role === 'leader') || null,
    deputy: teamPlayers.find(p => p.role === 'deputy') || null,
  };
}

export function checkGameOver(players: PrisonPlayer[]): {
  over: boolean;
  winner: PrisonTeam | 'draw' | null;
  reason: string;
} {
  const alphaMembers = players.filter(p => p.team === 'alpha' && p.role !== 'guest');
  const betaMembers = players.filter(p => p.team === 'beta' && p.role !== 'guest');

  const alphaDown = alphaMembers.length > 0 && alphaMembers.every(p => p.status !== 'active');
  const betaDown = betaMembers.length > 0 && betaMembers.every(p => p.status !== 'active');

  if (alphaDown && betaDown) return { over: true, winner: 'draw', reason: 'تعادل! جميع لاعبي الفريقين تم إقصاؤهم' };
  if (alphaDown) return { over: true, winner: 'beta', reason: 'تم إقصاء جميع أعضاء فريق السجناء!' };
  if (betaDown) return { over: true, winner: 'alpha', reason: 'تم إقصاء جميع أعضاء فريق الحراس!' };

  return { over: false, winner: null, reason: '' };
}

export function getOpposingTeam(team: PrisonTeam): PrisonTeam {
  return team === 'alpha' ? 'beta' : 'alpha';
}

export function getActiveMembers(players: PrisonPlayer[], team: PrisonTeam): PrisonPlayer[] {
  return players.filter(p => p.team === team && p.status === 'active' && p.role !== 'guest');
}

export function getImprisonedMembers(players: PrisonPlayer[], team: PrisonTeam): PrisonPlayer[] {
  return players.filter(p => p.team === team && p.status === 'imprisoned' && p.role !== 'guest');
}

export function hasImprisonedPlayers(players: PrisonPlayer[], team: PrisonTeam): boolean {
  return players.some(p => p.team === team && p.status === 'imprisoned' && p.role !== 'guest');
}

export function getNextTeam(currentTeam: PrisonTeam): PrisonTeam {
  return currentTeam === 'alpha' ? 'beta' : 'alpha';
}

export function getGridConfig(gridSize: number): { cols: number; types: Record<CellType, number> } | null {
  return GRID_CONFIGS[gridSize] ?? null;
}

export function generatePrisonId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
}
