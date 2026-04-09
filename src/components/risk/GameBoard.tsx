'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRiskStore } from '@/lib/risk-store';
import { getCardStats, getGridCols, CARD_INFO } from '@/lib/risk-types';
import type { RiskCard, RiskTeam } from '@/lib/risk-types';
import { Bomb, Shield, CircleDot, ScrollText, FastForward, Wallet, Play, AlertTriangle } from 'lucide-react';

// ============================================================
// Stats Bar — shows remaining card counts
// ============================================================
function StatsBar({ cards }: { cards: RiskCard[] }) {
  const stats = getCardStats(cards);

  return (
    <div className="flex items-center justify-center gap-2 sm:gap-3 flex-wrap">
      <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-800/60 border border-slate-700/30 text-emerald-400">
        <Shield className="w-3.5 h-3.5" />
        <span className="text-xs font-bold">{stats.safes}</span>
        <span className="text-[9px] text-slate-500 hidden sm:inline">آمن</span>
      </div>
      <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-800/60 border border-slate-700/30 text-red-400">
        <Bomb className="w-3.5 h-3.5" />
        <span className="text-xs font-bold">{stats.bombs}</span>
        <span className="text-[9px] text-slate-500 hidden sm:inline">قنبلة</span>
      </div>
      <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-800/60 border border-slate-700/30 text-slate-400">
        <FastForward className="w-3.5 h-3.5" />
        <span className="text-xs font-bold">{stats.skips}</span>
        <span className="text-[9px] text-slate-500 hidden sm:inline">تخطي</span>
      </div>
      <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-800/60 border border-slate-700/30 text-slate-300">
        <CircleDot className="w-3.5 h-3.5" />
        <span className="text-xs font-bold">{stats.hidden}</span>
        <span className="text-[9px] text-slate-500 hidden sm:inline">متبقي</span>
      </div>
    </div>
  );
}

// ============================================================
// Team Score Panel
// ============================================================
function TeamScorePanel({
  team,
  isCurrent,
  isWinner,
}: {
  team: RiskTeam;
  isCurrent: boolean;
  isWinner: boolean;
}) {
  return (
    <motion.div
      key={team.id}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-xl border p-2.5 sm:p-3 transition-all ${
        isCurrent
          ? `ring-2 ${team.id === 'team_0' ? 'ring-violet-500/50' : team.id === 'team_1' ? 'ring-emerald-500/50' : team.id === 'team_2' ? 'ring-amber-500/50' : 'ring-rose-500/50'}`
          : ''
      } ${
        isWinner
          ? 'border-yellow-500/50 bg-yellow-950/10'
          : team.id === 'team_0'
            ? 'border-violet-500/30 bg-violet-950/20'
            : team.id === 'team_1'
              ? 'border-emerald-500/30 bg-emerald-950/20'
              : team.id === 'team_2'
                ? 'border-amber-500/30 bg-amber-950/20'
                : 'border-rose-500/30 bg-rose-950/20'
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm">{team.emoji}</span>
          <span className={`text-xs sm:text-sm font-bold ${team.color}`}>{team.name}</span>
          {isCurrent && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="text-[9px] px-1.5 py-0.5 rounded bg-white/10 text-white"
            >
              ◀ الآن
            </motion.span>
          )}
        </div>
        <div className="text-left">
          <p className="text-sm sm:text-base font-black text-white">{team.score}</p>
          {isCurrent && team.roundScore > 0 && (
            <motion.p
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-[10px] text-emerald-400 font-bold"
            >
              +{team.roundScore} هذه الجولة
            </motion.p>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ============================================================
// Grid Card Component
// ============================================================
function GridCard({
  card,
  onClick,
}: {
  card: RiskCard;
  onClick?: () => void;
}) {
  const canClick = !card.revealed && onClick;

  return (
    <motion.button
      whileTap={canClick ? { scale: 0.9 } : undefined}
      onClick={onClick}
      disabled={!canClick}
      className={`relative rounded-lg overflow-hidden transition-all ${
        canClick
          ? 'cursor-pointer hover:ring-2 hover:ring-violet-400/50 hover:scale-[1.03] active:scale-95'
          : 'cursor-default'
      }`}
    >
      {card.revealed ? (
        <motion.div
          initial={{ rotateY: 180, opacity: 0 }}
          animate={{ rotateY: 0, opacity: 1 }}
          transition={{ type: 'spring', damping: 15 }}
          className="w-full aspect-square rounded-lg border-2 flex flex-col items-center justify-center relative"
          style={{
            borderColor: card.type === 'bomb' ? '#ef444440' : card.type === 'skip' ? '#94a3b840' : '#34d39940',
            background: card.type === 'bomb'
              ? 'linear-gradient(135deg, #1a0a0a, #2a1010)'
              : card.type === 'skip'
                ? 'linear-gradient(135deg, #1a1a2e, #1e1e30)'
                : 'linear-gradient(135deg, #0a1a10, #0a2a18)',
          }}
        >
          <div className="text-xl sm:text-2xl mb-0.5">
            {card.type === 'bomb' ? '💣' : card.type === 'skip' ? '⏭️' : '✅'}
          </div>
          {card.type === 'safe' && (
            <div className="text-xs sm:text-sm font-black text-emerald-400">+{card.value}</div>
          )}
        </motion.div>
      ) : (
        <div className="w-full aspect-square bg-gradient-to-br from-slate-800 via-slate-700/80 to-slate-800 border-2 border-slate-600/40 rounded-lg flex items-center justify-center hover:border-violet-500/30 transition-colors">
          <div className="text-slate-600 text-[10px] sm:text-xs font-bold">
            {card.index + 1}
          </div>
        </div>
      )}
    </motion.button>
  );
}

// ============================================================
// Bomb Explosion Animation
// ============================================================
function BombExplosion({ onComplete }: { onComplete: () => void }) {
  const [particles] = useState(() =>
    Array.from({ length: 20 }).map((_, i) => ({
      id: i,
      angle: (i / 20) * 360,
      distance: 50 + Math.random() * 100,
      size: 4 + Math.random() * 8,
      color: ['#ef4444', '#f97316', '#eab308', '#dc2626'][Math.floor(Math.random() * 4)],
    }))
  );

  useEffect(() => {
    const timer = setTimeout(onComplete, 1200);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center pointer-events-none">
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: [0, 1.5, 2], opacity: [0, 0.8, 0] }}
        transition={{ duration: 0.8 }}
        className="absolute w-64 h-64 rounded-full bg-red-500/30 blur-2xl"
      />
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: [0, 1, 0.5] }}
        transition={{ duration: 0.6, type: 'spring' }}
        className="relative z-10 text-8xl"
      >
        💥
      </motion.div>
      {particles.map((p) => (
        <motion.div
          key={p.id}
          initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
          animate={{
            x: Math.cos((p.angle * Math.PI) / 180) * p.distance,
            y: Math.sin((p.angle * Math.PI) / 180) * p.distance,
            opacity: 0,
            scale: 0,
          }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="absolute rounded-full"
          style={{
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
          }}
        />
      ))}
    </div>
  );
}

// ============================================================
// Result Modal
// ============================================================
function ResultModal({
  card,
  currentTeam,
  onContinue,
  onBank,
  onAdvance,
  turnState,
}: {
  card: RiskCard;
  currentTeam: RiskTeam;
  onContinue: () => void;
  onBank: () => void;
  onAdvance: () => void;
  turnState: string;
}) {
  const cardInfo = CARD_INFO[card.type];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[150] flex items-center justify-center bg-black/80 p-4"
      onClick={(turnState === 'showing_result') ? onAdvance : undefined}
    >
      <motion.div
        initial={{ scale: 0.8, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.8, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-sm w-full shadow-2xl text-center"
      >
        {/* Card type display */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', damping: 10, delay: 0.1 }}
          className="text-6xl mb-4"
        >
          {cardInfo.emoji}
        </motion.div>

        <h2
          className="text-xl sm:text-2xl font-black mb-2"
          style={{ color: cardInfo.color }}
        >
          {cardInfo.label}
        </h2>

        <p className="text-sm text-slate-300 mb-1">{cardInfo.desc}</p>

        {card.type === 'safe' && (
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-lg font-black text-emerald-400 mb-4"
          >
            +{card.value} نقاط!
          </motion.p>
        )}

        {card.type === 'bomb' && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-sm text-red-400 font-bold mb-4"
          >
            {currentTeam.name} خسرت {currentTeam.roundScore} نقطة!
          </motion.p>
        )}

        {card.type === 'skip' && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-sm text-slate-400 mb-4"
          >
            تم تخطي دور {currentTeam.name}
          </motion.p>
        )}

        {/* Action buttons based on card type */}
        {card.type === 'safe' && turnState === 'waiting_for_decision' && (
          <div className="space-y-2">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onContinue}
              className="w-full py-3 rounded-xl font-bold text-sm bg-gradient-to-l from-emerald-600 to-green-700 hover:from-emerald-500 hover:to-green-600 text-white transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <Play className="w-4 h-4" />
              استمر ▶
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onBank}
              className="w-full py-3 rounded-xl font-bold text-sm bg-gradient-to-l from-amber-600 to-yellow-700 hover:from-amber-500 hover:to-yellow-600 text-white transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <Wallet className="w-4 h-4" />
              احفظ 💰 ({currentTeam.roundScore + card.value} نقطة)
            </motion.button>
          </div>
        )}

        {/* Universal continue button for showing_result state (covers bomb, skip, and safe after banking) */}
        {turnState === 'showing_result' && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onAdvance}
            className="w-full py-3 rounded-xl font-bold text-sm bg-gradient-to-l from-violet-600 to-purple-700 hover:from-violet-500 hover:to-purple-600 text-white transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            متابعة ▶
          </motion.button>
        )}
      </motion.div>
    </motion.div>
  );
}

// ============================================================
// Game Log Panel
// ============================================================
function GameLogPanel() {
  const { gameLog } = useRiskStore();
  const [isOpen, setIsOpen] = useState(false);
  const logEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && logEndRef.current) {
      logEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [gameLog, isOpen]);

  const TEAM_COLORS_MAP: Record<string, string> = {
    team_0: 'bg-violet-950/30 text-violet-300',
    team_1: 'bg-emerald-950/30 text-emerald-300',
    team_2: 'bg-amber-950/30 text-amber-300',
    team_3: 'bg-rose-950/30 text-rose-300',
  };

  return (
    <div className="w-full max-w-2xl mx-auto mt-2">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-2 bg-slate-800/80 border border-slate-700/50 rounded-xl text-xs font-bold text-slate-300 hover:bg-slate-700/80 transition-all cursor-pointer"
      >
        <span className="flex items-center gap-2">
          <ScrollText className="w-3.5 h-3.5" />
          سجل اللعبة ({gameLog.length})
        </span>
        <span className="text-slate-500">{isOpen ? '▲' : '▼'}</span>
      </button>
      {isOpen && (
        <div className="mt-1 max-h-[40vh] overflow-y-auto bg-slate-900/80 border border-slate-700/30 rounded-xl p-3 space-y-1 risk-scrollbar">
          {gameLog.length === 0 ? (
            <p className="text-center text-slate-600 text-xs py-4">لا تحركات بعد...</p>
          ) : (
            gameLog.map((entry) => (
              <div
                key={entry.id}
                className={`flex items-center gap-2 text-[11px] py-1 px-2 rounded-lg ${
                  TEAM_COLORS_MAP[entry.teamId] || 'bg-slate-800/30 text-slate-300'
                }`}
              >
                <span className="font-bold text-slate-500 w-5 text-center">{entry.id}.</span>
                <span className="flex-1">{entry.action}</span>
              </div>
            ))
          )}
          <div ref={logEndRef} />
        </div>
      )}
    </div>
  );
}

// ============================================================
// Main GameBoard Component
// ============================================================
export default function GameBoard() {
  const {
    teams,
    currentTeamIndex,
    cards,
    turnState,
    drawCard,
    continueTurn,
    bankPoints,
    advanceTurn,
    config,
  } = useRiskStore();

  // Explosion shows when bomb explodes (modal shows after explosion)
  const showExplosion = turnState === 'bomb_exploded';

  const handleExplosionComplete = () => {
    // Explosion animation completed, modal will show via shouldShowModal
  };

  const cols = getGridCols(config.totalCards);
  const currentTeam = teams[currentTeamIndex];

  // Get the most recently revealed card for the modal
  const recentlyRevealed = cards.filter(c => c.revealed);
  const lastDrawnCard = recentlyRevealed.length > 0 ? recentlyRevealed[recentlyRevealed.length - 1] : null;

  const shouldShowModal = (turnState === 'waiting_for_decision' || turnState === 'showing_result') && !showExplosion;

  const handleDrawCard = (cardId: string) => {
    drawCard(cardId);
  };

  const handleContinue = () => {
    continueTurn();
  };

  const handleBank = () => {
    bankPoints();
  };

  const handleAdvance = () => {
    advanceTurn();
  };

  if (!currentTeam) return null;

  return (
    <div className="flex flex-col items-center px-3 sm:px-4 py-3 sm:py-4" dir="rtl">
      {/* Title */}
      <div className="text-center mb-3">
        <h1 className="text-xl sm:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-purple-300 to-violet-400">
          💣 المجازفة
        </h1>
      </div>

      {/* Stats Bar */}
      <div className="mb-3 w-full">
        <StatsBar cards={cards} />
      </div>

      {/* Team Turn Indicator */}
      <div className="mb-3">
        <motion.div
          key={currentTeamIndex}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`text-center py-1.5 px-4 rounded-xl border-2 ${currentTeam.id === 'team_0' ? 'bg-violet-950/40 border-violet-500/50 text-violet-300' : currentTeam.id === 'team_1' ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-300' : currentTeam.id === 'team_2' ? 'bg-amber-950/40 border-amber-500/50 text-amber-300' : 'bg-rose-950/40 border-rose-500/50 text-rose-300'}`}
        >
          <p className="text-xs sm:text-sm font-bold">
            {currentTeam.emoji} دور {currentTeam.name}
            {currentTeam.roundScore > 0 && (
              <span className="text-emerald-400 mr-2">(+{currentTeam.roundScore} جولة)</span>
            )}
          </p>
        </motion.div>
      </div>

      {/* Team Scores */}
      <div className="w-full max-w-2xl mx-auto grid grid-cols-2 gap-2 sm:gap-3 mb-3">
        {teams.map((team) => (
          <TeamScorePanel
            key={team.id}
            team={team}
            isCurrent={team.id === currentTeam.id}
            isWinner={false}
          />
        ))}
      </div>

      {/* Interaction Instruction */}
      <AnimatePresence mode="wait">
        {turnState === 'waiting_for_draw' && (
          <motion.div
            key="waiting_draw"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="w-full max-w-2xl mx-auto text-center py-2 px-4 rounded-xl border mb-3 bg-violet-950/30 border-violet-500/30 text-violet-300"
          >
            <p className="text-xs sm:text-sm font-bold flex items-center justify-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              اختر بطاقة — {currentTeam.name}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Card Grid */}
      <div className="w-full max-w-2xl mx-auto mb-3">
        <div
          className="grid gap-1.5 sm:gap-2"
          style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}
        >
          {cards.map((card) => (
            <GridCard
              key={card.id}
              card={card}
              onClick={
                turnState === 'waiting_for_draw' && !card.revealed
                  ? () => handleDrawCard(card.id)
                  : undefined
              }
            />
          ))}
        </div>
      </div>

      {/* Game Log */}
      <GameLogPanel />

      {/* Bomb Explosion */}
      <AnimatePresence>
        {showExplosion && <BombExplosion onComplete={handleExplosionComplete} />}
      </AnimatePresence>

      {/* Result Modal */}
      <AnimatePresence mode="wait">
        {shouldShowModal && lastDrawnCard && !showExplosion && (
          <ResultModal
            key={`${lastDrawnCard.id}-${turnState}`}
            card={lastDrawnCard}
            currentTeam={currentTeam}
            onContinue={handleContinue}
            onBank={handleBank}
            onAdvance={handleAdvance}
            turnState={turnState}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
