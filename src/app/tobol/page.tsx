'use client';

import { useState, useCallback, useEffect } from 'react';
import { useSyncExternalStore } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useTobolStore } from '@/lib/tobol-store';
import LandingPage from '@/components/tobol/LandingPage';
import GameSetup from '@/components/tobol/GameSetup';
import GameBoard from '@/components/tobol/GameBoard';
import TobolGameOver from '@/components/tobol/TobolGameOver';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Home as HomeIcon, RotateCcw, Eye } from 'lucide-react';

// ============================================================
// Hydration guard
// ============================================================
function useHydrated() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
}

// ============================================================
// Host Heartbeat Hook (Diwaniya mode)
// ============================================================
function useHostHeartbeat() {
  const { gameMode, roomCode } = useTobolStore();

  useEffect(() => {
    if (gameMode !== 'diwaniya' || !roomCode) return;

    const sendHeartbeat = () => {
      fetch(`/api/tobol-room/${roomCode}/heartbeat`, {
        method: 'POST',
      }).catch(() => {});
    };

    sendHeartbeat();
    const interval = setInterval(sendHeartbeat, 5000);
    return () => clearInterval(interval);
  }, [gameMode, roomCode]);

  // Clean up room on tab close
  useEffect(() => {
    if (gameMode !== 'diwaniya' || !roomCode) return;

    const handleBeforeUnload = () => {
      const baseUrl = window.location.origin;
      navigator.sendBeacon(
        `${baseUrl}/api/tobol-room/${roomCode}`,
        JSON.stringify({ _method: 'DELETE' })
      );
      try {
        fetch(`/api/tobol-room/${roomCode}`, { method: 'DELETE' });
      } catch { /* ignore */ }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [gameMode, roomCode]);
}

// ============================================================
// BrandedHeader
// ============================================================
function BrandedHeader() {
  return (
    <div className="w-full border-b border-slate-800/30 bg-slate-950/95 backdrop-blur-md">
      <div className="max-w-7xl mx-auto flex items-center justify-between h-14 px-4">
        <a href="/" className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-red-500 to-purple-600 flex items-center justify-center shadow-lg shadow-red-500/20">
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
          <h1 className="text-base sm:text-lg font-black bg-gradient-to-l from-red-400 via-yellow-300 to-red-400 bg-clip-text text-transparent">
            ألعاب الغريب
          </h1>
        </a>
        <div className="flex items-center gap-4">
          <span className="text-xs sm:text-sm font-bold text-slate-400">
            🥁 لعبة طبول الحرب
          </span>
          <a href="/" className="text-xs text-slate-400 hover:text-white transition-colors">
            الرئيسية
          </a>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// BrandedFooter
// ============================================================
function BrandedFooter() {
  return (
    <div className="w-full border-t border-slate-800/30 bg-slate-950/60">
      <div className="flex flex-col items-center gap-0.5 py-2 px-3">
        <div className="flex items-center justify-center gap-1.5">
          <span className="text-xs sm:text-sm">🥁</span>
          <span className="text-[10px] sm:text-xs font-bold bg-gradient-to-l from-red-400 via-amber-300 to-blue-400 bg-clip-text text-transparent">
            طبول الحرب | Tobol
          </span>
          <span className="text-xs sm:text-sm">🥁</span>
        </div>
        <div className="flex items-center gap-1.5 mt-0.5">
          <span className="text-[9px] sm:text-[10px] text-slate-500">💻 برمجة</span>
          <span className="text-[9px] sm:text-[10px] font-bold bg-gradient-to-l from-yellow-400 to-amber-500 bg-clip-text text-transparent">الغريب</span>
          <span className="text-[9px] sm:text-[10px] text-slate-600">|</span>
          <span className="text-[9px] sm:text-[10px] text-slate-500">🏠 برعاية</span>
          <span className="text-[9px] sm:text-[10px] font-bold bg-gradient-to-l from-blue-400 to-purple-400 bg-clip-text text-transparent">ANA VIP 100034</span>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// GameTopBar
// ============================================================
function GameTopBar() {
  const { phase, resetGame, gameMode, roomCode } = useTobolStore();
  const [showExitDialog, setShowExitDialog] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showViewers, setShowViewers] = useState(false);
  const [spectators, setSpectators] = useState<{ id: string; name: string; joinedAt: number }[]>([]);
  const [viewerCount, setViewerCount] = useState(0);

  const isGameOver = phase === 'game_over';

  // Poll spectators count for Diwaniya mode
  useEffect(() => {
    if (gameMode !== 'diwaniya' || !roomCode) return;
    const fetchViewers = () => {
      fetch(`/api/tobol-room/${roomCode}`)
        .then(r => r.ok ? r.json() : null)
        .then(d => {
          if (d?.room?.spectators) {
            setSpectators(d.room.spectators);
            setViewerCount(d.room.spectators.length);
          }
        })
        .catch(() => {});
    };
    fetchViewers();
    const iv = setInterval(fetchViewers, 5000);
    return () => clearInterval(iv);
  }, [gameMode, roomCode, showViewers]);

  const handleExit = () => {
    setLeaving(true);
    setTimeout(() => {
      resetGame();
      setLeaving(false);
      setShowExitDialog(false);
    }, 300);
  };

  const handleReset = () => {
    resetGame();
    setShowResetConfirm(false);
  };

  return (
    <>
      <div className="sticky top-0 z-50 border-b border-slate-800/50 bg-slate-950/90 backdrop-blur-sm">
        <div className="max-w-md mx-auto flex items-center justify-between px-3 py-1.5">
          <div className="flex items-center gap-1">
            <Button
              onClick={() => setShowExitDialog(true)}
              variant="ghost"
              className="text-slate-400 hover:text-red-400 hover:bg-red-950/30 gap-1.5 text-xs h-8 px-2"
            >
              <HomeIcon className="w-4 h-4" />
              <span className="hidden sm:inline">الرئيسية</span>
            </Button>

            {/* Viewers icon (Diwaniya mode) */}
            {gameMode === 'diwaniya' && roomCode && (
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => setShowViewers(true)}
                className="flex items-center gap-1 text-[10px] sm:text-xs text-slate-400 hover:text-blue-400 transition-colors px-2 py-1 rounded-lg hover:bg-blue-950/30 cursor-pointer"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>{viewerCount}</span>
              </motion.button>
            )}
          </div>

          {/* Diwaniya host badge */}
          {gameMode === 'diwaniya' && !isGameOver && (
            <div className="flex items-center gap-1 bg-amber-950/40 border border-amber-500/30 rounded-lg px-2 py-1">
              <span className="text-xs">🏠</span>
              <span className="text-[10px] sm:text-xs font-bold text-amber-300">ديوانية</span>
            </div>
          )}

          {/* Turn indicator — shown in notification bar only, not here */}

          {isGameOver && (
            <Badge
              variant="outline"
              className="text-[10px] sm:text-xs px-2 py-0.5 border-yellow-500/50 text-yellow-300"
            >
              🏁 انتهت المعركة
            </Badge>
          )}

          {/* Reset button */}
          {!isGameOver && (
            <div className="relative">
              {!showResetConfirm ? (
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setShowResetConfirm(true)}
                  className="flex items-center gap-1 text-[10px] sm:text-xs text-slate-500 hover:text-red-400 transition-colors px-2 py-1 rounded-lg hover:bg-red-950/30 cursor-pointer"
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
                    className="text-[10px] bg-red-900/60 text-red-300 px-1.5 py-0.5 rounded font-bold cursor-pointer"
                  >
                    نعم
                  </button>
                  <button
                    onClick={() => setShowResetConfirm(false)}
                    className="text-[10px] bg-slate-800/60 text-slate-400 px-1.5 py-0.5 rounded font-bold cursor-pointer"
                  >
                    لا
                  </button>
                </motion.div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Room Code Banner (Diwaniya) */}
      {gameMode === 'diwaniya' && roomCode && (
        <div className="bg-gradient-to-l from-red-900/50 to-blue-900/50 border-b border-red-500/30 py-2 px-4">
          <div className="max-w-md mx-auto flex items-center justify-between">
            <div>
              <p className="text-[10px] sm:text-xs text-red-300">كود الغرفة - شاركه مع المشاهدين:</p>
              <p className="text-xl sm:text-2xl font-mono font-bold text-white tracking-widest">{roomCode}</p>
            </div>
            <button
              onClick={() => {
                navigator.clipboard.writeText(roomCode);
              }}
              className="text-xs bg-red-800/50 text-red-200 px-3 py-1.5 rounded-lg hover:bg-red-700/50"
            >
              📋 نسخ
            </button>
          </div>
        </div>
      )}

      {/* Viewers Modal */}
      <AnimatePresence>
        {showViewers && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4"
            onClick={() => setShowViewers(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-slate-900 border border-slate-700 rounded-2xl p-5 sm:p-6 max-w-sm w-full shadow-2xl"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold text-slate-200 flex items-center gap-2">
                  <Eye className="w-4 h-4 text-blue-400" />
                  المشاهدون
                </h3>
                <button
                  onClick={() => setShowViewers(false)}
                  className="text-slate-500 hover:text-slate-300 text-lg cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {spectators.length === 0 ? (
                <div className="text-center py-6">
                  <div className="text-4xl mb-2">👥</div>
                  <p className="text-slate-500 text-sm">لا يوجد مشاهدون حالياً</p>
                  <p className="text-slate-600 text-xs mt-1">شارك كود الغرفة ليصلك المشاهدون</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[40vh] overflow-y-auto tobol-scrollbar">
                  {spectators.map((spec, idx) => (
                    <div
                      key={spec.id}
                      className="flex items-center gap-3 bg-slate-800/50 border border-slate-700/30 rounded-xl px-3 py-2.5"
                    >
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                        {spec.name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-slate-200 truncate">{spec.name}</p>
                        <p className="text-[10px] text-slate-500">
                          انضم منذ {Math.floor((Date.now() - spec.joinedAt) / 60000)} دقيقة
                        </p>
                      </div>
                      <span className="text-[10px] text-slate-600 shrink-0">#{idx + 1}</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-4 text-center">
                <p className="text-[10px] text-slate-600">
                  إجمالي المشاهدين: {spectators.length}
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
              className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-sm w-full shadow-2xl"
            >
              <div className="text-center">
                <div className="text-5xl mb-3">🚪</div>
                <h3 className="text-lg font-bold text-slate-200 mb-2">
                  الخروج من المعركة؟
                </h3>
                <p className="text-sm text-slate-400 mb-6">
                  {gameMode === 'diwaniya'
                    ? 'سيتم إنهاء الجلسة وسيخرج جميع المشاهدين.'
                    : 'سيتم إعادة تعيين اللعبة بالكامل. هل تريد المتابعة؟'
                  }
                </p>
                <div className="flex gap-3">
                  <Button
                    onClick={() => setShowExitDialog(false)}
                    variant="outline"
                    disabled={leaving}
                    className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-800 h-11"
                  >
                    إلغاء
                  </Button>
                  <Button
                    onClick={handleExit}
                    disabled={leaving}
                    className="flex-1 bg-gradient-to-l from-red-700 to-red-900 hover:from-red-600 hover:to-red-800 text-white font-bold h-11"
                  >
                    {leaving ? 'جاري الخروج...' : 'نعم، اخرج'}
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
// Main Page
// ============================================================
export default function TobolPage() {
  const { phase, setPhase, resetGame, setGameMode } = useTobolStore();
  const mounted = useHydrated();

  // Start host heartbeat in Diwaniya mode
  useHostHeartbeat();

  const handleStartLocal = useCallback(() => {
    setGameMode('classic');
    setPhase('setup');
  }, [setPhase, setGameMode]);

  const handleStartDiwaniya = useCallback(() => {
    setGameMode('diwaniya');
    setPhase('setup');
  }, [setPhase, setGameMode]);

  if (!mounted) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center tobol-bg">
        <div className="text-center flex-1 flex items-center justify-center">
          <div>
            <div className="text-5xl mb-4">🥁</div>
            <p className="text-slate-400">جاري التحميل...</p>
          </div>
        </div>
        <BrandedFooter />
      </div>
    );
  }

  // ============================
  // LANDING PAGE
  // ============================
  if (phase === 'landing') {
    return (
      <div className="min-h-screen flex flex-col tobol-bg">
        <BrandedHeader />
        <main className="flex-1">
          <LandingPage onStartLocal={handleStartLocal} onStartDiwaniya={handleStartDiwaniya} />
        </main>
        <BrandedFooter />
      </div>
    );
  }

  // ============================
  // SETUP PAGE
  // ============================
  if (phase === 'setup') {
    return (
      <div className="min-h-screen flex flex-col tobol-bg">
        <BrandedHeader />
        <main className="flex-1">
          <GameSetup />
        </main>
        <BrandedFooter />
      </div>
    );
  }

  // ============================
  // PLAYING / GAME OVER
  // ============================
  return (
    <div className="flex flex-col min-h-screen tobol-bg">
      <GameTopBar />
      <main className="flex-1">
        {phase === 'playing' && <GameBoard />}
        {phase === 'game_over' && <TobolGameOver />}
      </main>
      <BrandedFooter />
    </div>
  );
}
