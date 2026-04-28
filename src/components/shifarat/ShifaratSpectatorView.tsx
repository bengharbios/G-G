'use client';

import { useEffect, useState, useMemo } from 'react';
import { motion } from 'framer-motion';

interface ShifaratRoomState {
  teams: Array<{ name: string; score: number }>;
  currentTeamIndex: number;
  currentWord: { w: string; hint: string } | null;
  currentCategory: string;
  timerLeft: number;
  timerMax: number;
  skipsLeft: number;
  roundActive: boolean;
  roundNumber: number;
  roundStatus: string;
  roundMessage: string;
  targetScore: number;
}

interface ShifaratSpectatorViewProps {
  stateJson: string;
  roomCode: string;
  hostName: string;
  playerName?: string;
}

export default function ShifaratSpectatorView({
  stateJson,
  roomCode,
  hostName,
  playerName,
}: ShifaratSpectatorViewProps) {
  const [showWord, setShowWord] = useState(false);

  // Parse state (useMemo to avoid setState in effect)
  const parsedState = useMemo(() => {
    try {
      return JSON.parse(stateJson) as ShifaratRoomState;
    } catch {
      return null;
    }
  }, [stateJson]);

  // Keep state in sync with parsed state + polling updates
  const [state, setState] = useState<ShifaratRoomState | null>(parsedState);

  useEffect(() => {
    setState(parsedState);
  }, [parsedState]);

  // Poll for updates every 2s
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/room/${roomCode}`);
        if (res.ok) {
          const data = await res.json();
          if (data.stateJson) {
            try {
              setState(JSON.parse(data.stateJson));
            } catch {}
          }
        }
      } catch {}
    }, 2000);
    return () => clearInterval(interval);
  }, [roomCode]);

  if (!state) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-950 to-slate-900" dir="rtl">
        <div className="text-center">
          <div className="text-5xl mb-4 animate-bounce">🎯</div>
          <p className="text-slate-400">جاري تحميل اللعبة...</p>
        </div>
      </div>
    );
  }

  const isGameOver = state.teams[0].score >= state.targetScore || state.teams[1].score >= state.targetScore;
  const winner = state.teams[0].score >= state.targetScore ? state.teams[0] : state.teams[1];
  const timerPercent = state.timerMax > 0 ? (state.timerLeft / state.timerMax) * 100 : 0;
  const timerColor = timerPercent <= 20 ? 'bg-red-500' : timerPercent <= 40 ? 'bg-amber-500' : 'bg-emerald-500';

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-slate-950 to-slate-900" dir="rtl">
      {/* Header */}
      <div className="sticky top-0 z-50 border-b border-slate-800/50 bg-slate-950/90 backdrop-blur-sm">
        <div className="max-w-md mx-auto flex items-center justify-between px-3 py-2">
          <span className="text-xs text-slate-500">🎯 الشيفرات</span>
          {playerName && (
            <div className="flex items-center gap-1 bg-emerald-950/40 border border-emerald-500/30 rounded-lg px-2 py-1">
              <span className="text-xs">🎮</span>
              <span className="text-[10px] font-bold text-emerald-300">{playerName}</span>
            </div>
          )}
          <span className="text-xs text-slate-500">جولة {state.roundNumber}</span>
        </div>
      </div>

      <div className="flex-1 flex flex-col max-w-md mx-auto w-full p-4">
        {/* Team Cards */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          {state.teams.map((team, idx) => (
            <motion.div
              key={idx}
              animate={{ scale: state.currentTeamIndex === idx ? 1.02 : 1 }}
              className={`rounded-xl p-4 text-center transition-all ${
                state.currentTeamIndex === idx
                  ? 'bg-emerald-900/30 border-2 border-emerald-500/60 shadow-lg shadow-emerald-500/10'
                  : 'bg-slate-800/50 border border-slate-700/50'
              }`}
            >
              <p className="text-[10px] text-slate-400 mb-1">
                {idx === 0 ? 'الفريق الأول' : 'الفريق الثاني'}
              </p>
              <p className="text-sm font-bold text-white mb-2">{team.name}</p>
              <div className="relative h-2 bg-slate-700 rounded-full overflow-hidden mb-1">
                <motion.div
                  animate={{ width: `${Math.min((team.score / state.targetScore) * 100, 100)}%` }}
                  className="h-full bg-emerald-500 rounded-full"
                />
              </div>
              <p className="text-2xl font-bold text-emerald-400">{team.score}</p>
              <p className="text-[10px] text-slate-500">من {state.targetScore}</p>
            </motion.div>
          ))}
        </div>

        {/* Turn Info */}
        <div className="text-center mb-3">
          <p className="text-xs text-slate-400">
            دور: <span className="text-emerald-400 font-bold">{state.teams[state.currentTeamIndex].name}</span>
          </p>
        </div>

        {/* Timer Bar */}
        <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden mb-4">
          <motion.div
            animate={{ width: `${timerPercent}%` }}
            transition={{ duration: 0.3 }}
            className={`h-full ${timerColor} rounded-full`}
          />
        </div>

        {/* Word Display */}
        <div
          className="rounded-xl p-6 text-center mb-4 min-h-[140px] flex flex-col items-center justify-center cursor-pointer bg-slate-800/30 border border-slate-700/30"
          onClick={() => setShowWord(!showWord)}
        >
          {isGameOver ? (
            <>
              <div className="text-5xl mb-3">🏆</div>
              <p className="text-xl font-bold text-amber-400">{winner.name}</p>
              <p className="text-sm text-slate-400 mt-1">فاز باللعبة!</p>
            </>
          ) : showWord && state.currentWord ? (
            <>
              <p className="text-3xl font-bold text-white mb-2">{state.currentWord.w}</p>
              <p className="text-xs text-emerald-400">📂 {state.currentCategory}</p>
              <p className="text-[10px] text-slate-500 mt-2">اضغط للإخفاء</p>
            </>
          ) : (
            <>
              <p className="text-4xl mb-2">🎯</p>
              <p className="text-sm text-slate-300">اضغط لكشف الكلمة</p>
              {state.currentCategory && (
                <p className="text-xs text-slate-500 mt-1">📂 {state.currentCategory}</p>
              )}
            </>
          )}
        </div>

        {/* Round Message */}
        {state.roundMessage && !isGameOver && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`text-center p-3 rounded-xl mb-4 text-sm font-medium ${
              state.roundStatus === 'correct' ? 'bg-emerald-900/30 text-emerald-300 border border-emerald-500/30' :
              state.roundStatus === 'wrong' ? 'bg-red-900/30 text-red-300 border border-red-500/30' :
              state.roundStatus === 'time_up' ? 'bg-amber-900/30 text-amber-300 border border-amber-500/30' :
              'bg-slate-800/30 text-slate-300 border border-slate-700/30'
            }`}
          >
            {state.roundMessage}
          </motion.div>
        )}

        {/* Game Info */}
        <div className="flex items-center justify-between text-[10px] text-slate-500 px-2">
          <span>⏱ {state.timerLeft}ث</span>
          <span>↷ تخطي: {state.skipsLeft}</span>
          <span>🎯 الجولة {state.roundNumber}</span>
        </div>
      </div>
    </div>
  );
}
