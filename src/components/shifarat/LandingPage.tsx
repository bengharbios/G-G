'use client';

import { motion } from 'framer-motion';
import { Target, Globe } from 'lucide-react';

interface LandingPageProps {
  onSelectMode: (mode: 'godfather' | 'diwaniya') => void;
}

export default function LandingPage({ onSelectMode }: LandingPageProps) {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-6"
      dir="rtl"
      style={{
        background: 'linear-gradient(135deg, #020617 0%, #0f172a 50%, #020617 100%)',
      }}
    >
      {/* Decorative dots */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 30 }).map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full"
            style={{
              width: Math.random() * 3 + 1 + 'px',
              height: Math.random() * 3 + 1 + 'px',
              top: Math.random() * 100 + '%',
              left: Math.random() * 100 + '%',
              backgroundColor: `rgba(16, 185, 129, ${Math.random() * 0.3 + 0.1})`,
              animation: `pulse ${Math.random() * 3 + 2}s ease-in-out infinite`,
              animationDelay: Math.random() * 2 + 's',
            }}
          />
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="relative z-10 w-full max-w-md mx-auto"
      >
        {/* Header */}
        <div className="text-center mb-8 sm:mb-10">
          <motion.div
            initial={{ scale: 0.3 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2, type: 'spring', stiffness: 200 }}
            className="text-6xl sm:text-7xl mb-3"
          >
            🎯
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="text-3xl sm:text-4xl font-black mb-2"
            style={{
              background: 'linear-gradient(to left, #34d399, #10b981, #6ee7b7)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            لعبة الشيفرات
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="text-slate-400 text-sm"
          >
            لمّح بكلمة واحدة فقط! 🧠
          </motion.p>
        </div>

        {/* Mode Selection Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
          {/* Godfather Mode */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            whileHover={{ scale: 1.03, y: -4 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => onSelectMode('godfather')}
            className="cursor-pointer rounded-2xl p-5 sm:p-6 border-2 border-emerald-500/20 transition-all duration-300"
            style={{
              background: 'linear-gradient(135deg, rgba(6, 78, 59, 0.3) 0%, rgba(15, 23, 42, 0.8) 100%)',
            }}
          >
            <div
              className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center mb-4 mx-auto"
              style={{
                background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(16, 185, 129, 0.05))',
                border: '1px solid rgba(16, 185, 129, 0.3)',
              }}
            >
              <span className="text-3xl sm:text-4xl">🎯</span>
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-emerald-300 text-center mb-2">
              العب مع أصحابك
            </h3>
            <p className="text-xs sm:text-sm text-slate-400 text-center leading-relaxed">
              العب على جهاز واحد - مرر الجهاز بين الفرق
            </p>
            <div className="mt-3 text-center">
              <span className="text-[10px] text-emerald-500/60 font-bold px-3 py-1 rounded-full border border-emerald-500/20 bg-emerald-500/5">
                وضع العراب
              </span>
            </div>
          </motion.div>

          {/* Diwaniya Mode */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            whileHover={{ scale: 1.03, y: -4 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => onSelectMode('diwaniya')}
            className="cursor-pointer rounded-2xl p-5 sm:p-6 border-2 border-emerald-500/20 transition-all duration-300"
            style={{
              background: 'linear-gradient(135deg, rgba(6, 78, 59, 0.2) 0%, rgba(15, 23, 42, 0.8) 100%)',
            }}
          >
            <div
              className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center mb-4 mx-auto"
              style={{
                background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(16, 185, 129, 0.05))',
                border: '1px solid rgba(16, 185, 129, 0.3)',
              }}
            >
              <span className="text-3xl sm:text-4xl">🌐</span>
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-emerald-300 text-center mb-2">
              الاعب أونلاين
            </h3>
            <p className="text-xs sm:text-sm text-slate-400 text-center leading-relaxed">
              أنشئ غرفة وادعُ أصدقائك للعب من أجهزتهم
            </p>
            <div className="mt-3 text-center">
              <span className="text-[10px] text-emerald-500/60 font-bold px-3 py-1 rounded-full border border-emerald-500/20 bg-emerald-500/5">
                وضع الديوانية
              </span>
            </div>
          </motion.div>
        </div>

        {/* Footer hint */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="text-center text-[10px] text-slate-600 mt-8"
        >
          اختر طريقة اللعب للبدء
        </motion.p>
      </motion.div>
    </div>
  );
}
