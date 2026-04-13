'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useSyncExternalStore } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Home as HomeIcon, RotateCcw, Zap, Plus, Minus, ChevronLeft, Play, SkipForward, CheckCircle, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

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
// Survey Questions Data
// ============================================================
interface SurveyAnswer {
  text: string;
  points: number;
  revealed: boolean;
}

interface SurveyQuestion {
  question: string;
  answers: SurveyAnswer[];
}

const SURVEY_QUESTIONS: SurveyQuestion[] = [
  {
    question: 'شيء تفكر فيه قبل ما تنام',
    answers: [
      { text: 'المستقبل', points: 35, revealed: false },
      { text: 'الأكل', points: 22, revealed: false },
      { text: 'العائلة', points: 18, revealed: false },
      { text: 'المال', points: 15, revealed: false },
      { text: 'المشاكل', points: 10, revealed: false },
    ],
  },
  {
    question: 'أكثر شيء يزعجك في المطعم',
    answers: [
      { text: 'التأخير', points: 30, revealed: false },
      { text: 'الخدمة السيئة', points: 25, revealed: false },
      { text: 'الضجيج', points: 18, revealed: false },
      { text: 'الأكل البارد', points: 15, revealed: false },
      { text: 'الفاتورة', points: 12, revealed: false },
    ],
  },
  {
    question: 'سبب يجعلك تضحك',
    answers: [
      { text: 'مقاطع مضحكة', points: 28, revealed: false },
      { text: 'أصحابي', points: 25, revealed: false },
      { text: 'مواقف محرجة', points: 20, revealed: false },
      { text: 'النكت', points: 15, revealed: false },
      { text: 'تذكر موقف', points: 12, revealed: false },
    ],
  },
  {
    question: 'أكلة لا تستطيع مقاومتها',
    answers: [
      { text: 'البيتزا', points: 30, revealed: false },
      { text: 'الشوكولاتة', points: 25, revealed: false },
      { text: 'البرجر', points: 20, revealed: false },
      { text: 'الكيك', points: 15, revealed: false },
      { text: 'الآيس كريم', points: 10, revealed: false },
    ],
  },
  {
    question: 'أول شيء تعمله الصبح',
    answers: [
      { text: 'الموبايل', points: 40, revealed: false },
      { text: 'القهوة/الشاي', points: 25, revealed: false },
      { text: 'غسل الوجه', points: 15, revealed: false },
      { text: 'الإفطار', points: 12, revealed: false },
      { text: 'الصلاة', points: 8, revealed: false },
    ],
  },
  {
    question: 'شيء تخبّيه عن أصحابك',
    answers: [
      { text: 'المشاعر', points: 28, revealed: false },
      { text: 'سر شخصي', points: 25, revealed: false },
      { text: 'الأكل', points: 20, revealed: false },
      { text: 'عمرك الحقيقي', points: 15, revealed: false },
      { text: 'علاقة عاطفية', points: 12, revealed: false },
    ],
  },
  {
    question: 'أكثر شيء يخوّفك',
    answers: [
      { text: 'الظلام', points: 28, revealed: false },
      { text: 'الفشل', points: 25, revealed: false },
      { text: 'الموت', points: 18, revealed: false },
      { text: 'الحشرات', points: 15, revealed: false },
      { text: 'الوحدة', points: 14, revealed: false },
    ],
  },
  {
    question: 'شيء لازم يكون في كل بيت',
    answers: [
      { text: 'التلفزيون', points: 30, revealed: false },
      { text: 'الفراش', points: 22, revealed: false },
      { text: 'المطبخ', points: 18, revealed: false },
      { text: 'الواي فاي', points: 18, revealed: false },
      { text: 'الثلاجة', points: 12, revealed: false },
    ],
  },
  {
    question: 'أكثر وحدة تستاهل هدية',
    answers: [
      { text: 'الأم', points: 45, revealed: false },
      { text: 'الأب', points: 22, revealed: false },
      { text: 'الحبيب/ة', points: 15, revealed: false },
      { text: 'صديق مقرّب', points: 10, revealed: false },
      { text: 'الأخ/الأخت', points: 8, revealed: false },
    ],
  },
  {
    question: 'شيء لازم تعمله كل يوم',
    answers: [
      { text: 'الأكل', points: 30, revealed: false },
      { text: 'الموبايل', points: 25, revealed: false },
      { text: 'النوم', points: 20, revealed: false },
      { text: 'الشاور', points: 15, revealed: false },
      { text: 'الرياضة', points: 10, revealed: false },
    ],
  },
  {
    question: 'سبب تتأخر فيه عن العمل',
    answers: [
      { text: 'السهر', points: 35, revealed: false },
      { text: 'الزحام', points: 25, revealed: false },
      { text: 'النوم ثاني', points: 20, revealed: false },
      { text: 'ما لقيت مفتاح', points: 12, revealed: false },
      { text: 'إحساس بالتعب', points: 8, revealed: false },
    ],
  },
  {
    question: 'أكثر شي تشتريه من السوبرماركت',
    answers: [
      { text: 'الماء', points: 25, revealed: false },
      { text: 'الخبز', points: 22, revealed: false },
      { text: 'الحليب', points: 18, revealed: false },
      { text: 'الفواكه', points: 17, revealed: false },
      { text: 'الشيبس', points: 10, revealed: false },
      { text: 'المشروبات', points: 8, revealed: false },
    ],
  },
  {
    question: 'أول شي تفكر فيه لما تصحى',
    answers: [
      { text: 'أيك أعمل اليوم', points: 30, revealed: false },
      { text: 'متى أنام ثاني', points: 22, revealed: false },
      { text: 'الموبايل', points: 20, revealed: false },
      { text: 'الأكل', points: 15, revealed: false },
      { text: 'العمل', points: 13, revealed: false },
    ],
  },
  {
    question: 'كلمة يقولونها كويتيين كثير',
    answers: [
      { text: 'يا حبيبي', points: 28, revealed: false },
      { text: 'والله', points: 25, revealed: false },
      { text: 'يمّه', points: 22, revealed: false },
      { text: 'مشكور', points: 13, revealed: false },
      { text: 'عادي', points: 12, revealed: false },
    ],
  },
  {
    question: 'شيء تبيه بالديوانية',
    answers: [
      { text: 'الشاي', points: 35, revealed: false },
      { text: 'الدخلة', points: 25, revealed: false },
      { text: 'التلفزيون', points: 18, revealed: false },
      { text: 'أصحابي', points: 12, revealed: false },
      { text: 'الهواء', points: 10, revealed: false },
    ],
  },
];

const FAST_MONEY_QUESTIONS: SurveyQuestion[] = [
  {
    question: 'شيء أحمر في البيت',
    answers: [
      { text: 'السجادة', points: 25, revealed: false },
      { text: 'المخدة', points: 20, revealed: false },
      { text: 'المايكرويف', points: 18, revealed: false },
      { text: 'الكارت', points: 17, revealed: false },
      { text: 'المفتاح', points: 12, revealed: false },
      { text: 'الطفاية', points: 8, revealed: false },
    ],
  },
  {
    question: 'شيء يبدأ بحرف الميم',
    answers: [
      { text: 'محمد', points: 30, revealed: false },
      { text: 'ماء', points: 22, revealed: false },
      { text: 'موبايل', points: 20, revealed: false },
      { text: 'مدرسة', points: 15, revealed: false },
      { text: 'مسجد', points: 13, revealed: false },
    ],
  },
  {
    question: 'أكلة بالديوانية',
    answers: [
      { text: 'اللقيمات', points: 28, revealed: false },
      { text: 'الهريس', points: 25, revealed: false },
      { text: 'المجبوس', points: 20, revealed: false },
      { text: 'التمر', points: 17, revealed: false },
      { text: 'القهوة', points: 10, revealed: false },
    ],
  },
  {
    question: 'حيوان تحبه',
    answers: [
      { text: 'القط', points: 28, revealed: false },
      { text: 'الكلب', points: 22, revealed: false },
      { text: 'الحصان', points: 18, revealed: false },
      { text: 'الأرنب', points: 15, revealed: false },
      { text: 'الطائر', points: 12, revealed: false },
      { text: 'السلاحف', points: 5, revealed: false },
    ],
  },
  {
    question: 'لون تحبه',
    answers: [
      { text: 'أزرق', points: 28, revealed: false },
      { text: 'أسود', points: 22, revealed: false },
      { text: 'أبيض', points: 18, revealed: false },
      { text: 'أحمر', points: 17, revealed: false },
      { text: 'أخضر', points: 15, revealed: false },
    ],
  },
];

// ============================================================
// BrandedHeader
// ============================================================
function BrandedHeader() {
  return (
    <div className="w-full border-b border-slate-800/30 bg-slate-950/95 backdrop-blur-md">
      <div className="max-w-7xl mx-auto flex items-center justify-between h-14 px-4">
        <a href="/" className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-rose-500 to-amber-600 flex items-center justify-center shadow-lg shadow-rose-500/20">
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
          <h1 className="text-base sm:text-lg font-black bg-gradient-to-l from-rose-400 via-amber-300 to-rose-400 bg-clip-text text-transparent">
            ألعاب الغريب
          </h1>
        </a>
        <div className="flex items-center gap-4">
          <span className="text-xs sm:text-sm font-bold text-slate-400">
            🏆 فاميلي فيود
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
    <div className="w-full border-t border-slate-800/30 bg-slate-950/60 mt-auto">
      <div className="flex flex-col items-center gap-0.5 py-2 px-3">
        <div className="flex items-center justify-center gap-1.5">
          <span className="text-xs sm:text-sm">🏆</span>
          <span className="text-[10px] sm:text-xs font-bold bg-gradient-to-l from-rose-400 via-amber-300 to-rose-400 bg-clip-text text-transparent">
            فاميلي فيود | Family Feud
          </span>
          <span className="text-xs sm:text-sm">🏆</span>
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
// Confetti Effect (fixed - uses drop-shadow for glow)
// ============================================================
const CONFETTI_EMOJIS = ['🎉', '🎊', '✨', '🌟', '💫', '🏆', '🥇', '🎆'];
const CONFETTI_COLORS = ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#FF69B4', '#98D8C8', '#F7DC6F', '#BB8FCE'];

function ConfettiPiece({ delay, left }: { delay: number; left: string }) {
  const emoji = CONFETTI_EMOJIS[Math.floor(Math.random() * CONFETTI_EMOJIS.length)];
  const color = CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)];
  const size = 16 + Math.random() * 16;
  return (
    <motion.div
      initial={{ top: '-30px', opacity: 1, rotate: 0 }}
      animate={{
        top: ['0vh', '105vh'],
        opacity: [1, 1, 1, 0.3],
        rotate: [0, 360 * (Math.random() > 0.5 ? 1 : -1)],
        x: [(Math.random() - 0.5) * 100, (Math.random() - 0.5) * 300],
      }}
      transition={{ duration: 3 + Math.random() * 3, delay, repeat: Infinity, repeatDelay: 1 + Math.random() }}
      className="fixed z-[200] pointer-events-none"
      style={{ left, fontSize: size }}
    >
      <span style={{ filter: `drop-shadow(0 0 8px ${color})` }}>{emoji}</span>
    </motion.div>
  );
}

function ConfettiOverlay() {
  const pieces = Array.from({ length: 25 }, (_, i) => ({
    delay: Math.random() * 3,
    left: `${Math.random() * 100}%`,
  }));
  return (
    <div className="fixed inset-0 z-[200] pointer-events-none overflow-hidden">
      {pieces.map((p, i) => (
        <ConfettiPiece key={`${i}-${p.left}-${p.delay}`} {...p} />
      ))}
    </div>
  );
}

// ============================================================
// Sound Manager (visual feedback)
// ============================================================
function useScreenShake() {
  const [shaking, setShaking] = useState(false);
  const shake = useCallback(() => {
    setShaking(true);
    setTimeout(() => setShaking(false), 500);
  }, []);
  return { shaking, shake };
}

// ============================================================
// Feedback Overlay (correct/wrong answer popup)
// ============================================================
function FeedbackOverlay({ show, correct, answer }: { show: boolean; correct: boolean; answer?: string }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: -50, scale: 0.5 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 30, scale: 0.5 }}
          transition={{ duration: 0.3 }}
          className="fixed top-1/3 left-1/2 -translate-x-1/2 z-[100] pointer-events-none"
        >
          <div className={cn(
            'flex flex-col items-center gap-2 px-6 py-4 rounded-2xl border-2 backdrop-blur-lg',
            correct
              ? 'bg-emerald-950/80 border-emerald-400/60 shadow-lg shadow-emerald-500/20'
              : 'bg-red-950/80 border-red-400/60 shadow-lg shadow-red-500/20'
          )}>
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.1, type: 'spring', stiffness: 300 }}
            >
              {correct ? (
                <CheckCircle className="w-10 h-10 text-emerald-400" />
              ) : (
                <XCircle className="w-10 h-10 text-red-400" />
              )}
            </motion.div>
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className={cn('font-black text-lg', correct ? 'text-emerald-300' : 'text-red-300')}
            >
              {correct ? 'إجابة صحيحة! ✅' : 'إجابة خاطئة ❌'}
            </motion.p>
            {correct && answer && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-sm text-emerald-400/80"
              >
                {answer}
              </motion.p>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ============================================================
// LANDING PAGE
// ============================================================
function LandingPage({ onStart }: { onStart: () => void }) {
  return (
    <div className="flex-1 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="max-w-lg w-full text-center"
      >
        {/* Game Icon */}
        <motion.div
          animate={{ rotate: [0, 5, -5, 0], scale: [1, 1.05, 1] }}
          transition={{ duration: 3, repeat: Infinity }}
          className="text-7xl sm:text-8xl mb-6"
        >
          🏆
        </motion.div>

        {/* Title */}
        <h1 className="text-4xl sm:text-5xl font-black mb-3">
          <span className="bg-gradient-to-l from-rose-400 via-amber-300 to-rose-500 bg-clip-text text-transparent">
            فاميلي فيود
          </span>
        </h1>
        <p className="text-sm text-slate-400 font-bold mb-2">Family Feud</p>

        {/* Description */}
        <p className="text-base sm:text-lg text-slate-400 mb-8 leading-relaxed max-w-md mx-auto">
          فريقين يتنافسون لتخمين أكثر الإجابات شعبية على أسئلة استطلاعية!
          <br />
          <span className="text-slate-500 text-sm">العراب 🔴 ضد الديوانية 🟡</span>
        </p>

        {/* Features */}
        <div className="grid grid-cols-3 gap-3 mb-8 max-w-sm mx-auto">
          {[
            { icon: '🎯', label: 'أسئلة استطلاعية' },
            { icon: '⚔️', label: 'مواجهة مباشرة' },
            { icon: '💰', label: 'جائزة مالية' },
          ].map((f, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + i * 0.1 }}
              className="bg-slate-900/80 border border-slate-800/50 rounded-xl p-3 text-center"
            >
              <div className="text-2xl mb-1">{f.icon}</div>
              <p className="text-[11px] text-slate-400">{f.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Team Preview */}
        <div className="flex gap-4 justify-center mb-8">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            className="flex items-center gap-2 bg-red-950/40 border border-red-500/30 rounded-xl px-4 py-3"
          >
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center text-xl">
              👑
            </div>
            <div className="text-right">
              <p className="text-sm font-bold text-red-300">العراب</p>
              <p className="text-[10px] text-red-400/60">الفريق الأحمر</p>
            </div>
          </motion.div>
          <div className="text-2xl self-center text-slate-600 font-bold">VS</div>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
            className="flex items-center gap-2 bg-amber-950/40 border border-amber-500/30 rounded-xl px-4 py-3"
          >
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-xl">
              🏛️
            </div>
            <div className="text-right">
              <p className="text-sm font-bold text-amber-300">الديوانية</p>
              <p className="text-[10px] text-amber-400/60">الفريق الذهبي</p>
            </div>
          </motion.div>
        </div>

        {/* Start Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <Button
            onClick={onStart}
            size="lg"
            className="bg-gradient-to-l from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-black text-lg px-10 py-7 shadow-xl shadow-rose-500/25 hover:shadow-rose-500/40 transition-all w-full sm:w-auto"
          >
            <Play className="w-5 h-5 ml-2" />
            ابدأ اللعب
          </Button>
        </motion.div>

        {/* Players Info */}
        <p className="text-xs text-slate-600 mt-4">
          👥 2-10 لاعبين | 5 جولات + جولة الجائزة الكبرى
        </p>
      </motion.div>
    </div>
  );
}

// ============================================================
// TEAM SETUP
// ============================================================
function TeamSetup({ onStartGame }: { onStartGame: (team1: string[], team2: string[]) => void }) {
  const [team1Players, setTeam1Players] = useState<string[]>(['']);
  const [team2Players, setTeam2Players] = useState<string[]>(['']);

  const addPlayer = (team: 1 | 2) => {
    if (team === 1 && team1Players.length < 5) {
      setTeam1Players([...team1Players, '']);
    } else if (team === 2 && team2Players.length < 5) {
      setTeam2Players([...team2Players, '']);
    }
  };

  const removePlayer = (team: 1 | 2, index: number) => {
    if (team === 1 && team1Players.length > 1) {
      setTeam1Players(team1Players.filter((_, i) => i !== index));
    } else if (team === 2 && team2Players.length > 1) {
      setTeam2Players(team2Players.filter((_, i) => i !== index));
    }
  };

  const updatePlayer = (team: 1 | 2, index: number, name: string) => {
    if (team === 1) {
      const updated = [...team1Players];
      updated[index] = name;
      setTeam1Players(updated);
    } else {
      const updated = [...team2Players];
      updated[index] = name;
      setTeam2Players(updated);
    }
  };

  const canStart = team1Players.some(p => p.trim()) && team2Players.some(p => p.trim());

  return (
    <div className="flex-1 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-lg w-full"
      >
        <h2 className="text-2xl sm:text-3xl font-black text-center mb-2">
          <span className="bg-gradient-to-l from-rose-400 to-amber-400 bg-clip-text text-transparent">
            إعداد الفرق
          </span>
        </h2>
        <p className="text-sm text-slate-500 text-center mb-6">أدخل أسماء اللاعبين لكل فريق</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Team 1 - العراب */}
          <Card className="bg-slate-900/80 border-red-500/30">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center text-sm">
                  👑
                </div>
                <div>
                  <h3 className="text-sm font-bold text-red-300">العراب</h3>
                  <p className="text-[10px] text-red-400/60">الفريق الأحمر</p>
                </div>
              </div>
              <div className="space-y-2">
                {team1Players.map((player, i) => (
                  <div key={i} className="flex gap-2">
                    <Input
                      value={player}
                      onChange={(e) => updatePlayer(1, i, e.target.value)}
                      placeholder={`لاعب ${i + 1}`}
                      className="bg-slate-800/60 border-red-900/40 text-red-100 placeholder:text-red-800/40 h-9 text-sm"
                    />
                    {team1Players.length > 1 && (
                      <button onClick={() => removePlayer(1, i)} className="text-red-500/60 hover:text-red-400 p-1">
                        <Minus className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
                {team1Players.length < 5 && (
                  <button onClick={() => addPlayer(1)} className="flex items-center gap-1 text-xs text-red-400/60 hover:text-red-300 mt-1">
                    <Plus className="w-3 h-3" /> إضافة لاعب
                  </button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Team 2 - الديوانية */}
          <Card className="bg-slate-900/80 border-amber-500/30">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-sm">
                  🏛️
                </div>
                <div>
                  <h3 className="text-sm font-bold text-amber-300">الديوانية</h3>
                  <p className="text-[10px] text-amber-400/60">الفريق الذهبي</p>
                </div>
              </div>
              <div className="space-y-2">
                {team2Players.map((player, i) => (
                  <div key={i} className="flex gap-2">
                    <Input
                      value={player}
                      onChange={(e) => updatePlayer(2, i, e.target.value)}
                      placeholder={`لاعب ${i + 1}`}
                      className="bg-slate-800/60 border-amber-900/40 text-amber-100 placeholder:text-amber-800/40 h-9 text-sm"
                    />
                    {team2Players.length > 1 && (
                      <button onClick={() => removePlayer(2, i)} className="text-amber-500/60 hover:text-amber-400 p-1">
                        <Minus className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
                {team2Players.length < 5 && (
                  <button onClick={() => addPlayer(2)} className="flex items-center gap-1 text-xs text-amber-400/60 hover:text-amber-300 mt-1">
                    <Plus className="w-3 h-3" /> إضافة لاعب
                  </button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="text-center mt-6">
          <Button
            onClick={() => {
              const t1 = team1Players.filter(p => p.trim());
              const t2 = team2Players.filter(p => p.trim());
              onStartGame(t1.length > 0 ? t1 : ['اللاعب 1'], t2.length > 0 ? t2 : ['اللاعب 1']);
            }}
            disabled={!canStart}
            className="bg-gradient-to-l from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-bold px-10 py-6 disabled:opacity-40"
          >
            <Play className="w-5 h-5 ml-2" />
            ابدأ اللعبة
          </Button>
        </div>
      </motion.div>
    </div>
  );
}

// ============================================================
// ANSWER BOARD
// ============================================================
function AnswerSlot({
  answer,
  index,
  teamColor,
  onReveal,
  revealed,
  shakeAnim,
}: {
  answer: SurveyAnswer;
  index: number;
  teamColor: 'red' | 'amber';
  onReveal?: () => void;
  revealed: boolean;
  shakeAnim: boolean;
}) {
  const colors = {
    red: {
      bg: 'bg-red-900/60',
      border: 'border-red-500/50',
      text: 'text-red-200',
      points: 'text-red-400',
      hidden: 'from-red-800 to-red-900',
      check: 'text-red-300',
    },
    amber: {
      bg: 'bg-amber-900/60',
      border: 'border-amber-500/50',
      text: 'text-amber-200',
      points: 'text-amber-400',
      hidden: 'from-amber-800 to-amber-900',
      check: 'text-amber-300',
    },
  };
  const c = colors[teamColor];

  return (
    <motion.div
      layout
      initial={false}
      animate={shakeAnim ? { x: [0, -5, 5, -5, 5, 0] } : {}}
      transition={{ duration: 0.4 }}
      onClick={onReveal}
      className={cn(
        'relative flex items-center gap-3 rounded-xl px-4 py-3 border overflow-hidden cursor-pointer transition-all duration-300',
        revealed
          ? `${c.bg} ${c.border} border`
          : `bg-slate-800/40 border-slate-700/30 hover:border-slate-600/50`
      )}
    >
      {/* Rank Number */}
      <div className={cn(
        'w-8 h-8 rounded-full flex items-center justify-center text-sm font-black shrink-0',
        revealed ? `${c.bg} ${c.check}` : 'bg-slate-700/50 text-slate-500'
      )}>
        {index + 1}
      </div>

      {/* Answer Text / Points */}
      {revealed ? (
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
          className="flex-1 flex items-center justify-between"
        >
          <span className={cn('font-bold text-sm', c.text)}>{answer.text}</span>
          <span className={cn('font-black text-lg', c.points)}>{answer.points}</span>
        </motion.div>
      ) : (
        <div className="flex-1 flex items-center justify-between">
          <div className="flex-1 h-3 bg-slate-700/30 rounded-full" />
        </div>
      )}
    </motion.div>
  );
}

// ============================================================
// STRIKE MARK
// ============================================================
function StrikeMark({ show, index }: { show: boolean; index: number }) {
  return (
    <motion.div
      initial={false}
      animate={show ? { scale: [0, 1.3, 1], opacity: [0, 1], rotate: [0, -20, 0] } : { scale: 0, opacity: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
      className="text-3xl sm:text-4xl font-black"
    >
      <span className={show ? 'text-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.5)]' : 'text-transparent'}>✕</span>
    </motion.div>
  );
}

// ============================================================
// FACE-OFF SCREEN
// ============================================================
function FaceOffScreen({
  question,
  team1Name,
  team2Name,
  team1Player,
  team2Player,
  onTeam1Buzz,
  onTeam2Buzz,
  showTimer,
  timeLeft,
}: {
  question: string;
  team1Name: string;
  team2Name: string;
  team1Player: string;
  team2Player: string;
  onTeam1Buzz: () => void;
  onTeam2Buzz: () => void;
  showTimer: boolean;
  timeLeft: number;
}) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4 gap-6">
      {/* Timer */}
      {showTimer && (
        <motion.div
          animate={{ scale: timeLeft <= 5 ? [1, 1.1, 1] : 1 }}
          transition={{ repeat: timeLeft <= 5 ? Infinity : 0, duration: 0.5 }}
          className={cn(
            'text-5xl sm:text-6xl font-black tabular-nums',
            timeLeft <= 5 ? 'text-red-400' : timeLeft <= 10 ? 'text-amber-400' : 'text-slate-300'
          )}
        >
          {timeLeft}
        </motion.div>
      )}

      {/* Question */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <p className="text-xs text-slate-500 mb-2">سؤال الاستطلاع</p>
        <h2 className="text-xl sm:text-2xl font-black text-white max-w-md leading-relaxed">
          &quot;{question}&quot;
        </h2>
      </motion.div>

      {/* Teams Face-Off */}
      <div className="flex items-center gap-3 sm:gap-6 w-full max-w-md">
        {/* Team 1 */}
        <motion.button
          whileTap={{ scale: 0.95 }}
          whileHover={{ scale: 1.02 }}
          onClick={onTeam1Buzz}
          className="flex-1 bg-gradient-to-b from-red-800/60 to-red-900/40 border-2 border-red-500/40 hover:border-red-400/70 rounded-2xl p-4 sm:p-6 text-center transition-all cursor-pointer"
        >
          <div className="text-3xl sm:text-4xl mb-2">👑</div>
          <p className="text-sm font-bold text-red-300">{team1Name}</p>
          <p className="text-xs text-red-400/60 mt-1">{team1Player}</p>
          <motion.div
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
            className="mt-3 bg-red-700/50 rounded-lg py-2 px-4"
          >
            <p className="text-xs font-bold text-red-200">🔴 اضغط للإجابة</p>
          </motion.div>
        </motion.button>

        {/* VS */}
        <div className="text-xl sm:text-2xl font-black text-slate-600">VS</div>

        {/* Team 2 */}
        <motion.button
          whileTap={{ scale: 0.95 }}
          whileHover={{ scale: 1.02 }}
          onClick={onTeam2Buzz}
          className="flex-1 bg-gradient-to-b from-amber-800/60 to-amber-900/40 border-2 border-amber-500/40 hover:border-amber-400/70 rounded-2xl p-4 sm:p-6 text-center transition-all cursor-pointer"
        >
          <div className="text-3xl sm:text-4xl mb-2">🏛️</div>
          <p className="text-sm font-bold text-amber-300">{team2Name}</p>
          <p className="text-xs text-amber-400/60 mt-1">{team2Player}</p>
          <motion.div
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ repeat: Infinity, duration: 1.5, delay: 0.75 }}
            className="mt-3 bg-amber-700/50 rounded-lg py-2 px-4"
          >
            <p className="text-xs font-bold text-amber-200">🟡 اضغط للإجابة</p>
          </motion.div>
        </motion.button>
      </div>
    </div>
  );
}

// ============================================================
// MAIN GAME BOARD
// ============================================================
function GameBoard({
  question,
  answers,
  currentTeam,
  team1Score,
  team2Score,
  team1Name,
  team2Name,
  strikes,
  maxStrikes,
  team1Players,
  team2Players,
  currentPlayerIndex,
  onGuess,
  shakeAnim,
  round,
  totalRounds,
  phase,
  stealAnswer,
  onStealSubmit,
  onStealInput,
  showStealInput,
}: {
  question: string;
  answers: SurveyAnswer[];
  currentTeam: 1 | 2;
  team1Score: number;
  team2Score: number;
  team1Name: string;
  team2Name: string;
  strikes: number;
  maxStrikes: number;
  team1Players: string[];
  team2Players: string[];
  currentPlayerIndex: number;
  onGuess: (guess: string) => void;
  shakeAnim: boolean;
  round: number;
  totalRounds: number;
  phase: 'playing' | 'steal';
  stealAnswer: string;
  onStealSubmit: () => void;
  onStealInput: (v: string) => void;
  showStealInput: boolean;
}) {
  const [guessInput, setGuessInput] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const teamColor = currentTeam === 1 ? 'red' : 'amber';

  const players = currentTeam === 1 ? team1Players : team2Players;
  const currentPlayer = players[currentPlayerIndex % players.length];

  const handleSubmit = () => {
    if (guessInput.trim()) {
      onGuess(guessInput.trim());
      setGuessInput('');
    }
  };

  return (
    <div className="flex-1 flex flex-col p-3 sm:p-4 gap-3">
      {/* Top Bar: Scores + Round */}
      <div className="flex items-center justify-between gap-2">
        {/* Team 1 Score */}
        <div className={cn(
          'flex items-center gap-2 rounded-xl px-3 py-2 border',
          currentTeam === 1 ? 'bg-red-950/50 border-red-500/40' : 'bg-slate-900/40 border-slate-800/30'
        )}>
          <span className="text-lg">👑</span>
          <div>
            <p className="text-[10px] text-red-400/60">{team1Name}</p>
            <p className="text-lg font-black text-red-300 tabular-nums">{team1Score}</p>
          </div>
        </div>

        {/* Round Info */}
        <Badge variant="outline" className="border-slate-700 text-slate-400 text-[10px] px-2">
          الجولة {round}/{totalRounds}
        </Badge>

        {/* Team 2 Score */}
        <div className={cn(
          'flex items-center gap-2 rounded-xl px-3 py-2 border',
          currentTeam === 2 ? 'bg-amber-950/50 border-amber-500/40' : 'bg-slate-900/40 border-slate-800/30'
        )}>
          <div className="text-left">
            <p className="text-[10px] text-amber-400/60">{team2Name}</p>
            <p className="text-lg font-black text-amber-300 tabular-nums">{team2Score}</p>
          </div>
          <span className="text-lg">🏛️</span>
        </div>
      </div>

      {/* Question */}
      <div className="text-center py-2">
        <h2 className="text-base sm:text-lg font-black text-white leading-relaxed">
          &quot;{question}&quot;
        </h2>
      </div>

      {/* Strike Marks */}
      <div className="flex justify-center gap-3">
        {Array.from({ length: maxStrikes }).map((_, i) => (
          <StrikeMark key={i} show={i < strikes} index={i} />
        ))}
      </div>

      {/* Phase Indicator */}
      <div className="text-center">
        <Badge className={cn(
          'text-xs font-bold',
          phase === 'steal'
            ? 'bg-gradient-to-l from-rose-600 to-amber-600 text-white'
            : currentTeam === 1
              ? 'bg-red-900/60 border border-red-500/40 text-red-300'
              : 'bg-amber-900/60 border border-amber-500/40 text-amber-300'
        )}>
          {phase === 'steal' ? '⚡ فرصة السرقة!' : `${currentTeam === 1 ? '👑' : '🏛️'} دور ${currentTeam === 1 ? team1Name : team2Name}`}
        </Badge>
        {phase === 'playing' && (
          <p className="text-xs text-slate-500 mt-1">
            اللاعب: <span className={currentTeam === 1 ? 'text-red-400' : 'text-amber-400'}>{currentPlayer}</span>
          </p>
        )}
      </div>

      {/* Answer Board */}
      <motion.div
        animate={shakeAnim ? { x: [0, -8, 8, -8, 8, 0] } : {}}
        transition={{ duration: 0.5 }}
        className="grid grid-cols-1 sm:grid-cols-2 gap-2 flex-1"
      >
        {answers.map((answer, i) => (
          <AnswerSlot
            key={i}
            answer={answer}
            index={i}
            teamColor={teamColor}
            revealed={answer.revealed}
          />
        ))}
      </motion.div>

      {/* Input */}
      <div className="mt-auto">
        {phase === 'playing' && (
          <div className="flex gap-2">
            <Input
              ref={inputRef}
              value={guessInput}
              onChange={(e) => setGuessInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              placeholder="اكتب إجابتك..."
              className={cn(
                'flex-1 h-12 text-base',
                currentTeam === 1
                  ? 'bg-red-950/30 border-red-900/40 text-red-100 placeholder:text-red-800/30'
                  : 'bg-amber-950/30 border-amber-900/40 text-amber-100 placeholder:text-amber-800/30'
              )}
            />
            <Button
              onClick={handleSubmit}
              disabled={!guessInput.trim()}
              className={cn(
                'h-12 px-6 font-bold',
                currentTeam === 1
                  ? 'bg-gradient-to-l from-red-600 to-red-700 hover:from-red-500 hover:to-red-600'
                  : 'bg-gradient-to-l from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600'
              )}
            >
              <Zap className="w-4 h-4" />
            </Button>
            <Button
              onClick={() => {
                const players = currentTeam === 1 ? team1Players : team2Players;
                setCurrentPlayerIndex((prev) => (prev + 1) % players.length);
                setGuessInput('');
              }}
              variant="ghost"
              className="h-12 px-3 text-slate-500 hover:text-slate-300"
              title="تخطي الدور"
            >
              <SkipForward className="w-5 h-5" />
            </Button>
          </div>
        )}

        {phase === 'steal' && showStealInput && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-l from-rose-950/60 to-amber-950/60 border border-rose-500/30 rounded-xl p-3"
          >
            <p className="text-sm font-bold text-white text-center mb-2">
              ⚡ فرصة السرقة - {currentTeam === 1 ? team2Name : team1Name}!
            </p>
            <div className="flex gap-2">
              <Input
                value={stealAnswer}
                onChange={(e) => onStealInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && onStealSubmit()}
                placeholder="إجابة واحدة فقط للسرقة!"
                className="flex-1 h-11 bg-slate-800/60 border-slate-700/40 text-white"
              />
              <Button
                onClick={onStealSubmit}
                disabled={!stealAnswer.trim()}
                className="h-11 px-5 bg-gradient-to-l from-rose-600 to-amber-600 font-bold"
              >
                سرق!
              </Button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

// ============================================================
// ROUND RESULT
// ============================================================
function RoundResult({
  teamName,
  points,
  teamColor,
  message,
  onContinue,
}: {
  teamName: string;
  points: number;
  teamColor: 'red' | 'amber';
  message: string;
  onContinue: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex-1 flex items-center justify-center p-4"
    >
      <Card className={cn(
        'max-w-sm w-full text-center border',
        teamColor === 'red' ? 'bg-red-950/40 border-red-500/30' : 'bg-amber-950/40 border-amber-500/30'
      )}>
        <CardContent className="p-6 sm:p-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="text-6xl mb-4"
          >
            {teamColor === 'red' ? '👑' : '🏛️'}
          </motion.div>
          <h3 className={cn('text-xl font-black mb-2', teamColor === 'red' ? 'text-red-300' : 'text-amber-300')}>
            {teamName}
          </h3>
          <p className="text-sm text-slate-400 mb-4">{message}</p>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className={cn(
              'text-5xl font-black mb-6',
              teamColor === 'red' ? 'text-red-400' : 'text-amber-400'
            )}
          >
            +{points}
          </motion.div>
          <Button
            onClick={onContinue}
            className={cn(
              'w-full font-bold h-12',
              teamColor === 'red'
                ? 'bg-gradient-to-l from-red-600 to-red-700 hover:from-red-500 hover:to-red-600'
                : 'bg-gradient-to-l from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600'
            )}
          >
            التالي
            <ChevronLeft className="w-4 h-4 mr-2" />
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ============================================================
// FAST MONEY
// ============================================================
function FastMoney({
  questions,
  currentQuestionIndex,
  onGuess,
  timeLeft,
  score,
  playerName,
  teamName,
  teamColor,
}: {
  questions: SurveyQuestion[];
  currentQuestionIndex: number;
  onGuess: (guess: string) => void;
  timeLeft: number;
  score: number;
  playerName: string;
  teamName: string;
  teamColor: 'red' | 'amber';
}) {
  const [guessInput, setGuessInput] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const currentQ = questions[currentQuestionIndex];
  const answered = currentQuestionIndex;
  const total = questions.length;

  useEffect(() => {
    setGuessInput('');
    inputRef.current?.focus();
  }, [currentQuestionIndex]);

  const handleSubmit = () => {
    if (guessInput.trim()) {
      onGuess(guessInput.trim());
      setGuessInput('');
    }
  };

  return (
    <div className="flex-1 flex flex-col p-4 gap-4">
      {/* Header */}
      <div className="text-center">
        <Badge className="bg-gradient-to-l from-rose-600 to-amber-600 text-white font-bold text-xs mb-2">
          💰 جائزة مالية مضاعفة!
        </Badge>
        <p className={cn('text-sm font-bold', teamColor === 'red' ? 'text-red-300' : 'text-amber-300')}>
          {teamName} - {playerName}
        </p>
      </div>

      {/* Progress */}
      <div className="flex gap-1 justify-center">
        {questions.map((_, i) => (
          <div
            key={i}
            className={cn(
              'w-8 h-1.5 rounded-full transition-all',
              i < answered ? (teamColor === 'red' ? 'bg-red-500' : 'bg-amber-500') : 'bg-slate-700',
              i === currentQuestionIndex && (teamColor === 'red' ? 'ring-2 ring-red-400' : 'ring-2 ring-amber-400')
            )}
          />
        ))}
      </div>

      {/* Timer */}
      <div className="text-center">
        <motion.div
          animate={{ scale: timeLeft <= 5 ? [1, 1.1, 1] : 1 }}
          transition={{ repeat: timeLeft <= 5 ? Infinity : 0, duration: 0.5 }}
          className={cn(
            'text-4xl font-black tabular-nums',
            timeLeft <= 5 ? 'text-red-400' : timeLeft <= 10 ? 'text-amber-400' : 'text-slate-300'
          )}
        >
          {timeLeft}
        </motion.div>
      </div>

      {/* Score so far */}
      <div className="text-center">
        <p className="text-xs text-slate-500">المجموع حتى الآن</p>
        <p className={cn('text-3xl font-black', teamColor === 'red' ? 'text-red-400' : 'text-amber-400')}>{score}</p>
      </div>

      {/* Current Question */}
      {currentQ && currentQuestionIndex < total && (
        <motion.div
          key={currentQuestionIndex}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <p className="text-xs text-slate-500 mb-1">سؤال {currentQuestionIndex + 1} من {total}</p>
          <h3 className="text-lg sm:text-xl font-black text-white">
            &quot;{currentQ.question}&quot;
          </h3>
        </motion.div>
      )}

      {/* Previous answers summary */}
      {answered > 0 && (
        <div className="flex flex-wrap gap-2 justify-center max-h-20 overflow-y-auto">
          {questions.slice(0, answered).map((q, i) => (
            <Badge key={i} variant="outline" className="text-[10px] border-slate-700 text-slate-400">
              {q.question.slice(0, 20)}... → {q.answers.filter(a => a.revealed).reduce((s, a) => s + a.points, 0) || 0}
            </Badge>
          ))}
        </div>
      )}

      {/* Input */}
      {currentQuestionIndex < total && (
        <div className="mt-auto">
          <div className="flex gap-2">
            <Input
              ref={inputRef}
              value={guessInput}
              onChange={(e) => setGuessInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              placeholder="إجابتك..."
              className="flex-1 h-12 text-base bg-slate-900/60 border-slate-700/40 text-white"
            />
            <Button onClick={handleSubmit} disabled={!guessInput.trim()} className="h-12 px-6 bg-gradient-to-l from-rose-600 to-amber-600 font-bold">
              <Zap className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// GAME OVER
// ============================================================
function GameOver({
  team1Name,
  team2Name,
  team1Score,
  team2Score,
  winner,
  onPlayAgain,
}: {
  team1Name: string;
  team2Name: string;
  team1Score: number;
  team2Score: number;
  winner: 1 | 2;
  onPlayAgain: () => void;
}) {
  return (
    <div className="flex-1 flex items-center justify-center p-4">
      <ConfettiOverlay />
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.7 }}
        className="max-w-sm w-full text-center"
      >
        <motion.div
          animate={{ scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="text-8xl mb-4"
        >
          🏆
        </motion.div>

        <h2 className="text-3xl sm:text-4xl font-black mb-2">
          <span className={cn(
            'bg-clip-text text-transparent',
            winner === 1 ? 'bg-gradient-to-l from-red-400 to-amber-400' : 'bg-gradient-to-l from-amber-400 to-rose-400'
          )}>
            {winner === 1 ? team1Name : team2Name}
          </span>
        </h2>
        <p className="text-lg text-slate-400 mb-6">فاز باللعبة! 🎉</p>

        {/* Score Board */}
        <div className="flex gap-3 justify-center mb-8">
          <Card className={cn(
            'flex-1 border',
            winner === 1 ? 'bg-red-950/50 border-red-500/40 ring-2 ring-red-500/30' : 'bg-slate-900/50 border-slate-800/30'
          )}>
            <CardContent className="p-4">
              <div className="text-2xl mb-1">👑</div>
              <p className="text-sm font-bold text-red-300">{team1Name}</p>
              <p className="text-3xl font-black text-red-400">{team1Score}</p>
            </CardContent>
          </Card>
          <Card className={cn(
            'flex-1 border',
            winner === 2 ? 'bg-amber-950/50 border-amber-500/40 ring-2 ring-amber-500/30' : 'bg-slate-900/50 border-slate-800/30'
          )}>
            <CardContent className="p-4">
              <div className="text-2xl mb-1">🏛️</div>
              <p className="text-sm font-bold text-amber-300">{team2Name}</p>
              <p className="text-3xl font-black text-amber-400">{team2Score}</p>
            </CardContent>
          </Card>
        </div>

        <Button onClick={onPlayAgain} className="bg-gradient-to-l from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-bold px-8 h-12">
          <RotateCcw className="w-4 h-4 ml-2" />
          العب مرة ثانية
        </Button>
      </motion.div>
    </div>
  );
}

// ============================================================
// GAME TOP BAR
// ============================================================
function GameTopBar({ round, totalRounds, onExit, onReset }: { round: number; totalRounds: number; onExit: () => void; onReset: () => void }) {
  const [showExitDialog, setShowExitDialog] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  return (
    <>
      <div className="sticky top-0 z-50 border-b border-slate-800/50 bg-slate-950/90 backdrop-blur-sm">
        <div className="max-w-md mx-auto flex items-center justify-between px-3 py-1.5">
          <Button
            onClick={() => setShowExitDialog(true)}
            variant="ghost"
            className="text-slate-400 hover:text-red-400 hover:bg-red-950/30 gap-1.5 text-xs h-8 px-2"
          >
            <HomeIcon className="w-4 h-4" />
            <span className="hidden sm:inline">الرئيسية</span>
          </Button>

          <Badge variant="outline" className="border-slate-700 text-slate-400 text-[10px] px-2 py-0.5">
            🏆 الجولة {round}/{totalRounds}
          </Badge>

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
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex items-center gap-1">
                <span className="text-[10px] text-red-400 font-bold">مؤكد؟</span>
                <button onClick={() => { onReset(); setShowResetConfirm(false); }} className="text-[10px] bg-red-900/60 text-red-300 px-1.5 py-0.5 rounded font-bold cursor-pointer">نعم</button>
                <button onClick={() => setShowResetConfirm(false)} className="text-[10px] bg-slate-800/60 text-slate-400 px-1.5 py-0.5 rounded font-bold cursor-pointer">لا</button>
              </motion.div>
            )}
          </div>
        </div>
      </div>

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
              className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-sm w-full shadow-2xl text-center"
            >
              <div className="text-5xl mb-3">🚪</div>
              <h3 className="text-lg font-bold text-slate-200 mb-2">الخروج من اللعبة؟</h3>
              <p className="text-sm text-slate-400 mb-6">سيتم إعادة تعيين اللعبة بالكامل.</p>
              <div className="flex gap-3">
                <Button onClick={() => setShowExitDialog(false)} variant="outline" className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-800 h-11">إلغاء</Button>
                <Button onClick={onExit} className="flex-1 bg-gradient-to-l from-red-700 to-red-900 hover:from-red-600 hover:to-red-800 text-white font-bold h-11">نعم</Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// ============================================================
// MAIN PAGE
// ============================================================
type GamePhase = 'landing' | 'setup' | 'faceoff' | 'playing' | 'steal' | 'roundResult' | 'fastMoney' | 'gameOver';

export default function FamilyFeudPage() {
  const mounted = useHydrated();

  // Game State
  const [phase, setPhase] = useState<GamePhase>('landing');
  const [team1Players, setTeam1Players] = useState<string[]>([]);
  const [team2Players, setTeam2Players] = useState<string[]>([]);
  const [team1Score, setTeam1Score] = useState(0);
  const [team2Score, setTeam2Score] = useState(0);
  const [currentRound, setCurrentRound] = useState(1);
  const [currentTeam, setCurrentTeam] = useState<1 | 2>(1);
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [strikes, setStrikes] = useState(0);
  const [questions, setQuestions] = useState<SurveyQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [roundPoints, setRoundPoints] = useState(0);
  const [stealAnswer, setStealAnswer] = useState('');
  const [showStealInput, setShowStealInput] = useState(false);

  // Fast Money State
  const [fastMoneyQuestions, setFastMoneyQuestions] = useState<SurveyQuestion[]>([]);
  const [fmCurrentIndex, setFmCurrentIndex] = useState(0);
  const [fmScore, setFmScore] = useState(0);
  const [fmTimeLeft, setFmTimeLeft] = useState(20);
  const [fmTeam, setFmTeam] = useState<1 | 2>(1);
  const [fmPlayerIndex, setFmPlayerIndex] = useState(0);

  // Face-off Timer
  const [faceoffTimeLeft, setFaceoffTimeLeft] = useState(0);

  // Visual
  const { shaking, shake } = useScreenShake();

  // Shuffle questions on game start
  const startGame = useCallback((t1: string[], t2: string[]) => {
    setTeam1Players(t1);
    setTeam2Players(t2);
    const shuffled = [...SURVEY_QUESTIONS].sort(() => Math.random() - 0.5).slice(0, 5).map(q => ({
      ...q,
      answers: q.answers.map(a => ({ ...a, revealed: false })),
    }));
    setQuestions(shuffled);
    setCurrentRound(1);
    setTeam1Score(0);
    setTeam2Score(0);
    setCurrentTeam(Math.random() < 0.5 ? 1 : 2);
    setCurrentPlayerIndex(0);
    setStrikes(0);
    setRoundPoints(0);
    setFaceoffTimeLeft(10);
    setPhase('faceoff');
  }, []);

  // Face-off Timer
  useEffect(() => {
    if (phase !== 'faceoff' || faceoffTimeLeft <= 0) return;
    const timer = setInterval(() => {
      setFaceoffTimeLeft(prev => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [phase, faceoffTimeLeft]);

  // Auto-start face-off if timer runs out
  useEffect(() => {
    if (phase === 'faceoff' && faceoffTimeLeft <= 0) {
      handleFaceoffTeam(currentTeam);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [faceoffTimeLeft, phase]);

  // Fast Money Timer
  useEffect(() => {
    if (phase !== 'fastMoney' || fmTimeLeft <= 0) return;
    const timer = setInterval(() => {
      setFmTimeLeft(prev => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [phase, fmTimeLeft]);

  // Auto-move to next FM question on timeout
  useEffect(() => {
    if (phase === 'fastMoney' && fmTimeLeft <= 0) {
      // No answer given, move to next
      if (fmCurrentIndex < fastMoneyQuestions.length - 1) {
        setFmCurrentIndex(prev => prev + 1);
        setFmTimeLeft(20);
      } else {
        // FM over
        finishFastMoney();
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fmTimeLeft, phase]);

  const handleFaceoffTeam = useCallback((team: 1 | 2) => {
    setCurrentTeam(team);
    setCurrentPlayerIndex(0);
    setStrikes(0);
    setPhase('playing');
  }, []);

  const handleGuess = useCallback((guess: string) => {
    const currentQ = questions[currentQuestionIndex];
    if (!currentQ) return;

    const normalized = guess.trim();
    const matchIndex = currentQ.answers.findIndex(
      a => !a.revealed && a.text.includes(normalized) || normalized.includes(a.text)
    );

    // Also check if it's close enough (remove diacritics, compare)
    let foundIndex = matchIndex;
    if (foundIndex === -1) {
      foundIndex = currentQ.answers.findIndex(a => {
        if (a.revealed) return false;
        const aClean = a.text.replace(/[ً-ً]/g, '').replace(/[\u064B-\u065F]/g, '');
        const gClean = normalized.replace(/[\u064B-\u065F]/g, '');
        return aClean === gClean || aClean.includes(gClean) || gClean.includes(aClean);
      });
    }

    if (foundIndex !== -1) {
      // Correct!
      const newAnswers = [...currentQ.answers];
      newAnswers[foundIndex] = { ...newAnswers[foundIndex], revealed: true };
      const newQuestions = [...questions];
      newQuestions[currentQuestionIndex] = { ...currentQ, answers: newAnswers };
      setQuestions(newQuestions);
      setRoundPoints(prev => prev + currentQ.answers[foundIndex].points);

      // Check if all revealed
      const allRevealed = newAnswers.every(a => a.revealed);
      if (allRevealed) {
        const totalPoints = newAnswers.reduce((s, a) => s + a.points, 0);
        setTimeout(() => {
          if (currentTeam === 1) setTeam1Score(s => s + totalPoints);
          else setTeam2Score(s => s + totalPoints);
          setRoundPoints(totalPoints);
          setPhase('roundResult');
        }, 800);
      } else {
        // Next player same team
        const players = currentTeam === 1 ? team1Players : team2Players;
        setCurrentPlayerIndex(prev => (prev + 1) % players.length);
      }
    } else {
      // Wrong!
      shake();
      setStrikes(prev => prev + 1);

      const players = currentTeam === 1 ? team1Players : team2Players;
      setCurrentPlayerIndex(prev => (prev + 1) % players.length);

      if (strikes + 1 >= 3) {
        // 3 strikes - steal opportunity
        setTimeout(() => {
          setPhase('steal');
          setShowStealInput(true);
        }, 600);
      }
    }
  }, [questions, currentQuestionIndex, currentTeam, strikes, team1Players, team2Players, shake]);

  const handleStealSubmit = useCallback(() => {
    if (!stealAnswer.trim()) return;

    const currentQ = questions[currentQuestionIndex];
    if (!currentQ) return;

    const stealTeam: 1 | 2 = currentTeam === 1 ? 2 : 1;
    const normalized = stealAnswer.trim();

    const matchIndex = currentQ.answers.findIndex(a => {
      if (a.revealed) return false;
      const aClean = a.text.replace(/[\u064B-\u065F]/g, '');
      const gClean = normalized.replace(/[\u064B-\u065F]/g, '');
      return aClean === gClean || aClean.includes(gClean) || gClean.includes(aClean) || a.text.includes(normalized) || normalized.includes(a.text);
    });

    if (matchIndex !== -1) {
      // Steal successful!
      const newAnswers = [...currentQ.answers];
      newAnswers[matchIndex] = { ...newAnswers[matchIndex], revealed: true };
      const newQuestions = [...questions];
      newQuestions[currentQuestionIndex] = { ...currentQ, answers: newAnswers };
      setQuestions(newQuestions);

      const totalPoints = newAnswers.reduce((s, a) => s + a.points, 0);
      if (stealTeam === 1) setTeam1Score(s => s + totalPoints);
      else setTeam2Score(s => s + totalPoints);
      setRoundPoints(totalPoints);
      setCurrentTeam(stealTeam);
    } else {
      // Steal failed - original team keeps revealed points
      const revealedPoints = currentQ.answers.filter(a => a.revealed).reduce((s, a) => s + a.points, 0);
      if (currentTeam === 1) setTeam1Score(s => s + revealedPoints);
      else setTeam2Score(s => s + revealedPoints);
      setRoundPoints(revealedPoints);
    }

    setShowStealInput(false);
    setStealAnswer('');
    setTimeout(() => setPhase('roundResult'), 500);
  }, [stealAnswer, questions, currentQuestionIndex, currentTeam]);

  const handleNextRound = useCallback(() => {
    if (currentRound >= 5) {
      // Start Fast Money
      const shuffled = [...FAST_MONEY_QUESTIONS].sort(() => Math.random() - 0.5).slice(0, 5).map(q => ({
        ...q,
        answers: q.answers.map(a => ({ ...a, revealed: false })),
      }));
      setFastMoneyQuestions(shuffled);
      setFmCurrentIndex(0);
      setFmScore(0);
      setFmTimeLeft(20);
      setFmTeam(team1Score >= team2Score ? 2 : 1);
      setFmPlayerIndex(0);
      setPhase('fastMoney');
    } else {
      setCurrentRound(prev => prev + 1);
      setCurrentQuestionIndex(prev => prev + 1);
      setCurrentTeam(prev => prev === 1 ? 2 : 1);
      setCurrentPlayerIndex(0);
      setStrikes(0);
      setRoundPoints(0);
      setFaceoffTimeLeft(10);
      setPhase('faceoff');
    }
  }, [currentRound, team1Score, team2Score]);

  const handleFastMoneyGuess = useCallback((guess: string) => {
    const currentQ = fastMoneyQuestions[fmCurrentIndex];
    if (!currentQ) return;

    const normalized = guess.trim();
    const matchIndex = currentQ.answers.findIndex(a => {
      if (a.revealed) return false;
      const aClean = a.text.replace(/[\u064B-\u065F]/g, '');
      const gClean = normalized.replace(/[\u064B-\u065F]/g, '');
      return aClean === gClean || aClean.includes(gClean) || gClean.includes(aClean) || a.text.includes(normalized) || normalized.includes(a.text);
    });

    if (matchIndex !== -1) {
      const newAnswers = [...currentQ.answers];
      newAnswers[matchIndex] = { ...newAnswers[matchIndex], revealed: true };
      const newQuestions = [...fastMoneyQuestions];
      newQuestions[fmCurrentIndex] = { ...currentQ, answers: newAnswers };
      setFastMoneyQuestions(newQuestions);
      setFmScore(prev => prev + currentQ.answers[matchIndex].points * 2); // Double points!
    }

    if (fmCurrentIndex < fastMoneyQuestions.length - 1) {
      setFmCurrentIndex(prev => prev + 1);
      setFmTimeLeft(20);
    } else {
      finishFastMoney();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fastMoneyQuestions, fmCurrentIndex]);

  const finishFastMoney = useCallback(() => {
    if (fmTeam === 1) setTeam1Score(s => s + fmScore);
    else setTeam2Score(s => s + fmScore);
    setTimeout(() => setPhase('gameOver'), 500);
  }, [fmTeam, fmScore]);

  const resetGame = useCallback(() => {
    setPhase('landing');
    setTeam1Players([]);
    setTeam2Players([]);
    setTeam1Score(0);
    setTeam2Score(0);
    setCurrentRound(1);
    setCurrentTeam(1);
    setCurrentPlayerIndex(0);
    setStrikes(0);
    setQuestions([]);
    setCurrentQuestionIndex(0);
    setRoundPoints(0);
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950">
        <div className="text-center flex-1 flex items-center justify-center">
          <div>
            <div className="text-5xl mb-4">🏆</div>
            <p className="text-slate-400">جاري التحميل...</p>
          </div>
        </div>
        <BrandedFooter />
      </div>
    );
  }

  // LANDING
  if (phase === 'landing') {
    return (
      <div className="min-h-screen flex flex-col bg-slate-950">
        <BrandedHeader />
        <LandingPage onStart={() => setPhase('setup')} />
        <BrandedFooter />
      </div>
    );
  }

  // SETUP
  if (phase === 'setup') {
    return (
      <div className="min-h-screen flex flex-col bg-slate-950">
        <BrandedHeader />
        <TeamSetup onStartGame={startGame} />
        <BrandedFooter />
      </div>
    );
  }

  // GAME OVER
  if (phase === 'gameOver') {
    const winner = team1Score >= team2Score ? 1 : 2;
    return (
      <div className="min-h-screen flex flex-col bg-slate-950">
        <GameTopBar round={5} totalRounds={5} onExit={resetGame} onReset={resetGame} />
        <GameOver
          team1Name="العراب"
          team2Name="الديوانية"
          team1Score={team1Score}
          team2Score={team2Score}
          winner={winner}
          onPlayAgain={resetGame}
        />
        <BrandedFooter />
      </div>
    );
  }

  // FACE-OFF
  if (phase === 'faceoff') {
    const currentQ = questions[currentQuestionIndex];
    if (!currentQ) return null;
    const team1Player = team1Players[0] || 'اللاعب 1';
    const team2Player = team2Players[0] || 'اللاعب 1';

    return (
      <div className="min-h-screen flex flex-col bg-slate-950">
        <GameTopBar round={currentRound} totalRounds={5} onExit={resetGame} onReset={resetGame} />
        <FaceOffScreen
          question={currentQ.question}
          team1Name="العراب"
          team2Name="الديوانية"
          team1Player={team1Player}
          team2Player={team2Player}
          onTeam1Buzz={() => handleFaceoffTeam(1)}
          onTeam2Buzz={() => handleFaceoffTeam(2)}
          showTimer={faceoffTimeLeft > 0}
          timeLeft={faceoffTimeLeft}
        />
        <BrandedFooter />
      </div>
    );
  }

  // ROUND RESULT
  if (phase === 'roundResult') {
    return (
      <div className="min-h-screen flex flex-col bg-slate-950">
        <GameTopBar round={currentRound} totalRounds={5} onExit={resetGame} onReset={resetGame} />
        <RoundResult
          teamName={currentTeam === 1 ? 'العراب' : 'الديوانية'}
          points={roundPoints}
          teamColor={currentTeam === 1 ? 'red' : 'amber'}
          message={currentRound >= 5 ? 'نتيجة الجولة الأخيرة!' : 'حصل على النقاط!'}
          onContinue={handleNextRound}
        />
        <BrandedFooter />
      </div>
    );
  }

  // FAST MONEY
  if (phase === 'fastMoney') {
    const players = fmTeam === 1 ? team1Players : team2Players;
    const player = players[fmPlayerIndex] || 'لاعب';

    return (
      <div className="min-h-screen flex flex-col bg-slate-950">
        <GameTopBar round={6} totalRounds={5} onExit={resetGame} onReset={resetGame} />
        <FastMoney
          questions={fastMoneyQuestions}
          currentQuestionIndex={fmCurrentIndex}
          onGuess={handleFastMoneyGuess}
          timeLeft={fmTimeLeft}
          score={fmScore}
          playerName={player}
          teamName={fmTeam === 1 ? 'العراب' : 'الديوانية'}
          teamColor={fmTeam === 1 ? 'red' : 'amber'}
        />
        <BrandedFooter />
      </div>
    );
  }

  // PLAYING / STEAL
  const currentQ = questions[currentQuestionIndex];
  if (!currentQ) return null;

  return (
    <div className={cn('min-h-screen flex flex-col bg-slate-950 transition-transform', shaking && 'animate-shake')}>
      <GameTopBar round={currentRound} totalRounds={5} onExit={resetGame} onReset={resetGame} />
      <GameBoard
        question={currentQ.question}
        answers={currentQ.answers}
        currentTeam={currentTeam}
        team1Score={team1Score}
        team2Score={team2Score}
        team1Name="العراب"
        team2Name="الديوانية"
        strikes={strikes}
        maxStrikes={3}
        team1Players={team1Players}
        team2Players={team2Players}
        currentPlayerIndex={currentPlayerIndex}
        onGuess={handleGuess}
        shakeAnim={shaking}
        round={currentRound}
        totalRounds={5}
        phase={phase}
        stealAnswer={stealAnswer}
        onStealSubmit={handleStealSubmit}
        onStealInput={setStealAnswer}
        showStealInput={showStealInput}
      />
      <BrandedFooter />
    </div>
  );
}
