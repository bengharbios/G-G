'use client';

import { useState, useEffect, useSyncExternalStore, useCallback } from 'react';
import { motion } from 'framer-motion';

function useHydrated() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
}

export default function JoinRisk2Page({ params }: { params: Promise<{ code: string }> }) {
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const mounted = useHydrated();

  useEffect(() => {
    params.then(p => setCode(p.code));
  }, [params]);

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const nameParam = searchParams.get('name');
    if (nameParam) {
      setName(nameParam);
    }
  }, []);

  const handleJoin = useCallback(async () => {
    if (!name.trim()) {
      setError('أدخل اسمك');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Join as spectator
      const res = await fetch(`/api/risk2-room/${code}/spectator`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim() }),
      });

      if (!res.ok) {
        setError('الكود غير صحيح');
        setLoading(false);
        return;
      }

      // Redirect to host page
      window.location.href = `/risk2`;
    } catch {
      setError('حدث خطأ');
      setLoading(false);
    }
  }, [name, code]);

  if (!mounted || !code) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="text-5xl animate-pulse">🎴</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4" dir="rtl">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-slate-900 border border-slate-700 rounded-2xl p-6 sm:p-8 max-w-sm w-full shadow-2xl text-center"
      >
        <motion.div
          initial={{ y: -10 }}
          animate={{ y: 0 }}
          transition={{ type: 'spring', damping: 10 }}
          className="text-5xl mb-4"
        >
          🎴
        </motion.div>

        <h1 className="text-xl font-bold text-slate-200 mb-1">المجازفة 2</h1>
        <p className="text-sm text-slate-400 mb-6">الانضمام كلاعب</p>

        <div className="mb-4 py-3 px-4 rounded-xl bg-slate-800/60 border border-slate-700/30">
          <p className="text-[10px] text-slate-500 mb-1">كود اللعبة</p>
          <p className="text-xl font-mono font-bold text-orange-400 tracking-widest" dir="ltr">{code}</p>
        </div>

        <div className="space-y-3 mb-4">
          <input
            type="text"
            placeholder="اسمك"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={20}
            className="w-full px-4 py-3 rounded-xl bg-slate-800/60 border border-slate-700/50 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-orange-500/50 text-center"
            onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
          />
        </div>

        {error && (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xs text-red-400 mb-3">
            {error}
          </motion.p>
        )}

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleJoin}
          disabled={loading || !name.trim()}
          className="w-full py-3 rounded-xl font-bold text-sm bg-gradient-to-l from-orange-600 to-red-700 hover:from-orange-500 hover:to-red-600 text-white transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {loading ? 'جاري الانضمام...' : 'انضم ▶'}
        </motion.button>

        <a href="/" className="block text-xs text-slate-500 hover:text-slate-300 mt-4 transition-colors">
          الرئيسية
        </a>
      </motion.div>
    </div>
  );
}
