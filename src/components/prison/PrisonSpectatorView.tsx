'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  CELL_CONFIG,
  GRID_CONFIGS,
  TEAM_CONFIG,
  ROLE_CONFIG,
  CellType,
  PrisonTeam,
} from '@/lib/prison-types';
import type { Cell, GameLogEntry } from '@/lib/prison-types';
import {
  Lock,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Users,
  Eye,
  Loader2,
} from 'lucide-react';

// ════════════════════════════════════════════════════════════════
// TYPES — matching PrisonRoomState from prison-room-store.ts
// ════════════════════════════════════════════════════════════════

interface SpectatorInfo {
  id: string;
  name: string;
  joinedAt: number;
  lastSeen: number;
}

interface PrisonRoomData {
  code: string;
  hostName: string;
  createdAt: number;
  hostLastSeen: number;
  gridSize: number;
  cols: number;
  phase: string;
  currentTeam: string;
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
  winner: string | null;
  winReason: string;
  spectators: SpectatorInfo[];
}

// ════════════════════════════════════════════════════════════════
// CONFETTI
// ════════════════════════════════════════════════════════════════

function Confetti() {
  const particles = useMemo(() => {
    const colors = ['#f59e0b', '#f97316', '#ef4444', '#22c55e', '#06b6d4', '#a855f7', '#ec4899'];
    return Array.from({ length: 40 }).map((_, i) => ({
      id: i,
      x: Math.random() * 100,
      color: colors[Math.floor(Math.random() * colors.length)],
      delay: Math.random() * 2,
      duration: 2 + Math.random() * 3,
      size: 4 + Math.random() * 8,
      rotate: Math.random() * 360,
    }));
  }, []);

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-50">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          initial={{ y: -20, x: `${p.x}vw`, rotate: 0, opacity: 1 }}
          animate={{ y: '110vh', rotate: p.rotate + 720, opacity: 0 }}
          transition={{ duration: p.duration, delay: p.delay, ease: 'easeIn' }}
          className="absolute"
          style={{
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            borderRadius: Math.random() > 0.5 ? '50%' : '2px',
          }}
        />
      ))}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// SPECTATOR GAME OVER
// ════════════════════════════════════════════════════════════════

function SpectatorGameOver({ room }: { room: PrisonRoomData }) {
  const winner = room.winner as PrisonTeam | 'draw' | null;
  const isDraw = winner === 'draw';
  const winnerTeamConfig = winner && winner !== 'draw' ? TEAM_CONFIG[winner] : null;
  const winnerName = winner === 'alpha' ? room.teamAlphaName : winner === 'beta' ? room.teamBetaName : null;

  const alphaMembers = room.players.filter(p => p.team === 'alpha' && p.role !== 'guest');
  const betaMembers = room.players.filter(p => p.team === 'beta' && p.role !== 'guest');
  const alphaActive = alphaMembers.filter(p => p.status === 'active').length;
  const betaActive = betaMembers.filter(p => p.status === 'active').length;

  return (
    <div className="min-h-screen flex items-center justify-center p-4" dir="rtl">
      {!isDraw && <Confetti />}

      <div className="relative z-10 w-full max-w-sm sm:max-w-md mx-auto">
        <Card className="bg-gradient-to-bl from-amber-950/90 via-slate-900/95 to-slate-900/95 border-amber-500/40 shadow-2xl shadow-amber-950/30">
          <CardContent className="pt-6 pb-6 text-center">
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="text-6xl sm:text-7xl mb-4"
            >
              {isDraw ? '🤝' : '🏆'}
            </motion.div>

            <h1
              className={cn(
                'text-2xl sm:text-3xl font-black mb-2',
                isDraw
                  ? 'text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-400'
                  : winner === 'alpha'
                    ? 'text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-yellow-300'
                    : 'text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-teal-300'
              )}
            >
              {isDraw ? 'تعادل!' : `${winnerTeamConfig?.icon} ${winnerName} فاز!`}
            </h1>

            <p className="text-slate-400 text-xs sm:text-sm mb-5">{room.winReason}</p>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-3 mb-5">
              <div className={cn(
                'rounded-xl p-3 border',
                winner === 'alpha'
                  ? 'bg-amber-950/40 border-amber-500/40'
                  : 'bg-slate-800/40 border-slate-700/30 opacity-60'
              )}>
                <p className="text-xs text-amber-300 font-bold mb-1">🔒 {room.teamAlphaName}</p>
                <div className="grid grid-cols-2 gap-1 text-[10px]">
                  <div className="bg-slate-800/50 rounded px-1.5 py-1">
                    <span className="text-green-400 font-bold">{alphaActive}</span>
                    <span className="text-slate-500 block">نشط</span>
                  </div>
                  <div className="bg-slate-800/50 rounded px-1.5 py-1">
                    <span className="text-red-400 font-bold">{alphaMembers.length - alphaActive}</span>
                    <span className="text-slate-500 block">خاسر</span>
                  </div>
                </div>
              </div>

              <div className={cn(
                'rounded-xl p-3 border',
                winner === 'beta'
                  ? 'bg-cyan-950/40 border-cyan-500/40'
                  : 'bg-slate-800/40 border-slate-700/30 opacity-60'
              )}>
                <p className="text-xs text-cyan-300 font-bold mb-1">👮 {room.teamBetaName}</p>
                <div className="grid grid-cols-2 gap-1 text-[10px]">
                  <div className="bg-slate-800/50 rounded px-1.5 py-1">
                    <span className="text-green-400 font-bold">{betaActive}</span>
                    <span className="text-slate-500 block">نشط</span>
                  </div>
                  <div className="bg-slate-800/50 rounded px-1.5 py-1">
                    <span className="text-red-400 font-bold">{betaMembers.length - betaActive}</span>
                    <span className="text-slate-500 block">خاسر</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="text-center">
              <p className="text-xs text-slate-500">👁️ أنت تشاهد كمشاهد</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// SPECTATOR REVEAL RESULT
// ════════════════════════════════════════════════════════════════

function SpectatorRevealResult({ room }: { room: PrisonRoomData }) {
  if (!room.revealResult) return null;

  const cellConfig = CELL_CONFIG[room.revealResult.cellType as CellType];
  if (!cellConfig) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={cn(
        'rounded-xl border-2 p-3 sm:p-4 text-center',
        cellConfig.bgColor,
        cellConfig.borderColor,
      )}
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', damping: 8 }}
        className="text-3xl sm:text-4xl mb-1"
      >
        {cellConfig.emoji}
      </motion.div>
      <p className={cn('text-xs sm:text-sm font-bold', cellConfig.color)}>
        {cellConfig.label}
      </p>
      <p className="text-[10px] sm:text-xs text-slate-300 mt-1 leading-relaxed">
        {room.revealResult.message}
      </p>
      {room.revealResult.targetPlayer && (
        <div className="mt-2">
          <Badge className={cn('text-xs', cellConfig.bgColor, cellConfig.borderColor, cellConfig.color)}>
            {room.revealResult.targetPlayer.name}
          </Badge>
        </div>
      )}
    </motion.div>
  );
}

// ════════════════════════════════════════════════════════════════
// STATS BAR — remaining hidden cells
// ════════════════════════════════════════════════════════════════

function StatsBar({ cells }: { cells: PrisonRoomData['cells'] }) {
  const stats = useMemo(() => {
    const hidden = cells.filter(c => c.status === 'hidden');
    const counts: Record<string, number> = {};
    hidden.forEach(c => {
      counts[c.type] = (counts[c.type] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([type, count]) => ({
        type: type as CellType,
        count,
        config: CELL_CONFIG[type as CellType],
      }))
      .sort((a, b) => b.count - a.count);
  }, [cells]);

  if (stats.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1.5 justify-center px-2">
      {stats.map(({ type, count, config }) => (
        <span
          key={type}
          className={cn(
            'inline-flex items-center gap-1 text-[10px] rounded-full px-2 py-0.5 border',
            config.bgColor,
            config.borderColor,
            config.color,
          )}
        >
          <span>{config.emoji}</span>
          <span className="font-bold">{count}</span>
        </span>
      ))}
      <span className="inline-flex items-center gap-1 text-[10px] rounded-full px-2 py-0.5 bg-slate-800/60 border border-slate-700/40 text-slate-400">
        <span>🔒</span>
        <span className="font-bold">{cells.filter(c => c.status === 'hidden').length}</span>
      </span>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// TEAM STATUS BAR
// ════════════════════════════════════════════════════════════════

function TeamStatusBar({ room }: { room: PrisonRoomData }) {
  const isAlphaTurn = room.currentTeam === 'alpha';

  const alphaMembers = room.players.filter(p => p.team === 'alpha' && p.role !== 'guest');
  const betaMembers = room.players.filter(p => p.team === 'beta' && p.role !== 'guest');

  const alphaActive = alphaMembers.filter(p => p.status === 'active').length;
  const alphaImprisoned = alphaMembers.filter(p => p.status === 'imprisoned').length;
  const alphaKilled = alphaMembers.filter(p => p.status === 'killed').length;

  const betaActive = betaMembers.filter(p => p.status === 'active').length;
  const betaImprisoned = betaMembers.filter(p => p.status === 'imprisoned').length;
  const betaKilled = betaMembers.filter(p => p.status === 'killed').length;

  return (
    <div className="grid grid-cols-2 gap-2 px-1">
      {/* Alpha */}
      <div className={cn(
        'rounded-xl p-2.5 sm:p-3 border-2 transition-all duration-300',
        isAlphaTurn
          ? 'border-amber-500/60 bg-amber-950/40 shadow-lg shadow-amber-500/10'
          : 'border-amber-500/20 bg-slate-800/40 opacity-70'
      )}>
        <div className="flex items-center gap-1.5 mb-1.5">
          <span className="text-sm">🔒</span>
          <span className="text-[10px] sm:text-xs font-bold text-amber-300 truncate">{room.teamAlphaName}</span>
          {isAlphaTurn && (
            <motion.span
              animate={{ opacity: [1, 0.4, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="text-[8px] bg-amber-500/30 text-amber-200 rounded px-1 py-0.5 mr-auto"
            >
              الدور
            </motion.span>
          )}
        </div>
        <div className="flex gap-1.5 text-[9px] sm:text-[10px]">
          <span className="bg-green-900/40 text-green-400 rounded px-1.5 py-0.5 font-bold">🟢 {alphaActive}</span>
          <span className="bg-yellow-900/40 text-yellow-400 rounded px-1.5 py-0.5 font-bold">⛓️ {alphaImprisoned}</span>
          <span className="bg-red-900/40 text-red-400 rounded px-1.5 py-0.5 font-bold">💀 {alphaKilled}</span>
        </div>
      </div>

      {/* Beta */}
      <div className={cn(
        'rounded-xl p-2.5 sm:p-3 border-2 transition-all duration-300',
        !isAlphaTurn
          ? 'border-cyan-500/60 bg-cyan-950/40 shadow-lg shadow-cyan-500/10'
          : 'border-cyan-500/20 bg-slate-800/40 opacity-70'
      )}>
        <div className="flex items-center gap-1.5 mb-1.5">
          <span className="text-sm">👮</span>
          <span className="text-[10px] sm:text-xs font-bold text-cyan-300 truncate">{room.teamBetaName}</span>
          {!isAlphaTurn && (
            <motion.span
              animate={{ opacity: [1, 0.4, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="text-[8px] bg-cyan-500/30 text-cyan-200 rounded px-1 py-0.5 mr-auto"
            >
              الدور
            </motion.span>
          )}
        </div>
        <div className="flex gap-1.5 text-[9px] sm:text-[10px]">
          <span className="bg-green-900/40 text-green-400 rounded px-1.5 py-0.5 font-bold">🟢 {betaActive}</span>
          <span className="bg-yellow-900/40 text-yellow-400 rounded px-1.5 py-0.5 font-bold">⛓️ {betaImprisoned}</span>
          <span className="bg-red-900/40 text-red-400 rounded px-1.5 py-0.5 font-bold">💀 {betaKilled}</span>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// GAME LOG PANEL
// ════════════════════════════════════════════════════════════════

function GameLogPanel({ roundLog }: { roundLog: PrisonRoomData['roundLog'] }) {
  const [isOpen, setIsOpen] = useState(false);
  const logEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && logEndRef.current) {
      logEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [roundLog, isOpen]);

  const logTypeStyles: Record<string, string> = {
    info: 'bg-slate-800/40 text-slate-400',
    action: 'bg-amber-950/30 text-amber-300',
    danger: 'bg-red-950/30 text-red-300',
    success: 'bg-green-950/30 text-green-300',
    system: 'bg-cyan-950/30 text-cyan-300',
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-2 bg-slate-800/80 border border-slate-700/50 rounded-xl text-xs font-bold text-slate-300 hover:bg-slate-700/80 transition-all cursor-pointer"
      >
        <span>📜 سجل الجولات ({roundLog.length})</span>
        <span className="text-slate-500">{isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}</span>
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="mt-1 max-h-52 overflow-y-auto bg-slate-900/80 border border-slate-700/30 rounded-xl p-3 space-y-1">
              {roundLog.length === 0 ? (
                <p className="text-center text-slate-600 text-xs py-4">لا توجد تحركات بعد...</p>
              ) : (
                roundLog.map((entry, i) => (
                  <div
                    key={`${entry.timestamp}-${i}`}
                    className={cn(
                      'text-[11px] py-1 px-2 rounded-lg flex items-start gap-2',
                      logTypeStyles[entry.type] || logTypeStyles.info,
                    )}
                  >
                    <span className="text-slate-500 font-bold w-5 text-center shrink-0">
                      {entry.round}
                    </span>
                    <span className="flex-1 leading-relaxed">{entry.message}</span>
                  </div>
                ))
              )}
              <div ref={logEndRef} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// READ-ONLY CELL
// ════════════════════════════════════════════════════════════════

function SpectatorCell({ cell }: { cell: PrisonRoomData['cells'][0] }) {
  const isRevealed = cell.status === 'revealed';
  const config = CELL_CONFIG[cell.type as CellType];

  if (!config) return null;

  return (
    <div
      className={cn(
        'aspect-square rounded-xl border-2 flex flex-col items-center justify-center transition-all duration-300',
        isRevealed
          ? cn(config.borderColor, config.bgColor)
          : 'border-slate-700/30 bg-slate-800/30',
      )}
    >
      {isRevealed ? (
        <div className="flex flex-col items-center gap-0.5">
          <span className="text-xl sm:text-2xl">{config.emoji}</span>
          <span className={cn('text-[8px] sm:text-[10px] font-bold', config.color)}>
            {config.label}
          </span>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-0.5 opacity-40">
          <Lock className="w-4 h-4 sm:w-5 sm:h-5 text-slate-500" />
          <span className="text-[9px] sm:text-[10px] font-bold text-slate-500">
            {cell.id}
          </span>
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// TURN INDICATOR
// ════════════════════════════════════════════════════════════════

function TurnIndicator({ room }: { room: PrisonRoomData }) {
  if (room.phase !== 'playing') return null;

  const isAlpha = room.currentTeam === 'alpha';
  const teamName = isAlpha ? room.teamAlphaName : room.teamBetaName;
  const teamConfig = TEAM_CONFIG[room.currentTeam as PrisonTeam];

  return (
    <div className="text-center mb-2">
      <div className="flex items-center justify-center gap-2">
        <span className="text-lg">{teamConfig.icon}</span>
        <p className={cn('text-xs sm:text-sm font-bold', teamConfig.color)}>
          دور فريق {teamName} — بانتظار اختيار الزنزانة... 👑
        </p>
      </div>
      <p className="text-[10px] text-slate-500 mt-0.5">👁️ وضع المشاهدة</p>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// MAIN SPECTATOR VIEW
// ════════════════════════════════════════════════════════════════

interface PrisonSpectatorViewProps {
  roomCode: string;
  onLeave?: () => void;
}

export default function PrisonSpectatorView({ roomCode, onLeave }: PrisonSpectatorViewProps) {
  const [room, setRoom] = useState<PrisonRoomData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [spectatorName, setSpectatorName] = useState('');
  const [joined, setJoined] = useState(false);
  const [spectatorId, setSpectatorId] = useState<string | null>(null);

  // Poll room state
  const pollRoom = useCallback(async () => {
    try {
      const url = `/api/prison-room/${roomCode}${spectatorId ? `?spectatorId=${spectatorId}` : ''}`;
      const res = await fetch(url);
      if (!res.ok) {
        if (res.status === 404) {
          setError('الغرفة غير موجودة أو انتهت صلاحيتها');
        } else {
          setError('خطأ في جلب البيانات');
        }
        setLoading(false);
        return;
      }
      const data = await res.json();
      if (data.success && data.room) {
        setRoom(data.room);
        setLoading(false);
      }
    } catch {
      setError('تعذر الاتصال بالخادم');
      setLoading(false);
    }
  }, [roomCode, spectatorId]);

  // Join as spectator
  const handleJoin = async () => {
    if (!spectatorName.trim()) return;
    try {
      const res = await fetch(`/api/prison-room/${roomCode}/spectator`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: spectatorName.trim() }),
      });
      if (res.ok) {
        const data = await res.json();
        setSpectatorId(data.spectatorId);
        setJoined(true);
      }
    } catch {
      // silent
    }
  };

  // Leave room
  const handleLeave = async () => {
    if (spectatorId) {
      try {
        await fetch(`/api/prison-room/${roomCode}/spectator`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ spectatorId }),
        });
      } catch {
        // silent
      }
    }
    onLeave?.();
  };

  useEffect(() => {
    const run = async () => { try { await pollRoom(); } catch { /* silent */ } };
    run();
    const interval = setInterval(run, 2000);
    return () => clearInterval(interval);
  }, [pollRoom]);

  // ── Loading State ─────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" dir="rtl">
        <div className="text-center">
          <div className="text-5xl mb-4 animate-bounce">👁️</div>
          <p className="text-slate-400">جاري الاتصال بالغرفة...</p>
          <p className="text-slate-500 text-xs mt-2 font-mono">كود: {roomCode}</p>
        </div>
      </div>
    );
  }

  // ── Error State ───────────────────────────────────────────────
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center" dir="rtl">
        <div className="text-center max-w-sm mx-auto p-4">
          <div className="text-5xl mb-4">💔</div>
          <p className="text-red-400 text-lg font-bold mb-4">{error}</p>
          {onLeave && (
            <Button
              onClick={onLeave}
              variant="outline"
              className="border-slate-600 text-slate-300 hover:bg-slate-800"
            >
              رجوع
            </Button>
          )}
        </div>
      </div>
    );
  }

  if (!room) return null;

  // ── Waiting to join ───────────────────────────────────────────
  if (!joined) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" dir="rtl">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-full max-w-sm mx-auto"
        >
          <Card className="bg-slate-900/90 border-amber-500/30">
            <CardContent className="pt-6 text-center">
              <div className="text-5xl mb-4">👁️</div>
              <h2 className="text-xl font-bold text-amber-300 mb-1">مشاهدة السجن</h2>
              <p className="text-xs text-slate-400 mb-4">كود الغرفة: <span className="font-mono font-bold text-white">{roomCode}</span></p>
              <p className="text-xs text-slate-400 mb-3">أدخل اسمك للمشاهدة</p>
              <Input
                value={spectatorName}
                onChange={(e) => setSpectatorName(e.target.value)}
                placeholder="اسمك..."
                className="bg-slate-800/50 border-amber-500/30 text-slate-200 placeholder:text-slate-500 text-right h-11 mb-3"
                dir="rtl"
                maxLength={20}
                onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
              />
              <Button
                onClick={handleJoin}
                disabled={!spectatorName.trim()}
                className="w-full bg-gradient-to-l from-amber-600 to-orange-800 hover:from-amber-500 hover:to-orange-700 text-white font-bold"
              >
                <Eye className="w-4 h-4 ml-2" />
                دخول كمشاهد
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  // ── Game Over ─────────────────────────────────────────────────
  if (room.phase === 'game_over') {
    return <SpectatorGameOver room={room} />;
  }

  // ── Main Spectator View ───────────────────────────────────────
  const cols = room.cols || 3;

  return (
    <div className="flex flex-col items-center py-3 sm:py-4 px-2 sm:px-4 relative" dir="rtl">
      {/* Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-amber-900/5 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-orange-900/5 rounded-full blur-[100px] pointer-events-none" />
      </div>

      <div className="relative z-10 w-full max-w-lg mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-2 sm:mb-3">
          <Badge className="text-[10px] bg-amber-950/50 text-amber-300 border border-amber-500/30 px-2.5">
            👁️ مشاهد
          </Badge>
          <div className="text-center flex-1">
            <h1 className="text-lg sm:text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-orange-300 to-amber-400">
              🏢 السجن
            </h1>
            <p className="text-[10px] text-slate-500">
              كود: {roomCode} • {room.hostName}
            </p>
          </div>
          <Button
            variant="ghost"
            onClick={handleLeave}
            className="text-slate-500 hover:text-red-400 text-xs gap-1"
          >
            خروج
          </Button>
        </div>

        {/* Team Status */}
        <TeamStatusBar room={room} />

        {/* Turn Indicator */}
        <div className="mt-2">
          <TurnIndicator room={room} />
        </div>

        {/* Stats Bar */}
        <div className="my-2">
          <StatsBar cells={room.cells} />
        </div>

        {/* Grid — READ ONLY */}
        <div
          className="grid gap-2 sm:gap-2.5 my-3"
          style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}
        >
          {room.cells.map((cell) => (
            <SpectatorCell key={cell.id} cell={cell} />
          ))}
        </div>

        {/* Reveal Result */}
        <AnimatePresence>
          {room.revealResult && (
            <div className="mb-3">
              <SpectatorRevealResult room={room} />
            </div>
          )}
        </AnimatePresence>

        {/* Spectator count */}
        {room.spectators && room.spectators.length > 0 && (
          <div className="flex items-center justify-center gap-1.5 text-[10px] text-slate-500 mb-3">
            <Users className="w-3.5 h-3.5" />
            <span>{room.spectators.length} مشاهد</span>
          </div>
        )}

        {/* Game Log */}
        <div className="mt-2">
          <GameLogPanel roundLog={room.roundLog} />
        </div>
      </div>
    </div>
  );
}
