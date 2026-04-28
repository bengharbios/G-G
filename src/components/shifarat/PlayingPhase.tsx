'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  RotateCcw,
  ChevronLeft,
  Clock,
  SkipForward,
  Check,
  X,
  MessageCircle,
  Eye,
  EyeOff,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useShifaratStore } from '@/lib/shifarat-store';

export default function PlayingPhase() {
  const {
    teams,
    currentTeamIndex,
    currentWord,
    currentCategory,
    timerMax,
    timerLeft,
    skipsLeft,
    roundActive,
    roundNumber,
    roundMessage,
    roundStatus,
    phase,
    gameLog,
    targetScore,
    newRound,
    markCorrect,
    markWrong,
    skipWord,
    tickTimer,
    nextTurn,
    resetGame,
  } = useShifaratStore();

  const [showWord, setShowWord] = useState(false);
  const [hints, setHints] = useState<string[]>([]);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Timer countdown
  useEffect(() => {
    if (roundActive && timerLeft > 0) {
      intervalRef.current = setInterval(() => {
        tickTimer();
      }, 1000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [roundActive, timerLeft, tickTimer]);

  // Auto-start round if no word and phase is playing
  useEffect(() => {
    if (phase === 'playing' && !currentWord && !roundActive) {
      // Wait a beat then auto-start
      const timeout = setTimeout(() => {
        newRound();
      }, 300);
      return () => clearTimeout(timeout);
    }
  }, [phase, currentWord, roundActive, newRound]);

  // Reset hints on new word
  useEffect(() => {
    if (currentWord) {
      setHints([]);
      setShowWord(false);
    }
  }, [currentWord?.w]);

  // Add hints on correct/wrong/skip
  useEffect(() => {
    if (roundMessage && currentWord) {
      setHints((prev) => [...prev, roundMessage]);
    }
  }, [roundMessage, currentWord]);

  // Show word automatically on new round
  useEffect(() => {
    if (roundActive && currentWord) {
      setShowWord(true);
    }
  }, [roundActive, currentWord]);

  const handleCorrect = useCallback(() => {
    markCorrect();
  }, [markCorrect]);

  const handleWrong = useCallback(() => {
    markWrong();
  }, [markWrong]);

  const handleSkip = useCallback(() => {
    skipWord();
  }, [skipWord]);

  const handleNextTurn = useCallback(() => {
    nextTurn();
  }, [nextTurn]);

  // Timer percentage
  const timerPercent = timerMax > 0 ? (timerLeft / timerMax) * 100 : 0;

  // Timer color
  const getTimerColor = () => {
    if (timerPercent > 60) return { bar: '#10b981', bg: 'rgba(16, 185, 129, 0.2)' };
    if (timerPercent > 30) return { bar: '#f59e0b', bg: 'rgba(245, 158, 11, 0.2)' };
    return { bar: '#ef4444', bg: 'rgba(239, 68, 68, 0.2)' };
  };

  const timerColors = getTimerColor();

  const activeTeam = teams[currentTeamIndex];
  const otherTeamIndex = currentTeamIndex === 0 ? 1 : 0;
  const otherTeam = teams[otherTeamIndex];

  // Words guessed this round
  const roundWordsGuessed = gameLog.filter(
    (log) => log.round === roundNumber && log.result === 'صح ✓'
  ).length;

  const backgroundStyle = {
    background: 'linear-gradient(135deg, #020617 0%, #0f172a 50%, #020617 100%)',
  };

  const cardStyle = {
    background: 'rgba(30, 41, 59, 0.5)',
    border: '1px solid rgba(51, 65, 85, 0.5)',
    borderRadius: '1rem',
  };

  // Team colors
  const teamColors = [
    { primary: '#3b82f6', bg: 'rgba(59, 130, 246, 0.15)', border: 'rgba(59, 130, 246, 0.3)', text: '#93c5fd' },
    { primary: '#10b981', bg: 'rgba(16, 185, 129, 0.15)', border: 'rgba(16, 185, 129, 0.3)', text: '#6ee7b7' },
  ];

  const currentColor = teamColors[currentTeamIndex];
  const otherColor = teamColors[otherTeamIndex];

  return (
    <div className="min-h-screen flex flex-col py-3 px-3 sm:px-4" dir="rtl" style={backgroundStyle}>
      {/* Decorative dots */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 15 }).map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full"
            style={{
              width: Math.random() * 2 + 1 + 'px',
              height: Math.random() * 2 + 1 + 'px',
              top: Math.random() * 100 + '%',
              left: Math.random() * 100 + '%',
              backgroundColor: `rgba(16, 185, 129, ${Math.random() * 0.15 + 0.05})`,
              animation: `pulse ${Math.random() * 3 + 2}s ease-in-out infinite`,
              animationDelay: Math.random() * 2 + 's',
            }}
          />
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="relative z-10 w-full max-w-md mx-auto flex flex-col min-h-screen"
      >
        {/* Team Scores */}
        <div className="flex gap-3 mb-3">
          {/* Current Team */}
          <motion.div
            layout
            className="flex-1 p-3"
            style={{
              background: currentColor.bg,
              border: `2px solid ${currentColor.border}`,
              borderRadius: '1rem',
              boxShadow: `0 0 20px ${currentColor.bg}`,
            }}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold" style={{ color: currentColor.text }}>
                {activeTeam.name}
              </span>
              <Badge
                className="text-[10px] px-1.5"
                style={{ background: currentColor.bg, color: currentColor.text, border: `1px solid ${currentColor.border}` }}
              >
                دورك
              </Badge>
            </div>
            <div className="text-2xl font-black text-white">{activeTeam.score}</div>
            <div className="w-full h-1.5 rounded-full mt-1.5" style={{ background: 'rgba(51, 65, 85, 0.3)' }}>
              <motion.div
                className="h-full rounded-full"
                style={{ background: currentColor.primary }}
                animate={{ width: `${Math.min((activeTeam.score / targetScore) * 100, 100)}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
            <div className="text-[9px] text-slate-500 mt-1">{activeTeam.score}/{targetScore}</div>
          </motion.div>

          {/* Other Team */}
          <div
            className="flex-1 p-3"
            style={{
              background: 'rgba(30, 41, 59, 0.3)',
              border: '1px solid rgba(51, 65, 85, 0.3)',
              borderRadius: '1rem',
              opacity: 0.6,
            }}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold text-slate-400">{otherTeam.name}</span>
            </div>
            <div className="text-2xl font-black text-slate-300">{otherTeam.score}</div>
            <div className="w-full h-1.5 rounded-full mt-1.5" style={{ background: 'rgba(51, 65, 85, 0.3)' }}>
              <motion.div
                className="h-full rounded-full"
                style={{ background: otherColor.primary, opacity: 0.5 }}
                animate={{ width: `${Math.min((otherTeam.score / targetScore) * 100, 100)}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
            <div className="text-[9px] text-slate-500 mt-1">{otherTeam.score}/{targetScore}</div>
          </div>
        </div>

        {/* Turn Info */}
        <div className="text-center mb-3">
          <p className="text-xs text-slate-400">
            الجولة {roundNumber}
            {roundWordsGuessed > 0 && (
              <span className="text-emerald-400 mr-1">• {roundWordsGuessed} كلمات</span>
            )}
          </p>
          <p className="text-sm font-bold" style={{ color: currentColor.text }}>
            {activeTeam.name} - لمّح بكلمة واحدة فقط!
          </p>
        </div>

        {/* Timer Bar */}
        {roundActive && (
          <div className="mb-4">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" style={{ color: timerColors.bar }} />
                <span className="text-xs font-bold" style={{ color: timerColors.bar }}>
                  {timerLeft}s
                </span>
              </div>
            </div>
            <div className="w-full h-2 rounded-full" style={{ background: timerColors.bg }}>
              <motion.div
                className="h-full rounded-full transition-all duration-1000"
                style={{ background: timerColors.bar }}
                animate={{ width: `${timerPercent}%` }}
              />
            </div>
          </div>
        )}

        {/* Word Display */}
        <AnimatePresence mode="wait">
          {currentWord && (
            <motion.div
              key={currentWord.w}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.3 }}
              className="mb-4"
            >
              <div
                className="text-center p-6"
                style={{
                  background: 'linear-gradient(135deg, rgba(6, 78, 59, 0.2) 0%, rgba(30, 41, 59, 0.5) 100%)',
                  border: `1px solid ${currentColor.border}`,
                  borderRadius: '1.25rem',
                  boxShadow: `0 0 30px ${currentColor.bg}`,
                }}
              >
                {/* Toggle word visibility */}
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowWord(!showWord)}
                  className="mb-3 flex items-center gap-1 mx-auto text-xs px-3 py-1.5 rounded-lg"
                  style={{
                    background: 'rgba(30, 41, 59, 0.8)',
                    border: '1px solid rgba(51, 65, 85, 0.3)',
                    color: '#94a3b8',
                  }}
                >
                  {showWord ? (
                    <>
                      <EyeOff className="w-3.5 h-3.5" />
                      إخفاء الكلمة
                    </>
                  ) : (
                    <>
                      <Eye className="w-3.5 h-3.5" />
                      إظهار الكلمة
                    </>
                  )}
                </motion.button>

                {/* Word */}
                {showWord ? (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <h2 className="text-3xl sm:text-4xl font-black text-white mb-2">
                      {currentWord.w}
                    </h2>
                    {currentWord.hint && (
                      <p className="text-sm text-slate-400 mb-1">💡 {currentWord.hint}</p>
                    )}
                  </motion.div>
                ) : (
                  <div className="text-2xl text-slate-600">••••••</div>
                )}

                {/* Category */}
                {currentCategory && (
                  <Badge
                    className="mt-3 text-[10px] px-2"
                    style={{
                      background: 'rgba(16, 185, 129, 0.1)',
                      color: '#6ee7b7',
                      border: '1px solid rgba(16, 185, 129, 0.2)',
                    }}
                  >
                    {currentCategory}
                  </Badge>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Waiting to start */}
        {!currentWord && phase === 'playing' && !roundActive && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center mb-4 p-6"
            style={{ ...cardStyle }}
          >
            <p className="text-slate-400 text-sm">اضغط لبدء الجولة</p>
            <Button
              onClick={newRound}
              className="mt-3 font-bold text-white"
              style={{
                background: 'linear-gradient(to left, #059669, #10b981)',
                borderRadius: '0.75rem',
                boxShadow: '0 0 20px rgba(16, 185, 129, 0.3)',
              }}
            >
              <ChevronLeft className="w-4 h-4 ml-1" />
              ابدأ الجولة
            </Button>
          </motion.div>
        )}

        {/* Hints/Message area */}
        <AnimatePresence>
          {hints.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mb-3 max-h-28 overflow-y-auto"
            >
              <div className="flex items-center gap-1 mb-2">
                <MessageCircle className="w-3.5 h-3.5 text-slate-500" />
                <span className="text-[10px] text-slate-500 font-bold">الأحداث</span>
              </div>
              <div className="space-y-1">
                {hints.map((hint, i) => (
                  <motion.div
                    key={`${i}-${hint}`}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="text-xs px-3 py-1.5 rounded-lg"
                    style={{
                      background: 'rgba(30, 41, 59, 0.5)',
                      color: hint.includes('صح') ? '#6ee7b7' : hint.includes('خطأ') ? '#fca5a5' : '#94a3b8',
                    }}
                  >
                    {hint}
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Skip Counter */}
        {roundActive && (
          <div className="flex items-center justify-center gap-2 mb-3">
            <span className="text-[10px] text-slate-500">التخطي المتبقي:</span>
            <div className="flex gap-1">
              {[0, 1].map((i) => (
                <div
                  key={i}
                  className="w-3 h-3 rounded-full transition-all"
                  style={{
                    background: i < skipsLeft ? '#f59e0b' : 'rgba(51, 65, 85, 0.3)',
                    boxShadow: i < skipsLeft ? '0 0 8px rgba(245, 158, 11, 0.4)' : 'none',
                  }}
                />
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        {roundActive && (
          <div className="flex gap-3 mb-4 mt-auto">
            {/* Correct */}
            <motion.div className="flex-1" whileTap={{ scale: 0.95 }}>
              <Button
                onClick={handleCorrect}
                className="w-full py-5 font-bold text-base text-white flex items-center justify-center gap-2"
                style={{
                  background: 'linear-gradient(135deg, #059669, #10b981)',
                  borderRadius: '1rem',
                  minHeight: '52px',
                  boxShadow: '0 0 20px rgba(16, 185, 129, 0.2)',
                }}
              >
                <Check className="w-5 h-5" />
                صح
              </Button>
            </motion.div>

            {/* Skip */}
            <motion.div className="flex-1" whileTap={{ scale: 0.95 }}>
              <Button
                onClick={handleSkip}
                disabled={skipsLeft <= 0}
                className="w-full py-5 font-bold text-base flex items-center justify-center gap-2"
                style={{
                  background: skipsLeft > 0
                    ? 'linear-gradient(135deg, #d97706, #f59e0b)'
                    : 'rgba(30, 41, 59, 0.5)',
                  borderRadius: '1rem',
                  minHeight: '52px',
                  color: skipsLeft > 0 ? 'white' : '#475569',
                  boxShadow: skipsLeft > 0 ? '0 0 20px rgba(245, 158, 11, 0.2)' : 'none',
                  border: skipsLeft > 0 ? 'none' : '1px solid rgba(51, 65, 85, 0.3)',
                }}
              >
                <SkipForward className="w-5 h-5" />
                تخطي ({skipsLeft})
              </Button>
            </motion.div>

            {/* Wrong */}
            <motion.div className="flex-1" whileTap={{ scale: 0.95 }}>
              <Button
                onClick={handleWrong}
                className="w-full py-5 font-bold text-base text-white flex items-center justify-center gap-2"
                style={{
                  background: 'linear-gradient(135deg, #dc2626, #ef4444)',
                  borderRadius: '1rem',
                  minHeight: '52px',
                  boxShadow: '0 0 20px rgba(239, 68, 68, 0.2)',
                }}
              >
                <X className="w-5 h-5" />
                خطأ
              </Button>
            </motion.div>
          </div>
        )}

        {/* Round End - Next Turn */}
        {phase === 'round_end' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-4 mt-auto"
          >
            <div
              className="p-5 mb-3"
              style={{
                background: 'rgba(30, 41, 59, 0.5)',
                border: '1px solid rgba(51, 65, 85, 0.5)',
                borderRadius: '1rem',
              }}
            >
              <p className="text-lg mb-1">⏰</p>
              <p className="text-sm font-bold text-slate-200">انتهى الوقت!</p>
              <p className="text-xs text-slate-400 mt-1">
                كلمات هذه الجولة: {roundWordsGuessed}
              </p>
            </div>
            <Button
              onClick={handleNextTurn}
              className="w-full py-5 font-bold text-base text-white"
              style={{
                background: 'linear-gradient(to left, #059669, #10b981)',
                borderRadius: '1rem',
                minHeight: '52px',
                boxShadow: '0 0 30px rgba(16, 185, 129, 0.3)',
              }}
            >
              <ChevronLeft className="w-4 h-4 ml-1" />
              الدور التالي - {otherTeam.name}
            </Button>
          </motion.div>
        )}

        {/* Reset Button */}
        <div className="flex justify-center mb-4 mt-2">
          <Button
            onClick={resetGame}
            variant="ghost"
            className="text-slate-600 hover:text-slate-400 gap-1 text-[10px]"
          >
            <RotateCcw className="w-3 h-3" />
            إعادة تعيين اللعبة
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
