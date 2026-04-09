'use client';

import { useSyncExternalStore, useCallback, useState, useEffect, useRef } from 'react';
import { usePrisonStore } from '@/lib/prison-store';
import LandingPage from '@/components/prison/LandingPage';
import PrisonSetup from '@/components/prison/PrisonSetup';
import PrisonGameBoard from '@/components/prison/PrisonGameBoard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Home as HomeIcon, RotateCcw, Copy, Wifi } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';

function useHydrated() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
}

// ============================================================
// BrandedHeader for Prison
// ============================================================

function BrandedHeader() {
  return (
    <div className="w-full border-b border-emerald-800/30 bg-emerald-950/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto flex items-center justify-between h-14 px-4">
        <a href="/" className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-amber-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <img
              src="/platform-logo.png"
              alt="ألعاب الغريب"
              className="w-7 h-7 rounded-lg object-contain"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                target.parentElement!.innerHTML = '<span class=\'text-white text-sm font-black\'>غ</span>';
              }}
            />
          </div>
          <h1 className="text-base sm:text-lg font-black bg-gradient-to-l from-emerald-400 via-amber-300 to-emerald-400 bg-clip-text text-transparent">
            ألعاب الغريب
          </h1>
        </a>

        <div className="flex items-center gap-4">
          <span className="text-xs sm:text-sm font-bold text-slate-400">
            🔒 لعبة السجن
          </span>
          <a
            href="/"
            className="text-xs text-slate-400 hover:text-white transition-colors"
          >
            الرئيسية
          </a>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// BrandedFooter for Prison
// ============================================================

function BrandedFooter() {
  return (
    <div className="w-full border-t border-emerald-800/30 bg-emerald-950/80">
      <div className="max-w-7xl mx-auto flex flex-col items-center gap-2 py-3 px-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-500 to-amber-600 flex items-center justify-center">
            <img
              src="/platform-logo.png"
              alt="ألعاب الغريب"
              className="w-5 h-5 rounded-md object-contain"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                target.parentElement!.innerHTML = '<span class=\'text-white text-xs font-black\'>غ</span>';
              }}
            />
          </div>
          <span className="text-sm font-bold bg-gradient-to-l from-emerald-400 via-amber-300 to-emerald-400 bg-clip-text text-transparent">
            ألعاب الغريب
          </span>
        </div>
        <div className="flex flex-col items-center gap-1">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span>💻 برمجة</span>
            <span className="font-bold bg-gradient-to-l from-yellow-400 to-amber-500 bg-clip-text text-transparent">
              الغريب
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span>🏠 برعاية</span>
            <span className="font-bold bg-gradient-to-l from-emerald-400 to-amber-400 bg-clip-text text-transparent">
              ANA VIP 100034
            </span>
          </div>
        </div>
        <p className="text-[10px] text-slate-600 mt-1">
          © {new Date().getFullYear()} ألعاب الغريب — جميع الحقوق محفوظة
        </p>
      </div>
    </div>
  );
}

// ============================================================
// Persistent top navigation bar during gameplay
// ============================================================

function GameTopBar() {
  const { phase, resetGame, currentTeam, teamAlphaName, teamBetaName, currentRound, roomCode, gameMode } = usePrisonStore();
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showExitDialog, setShowExitDialog] = useState(false);
  const { toast } = useToast();

  const isGameOver = phase === 'game_over';

  const handleExit = () => {
    resetGame();
    setShowExitDialog(false);
  };

  const handleReset = () => {
    resetGame();
    setShowResetConfirm(false);
  };

  const handleCopyCode = () => {
    if (!roomCode) return;
    navigator.clipboard.writeText(roomCode).then(() => {
      toast({ title: '✅ تم النسخ!', description: `كود الغرفة: ${roomCode}` });
    }).catch(() => {
      toast({ title: '📋 الكود', description: roomCode });
    });
  };

  const phaseLabel = phase === 'playing'
    ? `📋 الجولة ${currentRound} — ${currentTeam === 'alpha' ? teamAlphaName : teamBetaName}`
    : phase === 'game_over'
    ? '🏁 انتهت اللعبة'
    : '';

  return (
    <>
      <div className="sticky top-0 z-50 border-b border-emerald-800/50 bg-[#0a100e]/90 backdrop-blur-sm">
        <div className="max-w-md mx-auto flex items-center justify-between px-3 py-1.5">
          <Button
            onClick={() => setShowExitDialog(true)}
            variant="ghost"
            className="text-slate-400 hover:text-red-400 hover:bg-red-950/30 gap-1.5 text-xs h-8 px-2"
          >
            <HomeIcon className="w-4 h-4" />
            <span className="hidden sm:inline">الرئيسية</span>
          </Button>

          <Badge
            variant="outline"
            className={`text-[10px] sm:text-xs px-2 py-0.5 ${
              isGameOver
                ? 'border-amber-500/50 text-amber-300'
                : 'border-emerald-500/50 text-emerald-400'
            }`}
          >
            {phaseLabel}
          </Badge>

          {!isGameOver && (
            <div className="relative">
              {!showResetConfirm ? (
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setShowResetConfirm(true)}
                  className="flex items-center gap-1 text-[10px] sm:text-xs text-slate-500 hover:text-red-400 transition-colors px-2 py-1 rounded-lg hover:bg-red-950/30"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </motion.button>
              ) : (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex items-center gap-1"
                >
                  <span className="text-[10px] text-red-400 font-bold">مؤكد؟</span>
                  <button
                    onClick={handleReset}
                    className="text-[10px] bg-red-900/60 text-red-300 px-1.5 py-0.5 rounded font-bold"
                  >
                    نعم
                  </button>
                  <button
                    onClick={() => setShowResetConfirm(false)}
                    className="text-[10px] bg-slate-800/60 text-slate-400 px-1.5 py-0.5 rounded font-bold"
                  >
                    لا
                  </button>
                </motion.div>
              )}
            </div>
          )}
        </div>

        {/* Room Code Banner for Diwaniya mode */}
        {gameMode === 'diwaniya' && roomCode && !isGameOver && (
          <div className="border-t border-emerald-800/30 bg-emerald-950/40">
            <div className="max-w-md mx-auto flex items-center justify-between px-3 py-1.5">
              <div className="flex items-center gap-2">
                <Wifi className="w-3.5 h-3.5 text-green-400" />
                <span className="text-[10px] text-slate-400">بث مباشر</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">كود الغرفة:</span>
                <button
                  onClick={handleCopyCode}
                  className="flex items-center gap-1.5 bg-slate-800/60 border border-slate-600/50 rounded-lg px-3 py-1 hover:bg-slate-700/60 transition-colors"
                >
                  <span className="text-sm font-mono font-bold text-amber-300 tracking-wider">{roomCode}</span>
                  <Copy className="w-3 h-3 text-slate-400" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Exit Confirmation Dialog */}
      <AnimatePresence>
        {showExitDialog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4"
            onClick={() => setShowExitDialog(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#0e1a15] border border-emerald-700/50 rounded-2xl p-6 max-w-sm w-full shadow-2xl"
            >
              <div className="text-center">
                <div className="text-5xl mb-3">🚪</div>
                <h3 className="text-lg font-bold text-slate-200 mb-2">الخروج من اللعبة؟</h3>
                <p className="text-sm text-slate-400 mb-6">سيتم إعادة تعيين اللعبة بالكامل. هل تريد المتابعة؟</p>
                <div className="flex gap-3">
                  <Button
                    onClick={() => setShowExitDialog(false)}
                    variant="outline"
                    className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-800 h-11"
                  >
                    إلغاء
                  </Button>
                  <Button
                    onClick={handleExit}
                    className="flex-1 bg-gradient-to-l from-emerald-700 to-emerald-900 hover:from-emerald-600 hover:to-emerald-800 text-white font-bold h-11"
                  >
                    نعم، اخرج
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// ============================================================
// Host Heartbeat Hook
// ============================================================

function useHostHeartbeat() {
  const { roomCode, gameMode, phase } = usePrisonStore();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!roomCode || gameMode !== 'diwaniya' || phase === 'landing' || phase === 'setup' || phase === 'game_over') {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    const sendHeartbeat = () => {
      fetch(`/api/prison-room/${roomCode}/heartbeat`, { method: 'POST' }).catch(() => {});
    };

    sendHeartbeat();
    intervalRef.current = setInterval(sendHeartbeat, 5000);

    const handleBeforeUnload = () => {
      fetch(`/api/prison-room/${roomCode}`, { method: 'DELETE' }).catch(() => {});
      if (navigator.sendBeacon) {
        navigator.sendBeacon(`/api/prison-room/${roomCode}`, JSON.stringify({ _method: 'DELETE' }));
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [roomCode, gameMode, phase]);
}

// ============================================================
// MAIN PAGE
// ============================================================

export default function PrisonPage() {
  const { phase, setPhase, setGameMode, setRoomCode, gameMode } = usePrisonStore();
  const [creatingRoom, setCreatingRoom] = useState(false);
  const { toast } = useToast();
  const mounted = useHydrated();

  // Start heartbeat when in diwaniya mode
  useHostHeartbeat();

  const handleModeSelect = useCallback((mode: 'local' | 'diwaniya') => {
    if (mode === 'local') {
      setGameMode('local');
      setRoomCode(null);
      setPhase('setup');
    } else {
      handleStartDiwaniya();
    }
  }, []);

  const handleStartDiwaniya = useCallback(async () => {
    setCreatingRoom(true);
    try {
      const res = await fetch('/api/prison-room', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hostName: 'سجن',
          gridSize: 9,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({ title: '❌ خطأ', description: data.error || 'فشل إنشاء الغرفة', variant: 'destructive' });
        setCreatingRoom(false);
        return;
      }

      setGameMode('diwaniya');
      setRoomCode(data.code);
      setPhase('setup');
      toast({
        title: '🎉 تم إنشاء الغرفة!',
        description: `كود الغرفة: ${data.code} — شاركه مع المتفرجين`,
      });
    } catch {
      toast({ title: '❌ خطأ', description: 'تعذر الاتصال بالخادم', variant: 'destructive' });
    }
    setCreatingRoom(false);
  }, [setPhase, setGameMode, setRoomCode, toast]);

  if (!mounted) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#060e0a]">
        <div className="text-center flex-1 flex items-center justify-center">
          <div>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              className="text-5xl mb-4"
            >
              🔒
            </motion.div>
            <p className="text-slate-500 text-sm">جاري التحميل...</p>
          </div>
        </div>
        <BrandedFooter />
      </div>
    );
  }

  // Loading state while creating room
  if (creatingRoom) {
    return (
      <div className="min-h-screen flex flex-col bg-[#060e0a]">
        <BrandedHeader />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              className="text-5xl mb-4"
            >
              🏠
            </motion.div>
            <p className="text-slate-400 text-sm">جاري إنشاء الغرفة...</p>
          </div>
        </div>
        <BrandedFooter />
      </div>
    );
  }

  // Landing phase
  if (phase === 'landing') {
    return (
      <div className="min-h-screen flex flex-col bg-[#060e0a]" dir="rtl">
        <BrandedHeader />
        <main className="flex-1">
          <LandingPage onModeSelect={handleModeSelect} />
        </main>
        <BrandedFooter />
      </div>
    );
  }

  // Setup phase
  if (phase === 'setup') {
    return (
      <div className="min-h-screen flex flex-col bg-[#060e0a]" dir="rtl">
        <BrandedHeader />
        <main className="flex-1">
          <PrisonSetup onBack={() => setPhase('landing')} mode={gameMode || 'local'} />
        </main>
        <BrandedFooter />
      </div>
    );
  }

  // Playing & Game Over phases — GameBoard has its own game over overlay
  return (
    <div className="flex flex-col min-h-screen bg-[#060e0a] text-white" dir="rtl">
      <GameTopBar />
      <main className="flex-1">
        <PrisonGameBoard />
      </main>
    </div>
  );
}
