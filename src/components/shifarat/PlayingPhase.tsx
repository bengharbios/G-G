'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Clock,
  Check,
  ArrowDown,
  Hand,
  Send,
  Volume2,
  VolumeX,
  Lightbulb,
  Sparkles,
  ChevronDown,
  AlertTriangle,
  Shield,
  Zap,
  Eye,
  X,
  RotateCcw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useShifaratStore } from '@/lib/shifarat-store';
import type { BoardCard, TeamColor, CardColor } from '@/lib/shifarat-types';
import HowToPlay from './HowToPlay';
import { generateClueSuggestions, type ClueSuggestion } from '@/lib/shifarat-clue-engine';

// ============================================================
// SOUND SYSTEM — Web Audio API
// ============================================================

function playSound(type: 'correct' | 'wrong' | 'assassin' | 'tick' | 'win') {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    switch (type) {
      case 'correct':
        osc.frequency.setValueAtTime(523, ctx.currentTime);
        osc.frequency.setValueAtTime(659, ctx.currentTime + 0.1);
        osc.frequency.setValueAtTime(784, ctx.currentTime + 0.2);
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.4);
        break;
      case 'wrong':
        osc.frequency.setValueAtTime(300, ctx.currentTime);
        osc.frequency.setValueAtTime(200, ctx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.3);
        break;
      case 'assassin':
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, ctx.currentTime);
        osc.frequency.setValueAtTime(80, ctx.currentTime + 0.5);
        gain.gain.setValueAtTime(0.4, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.8);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.8);
        break;
      case 'tick':
        osc.frequency.setValueAtTime(800, ctx.currentTime);
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.05);
        break;
      case 'win':
        osc.frequency.setValueAtTime(523, ctx.currentTime);
        osc.frequency.setValueAtTime(659, ctx.currentTime + 0.15);
        osc.frequency.setValueAtTime(784, ctx.currentTime + 0.3);
        osc.frequency.setValueAtTime(1047, ctx.currentTime + 0.45);
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.8);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.8);
        break;
    }
  } catch {
    // audio not supported
  }
}

// ============================================================
// PHASE GUIDANCE BANNER
// ============================================================

interface PhaseBannerProps {
  phase: string;
  currentTeam?: TeamColor;
  redTeamName?: string;
  blueTeamName?: string;
}

function PhaseBanner({ phase, currentTeam, redTeamName, blueTeamName }: PhaseBannerProps) {
  const teamName = currentTeam === 'red' ? redTeamName : blueTeamName;
  const teamColor = currentTeam === 'red' ? 'text-red-300' : 'text-blue-300';
  const teamBorderColor = currentTeam === 'red' ? 'border-red-500/30' : 'border-blue-500/30';
  const teamBg = currentTeam === 'red' ? 'bg-red-950/20' : 'bg-blue-950/20';

  const getBanner = (): { text: string; icon: React.ReactNode; bg: string; border: string; textColor: string } => {
    switch (phase) {
      case 'spymaster_view':
        return {
          text: `🎯 أنت جاسوس ${teamName} — انظر للوحة وأعطِ دليلًا`,
          icon: <Eye className="w-4 h-4" />,
          bg: 'bg-purple-950/30',
          border: 'border-purple-500/30',
          textColor: 'text-purple-200',
        };
      case 'clue_given':
      case 'team_guessing':
        return {
          text: `🎯 خمنوا الكلمات المرتبطة بالدليل!`,
          icon: <span className="text-sm">🎯</span>,
          bg: `${teamBg}`,
          border: teamBorderColor,
          textColor: teamColor,
        };
      case 'turn_result':
        return {
          text: '📋 نتيجة التخمين',
          icon: <span className="text-sm">📋</span>,
          bg: 'bg-slate-800/30',
          border: 'border-slate-700/30',
          textColor: 'text-slate-300',
        };
      case 'turn_switch':
        return {
          text: '🔄 الدور ينتقل للفريق التالي',
          icon: <RotateCcw className="w-4 h-4" />,
          bg: 'bg-amber-950/20',
          border: 'border-amber-500/20',
          textColor: 'text-amber-300',
        };
      default:
        return {
          text: '',
          icon: null,
          bg: '',
          border: '',
          textColor: 'text-slate-300',
        };
    }
  };

  const banner = getBanner();
  if (!banner.text) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex items-center gap-2 px-3 py-2 rounded-xl border ${banner.bg} ${banner.border} mb-3`}
    >
      {banner.icon}
      <span className={`text-[11px] sm:text-xs font-bold ${banner.textColor}`}>
        {banner.text}
      </span>
    </motion.div>
  );
}

// ============================================================
// CORRECT GUESS TOAST (small banner for correct guesses)
// ============================================================

interface CorrectToastProps {
  word: string;
  remainingGuesses: number;
}

function CorrectToast({ word, remainingGuesses }: CorrectToastProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      transition={{ duration: 0.3 }}
      className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-950/50 border border-emerald-500/40 shadow-lg shadow-emerald-500/10"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 300 }}
      >
        <Check className="w-5 h-5 text-emerald-400" />
      </motion.div>
      <div className="flex-1">
        <span className="text-xs font-bold text-emerald-300">صحيح! </span>
        <span className="text-xs text-white font-bold">{word}</span>
      </div>
      {remainingGuesses > 0 && (
        <Badge className="text-[9px] px-2 bg-emerald-500/20 text-emerald-300 border-emerald-500/30">
          {remainingGuesses} متبقي
        </Badge>
      )}
    </motion.div>
  );
}

// ============================================================
// CARD GRID COMPONENT
// ============================================================

interface CardGridProps {
  board: BoardCard[];
  showColors: boolean;
  onCardClick?: (cardId: number) => void;
  disabled?: boolean;
}

function CardGrid({ board, showColors, onCardClick, disabled }: CardGridProps) {
  const getCardStyle = (card: BoardCard) => {
    if (card.isRevealed) {
      switch (card.color) {
        case 'red':
          return 'bg-red-500/80 border-red-400/80';
        case 'blue':
          return 'bg-blue-500/80 border-blue-400/80';
        case 'neutral':
          return 'bg-slate-600/50 border-slate-500/60';
        case 'assassin':
          return 'bg-gray-900 border-gray-500/60';
      }
    }

    if (showColors) {
      switch (card.color) {
        case 'red':
          return 'bg-red-500/80 border-red-400';
        case 'blue':
          return 'bg-blue-500/80 border-blue-400';
        case 'neutral':
          return 'bg-slate-600/50 border-slate-500';
        case 'assassin':
          return 'bg-gray-900 border-gray-400';
      }
    }

    return 'bg-slate-800 border-slate-600';
  };

  return (
    <div className="grid grid-cols-5 gap-2 sm:gap-2.5">
      {board.map((card, index) => {
        const canClick = onCardClick && !disabled && !card.isRevealed;
        return (
        <motion.button
          key={card.id}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: index * 0.03, duration: 0.3 }}
          whileHover={canClick ? { scale: 1.08, y: -3 } : {}}
          whileTap={canClick ? { scale: 0.93 } : {}}
          onClick={() => {
            if (canClick) onCardClick(card.id);
          }}
          disabled={disabled || card.isRevealed}
          className={`
            relative aspect-square rounded-xl sm:rounded-xl border-2
            flex items-center justify-center p-1.5 sm:p-2
            transition-all duration-200 select-none min-h-[44px]
            ${getCardStyle(card)}
            ${canClick ? 'cursor-pointer active:scale-95 active:bg-slate-700 hover:border-slate-400' : ''}
            ${card.isRevealed ? 'opacity-70' : ''}
          `}
        >
          {card.isRevealed && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute top-0.5 right-0.5 z-10"
            >
              <Check className="w-3 h-3 sm:w-4 sm:h-4 text-white/80" />
            </motion.div>
          )}

          {showColors && !card.isRevealed && card.color === 'assassin' && (
            <span className="absolute top-0 left-0 text-[8px] sm:text-[10px]">💀</span>
          )}

          <span
            className={`
              text-[10px] sm:text-xs md:text-sm font-bold text-center
              leading-tight break-words line-clamp-2
              ${card.isRevealed ? 'text-white/90' : showColors ? 'text-white' : 'text-slate-100'}
            `}
          >
            {card.word}
          </span>
        </motion.button>
        );
      })}
    </div>
  );
}

// ============================================================
// TIMER BAR
// ============================================================

function TimerBar({ remaining, duration }: { remaining: number; duration: number }) {
  const percent = duration > 0 ? (remaining / duration) * 100 : 0;

  const getTimerColor = () => {
    if (percent > 60) return { bar: '#10b981', bg: 'rgba(16, 185, 129, 0.2)', text: '#6ee7b7' };
    if (percent > 30) return { bar: '#f59e0b', bg: 'rgba(245, 158, 11, 0.2)', text: '#fbbf24' };
    return { bar: '#ef4444', bg: 'rgba(239, 68, 68, 0.2)', text: '#fca5a5' };
  };

  const colors = getTimerColor();

  if (duration <= 0) return null;

  return (
    <div className="mb-3">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-1">
          <Clock className="w-3.5 h-3.5" style={{ color: colors.text }} />
          <span className="text-xs font-bold" style={{ color: colors.text }}>
            {remaining}ث
          </span>
        </div>
      </div>
      <div className="w-full h-2 rounded-full" style={{ background: colors.bg }}>
        <motion.div
          className="h-full rounded-full transition-all duration-1000 ease-linear"
          style={{ background: colors.bar }}
          animate={{ width: `${Math.max(percent, 0)}%` }}
        />
      </div>
    </div>
  );
}

// ============================================================
// TEAM SCORE CARDS
// ============================================================

function TeamScores() {
  const { redTeam, blueTeam, currentTeam, startingTeam } = useShifaratStore();

  const redTotal = startingTeam === 'red' ? 9 : 8;
  const blueTotal = startingTeam === 'blue' ? 9 : 8;

  const isRedActive = currentTeam === 'red';
  const isBlueActive = currentTeam === 'blue';

  return (
    <div className="flex gap-2 sm:gap-3 mb-2">
      <motion.div
        layout
        className={`flex-1 p-2.5 sm:p-3 rounded-xl border-2 transition-all duration-300 ${
          isRedActive
            ? 'bg-red-950/40 border-red-500/60 shadow-lg shadow-red-500/10'
            : 'bg-slate-900/40 border-slate-800/50 opacity-70'
        }`}
      >
        <div className="flex items-center justify-between mb-1">
          <span className={`text-[10px] sm:text-xs font-bold ${isRedActive ? 'text-red-300' : 'text-slate-500'}`}>
            {redTeam.name}
          </span>
          {isRedActive && (
            <Badge className="text-[8px] sm:text-[10px] px-1.5 bg-red-500/20 text-red-300 border-red-500/30">
              دورك
            </Badge>
          )}
        </div>
        <div className="text-xl sm:text-2xl font-black text-red-400">{redTeam.score}</div>
        <div className="w-full h-1 rounded-full mt-1 bg-slate-800">
          <motion.div
            className="h-full rounded-full bg-red-500"
            animate={{ width: `${Math.min((redTeam.score / redTotal) * 100, 100)}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
        <div className="text-[9px] text-slate-600 mt-0.5">{redTeam.score}/{redTotal}</div>
      </motion.div>

      <motion.div
        layout
        className={`flex-1 p-2.5 sm:p-3 rounded-xl border-2 transition-all duration-300 ${
          isBlueActive
            ? 'bg-blue-950/40 border-blue-500/60 shadow-lg shadow-blue-500/10'
            : 'bg-slate-900/40 border-slate-800/50 opacity-70'
        }`}
      >
        <div className="flex items-center justify-between mb-1">
          <span className={`text-[10px] sm:text-xs font-bold ${isBlueActive ? 'text-blue-300' : 'text-slate-500'}`}>
            {blueTeam.name}
          </span>
          {isBlueActive && (
            <Badge className="text-[8px] sm:text-[10px] px-1.5 bg-blue-500/20 text-blue-300 border-blue-500/30">
              دورك
            </Badge>
          )}
        </div>
        <div className="text-xl sm:text-2xl font-black text-blue-400">{blueTeam.score}</div>
        <div className="w-full h-1 rounded-full mt-1 bg-slate-800">
          <motion.div
            className="h-full rounded-full bg-blue-500"
            animate={{ width: `${Math.min((blueTeam.score / blueTotal) * 100, 100)}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
        <div className="text-[9px] text-slate-600 mt-0.5">{blueTeam.score}/{blueTotal}</div>
      </motion.div>
    </div>
  );
}

// ============================================================
// CLUE DISPLAY
// ============================================================

function ClueDisplay() {
  const { currentClue, currentTeam, redTeam, blueTeam } = useShifaratStore();
  if (!currentClue) return null;

  const teamName = currentTeam === 'red' ? redTeam.name : blueTeam.name;
  const teamColor = currentTeam === 'red' ? 'text-red-400' : 'text-blue-400';
  const teamBorder = currentTeam === 'red' ? 'border-red-500/40' : 'border-blue-500/40';
  const teamBg = currentTeam === 'red' ? 'bg-red-950/30' : 'bg-blue-950/30';

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`mb-3 p-3 sm:p-4 rounded-xl border ${teamBg} ${teamBorder} text-center`}
    >
      <p className={`text-[10px] sm:text-xs font-bold ${teamColor} mb-1`}>
        فريق {teamName}
      </p>
      <div className="flex items-center justify-center gap-2 sm:gap-3">
        <span className="text-lg sm:text-2xl font-black text-white">{currentClue.word}</span>
        <span className="text-2xl sm:text-3xl font-black text-slate-500">—</span>
        <span className="text-lg sm:text-2xl font-black text-emerald-400">{currentClue.number}</span>
      </div>
    </motion.div>
  );
}

// ============================================================
// SPYMASTER VIEW — with improved clarity
// ============================================================

function SpymasterView() {
  const { board, giveClue, currentTeam, gameMode, redTeam, blueTeam, currentClue } = useShifaratStore();
  const [clueWord, setClueWord] = useState('');
  const [clueNumber, setClueNumber] = useState(1);
  const [error, setError] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Derive clueGiven from store (no effect needed)
  const clueGiven = !!currentClue;

  const teamName = currentTeam === 'red' ? redTeam.name : blueTeam.name;
  const teamColor = currentTeam === 'red' ? 'text-red-400' : 'text-blue-400';

  const suggestions = useMemo(() => {
    return generateClueSuggestions(board, currentTeam, 10);
  }, [board, currentTeam]);

  const multiWordSuggestions = suggestions.filter((s) => s.connectedWords.length >= 2);
  const singleWordSuggestions = suggestions.filter((s) => s.connectedWords.length === 1);

  const handleGiveClue = useCallback(() => {
    if (!clueWord.trim()) {
      setError('أدخل كلمة الدليل');
      return;
    }
    const err = giveClue(clueWord.trim(), clueNumber);
    if (err) {
      setError(err);
    } else {
      setClueWord('');
      setClueNumber(1);
      setError('');
    }
  }, [clueWord, clueNumber, giveClue]);

  const handleSuggestionClick = useCallback((suggestion: ClueSuggestion) => {
    setClueWord(suggestion.word);
    setClueNumber(suggestion.suggestedNumber);
    setError('');
    setShowSuggestions(true);
  }, []);

  const getRiskIcon = (risk: string) => {
    switch (risk) {
      case 'safe': return <Shield className="w-3 h-3 text-emerald-400" />;
      case 'moderate': return <AlertTriangle className="w-3 h-3 text-amber-400" />;
      default: return <Zap className="w-3 h-3 text-red-400" />;
    }
  };

  const getRiskBg = (risk: string, isSelected: boolean) => {
    if (isSelected) return 'bg-emerald-500/20 border-emerald-500/50';
    switch (risk) {
      case 'safe': return 'bg-emerald-950/20 border-emerald-500/20 hover:bg-emerald-950/40';
      case 'moderate': return 'bg-amber-950/20 border-amber-500/20 hover:bg-amber-950/40';
      default: return 'bg-red-950/20 border-red-500/20 hover:bg-red-950/40';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex flex-col"
    >
      {/* Clear instruction banner */}
      <PhaseBanner
        phase="spymaster_view"
        currentTeam={currentTeam}
        redTeamName={redTeam.name}
        blueTeamName={blueTeam.name}
      />

      {/* Spymaster badge */}
      <div className="text-center mb-3">
        <Badge className="text-xs px-3 py-1 bg-purple-500/20 text-purple-300 border-purple-500/30 mb-1">
          👁️ رؤية الجاسوس
        </Badge>
        <p className={`text-xs font-bold ${teamColor}`}>
          {currentTeam === 'red' ? 'الفريق الأحمر' : 'الفريق الأزرق'} — أعطِ دليلك
        </p>
      </div>

      {/* 5x5 Grid with colors */}
      <div className="mb-4">
        <CardGrid board={board} showColors={true} />
      </div>

      {/* Clue confirmation (shown after giving clue) */}
      <AnimatePresence>
        {clueGiven && currentClue && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-4 p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/30 text-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 300 }}
            >
              <Check className="w-5 h-5 text-emerald-400 mx-auto mb-1" />
            </motion.div>
            <p className="text-[10px] text-emerald-300 mb-1">تم! الدليل:</p>
            <div className="flex items-center justify-center gap-2">
              <span className="text-lg font-black text-white">{currentClue.word}</span>
              <span className="text-lg font-black text-slate-500">—</span>
              <span className="text-lg font-black text-emerald-400">{currentClue.number}</span>
            </div>
            <p className="text-[9px] text-slate-400 mt-1">مرر الجهاز للفريق</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Clue Suggestions Panel */}
      {suggestions.length > 0 && !clueGiven && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-4 rounded-xl bg-slate-900/60 border border-purple-500/20 overflow-hidden"
        >
          {/* Toggle header */}
          <button
            onClick={() => setShowSuggestions(!showSuggestions)}
            className="w-full flex items-center justify-between p-3 hover:bg-slate-800/30 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-400" />
              <span className="text-xs font-bold text-purple-300">
                إيحاءات ذكية ({suggestions.length})
              </span>
            </div>
            {!showSuggestions && (
              <span className="text-[9px] text-purple-400/60 mr-1">اضغط للتوسيع ↓</span>
            )}
            <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform ${showSuggestions ? 'rotate-180' : ''}`} />
          </button>

          <AnimatePresence>
            {showSuggestions && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                {/* Multi-word suggestions */}
                {multiWordSuggestions.length > 0 && (
                  <div className="px-3 pb-3">
                    <div className="flex items-center gap-1.5 mb-2">
                      <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
                      <span className="text-[10px] font-bold text-amber-300">
                        أفضل الإيحاءات (كلمات متعددة)
                      </span>
                    </div>
                    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
                      {multiWordSuggestions.slice(0, 6).map((suggestion, i) => (
                        <motion.button
                          key={suggestion.word}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: i * 0.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleSuggestionClick(suggestion)}
                          className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl border-2 transition-all ${
                            getRiskBg(suggestion.risk, clueWord === suggestion.word)
                          }`}
                        >
                          {getRiskIcon(suggestion.risk)}
                          <span className="text-xs font-bold text-white">{suggestion.word}</span>
                          <span className="text-[10px] font-black text-emerald-400">{suggestion.suggestedNumber}</span>
                          <div className="flex gap-0.5">
                            {suggestion.connectedWords.map((w) => (
                              <span key={w} className="text-[8px] text-slate-400">{w}</span>
                            ))}
                          </div>
                        </motion.button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Single-word suggestions */}
                {singleWordSuggestions.length > 0 && (
                  <div className="px-3 pb-3">
                    <div className="flex items-center gap-1.5 mb-2">
                      <Zap className="w-3.5 h-3.5 text-blue-400" />
                      <span className="text-[10px] font-bold text-blue-300">
                        إيحاءات لكلمة واحدة
                      </span>
                    </div>
                    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
                      {singleWordSuggestions.slice(0, 8).map((suggestion, i) => (
                        <motion.button
                          key={suggestion.word}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: (multiWordSuggestions.length + i) * 0.04 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleSuggestionClick(suggestion)}
                          className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl border-2 transition-all ${
                            getRiskBg(suggestion.risk, clueWord === suggestion.word)
                          }`}
                        >
                          <span className="text-xs font-bold text-white">{suggestion.word}</span>
                          <span className="text-[8px] text-slate-500">→ {suggestion.connectedWords[0]}</span>
                        </motion.button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Help text */}
                <div className="px-3 pb-3">
                  <p className="text-[9px] text-slate-600 text-center leading-relaxed">
                    💡 الإيحاءات كلمات مرتبطة بكلمات فريقك — اختر إيحاءًا أو اكتب كلمتك الخاصة
                  </p>
                  <div className="flex items-center justify-center gap-3 mt-1">
                    <span className="flex items-center gap-1 text-[9px] text-slate-600">
                      <Shield className="w-2.5 h-2.5 text-emerald-500" /> آمن
                    </span>
                    <span className="flex items-center gap-1 text-[9px] text-slate-600">
                      <AlertTriangle className="w-2.5 h-2.5 text-amber-500" /> متوسط
                    </span>
                    <span className="flex items-center gap-1 text-[9px] text-slate-600">
                      <Zap className="w-2.5 h-2.5 text-red-500" /> محفوف
                    </span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Clue Input Form (hidden after clue given) */}
      {!clueGiven && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-auto p-4 rounded-xl bg-slate-900/60 border border-slate-800/50"
        >
          <p className="text-[10px] text-slate-400 mb-2 text-center">
            💡 اختر إيحاءًا من الأعلى أو اكتب كلمتك الخاصة
          </p>
          <div className="flex gap-2 mb-3">
            <Input
              value={clueWord}
              onChange={(e) => {
                setClueWord(e.target.value);
                setError('');
              }}
              onKeyDown={(e) => e.key === 'Enter' && handleGiveClue()}
              placeholder="كلمة الدليل..."
              className="flex-1 bg-slate-800/80 border-slate-700/50 text-white placeholder:text-slate-500 text-center h-11"
              dir="rtl"
              maxLength={20}
            />
          </div>

          {/* Number selector */}
          <div className="flex items-center justify-center gap-1.5 mb-3">
            <span className="text-[10px] text-slate-400 ml-2">عدد الكلمات:</span>
            {Array.from({ length: 9 }, (_, i) => i + 1).map((num) => (
              <motion.button
                key={num}
                whileTap={{ scale: 0.9 }}
                onClick={() => setClueNumber(num)}
                className={`w-8 h-8 sm:w-9 sm:h-9 rounded-lg text-sm font-bold transition-all flex items-center justify-center ${
                  clueNumber === num
                    ? 'bg-emerald-500/30 border-2 border-emerald-500/60 text-emerald-300'
                    : 'bg-slate-800/60 border-2 border-slate-700/40 text-slate-400 hover:bg-slate-700/60'
                }`}
              >
                {num}
              </motion.button>
            ))}
          </div>

          {error && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-red-400 text-[10px] sm:text-xs text-center mb-2"
            >
              ⚠️ {error}
            </motion.p>
          )}

          <Button
            onClick={handleGiveClue}
            disabled={!clueWord.trim()}
            className="w-full font-bold text-sm sm:text-base py-4 text-white"
            style={{
              background: !clueWord.trim()
                ? 'rgba(30, 41, 59, 0.5)'
                : 'linear-gradient(to left, #059669, #10b981)',
              borderRadius: '0.75rem',
              boxShadow: clueWord.trim() ? '0 0 20px rgba(16, 185, 129, 0.3)' : 'none',
            }}
          >
            <Send className="w-4 h-4 ml-2" />
            إعطاء الدليل
          </Button>
        </motion.div>
      )}
    </motion.div>
  );
}

// ============================================================
// TRANSITION VIEW (Godfather mode — pass device)
// ============================================================

function TransitionView({ onReady }: { onReady: () => void }) {
  const { currentClue, currentTeam, redTeam, blueTeam } = useShifaratStore();
  const teamName = currentTeam === 'red' ? redTeam.name : blueTeam.name;
  const teamColor = currentTeam === 'red' ? 'text-red-400' : 'text-blue-400';

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col items-center justify-center flex-1 p-6"
    >
      <div className="text-4xl mb-4">📱</div>

      <h2 className="text-xl sm:text-2xl font-black text-white mb-2">
        مرر الجهاز إلى الفريق
      </h2>
      <p className={`text-sm font-bold ${teamColor} mb-4`}>
        {teamName}
      </p>

      {currentClue && (
        <div className="mb-5 p-3 rounded-xl bg-slate-900/60 border border-slate-800/50 text-center">
          <p className="text-xs text-slate-400 mb-1">الدليل</p>
          <div className="flex items-center justify-center gap-3">
            <span className="text-2xl font-black text-white">{currentClue.word}</span>
            <span className="text-2xl font-black text-slate-500">—</span>
            <span className="text-2xl font-black text-emerald-400">{currentClue.number}</span>
          </div>
        </div>
      )}

      <Button
        onClick={onReady}
        className="w-full max-w-xs font-bold text-base py-5 text-white"
        style={{
          background: 'linear-gradient(to left, #059669, #10b981)',
          borderRadius: '0.75rem',
          boxShadow: '0 0 20px rgba(16, 185, 129, 0.3)',
        }}
      >
        جاهز للتخمين
      </Button>
    </motion.div>
  );
}

// ============================================================
// TEAM GUESSING VIEW — with correct guess toast
// ============================================================

function TeamGuessingView() {
  const {
    board,
    selectCard,
    currentClue,
    currentTeam,
    guessesThisTurn,
    guessesAllowed,
    passTurn,
    timerRemaining,
    timerDuration,
    redTeam,
    blueTeam,
    gameMode,
    viewMode,
    lastGuessResult,
  } = useShifaratStore();

  const remainingGuesses = guessesAllowed - guessesThisTurn;
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showCorrectToast, setShowCorrectToast] = useState(false);
  const [lastCorrectWord, setLastCorrectWord] = useState('');

  // Show correct toast when correct
  const correctToastTimerRef = useRef<NodeJS.Timeout | null>(null);
  useEffect(() => {
    if (lastGuessResult === 'correct') {
      const lastRevealed = [...board].reverse().find((c) => c.isRevealed);
      if (lastRevealed) {
        queueMicrotask(() => {
          setLastCorrectWord(lastRevealed.word);
          setShowCorrectToast(true);
        });
        correctToastTimerRef.current = setTimeout(() => {
          queueMicrotask(() => setShowCorrectToast(false));
        }, 1500);
        return () => {
          if (correctToastTimerRef.current) clearTimeout(correctToastTimerRef.current);
        };
      }
    }
  }, [lastGuessResult, board]);

  // Timer countdown
  useEffect(() => {
    const store = useShifaratStore.getState();
    if (store.isTimerActive && store.timerRemaining > 0) {
      intervalRef.current = setInterval(() => {
        useShifaratStore.getState().tickTimer();
        if (store.timerRemaining <= 10 && store.timerRemaining > 0) {
          playSound('tick');
        }
      }, 1000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const handleCardClick = useCallback((cardId: number) => {
    if (isProcessing) return;
    setIsProcessing(true);

    const { result, gameEnded } = selectCard(cardId);

    if (result === 'correct') {
      playSound('correct');
    } else if (result === 'wrong') {
      playSound('wrong');
    } else if (result === 'assassin') {
      playSound('assassin');
    } else if (result === 'neutral') {
      playSound('wrong');
    }
    if (gameEnded) {
      setTimeout(() => playSound('win'), 500);
    }

    setTimeout(() => setIsProcessing(false), 300);
  }, [selectCard, isProcessing]);

  const handlePass = useCallback(() => {
    passTurn();
  }, [passTurn]);

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex flex-col"
    >
      {/* Phase guidance banner */}
      <PhaseBanner
        phase="team_guessing"
        currentTeam={currentTeam}
        redTeamName={redTeam.name}
        blueTeamName={blueTeam.name}
      />

      {/* Correct guess toast */}
      <div className="mb-3 min-h-[44px]">
        <AnimatePresence>
          {showCorrectToast && (
            <CorrectToast
              word={lastCorrectWord}
              remainingGuesses={remainingGuesses - 1}
            />
          )}
        </AnimatePresence>
      </div>

      {/* Clue Display */}
      <ClueDisplay />

      {/* Timer */}
      <TimerBar remaining={timerRemaining} duration={timerDuration} />

      {/* Remaining guesses */}
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          <span className="text-[10px] sm:text-xs text-slate-400">التخمينات المتبقية:</span>
          <div className="flex gap-1">
            {Array.from({ length: guessesAllowed }, (_, i) => (
              <motion.div
                key={i}
                animate={i < remainingGuesses ? { scale: [1, 1.2, 1] } : {}}
                transition={{ repeat: i === remainingGuesses - 1 ? Infinity : 0, duration: 1 }}
                className="w-3 h-3 sm:w-4 sm:h-4 rounded-full transition-all"
                style={{
                  background: i < remainingGuesses
                    ? (currentTeam === 'red' ? '#ef4444' : '#3b82f6')
                    : 'rgba(51, 65, 85, 0.3)',
                  boxShadow: i < remainingGuesses
                    ? `0 0 6px ${currentTeam === 'red' ? 'rgba(239, 68, 68, 0.5)' : 'rgba(59, 130, 246, 0.5)'}`
                    : 'none',
                }}
              />
            ))}
          </div>
        </div>
        <Badge className="text-[10px] px-2 bg-slate-800/60 text-slate-400 border-slate-700/40">
          {guessesThisTurn}/{guessesAllowed}
        </Badge>
      </div>

      {/* Instruction to tap cards */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="mb-2 flex items-center justify-center gap-2"
      >
        <motion.div
          animate={{ y: [0, -4, 0] }}
          transition={{ repeat: Infinity, duration: 1.2, ease: 'easeInOut' }}
        >
          <span className="text-base">👆</span>
        </motion.div>
        <span className="text-[10px] sm:text-xs text-slate-400 font-bold">
          اضغط على الكلمة التي تظن أنها مرتبطة بالدليل
        </span>
      </motion.div>

      {/* 5x5 Grid — no colors shown */}
      <div className="mb-4">
        <CardGrid
          board={board}
          showColors={false}
          onCardClick={handleCardClick}
          disabled={isProcessing}
        />
      </div>

      {/* Pass button — secondary action */}
      <motion.div className="mt-auto">
        <p className="text-[9px] text-slate-600 text-center mb-1.5">
          أو تنازل عن الدور إذا لم تتأكد
        </p>
        <Button
          onClick={handlePass}
          variant="outline"
          className="w-full font-bold text-sm py-3 border-slate-700/60 text-slate-400 hover:bg-slate-800/60 hover:text-slate-300"
          style={{ borderRadius: '0.75rem' }}
        >
          <Hand className="w-4 h-4 ml-2" />
          تنازل عن الدور
        </Button>
      </motion.div>
    </motion.div>
  );
}

// ============================================================
// TURN RESULT VIEW — small banner for correct, bigger card for wrong/neutral/assassin
// ============================================================

function TurnResultView({ onNext }: { onNext: () => void }) {
  const { board, lastGuessResult, gameLog, winner, winReason, currentTeam, redTeam, blueTeam } = useShifaratStore();

  const lastRevealed = [...board].reverse().find((c) => c.isRevealed);
  const lastLog = gameLog[gameLog.length - 1];

  const getResultDisplay = () => {
    switch (lastGuessResult) {
      case 'correct':
        return {
          emoji: '✅',
          title: 'صحيح!',
          subtitle: lastRevealed ? lastRevealed.word : '',
          color: 'text-emerald-400',
          bg: 'bg-emerald-950/30',
          border: 'border-emerald-500/30',
          isSmall: true,
        };
      case 'wrong':
        return {
          emoji: '❌',
          title: 'خطأ!',
          subtitle: lastRevealed ? `كلمة الفريق الخصم — انتهى الدور` : '',
          color: 'text-red-400',
          bg: 'bg-red-950/30',
          border: 'border-red-500/30',
          isSmall: false,
        };
      case 'neutral':
        return {
          emoji: '⬜',
          title: 'محايدة!',
          subtitle: lastRevealed ? `كلمة محايدة — انتهى الدور` : '',
          color: 'text-slate-300',
          bg: 'bg-slate-900/30',
          border: 'border-slate-700/30',
          isSmall: false,
        };
      case 'assassin':
        return {
          emoji: '💀',
          title: 'القاتل!',
          subtitle: 'خسارة فورية!',
          color: 'text-gray-300',
          bg: 'bg-gray-950/50',
          border: 'border-gray-500/30',
          isSmall: false,
        };
      default:
        return {
          emoji: '❓',
          title: 'نتيجة',
          subtitle: '',
          color: 'text-slate-400',
          bg: 'bg-slate-900/30',
          border: 'border-slate-700/30',
          isSmall: false,
        };
    }
  };

  const result = getResultDisplay();

  // For correct guesses, auto-continue (the team keeps guessing)
  // The turn_result for "correct" is only shown briefly before the next guess
  // Actually, based on the logic, correct guesses keep the phase as team_guessing
  // So turn_result is only reached for wrong/neutral/assassin/out-of-guesses

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col items-center justify-center flex-1 p-4 sm:p-6"
    >
      {/* Result card */}
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 200, delay: 0.1, duration: 0.4 }}
        className={`w-full max-w-sm ${result.isSmall ? 'p-4 sm:p-5' : 'p-6 sm:p-8'} rounded-2xl border text-center mb-5 ${result.bg} ${result.border}`}
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 300, delay: 0.2 }}
          className={`mb-2 ${result.isSmall ? 'text-3xl sm:text-4xl' : 'text-5xl sm:text-6xl'}`}
        >
          {result.emoji}
        </motion.div>

        <h2 className={`text-lg sm:text-xl ${result.isSmall ? '' : 'text-2xl'} font-black ${result.color} mb-1`}>
          {result.title}
        </h2>
        {result.subtitle && (
          <p className={`text-sm text-slate-400 ${result.isSmall ? '' : 'mb-3'}`}>{result.subtitle}</p>
        )}

        {lastRevealed && !result.isSmall && (
          <div className="mt-3 p-3 rounded-xl bg-slate-900/40 border border-slate-800/50">
            <p className="text-lg font-bold text-white">{lastRevealed.word}</p>
          </div>
        )}
      </motion.div>

      <Button
        onClick={onNext}
        className="w-full max-w-xs font-bold text-base py-4 text-white"
        style={{
          background: 'linear-gradient(to left, #059669, #10b981)',
          borderRadius: '0.75rem',
          boxShadow: '0 0 20px rgba(16, 185, 129, 0.3)',
        }}
      >
        التالي
      </Button>
    </motion.div>
  );
}

// ============================================================
// TURN SWITCH VIEW — clear WHO with team color
// ============================================================

function TurnSwitchView({ onContinue }: { onContinue: () => void }) {
  const { currentTeam, redTeam, blueTeam, gameMode } = useShifaratStore();

  const nextTeam: TeamColor = currentTeam === 'red' ? 'blue' : 'red';
  const teamName = nextTeam === 'red' ? redTeam.name : blueTeam.name;
  const teamColor = nextTeam === 'red' ? 'text-red-400' : 'text-blue-400';
  const teamBg = nextTeam === 'red' ? 'bg-red-950/30' : 'bg-blue-950/30';
  const teamBorder = nextTeam === 'red' ? 'border-red-500/40' : 'border-blue-500/40';
  const teamEmoji = nextTeam === 'red' ? '🔴' : '🔵';
  const teamGlow = nextTeam === 'red' ? 'shadow-lg shadow-red-500/10' : 'shadow-lg shadow-blue-500/10';
  const isGodfather = gameMode === 'godfather';

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col items-center justify-center flex-1 p-6"
    >
      {/* Phase banner */}
      <PhaseBanner phase="turn_switch" />

      {/* Turn switch card */}
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 200, delay: 0.15 }}
        className={`w-full max-w-sm p-6 sm:p-8 rounded-2xl border text-center mb-5 ${teamBg} ${teamBorder} ${teamGlow}`}
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 300, delay: 0.3 }}
          className="text-5xl mb-3"
        >
          {teamEmoji}
        </motion.div>

        <p className="text-xs text-slate-400 mb-1">الدور الآن لـ</p>
        <h2 className={`text-xl sm:text-2xl font-black ${teamColor} mb-1`}>
          {teamName}
        </h2>

        <p className={`text-xs font-bold ${teamColor} mt-2`}>
          👁️ جاسوس {teamName}: أعد دليلك
        </p>

        {isGodfather && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-[10px] text-slate-500 mt-3 mb-1"
          >
            مرر الجهاز إلى جاسوس الفريق
          </motion.p>
        )}
      </motion.div>

      <Button
        onClick={onContinue}
        className="w-full max-w-xs font-bold text-base py-4 text-white"
        style={{
          background: 'linear-gradient(to left, #059669, #10b981)',
          borderRadius: '0.75rem',
          boxShadow: '0 0 20px rgba(16, 185, 129, 0.3)',
        }}
      >
        متابعة
      </Button>
    </motion.div>
  );
}

// ============================================================
// MAIN PLAYING PHASE — Orchestrator
// ============================================================

export default function PlayingPhase() {
  const {
    phase,
    viewMode,
    gameMode,
    confirmTurnSwitch,
    setViewMode,
    currentTeam,
    redTeam,
    blueTeam,
    roundNumber,
  } = useShifaratStore();

  const [showHowToPlay, setShowHowToPlay] = useState(false);

  const handleTransitionReady = useCallback(() => {
    setViewMode('team');
  }, [setViewMode]);

  const handleTurnResultNext = useCallback(() => {
    confirmTurnSwitch();
  }, [confirmTurnSwitch]);

  const handleTurnSwitchContinue = useCallback(() => {
    confirmTurnSwitch();
  }, [confirmTurnSwitch]);

  const renderContent = () => {
    if (phase === 'game_over') return null;

    if (phase === 'spymaster_view') {
      if (viewMode === 'spymaster') {
        return <SpymasterView />;
      }
      if (gameMode === 'godfather') {
        return (
          <TransitionView onReady={() => setViewMode('spymaster')} />
        );
      }
      return <SpymasterView />;
    }

    if (phase === 'clue_given' || phase === 'team_guessing') {
      if (viewMode === 'transition') {
        return <TransitionView onReady={handleTransitionReady} />;
      }
      return <TeamGuessingView />;
    }

    if (phase === 'turn_result') {
      return <TurnResultView onNext={handleTurnResultNext} />;
    }

    if (phase === 'turn_switch') {
      return <TurnSwitchView onContinue={handleTurnSwitchContinue} />;
    }

    return null;
  };

  return (
    <div className="flex flex-col min-h-screen py-2 px-3 sm:px-4" dir="rtl">
      {/* Team Scores */}
      <TeamScores />

      {/* Round indicator */}
      <div className="flex items-center justify-between mb-2 px-1">
        <span className="text-[10px] text-slate-500">الجولة {roundNumber}</span>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setShowHowToPlay(true)}
            className="text-[10px] text-slate-500 hover:text-emerald-400 transition-colors"
          >
            كيف تلعب؟
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <AnimatePresence mode="wait">
          {renderContent()}
        </AnimatePresence>
      </div>

      {/* How to Play Modal */}
      <HowToPlay open={showHowToPlay} onOpenChange={setShowHowToPlay} />
    </div>
  );
}
