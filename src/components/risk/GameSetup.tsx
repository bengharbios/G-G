'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useRiskStore } from '@/lib/risk-store';
import { Plus, Minus, ChevronLeft } from 'lucide-react';
import { DEFAULT_TEAM_NAMES } from '@/lib/risk-types';
import type { RiskGameConfig } from '@/lib/risk-types';

const TEAM_COUNT_OPTIONS = [2, 3, 4];
const TOTAL_CARDS_OPTIONS = [
  { value: 40, label: '40' },
  { value: 50, label: '50' },
  { value: 60, label: '60' },
  { value: 70, label: '70' },
  { value: 80, label: '80' },
  { value: 100, label: '100' },
];

export default function GameSetup() {
  const { startGame } = useRiskStore();

  const [teamCount, setTeamCount] = useState(2);
  const [teamNames, setTeamNames] = useState<string[]>(DEFAULT_TEAM_NAMES);
  const [bombCount, setBombCount] = useState(3);
  const [skipCount, setSkipCount] = useState(2);
  const [totalCards, setTotalCards] = useState(40);

  const updateTeamName = (index: number, name: string) => {
    const updated = [...teamNames];
    updated[index] = name;
    setTeamNames(updated);
  };

  const handleStart = () => {
    const config: RiskGameConfig = {
      teamCount,
      bombCount,
      skipCount,
      totalCards,
      teamNames: teamNames.slice(0, teamCount),
    };
    startGame(config);
  };

  const safeCount = totalCards - bombCount - skipCount;
  const isValid = safeCount >= 1 && bombCount >= 1 && bombCount <= 10 && skipCount >= 0 && skipCount <= 5;
  const teamNamesValid = teamNames.slice(0, teamCount).every(n => n.trim().length > 0);

  const TEAM_COLORS = [
    { bg: 'bg-violet-950/40', border: 'border-violet-500/30', text: 'text-violet-300', dot: 'bg-violet-500' },
    { bg: 'bg-emerald-950/40', border: 'border-emerald-500/30', text: 'text-emerald-300', dot: 'bg-emerald-500' },
    { bg: 'bg-amber-950/40', border: 'border-amber-500/30', text: 'text-amber-300', dot: 'bg-amber-500' },
    { bg: 'bg-rose-950/40', border: 'border-rose-500/30', text: 'text-rose-300', dot: 'bg-rose-500' },
  ];

  return (
    <div className="flex flex-col items-center px-4 py-6 sm:py-8" dir="rtl">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-sm mx-auto"
      >
        {/* Title */}
        <motion.div
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring' }}
          className="text-center mb-6"
        >
          <div className="text-4xl mb-2">💣</div>
          <h2 className="text-xl sm:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-purple-400">
            تجهيز المجازفة
          </h2>
          <p className="text-xs text-slate-400 mt-1">أعدّ الفرق واختر إعدادات اللعبة!</p>
        </motion.div>

        {/* Team Count */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="mb-4 rounded-2xl border border-slate-700/40 bg-slate-900/60 p-4"
        >
          <p className="text-xs text-slate-400 font-bold mb-3 text-center">👥 عدد الفرق</p>
          <div className="flex gap-2">
            {TEAM_COUNT_OPTIONS.map((count) => (
              <button
                key={count}
                onClick={() => setTeamCount(count)}
                className={`flex-1 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer border-2 ${
                  teamCount === count
                    ? 'border-violet-500 bg-violet-950/60 text-violet-200 shadow-lg shadow-violet-950/30'
                    : 'border-slate-700/40 bg-slate-800/40 text-slate-400 hover:border-violet-500/40'
                }`}
              >
                <div className="text-sm sm:text-base">{count} فرق</div>
              </button>
            ))}
          </div>
        </motion.div>

        {/* Team Names */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-4 space-y-2"
        >
          {Array.from({ length: teamCount }).map((_, idx) => {
            const color = TEAM_COLORS[idx];
            return (
              <div key={idx} className={`rounded-xl border ${color.border} ${color.bg} p-3`}>
                <div className="flex items-center gap-2 mb-2">
                  <div className={`w-3 h-3 rounded-full ${color.dot}`} />
                  <span className={`text-xs font-bold ${color.text}`}>فريق {idx + 1}</span>
                </div>
                <input
                  type="text"
                  value={teamNames[idx]}
                  onChange={(e) => updateTeamName(idx, e.target.value)}
                  placeholder={DEFAULT_TEAM_NAMES[idx]}
                  className="w-full bg-slate-800/60 border border-slate-700/30 rounded-lg px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-violet-500/50 transition-colors"
                  maxLength={20}
                />
              </div>
            );
          })}
        </motion.div>

        {/* Card Settings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="mb-4 rounded-2xl border border-slate-700/40 bg-slate-900/60 p-4"
        >
          <p className="text-xs text-slate-400 font-bold mb-3 text-center">🃏 إعدادات البطاقات</p>

          {/* Total Cards */}
          <div className="mb-3">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs text-slate-300">إجمالي البطاقات</span>
              <span className="text-xs font-bold text-violet-300">{totalCards}</span>
            </div>
            <div className="flex gap-1.5 flex-wrap">
              {TOTAL_CARDS_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setTotalCards(opt.value)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer border ${
                    totalCards === opt.value
                      ? 'border-violet-500 bg-violet-950/60 text-violet-200'
                      : 'border-slate-700/40 bg-slate-800/40 text-slate-400 hover:border-violet-500/40'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Bombs */}
          <div className="mb-3">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs text-slate-300">💣 القنابل</span>
              <span className="text-xs font-bold text-red-400">{bombCount}</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setBombCount(Math.max(1, bombCount - 1))}
                className="w-9 h-9 rounded-lg bg-slate-800/60 border border-slate-700/30 flex items-center justify-center text-slate-300 hover:bg-red-950/30 hover:border-red-500/30 transition-colors shrink-0 cursor-pointer"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <div className="flex-1 h-2 rounded-full bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-l from-red-500 to-red-700 rounded-full transition-all duration-300"
                  style={{ width: `${(bombCount / 10) * 100}%` }}
                />
              </div>
              <button
                onClick={() => setBombCount(Math.min(10, bombCount + 1))}
                className="w-9 h-9 rounded-lg bg-slate-800/60 border border-slate-700/30 flex items-center justify-center text-slate-300 hover:bg-red-950/30 hover:border-red-500/30 transition-colors shrink-0 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Skips */}
          <div className="mb-3">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs text-slate-300">⏭️ التخطي</span>
              <span className="text-xs font-bold text-slate-400">{skipCount}</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSkipCount(Math.max(0, skipCount - 1))}
                className="w-9 h-9 rounded-lg bg-slate-800/60 border border-slate-700/30 flex items-center justify-center text-slate-300 hover:bg-slate-700/60 transition-colors shrink-0 cursor-pointer"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <div className="flex-1 h-2 rounded-full bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-l from-slate-500 to-slate-600 rounded-full transition-all duration-300"
                  style={{ width: `${(skipCount / 5) * 100}%` }}
                />
              </div>
              <button
                onClick={() => setSkipCount(Math.min(5, skipCount + 1))}
                className="w-9 h-9 rounded-lg bg-slate-800/60 border border-slate-700/30 flex items-center justify-center text-slate-300 hover:bg-slate-700/60 transition-colors shrink-0 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Safe cards summary */}
          <div className={`text-center py-2 rounded-lg border ${
            safeCount >= 1
              ? 'bg-emerald-950/20 border-emerald-500/20 text-emerald-400'
              : 'bg-red-950/20 border-red-500/20 text-red-400'
          }`}>
            <span className="text-xs font-bold">
              ✅ بطاقات آمنة: {safeCount}
              {safeCount < 1 && ' (يجب أن يكون هناك بطاقة واحدة على الأقل!)'}
            </span>
          </div>
        </motion.div>

        {/* Start Button */}
        <motion.button
          whileHover={{ scale: isValid && teamNamesValid ? 1.02 : 1 }}
          whileTap={{ scale: isValid && teamNamesValid ? 0.98 : 1 }}
          onClick={handleStart}
          disabled={!isValid || !teamNamesValid}
          className={`w-full rounded-2xl py-4 font-bold text-base sm:text-lg transition-all duration-300 flex items-center justify-center gap-2 ${
            isValid && teamNamesValid
              ? 'bg-gradient-to-l from-violet-600 via-purple-600 to-violet-700 hover:from-violet-500 hover:via-purple-500 hover:to-violet-600 text-white shadow-lg shadow-violet-950/50'
              : 'bg-slate-800 text-slate-500 cursor-not-allowed'
          }`}
        >
          <span>💣</span>
          <span>ابدأ المجازفة 🃏</span>
          <ChevronLeft className="w-5 h-5" />
        </motion.button>

        {!isValid && (
          <p className="text-center text-[10px] text-red-400/70 mt-2">
            تحقق من إعدادات البطاقات (الآمنة يجب أن تكون ≥ 1)
          </p>
        )}
      </motion.div>
    </div>
  );
}
