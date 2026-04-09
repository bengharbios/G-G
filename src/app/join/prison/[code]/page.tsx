'use client';

import { useState, useEffect } from 'react';
import { use, useSyncExternalStore } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Lock, Users, Loader2 } from 'lucide-react';
import PrisonSpectatorView from '@/components/prison/PrisonSpectatorView';

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
// Join Form Component
// ============================================================
function JoinForm({ code }: { code: string }) {
  const [error, setError] = useState('');
  const [attempts, setAttempts] = useState(0);

  const [name, setName] = useState(() => {
    if (typeof window === 'undefined') return '';
    const searchParams = new URLSearchParams(window.location.search);
    const queryName = searchParams.get('name');
    return queryName ? decodeURIComponent(queryName) : '';
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      setError('يجب إدخال اسمك');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch(`/api/prison-room/${code}/spectator`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim() }),
      });

      if (!res.ok) {
        if (res.status === 404) {
          setError('الغرفة غير موجودة أو انتهت صلاحيتها');
        } else {
          const data = await res.json().catch(() => null);
          setError(data?.error || 'حدث خطأ غير متوقع');
        }
        setLoading(false);

        if (attempts < 3) {
          setAttempts((prev) => prev + 1);
        }
        return;
      }

      const data = await res.json();
      if (data.success) {
        // Redirect with spectatorId to show spectator view
        window.location.href = `/join/prison/${code}?spectatorId=${data.spectatorId}&name=${encodeURIComponent(name.trim())}`;
        return;
      }

      setError('حدث خطأ غير متوقع');
      setLoading(false);
    } catch {
      setError('تعذر الاتصال بالخادم');
      setLoading(false);

      if (attempts < 3) {
        setAttempts((prev) => prev + 1);
      }
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-sm mx-auto"
    >
      {/* Header */}
      <div className="text-center mb-6">
        <motion.div
          initial={{ scale: 0.5 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.6, delay: 0.2, type: 'spring' }}
          className="text-5xl mb-3"
        >
          🔒
        </motion.div>
        <h1 className="text-2xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-400 mb-2">
          الانضمام كمشاهد
        </h1>
        <p className="text-xs text-slate-400">أدخل اسمك وانضم لمراقبة اللعبة</p>
      </div>

      {/* Room Code Display */}
      <Card className="bg-gradient-to-bl from-amber-950/40 via-slate-900/80 to-slate-900/80 border-amber-500/30 mb-6">
        <CardContent className="pt-5 sm:pt-6">
          <div className="text-center mb-4">
            <div className="inline-flex items-center gap-2 mb-2">
              <Lock className="w-5 h-5 text-amber-400" />
              <h2 className="text-lg sm:text-xl font-bold text-amber-300">
                كود الغرفة
              </h2>
            </div>
            <p className="text-3xl sm:text-4xl font-mono font-bold text-white tracking-[0.3em]">
              {code}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Join Form */}
      <Card className="bg-slate-900/80 border-slate-700/50 mb-6">
        <CardContent className="pt-5 sm:pt-6">
          <div className="text-center mb-4">
            <div className="inline-flex items-center gap-2">
              <Users className="w-5 h-5 text-cyan-400" />
              <h3 className="text-base font-bold text-cyan-300">معلومات المشاهد</h3>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs text-slate-400 mb-1 block">اسمك</label>
              <Input
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setError('');
                }}
                placeholder="أدخل اسمك هنا..."
                className="bg-slate-800/50 border-slate-700/50 text-slate-200 placeholder:text-slate-500 text-right h-12 focus:border-cyan-500/50"
                dir="rtl"
                maxLength={20}
                disabled={loading}
                autoFocus
              />
            </div>

            {error && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-red-400 text-xs text-center"
              >
                ⚠️ {error}
              </motion.p>
            )}

            {attempts > 0 && attempts < 3 && !error && (
              <p className="text-slate-500 text-[10px] text-center">
                محاولة {attempts} من 3
              </p>
            )}

            <Button
              type="submit"
              disabled={loading || !name.trim() || attempts >= 3}
              className="w-full bg-gradient-to-l from-cyan-600 to-teal-700 hover:from-cyan-500 hover:to-teal-600 text-white font-bold text-base sm:text-lg py-5 sm:py-6 transition-all duration-300 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                  جاري الانضمام...
                </>
              ) : (
                <>
                  <Users className="w-4 h-4 ml-2" />
                  انضمام
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Back Link */}
      <div className="text-center">
        <a
          href="/prison"
          className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
        >
          ← العودة لصفحة اللعبة
        </a>
      </div>
    </motion.div>
  );
}

// ============================================================
// Main Page Component
// ============================================================
export default function JoinPrisonPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = use(params);
  const mounted = useHydrated();

  // Check if already joined as spectator
  const [spectatorId, setSpectatorId] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const searchParams = new URLSearchParams(window.location.search);
    const sid = searchParams.get('spectatorId');
    if (sid) {
      setSpectatorId(sid);
    }
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center prison-bg">
        <div className="text-center">
          <div className="text-5xl mb-4 animate-bounce">🔒</div>
          <p className="text-slate-400">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  // If spectatorId is present, show spectator view
  if (spectatorId) {
    return <PrisonSpectatorView roomCode={code} />;
  }

  // Otherwise show join form
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 prison-bg" dir="rtl">
      <JoinForm code={code} />
    </div>
  );
}
