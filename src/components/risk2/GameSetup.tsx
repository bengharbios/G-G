'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useRisk2Store } from '@/lib/risk2-store';
import { TARGET_SCORE_OPTIONS } from '@/lib/risk2-types';
import type { Risk2Player } from '@/lib/risk2-types';
import { Plus, Trash2, Play, ArrowRight } from 'lucide-react';

// ============================================================
// Game Setup — المجازفة 2
// ============================================================
export default function GameSetup() {
  const { startGame, gameMode, setPhase } = useRisk2Store();

  const [targetScore, setTargetScore] = useState(50);
  const [playerNames, setPlayerNames] = useState<string[]>(['', '']);
  const [error, setError] = useState('');

  const addPlayer = () => {
    if (playerNames.length >= 10) return;
    setPlayerNames([...playerNames, '']);
  };

  const removePlayer = (index: number) => {
    if (playerNames.length <= 2) return;
    setPlayerNames(playerNames.filter((_, i) => i !== index));
  };

  const updateName = (index: number, name: string) => {
    const newNames = [...playerNames];
    newNames[index] = name;
    setPlayerNames(newNames);
  };

  const handleStart = () => {
    setError('');

    // Validate
    const validNames = playerNames.map(n => n.trim()).filter(n => n.length > 0);
    if (validNames.length < 2) {
      setError('يجب إدخال اسمين على الأقل');
      return;
    }

    // Check for duplicates
    const uniqueNames = new Set(validNames);
    if (uniqueNames.size !== validNames.length) {
      setError('الأسماء يجب أن تكون مختلفة');
      return;
    }

    // Create players
    const players: Risk2Player[] = validNames.map((name, i) => ({
      id: `player_${i}`,
      name,
      score: 0,
      roundScore: 0,
      multiplier: 1,
      joinOrder: i,
    }));

    startGame({ targetScore }, players);
  };

  return (
    <div className="flex flex-col items-center px-4 py-8 min-h-[70vh]" dir="rtl">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-6"
      >
        <h2 className="text-xl font-bold text-slate-200 mb-1">⚙️ إعداد اللعبة</h2>
        <p className="text-xs text-slate-500">
          {gameMode === 'diwaniya' ? '📺 وضع الديوانية' : '🎮 وضع العراب'}
        </p>
      </motion.div>

      <div className="w-full max-w-md space-y-5">
        {/* Target Score */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-slate-800/40 border border-slate-700/30 rounded-2xl p-4"
        >
          <h3 className="text-sm font-bold text-slate-300 mb-3">🏆 الهدف</h3>
          <div className="grid grid-cols-4 gap-2">
            {TARGET_SCORE_OPTIONS.map(score => (
              <button
                key={score}
                onClick={() => setTargetScore(score)}
                className={`py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer ${
                  targetScore === score
                    ? 'bg-gradient-to-l from-orange-600 to-red-700 text-white shadow-lg shadow-orange-500/20'
                    : 'bg-slate-900/60 text-slate-400 hover:bg-slate-800/60 border border-slate-700/30'
                }`}
              >
                {score}
              </button>
            ))}
          </div>
          <p className="text-[10px] text-slate-500 mt-2 text-center">
            أول لاعب يصل إلى {targetScore} نقطة يفوز!
          </p>
        </motion.div>

        {/* Players */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-slate-800/40 border border-slate-700/30 rounded-2xl p-4"
        >
          <h3 className="text-sm font-bold text-slate-300 mb-3">👥 اللاعبون</h3>
          <div className="space-y-2">
            {playerNames.map((name, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-center gap-2"
              >
                <span className="text-xs text-slate-500 w-6 text-center shrink-0">
                  {index + 1}
                </span>
                <input
                  type="text"
                  placeholder={`اسم اللاعب ${index + 1}`}
                  value={name}
                  onChange={(e) => updateName(index, e.target.value)}
                  maxLength={20}
                  className="flex-1 px-3 py-2.5 rounded-xl bg-slate-900/60 border border-slate-700/50 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-orange-500/50"
                />
                {playerNames.length > 2 && (
                  <button
                    onClick={() => removePlayer(index)}
                    className="p-2 rounded-lg text-red-400 hover:bg-red-950/30 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </motion.div>
            ))}
          </div>

          {playerNames.length < 10 && (
            <button
              onClick={addPlayer}
              className="w-full mt-3 py-2 rounded-xl border border-dashed border-slate-700/50 text-slate-400 text-xs hover:border-orange-500/30 hover:text-orange-400 transition-colors cursor-pointer flex items-center justify-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              إضافة لاعب
            </button>
          )}
        </motion.div>

        {/* Error */}
        {error && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-xs text-red-400 text-center"
          >
            {error}
          </motion.p>
        )}

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex gap-3"
        >
          <button
            onClick={() => setPhase('landing')}
            className="flex-1 py-3 rounded-xl font-bold text-sm bg-slate-800/60 border border-slate-700/30 text-slate-300 hover:bg-slate-700/60 transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <ArrowRight className="w-4 h-4" />
            رجوع
          </button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleStart}
            className="flex-1 py-3 rounded-xl font-bold text-sm bg-gradient-to-l from-orange-600 to-red-700 hover:from-orange-500 hover:to-red-600 text-white transition-all cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-orange-500/20"
          >
            <Play className="w-4 h-4" />
            ابدأ اللعب
          </motion.button>
        </motion.div>
      </div>
    </div>
  );
}
