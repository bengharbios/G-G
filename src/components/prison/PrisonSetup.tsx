'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { usePrisonStore } from '@/lib/prison-store';
import {
  GRID_CONFIGS,
  ROLE_CONFIG,
  TEAM_CONFIG,
  PrisonTeam,
  PlayerRole,
} from '@/lib/prison-types';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Play,
  Plus,
  Minus,
  Home,
  Copy,
  Check,
  Loader2,
  Users,
  Grid3x3,
  Info,
  ShieldAlert,
  Crown,
  Star,
} from 'lucide-react';

// ── Types ───────────────────────────────────────────────────────

interface PlayerEntry {
  name: string;
  role: PlayerRole;
}

interface PrisonSetupProps {
  onBack: () => void;
  mode: 'local' | 'diwaniya';
}

interface RoomData {
  code: string;
  hostName: string;
  gridSize: number;
  phase: string;
  spectators: Array<{ id: string; name: string; joinedAt: number; lastSeen: number }>;
}

// ── Constants ───────────────────────────────────────────────────

const GRID_SIZES = [9, 16, 20] as const;
const GRID_LABELS: Record<number, string> = {
  9: '9 (3×3)',
  16: '16 (4×4)',
  20: '20 (5×4)',
};
const MIN_PLAYERS_PER_TEAM = 2;
const MIN_TOTAL_PLAYERS = 4;

// ── Component ───────────────────────────────────────────────────

export default function PrisonSetup({ onBack, mode }: PrisonSetupProps) {
  const store = usePrisonStore();

  // ── Local Setup State ─────────────────────────────────────────
  const [gridSize, setGridSize] = useState(9);
  const [alphaName, setAlphaName] = useState(TEAM_CONFIG.alpha.defaultName + ' 🔒');
  const [betaName, setBetaName] = useState(TEAM_CONFIG.beta.defaultName + ' 👮');
  const [firstTeam, setFirstTeam] = useState<PrisonTeam>('alpha');
  const [alphaPlayers, setAlphaPlayers] = useState<PlayerEntry[]>([
    { name: 'سجين ١', role: 'leader' },
    { name: 'سجين ٢', role: 'member' },
  ]);
  const [betaPlayers, setBetaPlayers] = useState<PlayerEntry[]>([
    { name: 'حارس ١', role: 'leader' },
    { name: 'حارس ٢', role: 'member' },
  ]);
  const [error, setError] = useState('');
  const [showRules, setShowRules] = useState(false);

  // ── Diwaniya State ────────────────────────────────────────────
  // Restore from persisted room code — use lazy init to avoid set-state-in-effect
  const [step, setStep] = useState<'form' | 'waiting'>(() => {
    if (mode === 'diwaniya' && store.roomCode) return 'waiting';
    return 'form';
  });
  const [hostName, setHostName] = useState('');
  const [loading, setLoading] = useState(false);
  const [createdCode, setCreatedCode] = useState<string | null>(() => {
    if (mode === 'diwaniya' && store.roomCode) return store.roomCode;
    return null;
  });
  const [copied, setCopied] = useState(false);
  const [room, setRoom] = useState<RoomData | null>(null);
  const [diwaniyaGridSize, setDiwaniyaGridSize] = useState(9);

  // Poll room state when waiting
  const pollRoom = useCallback(async () => {
    if (!createdCode) return;
    try {
      const res = await fetch(`/api/prison-room/${createdCode}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.room) {
          setRoom(data.room);
        }
      } else if (res.status === 404) {
        setError('الغرفة لم تعد موجودة');
        setCreatedCode(null);
        setStep('form');
        store.setRoomCode(null);
      }
    } catch {
      // silent poll
    }
  }, [createdCode, store]);

  useEffect(() => {
    if (mode !== 'diwaniya' || step !== 'waiting') return;
    const run = async () => { try { await pollRoom(); } catch { /* silent */ } };
    run();
    const interval = setInterval(run, 2000);
    return () => clearInterval(interval);
  }, [mode, step, pollRoom]);

  // ── Player Management Helpers ─────────────────────────────────

  const addPlayer = (team: 'alpha' | 'beta') => {
    const players = team === 'alpha' ? alphaPlayers : betaPlayers;
    const setFn = team === 'alpha' ? setAlphaPlayers : setBetaPlayers;
    const prefix = team === 'alpha' ? 'سجين' : 'حارس';
    setFn([...players, { name: `${prefix} ${players.length + 1}`, role: 'member' }]);
    setError('');
  };

  const removePlayer = (team: 'alpha' | 'beta', index: number) => {
    const players = team === 'alpha' ? alphaPlayers : betaPlayers;
    const setFn = team === 'alpha' ? setAlphaPlayers : setBetaPlayers;
    if (players.length <= MIN_PLAYERS_PER_TEAM) return;
    setFn(players.filter((_, i) => i !== index));
    setError('');
  };

  const updatePlayerName = (team: 'alpha' | 'beta', index: number, name: string) => {
    const players = team === 'alpha' ? alphaPlayers : betaPlayers;
    const setFn = team === 'alpha' ? setAlphaPlayers : setBetaPlayers;
    const updated = [...players];
    updated[index] = { ...updated[index], name };
    setFn(updated);
    setError('');
  };

  const updatePlayerRole = (team: 'alpha' | 'beta', index: number, role: PlayerRole) => {
    const players = team === 'alpha' ? alphaPlayers : betaPlayers;
    const setFn = team === 'alpha' ? setAlphaPlayers : setBetaPlayers;
    const updated = [...players];
    updated[index] = { ...updated[index], role };
    setFn(updated);
    setError('');
  };

  // ── Start Local Game ──────────────────────────────────────────

  const handleStartLocal = () => {
    const trimmedAlpha = alphaPlayers.map(p => ({ ...p, name: p.name.trim() }));
    const trimmedBeta = betaPlayers.map(p => ({ ...p, name: p.name.trim() }));
    const allNames = [...trimmedAlpha, ...trimmedBeta].map(p => p.name);

    if (allNames.some(n => n.length === 0)) {
      setError('يجب إدخال أسماء جميع اللاعبين');
      return;
    }
    if (trimmedAlpha.length < MIN_PLAYERS_PER_TEAM || trimmedBeta.length < MIN_PLAYERS_PER_TEAM) {
      setError('كل فريق يحتاج لاعبين على الأقل');
      return;
    }
    if (trimmedAlpha.length + trimmedBeta.length < MIN_TOTAL_PLAYERS) {
      setError('يجب أن يكون ٤ لاعبين على الأقل');
      return;
    }
    const uniqueNames = new Set(allNames);
    if (uniqueNames.size !== allNames.length) {
      setError('يجب أن تكون الأسماء مختلفة');
      return;
    }
    // Check at least one leader per team
    if (!trimmedAlpha.some(p => p.role === 'leader')) {
      setError('فريق السجناء يحتاج قائد');
      return;
    }
    if (!trimmedBeta.some(p => p.role === 'leader')) {
      setError('فريق الحراس يحتاج قائد');
      return;
    }

    store.setGameMode('local');
    store.setupGame(gridSize, alphaName, betaName, trimmedAlpha, trimmedBeta, firstTeam);
  };

  // ── Diwaniya: Create Room ─────────────────────────────────────

  const handleCreateRoom = async () => {
    if (!hostName.trim()) {
      setError('يجب إدخال اسمك');
      return;
    }
    if (hostName.trim().length < 2) {
      setError('الاسم قصير جداً');
      return;
    }
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/prison-room', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hostName: hostName.trim(),
          gridSize: diwaniyaGridSize,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'حدث خطأ');
        setLoading(false);
        return;
      }

      setCreatedCode(data.code);
      store.setRoomCode(data.code);
      store.setGameMode('diwaniya');
      setStep('waiting');
    } catch {
      setError('تعذر الاتصال بالخادم');
      setLoading(false);
    }
  };

  // ── Diwaniya: Copy ────────────────────────────────────────────

  const handleCopy = () => {
    if (createdCode) {
      navigator.clipboard.writeText(createdCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // ── Diwaniya: Leave ───────────────────────────────────────────

  const handleLeaveRoom = async () => {
    if (createdCode) {
      try {
        await fetch(`/api/prison-room/${createdCode}`, { method: 'DELETE' });
      } catch {
        // silent
      }
    }
    store.setRoomCode(null);
    store.setGameMode(null);
    setCreatedCode(null);
    setStep('form');
    onBack();
  };

  // ── Grid config info ──────────────────────────────────────────

  const gridConfig = GRID_CONFIGS[gridSize];
  const diwaniyaGridConfig = GRID_CONFIGS[diwaniyaGridSize];
  const currentAlphaConfig = mode === 'diwaniya' ? diwaniyaGridConfig : gridConfig;
  const totalPlayers = alphaPlayers.length + betaPlayers.length;

  // ══════════════════════════════════════════════════════════════
  // LOCAL MODE SETUP
  // ══════════════════════════════════════════════════════════════
  if (mode === 'local') {
    return (
      <div className="min-h-screen flex flex-col items-center p-3 sm:p-4" dir="rtl">
        {/* Background decoration */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-amber-900/8 rounded-full blur-[120px] pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-orange-900/6 rounded-full blur-[100px] pointer-events-none" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative z-10 w-full max-w-sm sm:max-w-md mx-auto py-4"
        >
          {/* Back button */}
          <Button
            onClick={onBack}
            variant="ghost"
            className="text-slate-500 hover:text-slate-300 mb-3 gap-1 text-xs"
          >
            <ArrowLeft className="w-4 h-4" />
            رجوع
          </Button>

          {/* Title */}
          <div className="text-center mb-4 sm:mb-6">
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring' }}
              className="text-4xl sm:text-5xl mb-2"
            >
              ⚙️
            </motion.div>
            <h1 className="text-xl sm:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-400 mb-1">
              تجهيز السجن
            </h1>
            <p className="text-[10px] sm:text-xs text-slate-400">
              أعدّ الفرق واللاعبين وابدأ اللعبة!
            </p>
          </div>

          {/* Grid Size Selector */}
          <Card className="bg-slate-900/80 border-amber-700/30 mb-3">
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 mb-3">
                <Grid3x3 className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-bold text-amber-300">عدد الزنزانات</h3>
              </div>
              <div className="flex gap-2">
                {GRID_SIZES.map((size) => {
                  const config = GRID_CONFIGS[size];
                  const isActive = gridSize === size;
                  return (
                    <motion.button
                      key={size}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setGridSize(size)}
                      className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all border-2 cursor-pointer ${
                        isActive
                          ? 'border-amber-500 bg-amber-950/60 text-amber-200 shadow-lg shadow-amber-950/30'
                          : 'border-slate-700/40 bg-slate-800/40 text-slate-400 hover:border-amber-500/40'
                      }`}
                    >
                      <div className="text-sm sm:text-base">{GRID_LABELS[size]}</div>
                      <div className="text-[9px] mt-0.5 opacity-70">
                        {config.cols} أعمدة
                      </div>
                    </motion.button>
                  );
                })}
              </div>

              {/* Cell types preview */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={gridSize}
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 5 }}
                  transition={{ duration: 0.3 }}
                  className="mt-3 flex flex-wrap gap-1.5"
                >
                  {Object.entries(currentAlphaConfig.types).map(([type, count]) => {
                    const labels: Record<string, { emoji: string; label: string }> = {
                      open: { emoji: '🔓', label: 'فارغة' },
                      uniform: { emoji: '🚫', label: 'تحويل' },
                      skull: { emoji: '💀', label: 'إعدام' },
                      key: { emoji: '🔑', label: 'مفتاح' },
                      skip: { emoji: '✋', label: 'تخطي' },
                    };
                    const info = labels[type] || { emoji: '❓', label: type };
                    return (
                      <span
                        key={type}
                        className="inline-flex items-center gap-1 text-[10px] text-slate-400 bg-slate-800/50 rounded-full px-2 py-0.5"
                      >
                        {info.emoji} {info.label} ×{count}
                      </span>
                    );
                  })}
                </motion.div>
              </AnimatePresence>
            </CardContent>
          </Card>

          {/* Team Alpha Setup */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-3 rounded-2xl border-2 border-amber-500/30 bg-gradient-to-l from-amber-950/40 to-slate-900/80 p-4"
          >
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-amber-900/50 border border-amber-500/30 flex items-center justify-center">
                <span className="text-sm">🔒</span>
              </div>
              <input
                type="text"
                value={alphaName}
                onChange={(e) => setAlphaName(e.target.value)}
                className="flex-1 bg-transparent border-none text-amber-200 font-bold text-sm focus:outline-none"
                dir="rtl"
                maxLength={30}
              />
              <Badge className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2">
                {alphaPlayers.length} لاعب
              </Badge>
            </div>

            <div className="space-y-2 max-h-48 overflow-y-auto pl-1">
              {alphaPlayers.map((player, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="flex items-center gap-2"
                >
                  <span className="w-7 h-7 rounded-full bg-amber-900/50 border border-amber-500/20 flex items-center justify-center text-[10px] font-bold text-amber-300 shrink-0">
                    {ROLE_CONFIG[player.role].emoji}
                  </span>
                  <input
                    type="text"
                    value={player.name}
                    onChange={(e) => updatePlayerName('alpha', i, e.target.value)}
                    placeholder="اسم اللاعب..."
                    className="flex-1 bg-slate-800/50 border border-amber-500/20 rounded-lg px-2.5 py-2 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-amber-500/50 transition-colors"
                    dir="rtl"
                    maxLength={20}
                  />
                  <select
                    value={player.role}
                    onChange={(e) => updatePlayerRole('alpha', i, e.target.value as PlayerRole)}
                    className="bg-slate-800/50 border border-amber-500/20 rounded-lg px-1.5 py-2 text-[10px] text-amber-300 focus:outline-none focus:border-amber-500/50 cursor-pointer"
                    dir="rtl"
                  >
                    <option value="leader">👑 قائد</option>
                    <option value="deputy">⭐ نائب</option>
                    <option value="member">🛡️ عضو</option>
                    <option value="guest">👁️ ضيف</option>
                  </select>
                  {alphaPlayers.length > MIN_PLAYERS_PER_TEAM && (
                    <button
                      onClick={() => removePlayer('alpha', i)}
                      className="w-7 h-7 rounded-lg bg-red-900/30 border border-red-500/20 flex items-center justify-center hover:bg-red-900/50 transition-colors cursor-pointer shrink-0"
                    >
                      <Minus className="w-3.5 h-3.5 text-red-400" />
                    </button>
                  )}
                </motion.div>
              ))}
            </div>

            <button
              onClick={() => addPlayer('alpha')}
              className="mt-2 w-full py-2 rounded-lg border border-dashed border-amber-500/30 text-amber-400/70 text-xs hover:bg-amber-950/30 hover:border-amber-500/50 transition-all cursor-pointer flex items-center justify-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              إضافة لاعب
            </button>
          </motion.div>

          {/* VS Divider */}
          <div className="flex items-center justify-center my-2">
            <div className="h-px flex-1 bg-gradient-to-l from-slate-700 to-transparent" />
            <div className="px-3 text-slate-500 text-xs font-bold">VS</div>
            <div className="h-px flex-1 bg-gradient-to-r from-slate-700 to-transparent" />
          </div>

          {/* Team Beta Setup */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="mb-4 rounded-2xl border-2 border-cyan-500/30 bg-gradient-to-l from-cyan-950/40 to-slate-900/80 p-4"
          >
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-cyan-900/50 border border-cyan-500/30 flex items-center justify-center">
                <span className="text-sm">👮</span>
              </div>
              <input
                type="text"
                value={betaName}
                onChange={(e) => setBetaName(e.target.value)}
                className="flex-1 bg-transparent border-none text-cyan-200 font-bold text-sm focus:outline-none"
                dir="rtl"
                maxLength={30}
              />
              <Badge className="text-[10px] bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 px-2">
                {betaPlayers.length} لاعب
              </Badge>
            </div>

            <div className="space-y-2 max-h-48 overflow-y-auto pl-1">
              {betaPlayers.map((player, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: (alphaPlayers.length + i) * 0.03 }}
                  className="flex items-center gap-2"
                >
                  <span className="w-7 h-7 rounded-full bg-cyan-900/50 border border-cyan-500/20 flex items-center justify-center text-[10px] font-bold text-cyan-300 shrink-0">
                    {ROLE_CONFIG[player.role].emoji}
                  </span>
                  <input
                    type="text"
                    value={player.name}
                    onChange={(e) => updatePlayerName('beta', i, e.target.value)}
                    placeholder="اسم اللاعب..."
                    className="flex-1 bg-slate-800/50 border border-cyan-500/20 rounded-lg px-2.5 py-2 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500/50 transition-colors"
                    dir="rtl"
                    maxLength={20}
                  />
                  <select
                    value={player.role}
                    onChange={(e) => updatePlayerRole('beta', i, e.target.value as PlayerRole)}
                    className="bg-slate-800/50 border border-cyan-500/20 rounded-lg px-1.5 py-2 text-[10px] text-cyan-300 focus:outline-none focus:border-cyan-500/50 cursor-pointer"
                    dir="rtl"
                  >
                    <option value="leader">👑 قائد</option>
                    <option value="deputy">⭐ نائب</option>
                    <option value="member">🛡️ عضو</option>
                    <option value="guest">👁️ ضيف</option>
                  </select>
                  {betaPlayers.length > MIN_PLAYERS_PER_TEAM && (
                    <button
                      onClick={() => removePlayer('beta', i)}
                      className="w-7 h-7 rounded-lg bg-red-900/30 border border-red-500/20 flex items-center justify-center hover:bg-red-900/50 transition-colors cursor-pointer shrink-0"
                    >
                      <Minus className="w-3.5 h-3.5 text-red-400" />
                    </button>
                  )}
                </motion.div>
              ))}
            </div>

            <button
              onClick={() => addPlayer('beta')}
              className="mt-2 w-full py-2 rounded-lg border border-dashed border-cyan-500/30 text-cyan-400/70 text-xs hover:bg-cyan-950/30 hover:border-cyan-500/50 transition-all cursor-pointer flex items-center justify-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              إضافة لاعب
            </button>
          </motion.div>

          {/* First Team Selector */}
          <Card className="bg-slate-900/60 border-slate-700/40 mb-3">
            <CardContent className="pt-4">
              <p className="text-xs text-slate-400 font-bold mb-3 text-center">🎯 من يبدأ أولاً؟</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setFirstTeam('alpha')}
                  className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all cursor-pointer border-2 ${
                    firstTeam === 'alpha'
                      ? 'border-amber-500 bg-amber-950/60 text-amber-200 shadow-lg shadow-amber-950/30'
                      : 'border-slate-700/40 bg-slate-800/40 text-slate-400 hover:border-amber-500/40'
                  }`}
                >
                  🔒 {alphaName.split(' ')[0] || 'الأول'}
                </button>
                <button
                  onClick={() => setFirstTeam('beta')}
                  className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all cursor-pointer border-2 ${
                    firstTeam === 'beta'
                      ? 'border-cyan-500 bg-cyan-950/60 text-cyan-200 shadow-lg shadow-cyan-950/30'
                      : 'border-slate-700/40 bg-slate-800/40 text-slate-400 hover:border-cyan-500/40'
                  }`}
                >
                  👮 {betaName.split(' ')[0] || 'الثاني'}
                </button>
              </div>
            </CardContent>
          </Card>

          {/* Error */}
          {error && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-red-400 text-xs text-center mb-3"
            >
              <ShieldAlert className="w-3.5 h-3.5 inline ml-1" />
              {error}
            </motion.p>
          )}

          {/* Stats summary */}
          <div className="flex items-center justify-center gap-4 mb-3 text-[10px] text-slate-500">
            <span>{totalPlayers} لاعب</span>
            <span>•</span>
            <span>{gridSize} زنزانة</span>
          </div>

          {/* Start Button */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleStartLocal}
            className="w-full rounded-2xl py-4 font-bold text-base sm:text-lg bg-gradient-to-l from-amber-600 via-orange-600 to-amber-700 hover:from-amber-500 hover:via-orange-500 hover:to-amber-600 text-white shadow-lg shadow-amber-950/50 transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer"
          >
            <Play className="w-5 h-5" />
            <span>ابدأ السجن 🔒</span>
          </motion.button>

          {/* Rules */}
          <div className="flex justify-center mt-4">
            <Button
              variant="ghost"
              onClick={() => setShowRules(!showRules)}
              className="text-amber-400/60 hover:text-amber-300 hover:bg-amber-400/10 gap-2 text-xs"
            >
              <Info className="w-3.5 h-3.5" />
              {showRules ? 'إخفاء القوانين' : '📜 القوانين'}
            </Button>
          </div>

          <AnimatePresence>
            {showRules && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden mt-2"
              >
                <Card className="bg-slate-900/80 border-amber-700/30">
                  <CardContent className="pt-3 text-[10px] sm:text-xs text-slate-400 space-y-1.5">
                    <p>🔓 <strong className="text-slate-200">زنزانة فارغة:</strong> سجن لاعب خصم</p>
                    <p>🚫 <strong className="text-slate-200">ملابس السجن:</strong> تحويل لاعب خصم</p>
                    <p>💀 <strong className="text-slate-200">إعدام:</strong> قتل لاعب خصم نهائياً</p>
                    <p>🔑 <strong className="text-slate-200">مفتاح:</strong> تحرير زميل محبوس</p>
                    <p>✋ <strong className="text-slate-200">زنزانة ممتلئة:</strong> تخطي</p>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════
  // DIWANIYA MODE SETUP
  // ══════════════════════════════════════════════════════════════

  // ── FORM STEP ─────────────────────────────────────────────────
  if (step === 'form') {
    return (
      <div className="min-h-screen flex flex-col items-center p-3 sm:p-4" dir="rtl">
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-cyan-900/8 rounded-full blur-[120px] pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-amber-900/6 rounded-full blur-[100px] pointer-events-none" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative z-10 w-full max-w-sm sm:max-w-md mx-auto"
        >
          {/* Back button */}
          <Button
            onClick={onBack}
            variant="ghost"
            className="text-slate-500 hover:text-slate-300 mb-3 gap-1 text-xs"
          >
            <ArrowLeft className="w-4 h-4" />
            رجوع
          </Button>

          {/* Title */}
          <div className="text-center mb-4 sm:mb-6">
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring' }}
              className="text-5xl sm:text-6xl mb-2"
            >
              🏠
            </motion.div>
            <h1 className="text-2xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-amber-300 to-cyan-400 mb-1">
              الديوانية — السجن
            </h1>
            <p className="text-[10px] sm:text-xs text-slate-400">
              أنشئ غرفة وادعُ أصدقاءك للمشاهدة 🔒
            </p>
          </div>

          {/* Setup Form */}
          <Card className="bg-slate-900/80 border-cyan-500/30">
            <CardContent className="pt-4">
              <div className="space-y-4">
                {/* Host Name */}
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">اسمك (العراب)</label>
                  <Input
                    value={hostName}
                    onChange={(e) => { setHostName(e.target.value); setError(''); }}
                    placeholder="اسمك..."
                    className="bg-slate-800/50 border-cyan-500/30 text-slate-200 placeholder:text-slate-500 text-right h-12"
                    dir="rtl"
                    maxLength={20}
                  />
                </div>

                {/* Grid Size Selector */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Grid3x3 className="w-4 h-4 text-cyan-400" />
                    <label className="text-xs text-slate-400">عدد الزنزانات</label>
                  </div>
                  <div className="flex gap-2">
                    {GRID_SIZES.map((size) => {
                      const isActive = diwaniyaGridSize === size;
                      return (
                        <motion.button
                          key={size}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setDiwaniyaGridSize(size)}
                          className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all border-2 cursor-pointer ${
                            isActive
                              ? 'border-cyan-500 bg-cyan-950/60 text-cyan-200 shadow-lg shadow-cyan-950/30'
                              : 'border-slate-700/40 bg-slate-800/40 text-slate-400 hover:border-cyan-500/40'
                          }`}
                        >
                          <div className="text-sm sm:text-base">{GRID_LABELS[size]}</div>
                          <div className="text-[9px] mt-0.5 opacity-70">
                            {GRID_CONFIGS[size].cols} أعمدة
                          </div>
                        </motion.button>
                      );
                    })}
                  </div>
                </div>

                {/* Info */}
                <div className="bg-slate-800/50 rounded-xl p-3">
                  <p className="text-[10px] sm:text-xs text-slate-400 leading-relaxed">
                    🏠 <strong className="text-slate-200">الديوانية:</strong> أنت العراب تنشئ غرفة وتشارك الكود.
                    المشاهدون يشاهدون اللعبة من أجهزتهم في الوقت الحقيقي.
                  </p>
                  <p className="text-[10px] sm:text-xs text-slate-400 mt-1">
                    🎮 تتحكم باللعبة كاملة من جهازك
                  </p>
                </div>

                {error && (
                  <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-red-400 text-xs text-center">
                    ⚠️ {error}
                  </motion.p>
                )}

                {/* Create Room Button */}
                <Button
                  onClick={handleCreateRoom}
                  disabled={loading}
                  className="w-full bg-gradient-to-l from-cyan-600 to-amber-800 hover:from-cyan-500 hover:to-amber-700 text-white font-bold text-base sm:text-lg py-5"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin ml-2" />
                  ) : (
                    <Home className="w-5 h-5 ml-2" />
                  )}
                  إنشاء الغرفة 🔒
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  // ── WAITING STEP ──────────────────────────────────────────────
  return (
    <div className="min-h-screen flex flex-col items-center p-3 sm:p-4" dir="rtl">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-cyan-900/8 rounded-full blur-[120px] pointer-events-none" />
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="relative z-10 w-full max-w-sm sm:max-w-md mx-auto py-4 flex flex-col min-h-screen"
      >
        {/* Top Bar */}
        <div className="flex items-center justify-between mb-4">
          <Button
            onClick={handleLeaveRoom}
            variant="ghost"
            className="text-slate-500 hover:text-red-400 gap-1 text-xs"
          >
            <ArrowLeft className="w-4 h-4" />
            الرئيسية
          </Button>
          <Badge className="text-[10px] bg-cyan-950/50 text-cyan-300 border border-cyan-500/30 px-2.5">
            🏠 الديوانية
          </Badge>
        </div>

        {/* Header */}
        <div className="text-center mb-4">
          <h1 className="text-xl sm:text-2xl font-black text-cyan-300 mb-1">🏠 السجن — الديوانية</h1>
          <p className="text-xs text-slate-400">في انتظار المشاهدين...</p>
        </div>

        {/* Room Code Card */}
        <Card className="bg-gradient-to-bl from-cyan-950/50 via-slate-900/80 to-slate-900/80 border-cyan-500/30 mb-4">
          <CardContent className="pt-5 text-center">
            <p className="text-xs text-cyan-300 mb-2">كود الغرفة - شاركه مع المشاهدين:</p>
            <div className="bg-slate-800/80 rounded-xl p-4 mb-3 inline-block min-w-[200px]">
              <p className="text-3xl sm:text-4xl font-mono font-black text-white tracking-[0.3em]">
                {createdCode}
              </p>
            </div>
            <div className="flex justify-center gap-2">
              <Button
                onClick={handleCopy}
                variant="outline"
                size="sm"
                className="text-xs border-slate-600 text-slate-300 hover:bg-slate-700"
              >
                {copied ? (
                  <><Check className="w-3.5 h-3.5 ml-1" /> تم!</>
                ) : (
                  <><Copy className="w-3.5 h-3.5 ml-1" /> نسخ الكود</>
                )}
              </Button>
            </div>
            <p className="text-[10px] text-slate-500 mt-2">
              {diwaniyaGridSize} زنزانة • {GRID_CONFIGS[diwaniyaGridSize].cols} أعمدة
            </p>
          </CardContent>
        </Card>

        {/* Spectators List */}
        <Card className="bg-slate-900/80 border-slate-700/50 mb-4">
          <CardContent className="pt-3 pb-3">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-slate-300 font-bold text-xs sm:text-sm flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5" />
                المشاهدون
              </h3>
              <Badge className="text-[10px] bg-cyan-900/50 text-cyan-300 border border-cyan-500/30 px-2">
                {room?.spectators?.length || 0}
              </Badge>
            </div>

            {room?.spectators && room.spectators.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {room.spectators.map((spec, i) => (
                  <motion.div
                    key={spec.id}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.05 }}
                    className="bg-cyan-950/30 border border-cyan-500/20 rounded-lg p-2 flex items-center gap-2"
                  >
                    <div className="w-7 h-7 rounded-full bg-cyan-900/50 border border-cyan-500/30 flex items-center justify-center text-[10px] font-bold text-cyan-300">
                      👁️
                    </div>
                    <span className="text-xs text-slate-300 truncate">{spec.name}</span>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-xs text-slate-500">
                  لم ينضم أحد بعد... شارك الكود!
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {error && (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-red-400 text-xs text-center mb-3">
            ⚠️ {error}
          </motion.p>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Ready to start message */}
        <Card className="bg-amber-950/30 border-amber-500/30 mb-4">
          <CardContent className="pt-3 pb-3 text-center">
            <p className="text-xs text-amber-300 mb-3">
              🎮 ابدأ اللعبة عندما تكون مستعداً
            </p>
            <Button
              onClick={() => {
                store.setPhase('setup');
              }}
              className="w-full bg-gradient-to-l from-amber-600 to-orange-800 hover:from-amber-500 hover:to-orange-700 text-white font-bold text-sm sm:text-base py-4"
            >
              <Crown className="w-4 h-4 ml-2" />
              المتابعة لتجهيز اللعبة ⚙️
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
