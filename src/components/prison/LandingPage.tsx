'use client';

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { motion, AnimatePresence } from 'framer-motion';
import { Crown, Home, Info, Users, Zap } from 'lucide-react';

interface LandingPageProps {
  onModeSelect: (mode: 'local' | 'diwaniya') => void;
}

const PRISON_EMOJIS = ['🏢', '🔒', '⛓️', '🔑', '💀', '👮', '🚪', '🗡️', '🛡️', '⛓️', '🪖', '⚖️', '🏴‍☠️', '👁️', '💍', '🪞'];

export default function LandingPage({ onModeSelect }: LandingPageProps) {
  const [showRules, setShowRules] = useState(false);

  const floatingEmojis = useMemo(() => {
    return PRISON_EMOJIS.map((emoji, i) => ({
      emoji,
      top: `${8 + (i * 5.5) % 82}%`,
      left: `${3 + (i * 6.2) % 92}%`,
      size: 16 + (i % 4) * 6,
      duration: 3 + (i % 5) * 1.5,
      delay: i * 0.3,
    }));
  }, []);

  return (
    <div className="flex flex-col items-center py-6 sm:py-8 px-3 sm:px-4 relative overflow-hidden" dir="rtl">
      {/* Floating prison emojis background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {floatingEmojis.map((item, i) => (
          <div
            key={i}
            className="absolute"
            style={{
              top: item.top,
              left: item.left,
              fontSize: `${item.size}px`,
              opacity: 0.12,
              animation: `float ${item.duration}s ease-in-out ${item.delay}s infinite alternate`,
            }}
          >
            {item.emoji}
          </div>
        ))}

        {/* Ambient glows */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-amber-900/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-1/4 left-1/3 w-[300px] h-[300px] bg-orange-900/8 rounded-full blur-[80px] pointer-events-none" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="relative z-10 w-full max-w-sm sm:max-w-md mx-auto"
      >
        {/* Title */}
        <div className="text-center mb-6 sm:mb-8">
          <motion.div
            initial={{ scale: 0.5 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2, type: 'spring' }}
            className="text-6xl sm:text-7xl mb-3 sm:mb-4"
            style={{ animation: 'float 3s ease-in-out infinite alternate' }}
          >
            🏢
          </motion.div>
          <h1 className="text-3xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-orange-300 to-amber-400 mb-2">
            السجن
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm font-bold">
            لعبة السجون والحرية 🔒
          </p>
        </div>

        {/* ================================ */}
        {/* MODE SELECTION CARDS              */}
        {/* ================================ */}
        <Card className="bg-gradient-to-bl from-amber-950/40 via-slate-900/80 to-slate-900/80 border-amber-500/30 mb-4 sm:mb-6">
          <CardContent className="pt-5 sm:pt-6">
            <div className="text-center mb-4">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3, type: 'spring' }}
                className="inline-flex items-center gap-2 mb-2"
              >
                <Zap className="w-5 h-5 text-amber-400" />
                <h2 className="text-lg sm:text-xl font-bold text-amber-300">
                  اختر طريقة اللعب
                </h2>
              </motion.div>
              <p className="text-[10px] sm:text-xs text-slate-400">
                فريقان يتنافسان عبر الزنزانات — سجن، تحويل، إعدام أو حرية!
              </p>
            </div>

            <div className="space-y-3">
              {/* العراب Mode — Local */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onModeSelect('local')}
                className="w-full rounded-xl p-3 sm:p-4 border-2 border-amber-500/30 bg-gradient-to-l from-amber-950/50 to-orange-950/30 hover:border-amber-400/50 transition-all text-right cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-amber-900/50 border border-amber-500/30 flex items-center justify-center shrink-0">
                    <Crown className="w-6 h-6 sm:w-7 sm:h-7 text-amber-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-base sm:text-lg font-bold text-amber-200 mb-0.5">
                      العراب
                    </h3>
                    <p className="text-[10px] sm:text-xs text-slate-400 leading-relaxed">
                      أدخل أسماء الفرق واللاعبين على جهازك وتحكم باللعبة كاملة
                    </p>
                  </div>
                </div>
              </motion.button>

              {/* الديوانية Mode — Online Spectators */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onModeSelect('diwaniya')}
                className="w-full rounded-xl p-3 sm:p-4 border-2 border-cyan-500/30 bg-gradient-to-l from-cyan-950/50 to-amber-950/30 hover:border-cyan-400/50 transition-all text-right cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-cyan-900/50 border border-cyan-500/30 flex items-center justify-center shrink-0">
                    <Home className="w-6 h-6 sm:w-7 sm:h-7 text-cyan-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-base sm:text-lg font-bold text-cyan-200 mb-0.5">
                      الديوانية
                    </h3>
                    <p className="text-[10px] sm:text-xs text-slate-400 leading-relaxed">
                      أنشئ غرفة وشارك الكود، المشاهدون يشاهدون من أجهزتهم
                    </p>
                  </div>
                </div>
              </motion.button>
            </div>
          </CardContent>
        </Card>

        {/* Rules Toggle */}
        <div className="flex justify-center mb-3">
          <Button
            variant="ghost"
            onClick={() => setShowRules(!showRules)}
            className="text-amber-400 hover:text-amber-300 hover:bg-amber-400/10 gap-2 text-sm"
          >
            <Info className="w-4 h-4" />
            {showRules ? 'إخفاء القوانين' : '📜 عرض القوانين'}
          </Button>
        </div>

        {/* Rules */}
        <AnimatePresence>
          {showRules && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden mb-3"
            >
              <Card className="bg-slate-900/80 border-amber-700/30">
                <CardContent className="pt-4 text-xs sm:text-sm text-slate-300 space-y-3">
                  <div>
                    <h4 className="font-bold text-amber-400 mb-1">⚡ طريقة اللعب:</h4>
                    <ul className="space-y-1 text-slate-400 pr-4">
                      <li>👥 فريقان يتنافسان عبر شبكة من الزنزانات</li>
                      <li>👑 القائد يختار الزنزانة التي تُكشف كل جولة</li>
                      <li>🔒 كل زنزانة تحدث تأثيراً مختلفاً على اللاعبين</li>
                      <li>🔄 الدور ينتقل للفريق الآخر</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-bold text-orange-400 mb-1">🏗️ الزنزانات:</h4>
                    <ul className="space-y-1 text-slate-400 pr-4">
                      <li>🔓 <strong className="text-slate-200">زنزانة فارغة:</strong> سجن لاعب عشوائي من الخصم</li>
                      <li>🚫 <strong className="text-slate-200">ملابس السجن:</strong> تحويل لاعب خصم لفريقك</li>
                      <li>💀 <strong className="text-slate-200">إعدام:</strong> قتل لاعب خصم نهائياً</li>
                      <li>🔑 <strong className="text-slate-200">مفتاح:</strong> تحرير زميل محبوس</li>
                      <li>✋ <strong className="text-slate-200">زنزانة ممتلئة:</strong> تخطي، لا شيء يحدث</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-bold text-rose-400 mb-1">🏆 الفوز:</h4>
                    <ul className="space-y-1 text-slate-400 pr-4">
                      <li>🏆 الفريق الفائز هو من يُخرج جميع أعضاء الفريق الخصم</li>
                      <li>⚠️ المقتول لا يمكن إعادته أبداً</li>
                      <li>🔓 المحبوس يمكن تحريره بمفتاح الحرية</li>
                      <li>🚫 المحوّل ينضم للفريق الخصم</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-bold text-cyan-400 mb-1">🏷️ الأدوار:</h4>
                    <ul className="space-y-1 text-slate-400 pr-4">
                      <li>👑 <strong className="text-slate-200">القائد:</strong> يختار من يكشف الزنزانة</li>
                      <li>⭐ <strong className="text-slate-200">النائب:</strong> يحل محل القائد</li>
                      <li>🛡️ <strong className="text-slate-200">العضو:</strong> يشارك في اللعب</li>
                      <li>👁️ <strong className="text-slate-200">الضيف:</strong> متفرج فقط</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

      </motion.div>
    </div>
  );
}
