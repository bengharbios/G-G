'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { usePrisonStore } from '@/lib/prison-store';
import {
  CELL_CONFIG,
  GRID_CONFIGS,
  ROLE_CONFIG,
  TEAM_CONFIG,
  PrisonTeam,
  CellType,
  getTeamInfo,
} from '@/lib/prison-types';
import type { Cell, GameLogEntry } from '@/lib/prison-types';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  ArrowRight,
  RotateCcw,
  Trophy,
  Skull,
  Lock,
  ChevronDown,
  ChevronUp,
  Users,
  Eye,
} from 'lucide-react';

// ════════════════════════════════════════════════════════════════
// CONFETTI — for game over celebration
// ════════════════════════════════════════════════════════════════

function Confetti() {
  const particles = useMemo(() => {
    const colors = ['#f59e0b', '#f97316', '#ef4444', '#22c55e', '#06b6d4', '#a855f7', '#ec4899'];
    return Array.from({ length: 50 }).map((_, i) => ({
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
// GAME OVER OVERLAY
// ════════════════════════════════════════════════════════════════

function GameOverOverlay() {
  const {
    winner,
    winReason,
    teamAlphaName,
    teamBetaName,
    players,
    currentRound,
    cells,
    roundLog,
    resetGame,
  } = usePrisonStore();

  const alphaInfo = getTeamInfo(players, 'alpha', teamAlphaName);
  const betaInfo = getTeamInfo(players, 'beta', teamBetaName);
  const isDraw = winner === 'draw';
  const winnerTeamInfo = winner === 'alpha' ? alphaInfo : winner === 'beta' ? betaInfo : null;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/80 p-4" dir="rtl">
      {!isDraw && <Confetti />}

      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', damping: 12 }}
        className="relative z-10 w-full max-w-sm sm:max-w-md mx-auto"
      >
        <Card className="bg-gradient-to-bl from-amber-950/90 via-slate-900/95 to-slate-900/95 border-amber-500/40 shadow-2xl shadow-amber-950/30">
          <CardContent className="pt-6 pb-6 text-center">
            {/* Winner Trophy */}
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
              {isDraw ? 'تعادل!' : `${winnerTeamInfo?.icon} ${winnerTeamInfo?.name} فاز!`}
            </h1>

            <p className="text-slate-400 text-xs sm:text-sm mb-5">{winReason}</p>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-3 mb-5">
              {/* Alpha Team Stats */}
              <div className={cn(
                'rounded-xl p-3 border',
                winner === 'alpha'
                  ? 'bg-amber-950/40 border-amber-500/40'
                  : 'bg-slate-800/40 border-slate-700/30 opacity-60'
              )}>
                <p className="text-xs text-amber-300 font-bold mb-1">{alphaInfo.icon} {alphaInfo.name}</p>
                <div className="grid grid-cols-2 gap-1 text-[10px]">
                  <div className="bg-slate-800/50 rounded px-1.5 py-1">
                    <span className="text-green-400 font-bold">{alphaInfo.activeCount}</span>
                    <span className="text-slate-500 block">نشط</span>
                  </div>
                  <div className="bg-slate-800/50 rounded px-1.5 py-1">
                    <span className="text-red-400 font-bold">{alphaInfo.imprisonedCount + alphaInfo.killedCount}</span>
                    <span className="text-slate-500 block">خاسر</span>
                  </div>
                </div>
              </div>

              {/* Beta Team Stats */}
              <div className={cn(
                'rounded-xl p-3 border',
                winner === 'beta'
                  ? 'bg-cyan-950/40 border-cyan-500/40'
                  : 'bg-slate-800/40 border-slate-700/30 opacity-60'
              )}>
                <p className="text-xs text-cyan-300 font-bold mb-1">{betaInfo.icon} {betaInfo.name}</p>
                <div className="grid grid-cols-2 gap-1 text-[10px]">
                  <div className="bg-slate-800/50 rounded px-1.5 py-1">
                    <span className="text-green-400 font-bold">{betaInfo.activeCount}</span>
                    <span className="text-slate-500 block">نشط</span>
                  </div>
                  <div className="bg-slate-800/50 rounded px-1.5 py-1">
                    <span className="text-red-400 font-bold">{betaInfo.imprisonedCount + betaInfo.killedCount}</span>
                    <span className="text-slate-500 block">خاسر</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Summary stats */}
            <div className="flex items-center justify-center gap-4 text-[10px] text-slate-500 mb-5">
              <span>📋 {currentRound} جولة</span>
              <span>•</span>
              <span>🔓 {cells.filter(c => c.status === 'revealed').length}/{cells.length} مكشوف</span>
            </div>

            {/* Actions */}
            <Button
              onClick={resetGame}
              className="w-full bg-gradient-to-l from-amber-600 to-orange-800 hover:from-amber-500 hover:to-orange-700 text-white font-bold text-base py-4"
            >
              <RotateCcw className="w-4 h-4 ml-2" />
              لعبة جديدة 🔄
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// REVEAL RESULT OVERLAY
// ════════════════════════════════════════════════════════════════

function RevealResultOverlay({ onClose }: { onClose: () => void }) {
  const { revealResult, phase } = usePrisonStore();

  if (!revealResult || phase !== 'playing') return null;

  const cellConfig = CELL_CONFIG[revealResult.cellType as CellType];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-30 flex items-end sm:items-center justify-center bg-black/70 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 100, scale: 0.9 }}
        animate={{ y: 0, scale: 1 }}
        exit={{ y: 100, scale: 0.9 }}
        transition={{ type: 'spring', damping: 15 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm sm:max-w-md"
      >
        <Card className={cn(
          'border-2 shadow-2xl',
          cellConfig.borderColor,
          cellConfig.bgColor,
        )}>
          <CardContent className="pt-6 pb-6 text-center">
            {/* Cell Type */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', damping: 8 }}
              className="text-5xl sm:text-6xl mb-3"
            >
              {cellConfig.emoji}
            </motion.div>

            <motion.h2
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className={cn('text-lg sm:text-xl font-black mb-2', cellConfig.color)}
            >
              {cellConfig.label}
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-xs sm:text-sm text-slate-300 mb-4 leading-relaxed"
            >
              {revealResult.message}
            </motion.p>

            {/* Target player info */}
            {revealResult.targetPlayer && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5 }}
                className={cn(
                  'rounded-xl p-3 mb-4 border',
                  cellConfig.borderColor,
                )}
              >
                <div className="flex items-center justify-center gap-2">
                  <span className="text-2xl">{revealResult.targetPlayer.avatar}</span>
                  <div className="text-right">
                    <p className="text-sm font-bold text-slate-200">{revealResult.targetPlayer.name}</p>
                    <p className="text-[10px] text-slate-400">
                      {ROLE_CONFIG[revealResult.targetPlayer.role as keyof typeof ROLE_CONFIG]?.label || ''}
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Next button */}
            <Button
              onClick={onClose}
              className={cn(
                'w-full font-bold text-base py-4 transition-all',
                cellConfig.type === 'attack'
                  ? 'bg-gradient-to-l from-red-600 to-rose-800 hover:from-red-500 hover:to-rose-700 text-white'
                  : cellConfig.type === 'defense'
                    ? 'bg-gradient-to-l from-amber-600 to-orange-800 hover:from-amber-500 hover:to-orange-700 text-white'
                    : 'bg-gradient-to-l from-slate-600 to-slate-800 hover:from-slate-500 hover:to-slate-700 text-white',
              )}
            >
              <ArrowRight className="w-4 h-4 ml-2" />
              التالي
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}

// ════════════════════════════════════════════════════════════════
// STATS BAR — Shows remaining hidden cells by type
// ════════════════════════════════════════════════════════════════

function StatsBar() {
  const { cells } = usePrisonStore();

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
        <motion.span
          key={type}
          className={cn(
            'inline-flex items-center gap-1 text-[10px] rounded-full px-2 py-0.5 border',
            config.bgColor,
            config.borderColor,
            config.color,
          )}
          layout
        >
          <span>{config.emoji}</span>
          <span className="font-bold">{count}</span>
        </motion.span>
      ))}
      <span className="inline-flex items-center gap-1 text-[10px] rounded-full px-2 py-0.5 bg-slate-800/60 border border-slate-700/40 text-slate-400">
        <span>🔒</span>
        <span className="font-bold">{cells.filter(c => c.status === 'hidden').length}</span>
      </span>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// TEAM STATUS BAR — Shows both teams' player counts
// ════════════════════════════════════════════════════════════════

function TeamStatusBar() {
  const {
    teamAlphaName,
    teamBetaName,
    players,
    currentTeam,
    currentRound,
  } = usePrisonStore();

  const alphaInfo = getTeamInfo(players, 'alpha', teamAlphaName);
  const betaInfo = getTeamInfo(players, 'beta', teamBetaName);
  const isAlphaTurn = currentTeam === 'alpha';

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
          <span className="text-sm">{TEAM_CONFIG.alpha.icon}</span>
          <span className="text-[10px] sm:text-xs font-bold text-amber-300 truncate">{alphaInfo.name}</span>
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
          <span className="bg-green-900/40 text-green-400 rounded px-1.5 py-0.5 font-bold">
            🟢 {alphaInfo.activeCount}
          </span>
          <span className="bg-yellow-900/40 text-yellow-400 rounded px-1.5 py-0.5 font-bold">
            ⛓️ {alphaInfo.imprisonedCount}
          </span>
          <span className="bg-red-900/40 text-red-400 rounded px-1.5 py-0.5 font-bold">
            💀 {alphaInfo.killedCount}
          </span>
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
          <span className="text-sm">{TEAM_CONFIG.beta.icon}</span>
          <span className="text-[10px] sm:text-xs font-bold text-cyan-300 truncate">{betaInfo.name}</span>
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
          <span className="bg-green-900/40 text-green-400 rounded px-1.5 py-0.5 font-bold">
            🟢 {betaInfo.activeCount}
          </span>
          <span className="bg-yellow-900/40 text-yellow-400 rounded px-1.5 py-0.5 font-bold">
            ⛓️ {betaInfo.imprisonedCount}
          </span>
          <span className="bg-red-900/40 text-red-400 rounded px-1.5 py-0.5 font-bold">
            💀 {betaInfo.killedCount}
          </span>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// GAME LOG PANEL — Collapsible log
// ════════════════════════════════════════════════════════════════

function GameLogPanel() {
  const { roundLog } = usePrisonStore();
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
// SINGLE CELL COMPONENT
// ════════════════════════════════════════════════════════════════

function PrisonCell({
  cell,
  onReveal,
  disabled,
}: {
  cell: Cell;
  onReveal: (id: number) => void;
  disabled: boolean;
}) {
  const isRevealed = cell.status === 'revealed';
  const config = CELL_CONFIG[cell.type];
  const isDisabled = disabled || isRevealed;

  return (
    <motion.button
      whileHover={!isDisabled ? { scale: 1.05 } : undefined}
      whileTap={!isDisabled ? { scale: 0.95 } : undefined}
      onClick={() => !isDisabled && onReveal(cell.id)}
      disabled={isDisabled}
      className={cn(
        'relative aspect-square rounded-xl border-2 flex flex-col items-center justify-center transition-all duration-300 cursor-pointer',
        isRevealed
          ? cn(config.borderColor, config.bgColor)
          : disabled
            ? 'border-slate-700/30 bg-slate-800/30 cursor-not-allowed'
            : 'border-amber-500/30 bg-gradient-to-b from-amber-950/50 to-slate-900/50 hover:border-amber-400/60 hover:shadow-lg hover:shadow-amber-500/20',
      )}
      layout
    >
      {isRevealed ? (
        <motion.div
          initial={{ rotateY: 90, opacity: 0 }}
          animate={{ rotateY: 0, opacity: 1 }}
          transition={{ duration: 0.4, type: 'spring' }}
          className="flex flex-col items-center gap-0.5"
        >
          <span className="text-xl sm:text-2xl">{config.emoji}</span>
          <span className={cn('text-[8px] sm:text-[10px] font-bold', config.color)}>
            {config.label}
          </span>
        </motion.div>
      ) : (
        <motion.div
          className="flex flex-col items-center gap-0.5"
          animate={disabled ? undefined : { opacity: [0.7, 1, 0.7] }}
          transition={disabled ? undefined : { duration: 2, repeat: Infinity }}
        >
          <Lock className="w-4 h-4 sm:w-5 sm:h-5 text-amber-500/60" />
          <span className="text-[9px] sm:text-[10px] font-bold text-amber-400/60">
            {cell.id}
          </span>
        </motion.div>
      )}
    </motion.button>
  );
}

// ════════════════════════════════════════════════════════════════
// TURN INDICATOR
// ════════════════════════════════════════════════════════════════

function TurnIndicator() {
  const { currentTeam, currentRound, teamAlphaName, teamBetaName, revealResult, phase } = usePrisonStore();

  if (phase !== 'playing') return null;

  const isAlpha = currentTeam === 'alpha';
  const teamName = isAlpha ? teamAlphaName : teamBetaName;
  const teamConfig = TEAM_CONFIG[currentTeam];
  const waitingForReveal = !revealResult;

  return (
    <motion.div
      key={`${currentTeam}-${currentRound}`}
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-center mb-2"
    >
      {waitingForReveal ? (
        <div className="flex items-center justify-center gap-2">
          <span className="text-lg">{teamConfig.icon}</span>
          <p className={cn('text-xs sm:text-sm font-bold', teamConfig.color)}>
            دور فريق {teamName} — اختروا زنزانة! 👑
          </p>
        </div>
      ) : (
        <p className="text-xs text-slate-400">
          الجولة {currentRound} • اضغط &quot;التالي&quot; للمتابعة
        </p>
      )}
    </motion.div>
  );
}

// ════════════════════════════════════════════════════════════════
// MAIN GAME BOARD
// ════════════════════════════════════════════════════════════════

export default function PrisonGameBoard() {
  const {
    phase,
    gridSize,
    cells,
    currentTeam,
    revealResult,
    revealCell,
    advanceTurn,
    resetGame,
  } = usePrisonStore();

  const gridConfig = GRID_CONFIGS[gridSize];
  const cols = gridConfig?.cols || 3;
  const isGameOver = phase === 'game_over';
  const waitingForResult = !!revealResult && phase === 'playing';

  const handleReveal = (cellId: number) => {
    if (phase !== 'playing' || revealResult) return;
    revealCell(cellId);
  };

  const handleAdvance = () => {
    advanceTurn();
  };

  return (
    <div className="flex flex-col items-center py-3 sm:py-4 px-2 sm:px-4 relative" dir="rtl">
      {/* Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-amber-900/5 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-orange-900/5 rounded-full blur-[100px] pointer-events-none" />
      </div>

      <div className="relative z-10 w-full max-w-lg mx-auto">
        {/* Game Title */}
        <div className="text-center mb-2 sm:mb-3">
          <h1 className="text-xl sm:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-orange-300 to-amber-400">
            🏢 السجن
          </h1>
          <p className="text-[10px] text-slate-500 mt-0.5">
            الجولة {usePrisonStore.getState().currentRound}
          </p>
        </div>

        {/* Team Status */}
        <TeamStatusBar />

        {/* Turn Indicator */}
        <div className="mt-2">
          <TurnIndicator />
        </div>

        {/* Stats Bar */}
        <div className="my-2">
          <StatsBar />
        </div>

        {/* Grid */}
        <div
          className="grid gap-2 sm:gap-2.5 my-3"
          style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}
        >
          <AnimatePresence mode="popLayout">
            {cells.map((cell) => (
              <PrisonCell
                key={cell.id}
                cell={cell}
                onReveal={handleReveal}
                disabled={waitingForResult || isGameOver}
              />
            ))}
          </AnimatePresence>
        </div>

        {/* Advance Turn Button */}
        <AnimatePresence>
          {waitingForResult && !isGameOver && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="mt-3"
            >
              <Button
                onClick={handleAdvance}
                className="w-full max-w-xs mx-auto block bg-gradient-to-l from-amber-600 to-orange-800 hover:from-amber-500 hover:to-orange-700 text-white font-bold text-sm sm:text-base py-3.5"
              >
                <ArrowRight className="w-4 h-4 ml-2" />
                التالي
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Game Log */}
        <div className="mt-3">
          <GameLogPanel />
        </div>

        {/* Reset Button */}
        {!isGameOver && (
          <div className="flex justify-center mt-3">
            <Button
              variant="ghost"
              onClick={resetGame}
              className="text-slate-500 hover:text-red-400 gap-1.5 text-xs"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              إعادة اللعبة
            </Button>
          </div>
        )}
      </div>

      {/* Reveal Result Overlay */}
      <AnimatePresence>
        {waitingForResult && (
          <RevealResultOverlay onClose={handleAdvance} />
        )}
      </AnimatePresence>

      {/* Game Over Overlay */}
      <AnimatePresence>
        {isGameOver && <GameOverOverlay />}
      </AnimatePresence>
    </div>
  );
}
