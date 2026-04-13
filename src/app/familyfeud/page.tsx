'use client';

import { useSyncExternalStore, useState, useCallback, useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Home as HomeIcon,
  RotateCcw,
  Plus,
  Minus,
  Play,
  Crown,
  Home,
  Zap,
  Users,
  Info,
  ChevronLeft,
  CheckCircle,
  XCircle,
  SkipForward,
  Clock,
  Trophy,
  Eye,
  EyeOff,
  ArrowLeft,
} from 'lucide-react';
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
// Sound Effects Hook (Web Audio API)
// ============================================================
function useSoundEffects(soundEnabled: boolean) {
  const audioCtxRef = useRef<AudioContext | null>(null);
  const enabledRef = useRef(soundEnabled);
  useEffect(() => { enabledRef.current = soundEnabled; }, [soundEnabled]);

  const getCtx = useCallback(() => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new AudioContext();
    }
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  }, []);

  const playCorrect = useCallback(() => {
    if (!enabledRef.current) return;
    try {
      const ctx = getCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.setValueAtTime(1100, ctx.currentTime + 0.1);
      osc.frequency.setValueAtTime(1320, ctx.currentTime + 0.2);
      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.5);
    } catch {}
  }, [getCtx]);

  const playBuzz = useCallback(() => {
    if (!enabledRef.current) return;
    try {
      const ctx = getCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(90, ctx.currentTime);
      osc.frequency.setValueAtTime(70, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.4);
    } catch {}
  }, [getCtx]);

  const playStrike = useCallback(() => {
    if (!enabledRef.current) return;
    try {
      const ctx = getCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'square';
      osc.frequency.setValueAtTime(200, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(50, ctx.currentTime + 0.3);
      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.4);
      // Second layer
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(150, ctx.currentTime + 0.05);
      osc2.frequency.linearRampToValueAtTime(40, ctx.currentTime + 0.35);
      gain2.gain.setValueAtTime(0.2, ctx.currentTime + 0.05);
      gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.45);
      osc2.start(ctx.currentTime + 0.05);
      osc2.stop(ctx.currentTime + 0.45);
    } catch {}
  }, [getCtx]);

  const playReveal = useCallback(() => {
    if (!enabledRef.current) return;
    try {
      const ctx = getCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.08);
      osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.25);
    } catch {}
  }, [getCtx]);

  const playSteal = useCallback(() => {
    if (!enabledRef.current) return;
    try {
      const ctx = getCtx();
      // Tension rising
      for (let i = 0; i < 4; i++) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(300 + i * 100, ctx.currentTime + i * 0.15);
        gain.gain.setValueAtTime(0.15, ctx.currentTime + i * 0.15);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * 0.15 + 0.2);
        osc.start(ctx.currentTime + i * 0.15);
        osc.stop(ctx.currentTime + i * 0.15 + 0.2);
      }
    } catch {}
  }, [getCtx]);

  const playWin = useCallback(() => {
    if (!enabledRef.current) return;
    try {
      const ctx = getCtx();
      const notes = [523, 659, 784, 1047, 784, 1047];
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.15);
        gain.gain.setValueAtTime(0.2, ctx.currentTime + i * 0.15);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * 0.15 + 0.3);
        osc.start(ctx.currentTime + i * 0.15);
        osc.stop(ctx.currentTime + i * 0.15 + 0.3);
      });
    } catch {}
  }, [getCtx]);

  const playCountdown = useCallback(() => {
    if (!enabledRef.current) return;
    try {
      const ctx = getCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1000, ctx.currentTime);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.1);
    } catch {}
  }, [getCtx]);

  return { playCorrect, playBuzz, playStrike, playReveal, playSteal, playWin, playCountdown };
}

// ============================================================
// Types
// ============================================================
type GamePhase =
  | 'landing'
  | 'godfather_setup'
  | 'diwaniya_setup'
  | 'faceoff'
  | 'gameboard'
  | 'steal'
  | 'round_result'
  | 'fast_money_intro'
  | 'fast_money'
  | 'fast_money_results'
  | 'game_over';

interface Answer {
  text: string;
  points: number;
  revealed: boolean;
}

interface Question {
  question: string;
  answers: Answer[];
}

// ============================================================
// Questions Database (80+ Arabic Survey Questions)
// ============================================================
const ALL_QUESTIONS: Question[] = [
  // --- 65 questions from provided list ---
  {
    question: "اذكر شيئاً تأكله مع البسكويت:",
    answers: [
      { text: "شوربة", points: 28, revealed: false },
      { text: "جبنة", points: 24, revealed: false },
      { text: "زبدة فول سوداني", points: 21, revealed: false },
      { text: "شطة/فلفل", points: 16, revealed: false },
      { text: "لحوم مقطعة", points: 11, revealed: false },
    ],
  },
  {
    question: "اذكر شيئاً يفعله الناس غالباً في الليل:",
    answers: [
      { text: "قراءة كتاب", points: 26, revealed: false },
      { text: "استخدام الهاتف", points: 23, revealed: false },
      { text: "لعب ألعاب لوحية", points: 20, revealed: false },
      { text: "لعب ألعاب فيديو", points: 17, revealed: false },
      { text: "تأمل", points: 14, revealed: false },
    ],
  },
  {
    question: "اذكر أشياء ساخنة:",
    answers: [
      { text: "نار", points: 26, revealed: false },
      { text: "قهوة", points: 24, revealed: false },
      { text: "شاي", points: 21, revealed: false },
      { text: "موقد", points: 16, revealed: false },
      { text: "مدفأة", points: 13, revealed: false },
    ],
  },
  {
    question: "اذكر شيئاً مفتوناً به الكثير من الأطفال:",
    answers: [
      { text: "ألعاب فيديو/كمبيوتر", points: 41, revealed: false },
      { text: "حلويات/وجبات سريعة", points: 29, revealed: false },
      { text: "تلفزيون", points: 20, revealed: false },
      { text: "موسيقى", points: 5, revealed: false },
    ],
  },
  {
    question: "اذكر شيئاً يخاف منه بعض الناس ركوبه:",
    answers: [
      { text: "طائرة", points: 44, revealed: false },
      { text: "دراجة نارية", points: 21, revealed: false },
      { text: "أفعوانية", points: 16, revealed: false },
      { text: "قارب", points: 4, revealed: false },
      { text: "حصان", points: 4, revealed: false },
      { text: "مصعد", points: 3, revealed: false },
    ],
  },
  {
    question: "اذكر مكاناً ذا طاقة عالية يذهب إليه الناس:",
    answers: [
      { text: "ملعب رياضي", points: 28, revealed: false },
      { text: "حفل موسيقي", points: 27, revealed: false },
      { text: "بار/نادي", points: 15, revealed: false },
      { text: "سينما", points: 8, revealed: false },
      { text: "مدينة ملاهي", points: 6, revealed: false },
    ],
  },
  {
    question: "اذكر شيئاً شائعاً يخاف منه الناس:",
    answers: [
      { text: "الارتفاعات", points: 50, revealed: false },
      { text: "العناكب", points: 25, revealed: false },
      { text: "التحدث أمام الجمهور", points: 15, revealed: false },
      { text: "الطيران", points: 10, revealed: false },
    ],
  },
  {
    question: "اذكر شيئاً يفقده الرجال طوال الوقت:",
    answers: [
      { text: "المفاتيح", points: 50, revealed: false },
      { text: "الهاتف", points: 25, revealed: false },
      { text: "المحفظة", points: 15, revealed: false },
      { text: "النظارات الشمسية", points: 10, revealed: false },
    ],
  },
  {
    question: "اذكر حيواناً له رقبة طويلة:",
    answers: [
      { text: "زرافة", points: 78, revealed: false },
      { text: "نعامة", points: 10, revealed: false },
      { text: "بجعة", points: 3, revealed: false },
      { text: "كركي", points: 3, revealed: false },
      { text: "بطة", points: 2, revealed: false },
    ],
  },
  {
    question: "اذكر مكاناً تجد فيه النساء مفاتيحهن:",
    answers: [
      { text: "في المنزل", points: 55, revealed: false },
      { text: "في المول", points: 17, revealed: false },
      { text: "في حقيبة اليد", points: 10, revealed: false },
      { text: "في السيارة", points: 7, revealed: false },
      { text: "في بار", points: 6, revealed: false },
    ],
  },
  {
    question: "اذكر مكاناً تقابل فيه الناس شريك حياتهم:",
    answers: [
      { text: "المدرسة/الجامعة", points: 56, revealed: false },
      { text: "الكنيسة/المسجد", points: 26, revealed: false },
      { text: "مناسبات عائلية", points: 9, revealed: false },
      { text: "طبيب/طبيبة أسنان", points: 4, revealed: false },
      { text: "العمل", points: 2, revealed: false },
    ],
  },
  {
    question: "إذا كان عليك إنفاق ألف دولار في ساعة، ماذا تشتري؟",
    answers: [
      { text: "ملابس", points: 22, revealed: false },
      { text: "إلكترونيات", points: 20, revealed: false },
      { text: "هاتف", points: 18, revealed: false },
      { text: "ذهب/مجوهرات", points: 15, revealed: false },
      { text: "طعام", points: 12, revealed: false },
    ],
  },
  {
    question: "ما الذي يضعه الناس في البيتزا ولا يجب أن يكون هناك؟",
    answers: [
      { text: "أناناس", points: 44, revealed: false },
      { text: "سردين/سمك", points: 21, revealed: false },
      { text: "باذنجان", points: 2, revealed: false },
    ],
  },
  {
    question: "ما هو الشيء الذي يجب أن يفعله الناس بعد الأكل؟",
    answers: [
      { text: "غسل الأسنان", points: 26, revealed: false },
      { text: "تمشيط الشعر", points: 23, revealed: false },
      { text: "عصر البثور", points: 19, revealed: false },
      { text: "تفقد الملابس", points: 17, revealed: false },
      { text: "التدرب على الرقص", points: 15, revealed: false },
    ],
  },
  {
    question: "اذكر مكاناً يختبئ فيه الوحش عند الأطفال:",
    answers: [
      { text: "تحت السرير", points: 45, revealed: false },
      { text: "داخل الخزانة", points: 36, revealed: false },
      { text: "في القبو", points: 7, revealed: false },
      { text: "في العلية", points: 2, revealed: false },
      { text: "تحت الدرج", points: 2, revealed: false },
    ],
  },
  {
    question: "اذكر شيئاً تفقدره عندما تنقطع الكهرباء:",
    answers: [
      { text: "التلفزيون", points: 50, revealed: false },
      { text: "الراديو", points: 23, revealed: false },
      { text: "المكنسة الكهربائية", points: 13, revealed: false },
      { text: "الإضاءة", points: 4, revealed: false },
    ],
  },
  {
    question: "اذكر مناسبة يرتدي فيها الناس ملابس خاصة:",
    answers: [
      { text: "التخرج", points: 32, revealed: false },
      { text: "الزفاف", points: 26, revealed: false },
      { text: "العطلات", points: 20, revealed: false },
      { text: "حفل ميلاد", points: 14, revealed: false },
      { text: "حفل بكالوريوس", points: 8, revealed: false },
    ],
  },
  {
    question: "ما الشيء الذي يخيف الناس في الأفعوانية؟",
    answers: [
      { text: "السرعة", points: 77, revealed: false },
      { text: "الارتفاع", points: 8, revealed: false },
      { text: "السقوط", points: 3, revealed: false },
      { text: "الزلاقة", points: 3, revealed: false },
    ],
  },
  {
    question: "ما أول شيء تفعله في الصباح؟",
    answers: [
      { text: "الهاتف", points: 59, revealed: false },
      { text: "طعام/شراب", points: 12, revealed: false },
      { text: "قهوة", points: 12, revealed: false },
      { text: "طفل يبكي", points: 11, revealed: false },
      { text: "سجائر", points: 2, revealed: false },
    ],
  },
  {
    question: "اذكر آلة موسيقية يسهل العزف عليها:",
    answers: [
      { text: "جيتار", points: 69, revealed: false },
      { text: "بانجو", points: 21, revealed: false },
      { text: "قيثارة", points: 4, revealed: false },
      { text: "بيانو", points: 2, revealed: false },
    ],
  },
  {
    question: "ما هو الشيء الذي يكره الناس تنظيفه؟",
    answers: [
      { text: "الحمام", points: 45, revealed: false },
      { text: "غسل الأطباق", points: 25, revealed: false },
      { text: "تنظيف الأرضية", points: 20, revealed: false },
      { text: "الغسيل", points: 10, revealed: false },
    ],
  },
  {
    question: "ما نوع المشروبات التي تسبب المتاعب؟",
    answers: [
      { text: "قهوة", points: 37, revealed: false },
      { text: "بيرة", points: 28, revealed: false },
      { text: "شاي", points: 17, revealed: false },
      { text: "مشاكل", points: 8, revealed: false },
    ],
  },
  {
    question: "اذكر مهنة تبدأ بحرف السين:",
    answers: [
      { text: "سائق", points: 40, revealed: false },
      { text: "سكرتير", points: 20, revealed: false },
      { text: "ساعي بريد", points: 15, revealed: false },
      { text: "ساحر", points: 15, revealed: false },
      { text: "سباك", points: 10, revealed: false },
    ],
  },
  {
    question: "إذا جلست بجانب شخص كريه الرائحة، ماذا تفعل؟",
    answers: [
      { text: "تبديل المقعد", points: 39, revealed: false },
      { text: "تغطية الأنف", points: 24, revealed: false },
      { text: "إدارة الرأس", points: 6, revealed: false },
      { text: "رش عطر", points: 6, revealed: false },
    ],
  },
  {
    question: "اذكر نوع بيت مخيف:",
    answers: [
      { text: "بيت مسكون", points: 27, revealed: false },
      { text: "بيت الكلب", points: 8, revealed: false },
      { text: "بيت زجاجي", points: 6, revealed: false },
      { text: "مرحاض خارجي", points: 5, revealed: false },
    ],
  },
  {
    question: "اذكر مكاناً تحب فيه النوم:",
    answers: [
      { text: "السرير", points: 46, revealed: false },
      { text: "الحمام/الدش", points: 27, revealed: false },
      { text: "السينما", points: 9, revealed: false },
      { text: "السيارة", points: 4, revealed: false },
    ],
  },
  {
    question: "ما أول شيء تنظفه قبل وصول الضيوف؟",
    answers: [
      { text: "الحمام", points: 59, revealed: false },
      { text: "المطبخ", points: 18, revealed: false },
      { text: "الأرضيات", points: 11, revealed: false },
      { text: "غرفة المعيشة", points: 3, revealed: false },
    ],
  },
  {
    question: "أي وحش يستطيع هزيمة دراكولا في قتال؟",
    answers: [
      { text: "غودزيلا", points: 43, revealed: false },
      { text: "فرانكنشتاين", points: 26, revealed: false },
      { text: "كينغ كونغ", points: 13, revealed: false },
      { text: "رجل الذئب", points: 10, revealed: false },
    ],
  },
  {
    question: "ما أكثر عذر شائع للتأخر عن العمل؟",
    answers: [
      { text: "نمت متأخراً", points: 52, revealed: false },
      { text: "زحمة سير", points: 25, revealed: false },
      { text: "مشكلة بالسيارة", points: 17, revealed: false },
      { text: "مريض", points: 6, revealed: false },
    ],
  },
  {
    question: "ما أكثر شيء تحبه في الحفلات؟",
    answers: [
      { text: "الرقص", points: 45, revealed: false },
      { text: "التحدث مع الناس", points: 21, revealed: false },
      { text: "الشرب", points: 18, revealed: false },
      { text: "الأكل", points: 8, revealed: false },
    ],
  },
  {
    question: "ماذا تطلب من الساحر إذا ذهبت إلى أرض أوز؟",
    answers: [
      { text: "المال", points: 37, revealed: false },
      { text: "الصحة/قلب جديد", points: 17, revealed: false },
      { text: "عقل", points: 7, revealed: false },
      { text: "جسم قوي", points: 5, revealed: false },
    ],
  },
  {
    question: "ما الشيء الذي كنت تفعله كل يوم في الروضة و تتمنى تفعله الآن؟",
    answers: [
      { text: "أخذ قيلولة", points: 64, revealed: false },
      { text: "اللعب بالألعاب", points: 19, revealed: false },
      { text: "التلوين/الرسم", points: 12, revealed: false },
      { text: "وجبات مجانية", points: 4, revealed: false },
    ],
  },
  {
    question: "اذكر بعض أبطال مارفل (الانتقامون):",
    answers: [
      { text: "كابتن أمريكا", points: 22, revealed: false },
      { text: "آيرون مان", points: 22, revealed: false },
      { text: "البنثر الأسود", points: 20, revealed: false },
      { text: "الرجل الأخضر/هالك", points: 15, revealed: false },
      { text: "ثور", points: 15, revealed: false },
    ],
  },
  {
    question: "لماذا قد يركب شخص الدراجة للعمل؟",
    answers: [
      { text: "ليس لديه سيارة", points: 46, revealed: false },
      { text: "للرياضة", points: 23, revealed: false },
      { text: "لتوفير البنزين", points: 20, revealed: false },
      { text: "للبيئة", points: 7, revealed: false },
    ],
  },
  {
    question: "ما طريقة لقلي البيض تصف أيضاً شخصاً؟",
    answers: [
      { text: "مخفوق/فوضوي", points: 53, revealed: false },
      { text: "مسلوق/صلب", points: 13, revealed: false },
      { text: "مقلي", points: 11, revealed: false },
      { text: "وجه يسمع شمس", points: 7, revealed: false },
    ],
  },
  {
    question: "ما أكثر شيء يفقده الرجال في البيت؟",
    answers: [
      { text: "ريموت التلفزيون", points: 34, revealed: false },
      { text: "شاحن الهاتف", points: 22, revealed: false },
      { text: "جوارب", points: 18, revealed: false },
      { text: "مفاتيح", points: 14, revealed: false },
    ],
  },
  {
    question: "ما أكثر شيء يفتقده الناس عن طفولتهم؟",
    answers: [
      { text: "ملاعب/أرجوحة", points: 28, revealed: false },
      { text: "كرتون", points: 24, revealed: false },
      { text: "حلوى", points: 20, revealed: false },
      { text: "ركوب الدراجة", points: 16, revealed: false },
      { text: "سهرات مع الأصدقاء", points: 12, revealed: false },
    ],
  },
  {
    question: "ما أكثر شيء يضايقك في تنظيف المنزل؟",
    answers: [
      { text: "سقوط شيء", points: 34, revealed: false },
      { text: "عودة الغبار", points: 22, revealed: false },
      { text: "ظهور آثار أقدام", points: 18, revealed: false },
      { text: "تساقط شعر الكلب", points: 16, revealed: false },
    ],
  },
  {
    question: "ما وجبة خفيفة صحية يتناولها الأطفال؟",
    answers: [
      { text: "رقائق بطاطس", points: 40, revealed: false },
      { text: "تفاح", points: 22, revealed: false },
      { text: "حبوب إفطار", points: 16, revealed: false },
      { text: "فشار", points: 12, revealed: false },
      { text: "جزر", points: 10, revealed: false },
    ],
  },
  {
    question: "ماذا يفعل شخص عندما يتحدث كثيراً ولا يعرف كيف يوقف؟",
    answers: [
      { text: "يقول 'المهم...'", points: 30, revealed: false },
      { text: "يضحك بشكل محرج", points: 24, revealed: false },
      { text: "يسأل سؤال فجأة", points: 20, revealed: false },
      { text: "ينظر للساعة", points: 16, revealed: false },
    ],
  },
  {
    question: "ما عادة سيئة يعاني منها الكثيرون؟",
    answers: [
      { text: "التدخين", points: 45, revealed: false },
      { text: "قضم الأظافر", points: 20, revealed: false },
      { text: "الإفراط في الأكل", points: 15, revealed: false },
      { text: "السب", points: 10, revealed: false },
      { text: "الشرب", points: 10, revealed: false },
    ],
  },
  {
    question: "ما الشيء الذي لا يملك الناس ما يكفي منه؟",
    answers: [
      { text: "المال", points: 39, revealed: false },
      { text: "الوقت", points: 27, revealed: false },
      { text: "النوم", points: 17, revealed: false },
      { text: "الطاقة", points: 10, revealed: false },
      { text: "أيام إجازة", points: 7, revealed: false },
    ],
  },
  {
    question: "ما الذي يأخذه الناس معهم في السفر؟",
    answers: [
      { text: "أدوات تنظيف شخصية", points: 29, revealed: false },
      { text: "ملابس/أحذية", points: 28, revealed: false },
      { text: "مال/بطاقة ائتمان", points: 20, revealed: false },
      { text: "أدوية", points: 9, revealed: false },
      { text: "كاميرا", points: 6, revealed: false },
    ],
  },
  {
    question: "ما أكثر ما يزعجك بالصور؟",
    answers: [
      { text: "شعرك", points: 28, revealed: false },
      { text: "الخلفية الفوضوية", points: 24, revealed: false },
      { text: "شيء في أسنانك", points: 20, revealed: false },
      { text: "شكلك المتعب", points: 16, revealed: false },
      { text: "الإضاءة الغريبة", points: 12, revealed: false },
    ],
  },
  {
    question: "ماذا يقول المصور عادة؟",
    answers: [
      { text: "الجميع يبتسموا!", points: 30, revealed: false },
      { text: "ليش تومض عيونك؟", points: 25, revealed: false },
      { text: "اثبت!", points: 20, revealed: false },
      { text: "ما تسوي وجه غريب!", points: 15, revealed: false },
    ],
  },
  {
    question: "ما أول شيء تفعله عندما تضيع هاتفك؟",
    answers: [
      { text: "اتصل به", points: 34, revealed: false },
      { text: "تفقد جيوبك", points: 24, revealed: false },
      { text: "تتبع خطواتك", points: 20, revealed: false },
      { text: "استخدم تطبيق البحث", points: 14, revealed: false },
    ],
  },
  {
    question: "ما أشياء عديمة الفائدة تجدها في كل بيت؟",
    answers: [
      { text: "بطاريات", points: 28, revealed: false },
      { text: "كابلات عشوائية", points: 22, revealed: false },
      { text: "شريط لاصق", points: 18, revealed: false },
      { text: "مفاتيح قديمة", points: 16, revealed: false },
      { text: "قوائم طعام", points: 16, revealed: false },
    ],
  },
  // --- Additional 30+ translated questions ---
  {
    question: "اذكر رياضة تلعب بكرة:",
    answers: [
      { text: "كرة القدم", points: 45, revealed: false },
      { text: "كرة السلة", points: 25, revealed: false },
      { text: "التنس", points: 15, revealed: false },
      { text: "كرة الطائرة", points: 10, revealed: false },
      { text: "البيسبول", points: 5, revealed: false },
    ],
  },
  {
    question: "اذكر شيئاً تشتريه يأتي في علبة محكمة الإغلاق:",
    answers: [
      { text: "المشروبات الغازية", points: 35, revealed: false },
      { text: "الحساء", points: 25, revealed: false },
      { text: "الفاصوليا", points: 20, revealed: false },
      { text: "التونة", points: 15, revealed: false },
      { text: "الفواكه المعلبة", points: 5, revealed: false },
    ],
  },
  {
    question: "اذكر سبباً يجعل الناس يذهبون لكاليفورنيا:",
    answers: [
      { text: "هوليوود", points: 30, revealed: false },
      { text: "الشواطئ", points: 25, revealed: false },
      { text: "ديزني لاند", points: 20, revealed: false },
      { text: "الطقس", points: 15, revealed: false },
      { text: "وادي السيليكون", points: 10, revealed: false },
    ],
  },
  {
    question: "اذكر شيئاً قد تجده في المرآب:",
    answers: [
      { text: "سيارة", points: 40, revealed: false },
      { text: "أدوات", points: 25, revealed: false },
      { text: "دراجة", points: 15, revealed: false },
      { text: "صناديق قديمة", points: 12, revealed: false },
      { text: "مجرفة", points: 8, revealed: false },
    ],
  },
  {
    question: "اذكر كلمة تعني 'سريع':",
    answers: [
      { text: "سريع", points: 45, revealed: false },
      { text: "عاجل", points: 20, revealed: false },
      { text: "مجنون", points: 15, revealed: false },
      { text: "فوري", points: 12, revealed: false },
      { text: "خاطف", points: 8, revealed: false },
    ],
  },
  {
    question: "اذكر بطل خارق:",
    answers: [
      { text: "سبايدرمان", points: 30, revealed: false },
      { text: "باتمان", points: 25, revealed: false },
      { text: "سوبرمان", points: 20, revealed: false },
      { text: "آيرون مان", points: 15, revealed: false },
      { text: "كابتن أمريكا", points: 10, revealed: false },
    ],
  },
  {
    question: "اذكر شيئاً يفهمه الكلب:",
    answers: [
      { text: "اسمه", points: 40, revealed: false },
      { text: "لا", points: 25, revealed: false },
      { text: "تعال", points: 20, revealed: false },
      { text: "اجلس", points: 10, revealed: false },
      { text: "لغة الجسد", points: 5, revealed: false },
    ],
  },
  {
    question: "اذكر شيئاً يحب الأطفال القفز عليه:",
    answers: [
      { text: "سرير", points: 35, revealed: false },
      { text: "مخدة", points: 25, revealed: false },
      { text: "ترامبولين", points: 20, revealed: false },
      { text: "أرجوحة", points: 12, revealed: false },
      { text: "ماء", points: 8, revealed: false },
    ],
  },
  {
    question: "اذكر شيئاً تشربه عندما تعطش:",
    answers: [
      { text: "ماء", points: 55, revealed: false },
      { text: "كولا", points: 20, revealed: false },
      { text: "عصير", points: 15, revealed: false },
      { text: "شاي", points: 5, revealed: false },
      { text: "حليب", points: 5, revealed: false },
    ],
  },
  {
    question: "اذكر عطلة يتناول الناس فيها الكثير من الطعام:",
    answers: [
      { text: "عيد الفطر", points: 40, revealed: false },
      { text: "عيد الأضحى", points: 30, revealed: false },
      { text: "رمضان", points: 15, revealed: false },
      { text: "العرس", points: 10, revealed: false },
      { text: "عيد الميلاد", points: 5, revealed: false },
    ],
  },
  {
    question: "اذكر شيئاً يفعله الناس في الموعد الأول:",
    answers: [
      { text: "السينما", points: 30, revealed: false },
      { text: "العشاء", points: 25, revealed: false },
      { text: "المشي", points: 20, revealed: false },
      { text: "التحدث", points: 15, revealed: false },
      { text: "القهوة", points: 10, revealed: false },
    ],
  },
  {
    question: "اذكر دولة مشهورة بطعامها:",
    answers: [
      { text: "إيطاليا", points: 35, revealed: false },
      { text: "فرنسا", points: 25, revealed: false },
      { text: "الهند", points: 15, revealed: false },
      { text: "اليابان", points: 15, revealed: false },
      { text: "المكسيك", points: 10, revealed: false },
    ],
  },
  {
    question: "اذكر شيئاً يصعب فتحه:",
    answers: [
      { text: "علبة مخلل", points: 30, revealed: false },
      { text: "برطمان مربى", points: 25, revealed: false },
      { text: "قفل", points: 20, revealed: false },
      { text: "حزمة بلاستيك", points: 15, revealed: false },
      { text: "صدف البحر", points: 10, revealed: false },
    ],
  },
  {
    question: "اذكر شيئاً لا يجب فعله أثناء القيادة:",
    answers: [
      { text: "استخدام الهاتف", points: 40, revealed: false },
      { text: "النوم", points: 20, revealed: false },
      { text: "الأكل", points: 15, revealed: false },
      { text: "موسيقى صاخبة", points: 15, revealed: false },
      { text: "التحدث كثيراً", points: 10, revealed: false },
    ],
  },
  {
    question: "اذكر سبباً قد يؤدي للتأخر:",
    answers: [
      { text: "الزحام", points: 30, revealed: false },
      { text: "النوم", points: 25, revealed: false },
      { text: "مشكلة بالسيارة", points: 20, revealed: false },
      { text: "الطقس", points: 15, revealed: false },
      { text: "نسيان شيء", points: 10, revealed: false },
    ],
  },
  {
    question: "اذكر شيئاً يجعل الطفل يتوقف عن البكاء:",
    answers: [
      { text: "حليب", points: 35, revealed: false },
      { text: "حضن", points: 25, revealed: false },
      { text: "لعبة", points: 20, revealed: false },
      { text: "أغنية", points: 12, revealed: false },
      { text: "تهدئة", points: 8, revealed: false },
    ],
  },
  {
    question: "اذكر مكاناً تذهب إليه في يوم حار:",
    answers: [
      { text: "الشاطئ", points: 35, revealed: false },
      { text: "المسبح", points: 30, revealed: false },
      { text: "مركز تسوق", points: 15, revealed: false },
      { text: "مكيف", points: 12, revealed: false },
      { text: "مقهى بارد", points: 8, revealed: false },
    ],
  },
  {
    question: "اذكر شيئاً قد يصادره المعلم:",
    answers: [
      { text: "الهاتف", points: 45, revealed: false },
      { text: "ألعاب", points: 20, revealed: false },
      { text: "مجلة", points: 15, revealed: false },
      { text: "سماعات", points: 12, revealed: false },
      { text: "طعام", points: 8, revealed: false },
    ],
  },
  {
    question: "اذكر شيئاً يخاف منه الناس في الظلام:",
    answers: [
      { text: "العفاريت", points: 30, revealed: false },
      { text: "اللصوص", points: 25, revealed: false },
      { text: "الأصوات", points: 20, revealed: false },
      { text: "العناكب", points: 15, revealed: false },
      { text: "الظل", points: 10, revealed: false },
    ],
  },
  {
    question: "اذكر شيئاً ترتبط به مصاصي الدماء:",
    answers: [
      { text: "الثوم", points: 30, revealed: false },
      { text: "الصلب", points: 25, revealed: false },
      { text: "الدم", points: 20, revealed: false },
      { text: "الأنياب", points: 15, revealed: false },
      { text: "الخفاش", points: 10, revealed: false },
    ],
  },
  {
    question: "اذكر مهنة يعرفها الجميع:",
    answers: [
      { text: "طبيب", points: 35, revealed: false },
      { text: "معلم", points: 25, revealed: false },
      { text: "مهندس", points: 20, revealed: false },
      { text: "محامي", points: 12, revealed: false },
      { text: "شرطي", points: 8, revealed: false },
    ],
  },
  {
    question: "اذكر طعاماً لزجاً:",
    answers: [
      { text: "عسل", points: 35, revealed: false },
      { text: "فول سوداني", points: 25, revealed: false },
      { text: "كراميل", points: 20, revealed: false },
      { text: "تمر", points: 12, revealed: false },
      { text: "جلي", points: 8, revealed: false },
    ],
  },
  {
    question: "اذكر شيئاً تفعله كل صباح:",
    answers: [
      { text: "الاستيقاظ", points: 30, revealed: false },
      { text: "شرب قهوة", points: 25, revealed: false },
      { text: "الاستحمام", points: 20, revealed: false },
      { text: "الإفطار", points: 15, revealed: false },
      { text: "فحص الهاتف", points: 10, revealed: false },
    ],
  },
  {
    question: "اذكر لوناً لا تود رؤيته في طعامك:",
    answers: [
      { text: "أخضر", points: 35, revealed: false },
      { text: "أسود", points: 25, revealed: false },
      { text: "أزرق", points: 20, revealed: false },
      { text: "رمادي", points: 12, revealed: false },
      { text: "بني غامق", points: 8, revealed: false },
    ],
  },
  {
    question: "اذكر شيئاً يستخدم الكهرباء:",
    answers: [
      { text: "التلفزيون", points: 25, revealed: false },
      { text: "الهاتف", points: 25, revealed: false },
      { text: "الثلاجة", points: 20, revealed: false },
      { text: "المكيف", points: 15, revealed: false },
      { text: "الغسالة", points: 10, revealed: false },
      { text: "المصباح", points: 5, revealed: false },
    ],
  },
  {
    question: "اذكر سبباً للاتصال بالشرطة:",
    answers: [
      { text: "سرقة", points: 35, revealed: false },
      { text: "حادث", points: 25, revealed: false },
      { text: "شجار", points: 20, revealed: false },
      { text: "ضجيج", points: 12, revealed: false },
      { text: "شكوى", points: 8, revealed: false },
    ],
  },
  {
    question: "اذكر واجباً منزلياً لا يحبه أحد:",
    answers: [
      { text: "غسل الأطباق", points: 35, revealed: false },
      { text: "تنظيف الحمام", points: 30, revealed: false },
      { text: "كنس الأرض", points: 15, revealed: false },
      { text: "نشر الغسيل", points: 10, revealed: false },
      { text: "تنظيف الفرن", points: 10, revealed: false },
    ],
  },
  {
    question: "ما الذي يضعه الناس على البيتزا؟",
    answers: [
      { text: "بيبروني", points: 50, revealed: false },
      { text: "فطر", points: 20, revealed: false },
      { text: "سجق", points: 15, revealed: false },
      { text: "فلفل أخضر", points: 15, revealed: false },
    ],
  },
  {
    question: "ماذا يفعل الناس عندما يبقون في المنزل؟",
    answers: [
      { text: "مشاهدة التلفزيون", points: 40, revealed: false },
      { text: "لعب ألعاب فيديو", points: 30, revealed: false },
      { text: "قراءة كتاب", points: 15, revealed: false },
      { text: "أخذ قيلولة", points: 15, revealed: false },
    ],
  },
  {
    question: "إذا كنت تنام وسمعت صوتاً في الليل، ما هو؟",
    answers: [
      { text: "خطوات", points: 34, revealed: false },
      { text: "صرير الباب", points: 28, revealed: false },
      { text: "كسر زجاج", points: 18, revealed: false },
      { text: "نباح كلب", points: 12, revealed: false },
      { text: "صوت مجهول", points: 8, revealed: false },
    ],
  },
];

// Fast Money questions (separate set)
const FAST_MONEY_QUESTIONS: Question[] = [
  {
    question: "شيء أحمر في البيت:",
    answers: [
      { text: "السجادة", points: 25, revealed: false },
      { text: "المخدة", points: 20, revealed: false },
      { text: "المايكرويف", points: 18, revealed: false },
      { text: "المفتاح", points: 17, revealed: false },
      { text: "الطفاية", points: 12, revealed: false },
      { text: "وسادة", points: 8, revealed: false },
    ],
  },
  {
    question: "شيء يبدأ بحرف الميم:",
    answers: [
      { text: "محمد", points: 30, revealed: false },
      { text: "ماء", points: 22, revealed: false },
      { text: "موبايل", points: 20, revealed: false },
      { text: "مدرسة", points: 15, revealed: false },
      { text: "مسجد", points: 13, revealed: false },
    ],
  },
  {
    question: "حيوان تحبه:",
    answers: [
      { text: "القط", points: 28, revealed: false },
      { text: "الكلب", points: 22, revealed: false },
      { text: "الحصان", points: 18, revealed: false },
      { text: "الأرنب", points: 15, revealed: false },
      { text: "الطائر", points: 12, revealed: false },
      { text: "السلاحف", points: 5, revealed: false },
    ],
  },
  {
    question: "لون تحبه:",
    answers: [
      { text: "أزرق", points: 28, revealed: false },
      { text: "أسود", points: 22, revealed: false },
      { text: "أبيض", points: 18, revealed: false },
      { text: "أحمر", points: 17, revealed: false },
      { text: "أخضر", points: 15, revealed: false },
    ],
  },
  {
    question: "شيء تفكر فيه قبل ما تنام:",
    answers: [
      { text: "المستقبل", points: 35, revealed: false },
      { text: "الأكل", points: 22, revealed: false },
      { text: "العائلة", points: 18, revealed: false },
      { text: "المال", points: 15, revealed: false },
      { text: "المشاكل", points: 10, revealed: false },
    ],
  },
];

// ============================================================
// Confetti Effect
// ============================================================
const CONFETTI_EMOJIS = ["🎉", "🎊", "✨", "🌟", "💫", "🏆", "🥇", "🎆"];
const CONFETTI_COLORS = [
  "#FFD700",
  "#FF6B6B",
  "#4ECDC4",
  "#45B7D1",
  "#FF69B4",
  "#98D8C8",
  "#F7DC6F",
  "#BB8FCE",
];

function ConfettiPiece({ delay, left }: { delay: number; left: string }) {
  const emoji = CONFETTI_EMOJIS[Math.floor(Math.random() * CONFETTI_EMOJIS.length)];
  const color = CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)];
  const size = 16 + Math.random() * 16;
  return (
    <motion.div
      initial={{ top: "-30px", opacity: 1, rotate: 0 }}
      animate={{
        top: ["0vh", "105vh"],
        opacity: [1, 1, 1, 0.3],
        rotate: [0, 360 * (Math.random() > 0.5 ? 1 : -1)],
        x: [(Math.random() - 0.5) * 100, (Math.random() - 0.5) * 300],
      }}
      transition={{
        duration: 3 + Math.random() * 3,
        delay,
        repeat: Infinity,
        repeatDelay: 1 + Math.random(),
      }}
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
// BrandedHeader
// ============================================================
function BrandedHeader() {
  return (
    <div className="w-full border-b border-slate-800/30 bg-slate-950/95 backdrop-blur-md">
      <div className="max-w-7xl mx-auto flex items-center justify-between h-14 px-4">
        <a href="/" className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-rose-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
            <img
              src="/platform-logo.png"
              alt="ألعاب الغريب"
              className="w-7 h-7 rounded-lg object-contain"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = "none";
                target.parentElement!.innerHTML =
                  "<span class='text-white text-sm font-black'>غ</span>";
              }}
            />
          </div>
          <h1 className="text-base sm:text-lg font-black bg-gradient-to-l from-amber-400 via-rose-300 to-amber-400 bg-clip-text text-transparent">
            ألعاب الغريب
          </h1>
        </a>
        <div className="flex items-center gap-4">
          <span className="text-xs sm:text-sm font-bold text-slate-400">
            🏆 فاميلي فيود
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
// BrandedFooter
// ============================================================
function BrandedFooter() {
  return (
    <div className="w-full border-t border-slate-800/30 bg-slate-950/60 mt-auto">
      <div className="max-w-7xl mx-auto flex flex-col items-center gap-1.5 py-3 px-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-500 to-rose-600 flex items-center justify-center">
            <img
              src="/platform-logo.png"
              alt="ألعاب الغريب"
              className="w-5 h-5 rounded-md object-contain"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = "none";
                target.parentElement!.innerHTML =
                  "<span class='text-white text-xs font-black'>غ</span>";
              }}
            />
          </div>
          <span className="text-sm font-bold bg-gradient-to-l from-amber-400 via-rose-300 to-amber-400 bg-clip-text text-transparent">
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
            <span className="font-bold bg-gradient-to-l from-blue-400 to-purple-400 bg-clip-text text-transparent">
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
// Feedback Overlay
// ============================================================
function FeedbackOverlay({
  show,
  correct,
  answer,
}: {
  show: boolean;
  correct: boolean;
  answer?: string;
}) {
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
          <div
            className={cn(
              "flex flex-col items-center gap-2 px-6 py-4 rounded-2xl border-2 backdrop-blur-lg",
              correct
                ? "bg-emerald-950/80 border-emerald-400/60 shadow-lg shadow-emerald-500/20"
                : "bg-red-950/80 border-red-400/60 shadow-lg shadow-red-500/20"
            )}
          >
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.1, type: "spring", stiffness: 300 }}
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
              className={cn(
                "font-black text-lg",
                correct ? "text-emerald-300" : "text-red-300"
              )}
            >
              {correct ? "إجابة صحيحة! ✅" : "إجابة خاطئة ❌"}
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
// Round Result Card (Big animated overlay for steal/no-steal results)
// ============================================================
function RoundResultCard({
  show,
  type,
  teamName,
  points,
}: {
  show: boolean;
  type: "steal_success" | "steal_fail" | "round_complete";
  teamName: string;
  points: number;
}) {
  const isSuccess = type === "steal_success";
  const isFail = type === "steal_fail";

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-[150] flex items-center justify-center bg-black/60 backdrop-blur-sm"
        >
          {isSuccess && <ConfettiOverlay />}
          <motion.div
            initial={{ scale: 0, rotate: -15, y: 50 }}
            animate={{ scale: 1, rotate: 0, y: 0 }}
            exit={{ scale: 0.5, rotate: 15, y: -50, opacity: 0 }}
            transition={{ type: "spring", stiffness: 280, damping: 22 }}
            className={cn(
              "max-w-sm w-full mx-4 rounded-3xl border-[3px] p-6 sm:p-8 text-center shadow-2xl relative overflow-hidden",
              isSuccess
                ? "bg-gradient-to-b from-emerald-950/95 to-emerald-900/90 border-emerald-400/60 shadow-emerald-500/40"
                : isFail
                  ? "bg-gradient-to-b from-red-950/95 to-red-900/90 border-red-400/60 shadow-red-500/40"
                  : "bg-gradient-to-b from-amber-950/95 to-amber-900/90 border-amber-400/60 shadow-amber-500/40"
            )}
          >
            {/* Background glow */}
            <motion.div
              animate={{ opacity: [0.2, 0.5, 0.2], scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className={cn(
                "absolute inset-0 pointer-events-none blur-3xl",
                isSuccess ? "bg-emerald-500/20" : isFail ? "bg-red-500/20" : "bg-amber-500/20"
              )}
            />

            <div className="relative z-10">
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.15, type: "spring", stiffness: 300 }}
                className="text-6xl mb-4"
              >
                {isSuccess ? "🎯" : isFail ? "🛡️" : "⚡"}
              </motion.div>

              <motion.h3
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className={cn(
                  "text-2xl sm:text-3xl font-black mb-2",
                  isSuccess ? "text-emerald-300" : isFail ? "text-red-300" : "text-amber-300"
                )}
              >
                {isSuccess ? "سرقة ناجحة!" : isFail ? "سرقة فاشلة!" : "جولة مكتملة!"}
              </motion.h3>

              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
                className={cn(
                  "text-sm sm:text-base mb-5",
                  isSuccess ? "text-emerald-200/80" : isFail ? "text-red-200/80" : "text-amber-200/80"
                )}
              >
                {isSuccess
                  ? `${teamName} يسرق الجولة!`
                  : isFail
                    ? `${teamName} يحتفظ بنقاطه!`
                    : `${teamName} يكشف كل الإجابات!`}
              </motion.p>

              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.4, type: "spring", stiffness: 400 }}
                className={cn(
                  "rounded-2xl px-6 py-4 inline-block border",
                  isSuccess
                    ? "bg-emerald-800/60 border-emerald-500/30"
                    : isFail
                      ? "bg-red-800/60 border-red-500/30"
                      : "bg-amber-800/60 border-amber-500/30"
                )}
              >
                <span
                  className={cn(
                    "text-4xl sm:text-5xl font-black tabular-nums",
                    isSuccess ? "text-emerald-300" : isFail ? "text-red-300" : "text-amber-300"
                  )}
                >
                  {isFail ? points : `+${points}`}
                </span>
                <p
                  className={cn(
                    "text-xs mt-1",
                    isSuccess ? "text-emerald-400/60" : isFail ? "text-red-400/60" : "text-amber-400/60"
                  )}
                >
                  {isFail ? "نقاط محفوظة" : "نقاط"}
                </p>
              </motion.div>

              {/* Decorative sparkles */}
              {isSuccess && (
                <>
                  <motion.div
                    animate={{ scale: [0, 1.5, 0], rotate: [0, 180] }}
                    transition={{ delay: 0.5, duration: 1.2 }}
                    className="absolute top-4 right-8 text-2xl opacity-80"
                  >
                    ✨
                  </motion.div>
                  <motion.div
                    animate={{ scale: [0, 1.5, 0], rotate: [0, -180] }}
                    transition={{ delay: 0.7, duration: 1.2 }}
                    className="absolute bottom-8 left-8 text-2xl opacity-80"
                  >
                    ✨
                  </motion.div>
                </>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ============================================================
// Strike Mark (animated X marks)
// ============================================================
function StrikeMark({ show, index }: { show: boolean; index: number }) {
  return (
    <motion.div
      initial={false}
      animate={
        show
          ? { scale: [0, 1.3, 1], opacity: [0, 1], rotate: [0, -20, 0] }
          : { scale: 0, opacity: 0 }
      }
      transition={{ duration: 0.4, delay: index * 0.1 }}
      className="text-3xl sm:text-4xl font-black"
    >
      <span
        className={
          show
            ? "text-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.5)]"
            : "text-transparent"
        }
      >
        ✕
      </span>
    </motion.div>
  );
}

// ============================================================
// HOST Answer Slot (shows points even when hidden)
// ============================================================
function HostAnswerSlot({
  answer,
  index,
  onReveal,
  revealed,
}: {
  answer: Answer;
  index: number;
  onReveal: () => void;
  revealed: boolean;
}) {
  return (
    <motion.div
      initial={false}
      animate={revealed ? { scale: [0.95, 1.05, 1] } : {}}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="w-full"
    >
      <motion.button
        whileTap={!revealed ? { scale: 0.97 } : {}}
        onClick={onReveal}
        disabled={revealed}
        className={cn(
          "relative flex items-center gap-3 rounded-2xl px-4 py-3.5 border-2 overflow-hidden transition-all duration-300 w-full text-right group",
          revealed
            ? "bg-gradient-to-l from-emerald-800/70 via-emerald-900/50 to-emerald-950/40 border-emerald-400/60 shadow-lg shadow-emerald-500/20"
            : "bg-slate-800/70 border-slate-700/50 hover:border-amber-500/60 hover:bg-slate-800/90 cursor-pointer"
        )}
      >
        {/* Glow effect when revealed */}
        {revealed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-gradient-to-l from-emerald-500/10 to-transparent pointer-events-none"
          />
        )}

        {/* Rank circle - larger and more prominent */}
        <motion.div
          animate={revealed ? { scale: [0.5, 1.2, 1], rotate: [0, 10, -5, 0] } : {}}
          transition={{ duration: 0.5, type: "spring", stiffness: 300 }}
          className={cn(
            "w-10 h-10 rounded-full flex items-center justify-center text-base font-black shrink-0 relative z-10 border-2",
            revealed
              ? "bg-gradient-to-br from-emerald-500 to-emerald-700 text-white border-emerald-400 shadow-md shadow-emerald-500/30"
              : "bg-slate-700/80 text-slate-400 border-slate-600/50 group-hover:border-amber-500/40 group-hover:text-amber-400"
          )}
        >
          {index + 1}
        </motion.div>

        {/* Answer Text */}
        <div className="flex-1 min-w-0 relative z-10">
          {revealed ? (
            <motion.span
              initial={{ opacity: 0, x: -20, filter: "blur(4px)" }}
              animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
              transition={{ duration: 0.3, delay: 0.05 }}
              className="font-extrabold text-sm sm:text-base text-emerald-100 block truncate drop-shadow-sm"
            >
              {answer.text}
            </motion.span>
          ) : (
            <span className="text-sm text-slate-400 block truncate">
              {answer.text}
            </span>
          )}
        </div>

        {/* Points - more prominent */}
        <motion.div
          animate={revealed ? { scale: [0.5, 1.3, 1] } : {}}
          transition={{ duration: 0.4, delay: 0.1, type: "spring", stiffness: 400 }}
          className={cn(
            "text-xl sm:text-2xl font-black tabular-nums shrink-0 min-w-[48px] text-left relative z-10",
            revealed ? "text-yellow-300 drop-shadow-[0_0_8px_rgba(253,224,71,0.5)]" : "text-amber-400/70"
          )}
        >
          {answer.points}
        </motion.div>

        {/* Reveal indicator for host */}
        {!revealed && (
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
            <div className="bg-amber-500/20 rounded-full p-2">
              <Eye className="w-6 h-6 text-amber-400/60" />
            </div>
          </div>
        )}

        {/* Reveal flash effect */}
        <AnimatePresence>
          {revealed && (
            <motion.div
              initial={{ opacity: 0.8, scale: 1 }}
              animate={{ opacity: 0, scale: 1.5 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6 }}
              className="absolute inset-0 bg-emerald-400/20 pointer-events-none z-0"
            />
          )}
        </AnimatePresence>
      </motion.button>
    </motion.div>
  );
}

// ============================================================
// LANDING PAGE
// ============================================================
function LandingPage({
  onStartGodfather,
  onStartDiwaniya,
}: {
  onStartGodfather: () => void;
  onStartDiwaniya: () => void;
}) {
  const [selectedMode, setSelectedMode] = useState<"godfather" | "diwaniya" | null>(null);
  const [showRules, setShowRules] = useState(false);

  const handleConfirmMode = () => {
    if (selectedMode === "godfather") onStartGodfather();
    else if (selectedMode === "diwaniya") onStartDiwaniya();
  };

  return (
    <div className="flex-1 flex items-center justify-center p-3 sm:p-4" dir="rtl">
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="max-w-lg w-full"
      >
        {/* Game Icon */}
        <div className="text-center mb-6">
          <motion.div
            animate={{ rotate: [0, 5, -5, 0], scale: [1, 1.05, 1] }}
            transition={{ duration: 3, repeat: Infinity }}
            className="text-6xl sm:text-7xl mb-3"
          >
            🏆
          </motion.div>
          <h1 className="text-3xl sm:text-5xl font-black mb-2">
            <span className="bg-gradient-to-l from-amber-400 via-rose-300 to-amber-500 bg-clip-text text-transparent">
              فاميلي فيود
            </span>
          </h1>
          <p className="text-sm text-slate-400 font-bold">Family Feud</p>
        </div>

        {/* Mode Selection */}
        <AnimatePresence mode="wait">
          {!selectedMode ? (
            <motion.div
              key="mode-select"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <Card className="bg-gradient-to-bl from-amber-950/40 via-slate-900/80 to-slate-900/80 border-amber-500/30 mb-4">
                <CardContent className="pt-5 sm:pt-6">
                  <div className="text-center mb-4">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.3, type: "spring" }}
                      className="inline-flex items-center gap-2 mb-2"
                    >
                      <Zap className="w-5 h-5 text-amber-400" />
                      <h2 className="text-lg sm:text-xl font-bold text-amber-300">
                        اختر طريقة اللعب
                      </h2>
                    </motion.div>
                    <p className="text-[10px] sm:text-xs text-slate-400">
                      العراب يتحكم باللعبة مثل ستيف هارفي!
                    </p>
                  </div>

                  <div className="space-y-3">
                    {/* Godfather Mode (HOST) */}
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setSelectedMode("godfather")}
                      className="w-full rounded-xl p-3 sm:p-4 border-2 border-amber-500/30 bg-gradient-to-l from-amber-950/50 to-red-950/30 hover:border-amber-400/50 transition-all text-right cursor-pointer"
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
                            أنت المقدم! تتحكم باللعبة وترى جميع الإجابات والنقاط
                          </p>
                        </div>
                      </div>
                    </motion.button>

                    {/* Diwaniya Mode (ONLINE) */}
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setSelectedMode("diwaniya")}
                      className="w-full rounded-xl p-3 sm:p-4 border-2 border-blue-500/30 bg-gradient-to-l from-blue-950/50 to-indigo-950/30 hover:border-blue-400/50 transition-all text-right cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-blue-900/50 border border-blue-500/30 flex items-center justify-center shrink-0">
                          <Home className="w-6 h-6 sm:w-7 sm:h-7 text-blue-400" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-base sm:text-lg font-bold text-blue-200 mb-0.5">
                            الديوانية
                          </h3>
                          <p className="text-[10px] sm:text-xs text-slate-400 leading-relaxed">
                            أنشئ غرفة وشارك الكود، اللاعبون ينضمون من أجهزتهم
                          </p>
                        </div>
                      </div>
                    </motion.button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ) : (
            <motion.div
              key="mode-confirm"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="mb-4"
            >
              <Card
                className={cn(
                  "bg-gradient-to-bl",
                  selectedMode === "godfather"
                    ? "from-amber-950/40 via-slate-900/80 to-slate-900/80 border-amber-500/30"
                    : "from-blue-950/40 via-slate-900/80 to-slate-900/80 border-blue-500/30"
                )}
              >
                <CardContent className="pt-5 sm:pt-6">
                  <div className="text-center mb-4">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.2, type: "spring" }}
                      className="text-4xl mb-2"
                    >
                      {selectedMode === "godfather" ? "🕴️" : "🏠"}
                    </motion.div>
                    <h2
                      className={cn(
                        "text-lg sm:text-xl font-bold",
                        selectedMode === "godfather"
                          ? "text-amber-300"
                          : "text-blue-300"
                      )}
                    >
                      {selectedMode === "godfather" ? "العراب - وضع المقدم" : "الديوانية - لعب جماعي"}
                    </h2>
                  </div>

                  {selectedMode === "godfather" && (
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center gap-2 text-xs text-slate-300">
                        <Crown className="w-4 h-4 text-amber-400 shrink-0" />
                        <span>أنت المقدم - تتحكم باللعبة كاملة</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-300">
                        <Eye className="w-4 h-4 text-amber-400 shrink-0" />
                        <span>ترى جميع الإجابات والنقاط قبل الكشف</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-300">
                        <Zap className="w-4 h-4 text-amber-400 shrink-0" />
                        <span>اضغط على الإجابة لكشفها للجمهور</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-300">
                        <Users className="w-4 h-4 text-amber-400 shrink-0" />
                        <span>أدخل أسماء فريقين وتحكم بالجولات</span>
                      </div>
                    </div>
                  )}

                  {selectedMode === "diwaniya" && (
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center gap-2 text-xs text-slate-300">
                        <Home className="w-4 h-4 text-blue-400 shrink-0" />
                        <span>أنشئ غرفة واحصل على كود</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-300">
                        <Users className="w-4 h-4 text-blue-400 shrink-0" />
                        <span>شارك الكود مع الأصدقاء لينضموا</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-300">
                        <Zap className="w-4 h-4 text-blue-400 shrink-0" />
                        <span>لعب متعدد اللاعبين عبر الإنترنت</span>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button
                      onClick={() => setSelectedMode(null)}
                      variant="outline"
                      className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-800 py-4 text-sm"
                    >
                      رجوع
                    </Button>
                    <Button
                      onClick={handleConfirmMode}
                      className={cn(
                        "flex-1 font-bold text-base sm:text-lg py-5 transition-all duration-300",
                        selectedMode === "godfather"
                          ? "bg-gradient-to-l from-amber-600 to-red-800 hover:from-amber-500 hover:to-red-700 text-white"
                          : "bg-gradient-to-l from-blue-600 to-indigo-800 hover:from-blue-500 hover:to-indigo-700 text-white"
                      )}
                    >
                      متابعة
                      <ChevronLeft className="w-4 h-4 mr-2" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Rules Toggle */}
        <div className="flex justify-center mb-3">
          <Button
            variant="ghost"
            onClick={() => setShowRules(!showRules)}
            className="text-yellow-400 hover:text-yellow-300 hover:bg-yellow-400/10 gap-2 text-sm"
          >
            <Info className="w-4 h-4" />
            {showRules ? "إخفاء القوانين" : "📜 عرض القوانين"}
          </Button>
        </div>

        {/* Rules */}
        <AnimatePresence>
          {showRules && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden mb-3"
            >
              <Card className="bg-slate-900/80 border-slate-700/50">
                <CardContent className="pt-4 text-xs sm:text-sm text-slate-300 space-y-3">
                  <div>
                    <h4 className="font-bold text-amber-400 mb-1">
                      👑 وضع العراب (المقدم):
                    </h4>
                    <ul className="space-y-1 text-slate-400 pr-4">
                      <li>• أنت المقدم مثل ستيف هارفي في البرنامج</li>
                      <li>• ترى جميع الإجابات والنقاط مسبقاً</li>
                      <li>• اضغط على الإجابة لكشفها عند التخمين الصحيح</li>
                      <li>• 3 إخفاقات = فرصة سرقة للفريق الآخر</li>
                      <li>• 5 جولات عادية + جولة المال السريع</li>
                    </ul>
                  </div>
                  <div className="pt-2 border-t border-slate-700/50">
                    <p className="text-amber-400/80 text-xs">
                      🏆 الفريق الفائز يحصل على أكبر عدد من النقاط
                    </p>
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

// ============================================================
// TEAM SETUP (Host Mode)
// ============================================================
function TeamSetup({
  onStartGame,
  soundEnabled,
  setSoundEnabled,
}: {
  onStartGame: (team1Name: string, team2Name: string) => void;
  soundEnabled: boolean;
  setSoundEnabled: (v: boolean) => void;
}) {
  const [team1Name, setTeam1Name] = useState("فريق 1");
  const [team2Name, setTeam2Name] = useState("فريق 2");
  const [totalRounds, setTotalRounds] = useState(5);
  const [stealTimer, setStealTimer] = useState(0); // 0=off, 30, 60
  const [showSettings, setShowSettings] = useState(false);

  const handleSwapNames = () => {
    const tmp = team1Name;
    setTeam1Name(team2Name);
    setTeam2Name(tmp);
  };

  return (
    <div className="flex-1 flex items-center justify-center p-3 sm:p-4" dir="rtl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-lg w-full"
      >
        <h2 className="text-2xl sm:text-3xl font-black text-center mb-1">
          <span className="bg-gradient-to-l from-amber-400 to-rose-400 bg-clip-text text-transparent">
            إعداد الفرق
          </span>
        </h2>
        <p className="text-xs text-slate-500 text-center mb-1">
          العراب - وضع المستضيف
        </p>
        <div className="flex justify-center mb-5">
          <Badge className="bg-amber-900/40 border border-amber-500/30 text-amber-400 text-[10px]">
            👑 أنت المقدم - تتحكم باللعبة كاملة
          </Badge>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 relative">
          {/* Swap Button (centered between team cards on sm+) */}
          <div className="hidden sm:flex absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
            <motion.button
              whileTap={{ scale: 0.85 }}
              whileHover={{ scale: 1.1 }}
              onClick={handleSwapNames}
              className="w-10 h-10 rounded-full bg-slate-800 border-2 border-slate-600 hover:border-amber-500/60 flex items-center justify-center shadow-lg cursor-pointer"
            >
              <span className="text-base">🔄</span>
            </motion.button>
          </div>

          {/* Team 1 */}
          <Card className="bg-slate-900/80 border-amber-500/30">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-sm">
                  👑
                </div>
                <div>
                  <h3 className="text-sm font-bold text-amber-300">الفريق الأول</h3>
                  <p className="text-[10px] text-amber-400/60">بدأ المواجهة</p>
                </div>
              </div>
              <div className="relative">
                <div className="absolute top-1/2 right-3 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-amber-500 shadow-sm shadow-amber-500/50 z-10" />
                <Input
                  value={team1Name}
                  onChange={(e) => setTeam1Name(e.target.value)}
                  placeholder="اسم الفريق الأول"
                  className="bg-slate-800/60 border-amber-900/40 text-amber-100 placeholder:text-amber-800/40 h-11 text-sm pr-7"
                  dir="rtl"
                />
              </div>
            </CardContent>
          </Card>

          {/* Team 2 */}
          <Card className="bg-slate-900/80 border-rose-500/30">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-rose-500 to-rose-700 flex items-center justify-center text-sm">
                  🏛️
                </div>
                <div>
                  <h3 className="text-sm font-bold text-rose-300">الفريق الثاني</h3>
                  <p className="text-[10px] text-rose-400/60">المنافس</p>
                </div>
              </div>
              <div className="relative">
                <div className="absolute top-1/2 right-3 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-rose-500 shadow-sm shadow-rose-500/50 z-10" />
                <Input
                  value={team2Name}
                  onChange={(e) => setTeam2Name(e.target.value)}
                  placeholder="اسم الفريق الثاني"
                  className="bg-slate-800/60 border-rose-900/40 text-rose-100 placeholder:text-rose-800/40 h-11 text-sm pr-7"
                  dir="rtl"
                />
              </div>
            </CardContent>
          </Card>

          {/* Mobile Swap Button */}
          <div className="sm:hidden flex justify-center">
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={handleSwapNames}
              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-amber-400 transition-colors cursor-pointer"
            >
              <span>🔄</span>
              <span>تبديل الأسماء</span>
            </motion.button>
          </div>
        </div>

        {/* Host Info */}
        <Card className="bg-amber-950/20 border-amber-500/20 mt-4">
          <CardContent className="p-3">
            <div className="flex items-start gap-2">
              <Eye className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
              <p className="text-xs text-slate-400">
                بصفتك العراب، ستظهر لك جميع الإجابات والنقاط. اضغط على أي إجابة
                لكشفها للجمهور عندما يخمن الفريق بشكل صحيح.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Game Settings Panel */}
        <div className="mt-3">
          <Button
            variant="ghost"
            onClick={() => setShowSettings(!showSettings)}
            className="w-full text-slate-400 hover:text-amber-300 hover:bg-amber-500/5 gap-2 text-sm py-2 justify-center"
          >
            <Info className="w-4 h-4" />
            <span>إعدادات اللعبة</span>
            <motion.span
              animate={{ rotate: showSettings ? 90 : 0 }}
              className="text-slate-500"
            >
              ‹
            </motion.span>
          </Button>
          <AnimatePresence>
            {showSettings && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <Card className="bg-slate-900/60 border-slate-700/40">
                  <CardContent className="p-4 space-y-4">
                    {/* Number of Rounds */}
                    <div>
                      <p className="text-xs font-bold text-slate-300 mb-2">
                        🎯 عدد الجولات
                      </p>
                      <div className="flex gap-2">
                        {[3, 5, 7].map((n) => (
                          <motion.button
                            key={n}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setTotalRounds(n)}
                            className={cn(
                              "flex-1 rounded-xl py-2.5 text-sm font-bold border-2 transition-all cursor-pointer",
                              totalRounds === n
                                ? "bg-amber-500/20 border-amber-500/60 text-amber-300 shadow-sm shadow-amber-500/20"
                                : "bg-slate-800/40 border-slate-700/40 text-slate-400 hover:border-slate-600"
                            )}
                          >
                            {n} جولات
                          </motion.button>
                        ))}
                      </div>
                    </div>

                    {/* Steal Timer */}
                    <div>
                      <p className="text-xs font-bold text-slate-300 mb-2">
                        ⏱️ مؤقت السرقة
                      </p>
                      <div className="flex gap-2">
                        {[
                          { val: 0, label: "بدون" },
                          { val: 30, label: "30 ثانية" },
                          { val: 60, label: "60 ثانية" },
                        ].map((opt) => (
                          <motion.button
                            key={opt.val}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setStealTimer(opt.val)}
                            className={cn(
                              "flex-1 rounded-xl py-2.5 text-xs font-bold border-2 transition-all cursor-pointer",
                              stealTimer === opt.val
                                ? "bg-rose-500/20 border-rose-500/60 text-rose-300 shadow-sm shadow-rose-500/20"
                                : "bg-slate-800/40 border-slate-700/40 text-slate-400 hover:border-slate-600"
                            )}
                          >
                            {opt.label}
                          </motion.button>
                        ))}
                      </div>
                    </div>

                    {/* Sound Effects */}
                    <div>
                      <p className="text-xs font-bold text-slate-300 mb-2">
                        🔊 المؤثرات الصوتية
                      </p>
                      <div className="flex items-center justify-between bg-slate-800/40 rounded-xl p-3 border border-slate-700/40">
                        <span className="text-xs text-slate-400">
                          {soundEnabled ? "مفعّل" : "مكتّم"}
                        </span>
                        <motion.button
                          whileTap={{ scale: 0.9 }}
                          onClick={() => setSoundEnabled(!soundEnabled)}
                          className={cn(
                            "w-12 h-7 rounded-full relative transition-colors cursor-pointer",
                            soundEnabled
                              ? "bg-amber-500/60 shadow-sm shadow-amber-500/30"
                              : "bg-slate-700"
                          )}
                        >
                          <motion.div
                            animate={{ x: soundEnabled ? 20 : 2 }}
                            transition={{ type: "spring", stiffness: 500, damping: 30 }}
                            className="absolute top-1 w-5 h-5 rounded-full bg-white shadow-md"
                          />
                        </motion.button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Store settings in data attributes for main to pick up */}
        <input type="hidden" id="settings-totalRounds" value={totalRounds} />
        <input type="hidden" id="settings-stealTimer" value={stealTimer} />

        <div className="text-center mt-6">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() =>
              onStartGame(
                team1Name.trim() || "فريق 1",
                team2Name.trim() || "فريق 2"
              )
            }
            className="relative bg-gradient-to-l from-amber-600 to-rose-600 hover:from-amber-500 hover:to-rose-500 text-white font-bold px-12 py-6 rounded-xl shadow-lg shadow-amber-500/20 cursor-pointer overflow-hidden"
          >
            {/* Pulsing glow animation */}
            <motion.div
              animate={{ opacity: [0.3, 0.7, 0.3], scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute inset-0 bg-gradient-to-l from-amber-400/30 to-rose-400/30 rounded-xl pointer-events-none"
            />
            <span className="relative flex items-center gap-2 text-lg">
              <Play className="w-5 h-5" />
              ابدأ اللعبة
            </span>
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}

// ============================================================
// DIWANIYA PLACEHOLDER
// ============================================================
function DiwaniyaPlaceholder() {
  return (
    <div className="flex-1 flex items-center justify-center p-3 sm:p-4" dir="rtl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-lg w-full text-center"
      >
        <motion.div
          animate={{ rotate: [0, 5, -5, 0] }}
          transition={{ duration: 3, repeat: Infinity }}
          className="text-6xl mb-4"
        >
          🏠
        </motion.div>
        <h2 className="text-2xl sm:text-3xl font-black mb-3">
          <span className="bg-gradient-to-l from-blue-400 via-indigo-300 to-blue-400 bg-clip-text text-transparent">
            الديوانية - قريباً
          </span>
        </h2>
        <Card className="bg-blue-950/30 border-blue-500/30 mt-6">
          <CardContent className="p-6">
            <p className="text-sm text-slate-400 mb-4">
              وضع اللعب الجماعي عبر الإنترنت قيد التطوير حالياً.
              <br />
              سيتمكن اللاعبون من الانضمام من أجهزتهم والتنافس في الوقت الحقيقي!
            </p>
            <div className="space-y-2 mb-6">
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <div className="w-5 h-5 rounded-full bg-green-900/50 border border-green-500/30 flex items-center justify-center">
                  <CheckCircle className="w-3 h-3 text-green-400" />
                </div>
                <span>إنشاء غرفة بكود خاص</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <div className="w-5 h-5 rounded-full bg-green-900/50 border border-green-500/30 flex items-center justify-center">
                  <CheckCircle className="w-3 h-3 text-green-400" />
                </div>
                <span>انضمام اللاعبين من أجهزتهم</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <div className="w-5 h-5 rounded-full bg-slate-800/50 border border-slate-700/30 flex items-center justify-center">
                  <Clock className="w-3 h-3 text-slate-500" />
                </div>
                <span>لعب في الوقت الحقيقي (قريباً)</span>
              </div>
            </div>
            <Button
              onClick={() => {
                window.location.href = "/familyfeud";
              }}
              variant="outline"
              className="border-blue-500/30 text-blue-300 hover:bg-blue-950/30"
            >
              <ArrowLeft className="w-4 h-4 ml-2" />
              العودة للصفحة الرئيسية
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

// ============================================================
// FACE-OFF SCREEN
// ============================================================
function FaceOffScreen({
  question,
  team1Name,
  team2Name,
  onTeam1Start,
  onTeam2Start,
}: {
  question: string;
  team1Name: string;
  team2Name: string;
  onTeam1Start: () => void;
  onTeam2Start: () => void;
}) {
  const [countdown, setCountdown] = useState<number | null>(3);
  const [buzzerActive, setBuzzerActive] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<1 | 2 | null>(null);
  const [showBuzz, setShowBuzz] = useState(false);

  useEffect(() => {
    if (countdown === null) return;
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 800);
      return () => clearTimeout(timer);
    } else {
      const t0 = setTimeout(() => setShowBuzz(true), 0);
      const t1 = setTimeout(() => setBuzzerActive(true), 100);
      const t2 = setTimeout(() => setShowBuzz(false), 1000);
      return () => { clearTimeout(t0); clearTimeout(t1); clearTimeout(t2); };
    }
  }, [countdown]);

  const handleTeamSelect = (team: 1 | 2) => {
    setSelectedTeam(team);
    setTimeout(() => {
      if (team === 1) onTeam1Start();
      else onTeam2Start();
    }, 600);
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4 gap-6 relative overflow-hidden" dir="rtl">
      {/* Animated background glows */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <motion.div
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.15, 0.25, 0.15],
          }}
          transition={{ duration: 4, repeat: Infinity }}
          className="absolute -top-20 -right-20 w-64 h-64 bg-amber-500/20 rounded-full blur-[80px]"
        />
        <motion.div
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.15, 0.25, 0.15],
          }}
          transition={{ duration: 4, repeat: Infinity, delay: 2 }}
          className="absolute -bottom-20 -left-20 w-64 h-64 bg-rose-500/20 rounded-full blur-[80px]"
        />
      </div>

      {/* Question */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center relative z-10"
      >
        <motion.p
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="text-xs font-bold text-amber-400/80 mb-2 tracking-wider"
        >
          ⚔️ المواجهة
        </motion.p>
        <h2 className="text-xl sm:text-2xl font-black text-white max-w-md leading-relaxed">
          &quot;{question}&quot;
        </h2>
        <p className="text-xs text-slate-500 mt-2">
          اختر الفريق الذي سيبدأ بالمواجهة
        </p>
      </motion.div>

      {/* Countdown overlay */}
      <AnimatePresence>
        {countdown !== null && countdown > 0 && (
          <motion.div
            key={countdown}
            initial={{ scale: 3, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.5, opacity: 0 }}
            transition={{ duration: 0.6, type: "spring", stiffness: 200 }}
            className="absolute inset-0 flex items-center justify-center z-30"
          >
            <div className="text-8xl sm:text-9xl font-black text-transparent bg-clip-text bg-gradient-to-b from-amber-300 to-rose-400 drop-shadow-2xl">
              {countdown}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Go! text - auto-fades after 1 second */}
      <AnimatePresence>
        {showBuzz && (
          <motion.div
            initial={{ scale: 3, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.5, opacity: 0, y: -50 }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0 flex items-center justify-center z-30 pointer-events-none"
          >
            <div className="text-6xl sm:text-7xl font-black text-emerald-400 drop-shadow-[0_0_30px_rgba(52,211,153,0.5)]">
              بَزّ!
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Buzz in text */}
      <AnimatePresence>
        {buzzerActive && !showBuzz && !selectedTeam && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="relative z-10"
          >
            <motion.div
              animate={{ scale: [1, 1.1, 1], opacity: [0.7, 1, 0.7] }}
              transition={{ duration: 1.2, repeat: Infinity }}
              className="text-sm font-bold text-amber-300 bg-amber-500/10 border border-amber-500/30 rounded-full px-4 py-1"
            >
              🔔 اختر الفريق الذي سيبدأ!
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Team selected indicator */}
      <AnimatePresence>
        {selectedTeam && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className={cn(
              "absolute top-1/3 z-30 text-2xl font-black px-6 py-3 rounded-2xl border-2",
              selectedTeam === 1
                ? "text-amber-200 bg-amber-950/90 border-amber-400/50 shadow-lg shadow-amber-500/30"
                : "text-rose-200 bg-rose-950/90 border-rose-400/50 shadow-lg shadow-rose-500/30"
            )}
          >
            {selectedTeam === 1 ? "👑" : "🏛️"} {selectedTeam === 1 ? team1Name : team2Name}!
          </motion.div>
        )}
      </AnimatePresence>

      {/* Teams */}
      <div className="flex items-center gap-3 sm:gap-6 w-full max-w-md relative z-10">
        {/* Team 1 Button */}
        <motion.button
          whileTap={{ scale: 0.93 }}
          whileHover={{ scale: 1.03 }}
          onClick={() => handleTeamSelect(1)}
          disabled={!buzzerActive}
          className={cn(
            "flex-1 relative rounded-3xl p-5 sm:p-8 text-center transition-all cursor-pointer overflow-hidden",
            buzzerActive
              ? "border-2 border-amber-400/70 bg-gradient-to-b from-amber-800/60 to-amber-900/40"
              : "border-2 border-amber-500/20 bg-gradient-to-b from-amber-900/30 to-amber-950/20 opacity-50"
          )}
        >
          {/* Pulsing glow for active state */}
          {buzzerActive && (
            <motion.div
              animate={{ opacity: [0.3, 0.6, 0.3] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="absolute inset-0 bg-gradient-to-b from-amber-500/20 to-transparent rounded-3xl pointer-events-none"
            />
          )}
          <motion.div
            animate={buzzerActive ? { scale: [1, 1.1, 1] } : {}}
            transition={{ repeat: Infinity, duration: 1.2 }}
            className="text-4xl sm:text-5xl mb-3"
          >
            👑
          </motion.div>
          <p className="text-base sm:text-lg font-bold text-amber-200">{team1Name}</p>
          {buzzerActive && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-3"
            >
              <span className="text-xs font-bold text-amber-300 bg-amber-700/40 rounded-full py-1.5 px-4 inline-block">
                🟡 ابدأ!
              </span>
            </motion.div>
          )}
        </motion.button>

        {/* VS Badge */}
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: 0.5, type: "spring", stiffness: 200 }}
          className="relative shrink-0"
        >
          <motion.div
            animate={{ scale: [1, 1.15, 1], rotate: [0, 5, -5, 0] }}
            transition={{ duration: 3, repeat: Infinity }}
            className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-amber-500 via-rose-500 to-amber-600 flex items-center justify-center shadow-lg shadow-rose-500/30 border-2 border-white/20"
          >
            <span className="text-xl sm:text-2xl font-black text-white drop-shadow-lg">VS</span>
          </motion.div>
          {/* Glow ring */}
          <motion.div
            animate={{ scale: [1, 1.4, 1], opacity: [0.4, 0.1, 0.4] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute inset-0 rounded-full bg-gradient-to-br from-amber-400/30 to-rose-400/30 blur-sm"
          />
        </motion.div>

        {/* Team 2 Button */}
        <motion.button
          whileTap={{ scale: 0.93 }}
          whileHover={{ scale: 1.03 }}
          onClick={() => handleTeamSelect(2)}
          disabled={!buzzerActive}
          className={cn(
            "flex-1 relative rounded-3xl p-5 sm:p-8 text-center transition-all cursor-pointer overflow-hidden",
            buzzerActive
              ? "border-2 border-rose-400/70 bg-gradient-to-b from-rose-800/60 to-rose-900/40"
              : "border-2 border-rose-500/20 bg-gradient-to-b from-rose-900/30 to-rose-950/20 opacity-50"
          )}
        >
          {/* Pulsing glow for active state */}
          {buzzerActive && (
            <motion.div
              animate={{ opacity: [0.3, 0.6, 0.3] }}
              transition={{ duration: 1.5, repeat: Infinity, delay: 0.75 }}
              className="absolute inset-0 bg-gradient-to-b from-rose-500/20 to-transparent rounded-3xl pointer-events-none"
            />
          )}
          <motion.div
            animate={buzzerActive ? { scale: [1, 1.1, 1] } : {}}
            transition={{ repeat: Infinity, duration: 1.2, delay: 0.6 }}
            className="text-4xl sm:text-5xl mb-3"
          >
            🏛️
          </motion.div>
          <p className="text-base sm:text-lg font-bold text-rose-200">{team2Name}</p>
          {buzzerActive && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-3"
            >
              <span className="text-xs font-bold text-rose-300 bg-rose-700/40 rounded-full py-1.5 px-4 inline-block">
                🔴 ابدأ!
              </span>
            </motion.div>
          )}
        </motion.button>
      </div>
    </div>
  );
}

// ============================================================
// MAIN GAME BOARD (HOST VIEW)
// ============================================================
function GameBoardView({
  question,
  answers,
  currentTeam,
  team1Score,
  team2Score,
  team1Name,
  team2Name,
  strikes,
  onRevealAnswer,
  onAddStrike,
  onPassToOtherTeam,
  onSteal,
  onNoSteal,
  onRevealAll,
  phase,
  round,
  totalRounds,
  roundScore,
}: {
  question: string;
  answers: Answer[];
  currentTeam: 1 | 2;
  team1Score: number;
  team2Score: number;
  team1Name: string;
  team2Name: string;
  strikes: number;
  onRevealAnswer: (index: number) => void;
  onAddStrike: () => void;
  onPassToOtherTeam: () => void;
  onSteal: () => void;
  onNoSteal: () => void;
  onRevealAll: () => void;
  phase: "playing" | "steal";
  round: number;
  totalRounds: number;
  roundScore: number;
}) {
  // Calculate points remaining (unrevealed)
  const totalPoints = answers.reduce((sum, a) => sum + a.points, 0);
  const revealedPoints = answers.filter(a => a.revealed).reduce((sum, a) => sum + a.points, 0);
  const pointsRemaining = totalPoints - revealedPoints;
  const maxScore = Math.max(team1Score, team2Score, 1);

  // Answer search state
  const [searchQuery, setSearchQuery] = useState("");
  const searchMatches = searchQuery.trim().length > 0
    ? answers.filter(
        (a) =>
          !a.revealed &&
          (a.text.includes(searchQuery.trim()) ||
            searchQuery.trim().includes(a.text))
      )
    : [];

  return (
    <div className="flex-1 flex flex-col p-3 sm:p-4 gap-3" dir="rtl">
      {/* Team Score Panels with VS Badge */}
      <div className="flex items-stretch gap-2 sm:gap-3">
        {/* Team 1 Score Panel */}
        <motion.div
          animate={currentTeam === 1 && phase === "playing" ? { scale: [1, 1.02, 1] } : {}}
          transition={{ duration: 2, repeat: Infinity }}
          className={cn(
            "flex-1 rounded-2xl border-2 p-3 sm:p-4 relative overflow-hidden transition-all",
            currentTeam === 1 && phase === "playing"
              ? "bg-gradient-to-br from-amber-950/80 to-amber-900/40 border-amber-500/60 shadow-lg shadow-amber-500/20"
              : "bg-slate-900/60 border-slate-700/40"
          )}
        >
          {/* Progress bar background */}
          <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-slate-800/60">
            <motion.div
              animate={{ width: `${(team1Score / maxScore) * 100}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="h-full bg-gradient-to-l from-amber-400 to-amber-600 rounded-r-full"
            />
          </div>
          {/* Active indicator pulse */}
          {currentTeam === 1 && phase === "playing" && (
            <motion.div
              animate={{ opacity: [0.3, 0.7, 0.3] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="absolute top-2 left-2 w-2.5 h-2.5 rounded-full bg-amber-400 shadow-lg shadow-amber-400/50"
            />
          )}
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xl sm:text-2xl">👑</span>
            <p className="text-xs font-bold text-amber-400/70 truncate">{team1Name}</p>
          </div>
          <motion.p
            key={team1Score}
            initial={{ scale: 1.2 }}
            animate={{ scale: 1 }}
            className="text-2xl sm:text-3xl font-black text-amber-300 tabular-nums leading-none"
          >
            {team1Score}
          </motion.p>
        </motion.div>

        {/* VS Badge + Round */}
        <div className="flex flex-col items-center justify-center gap-1.5 shrink-0 px-1">
          <motion.div
            animate={{ scale: [1, 1.1, 1], rotate: [0, 3, -3, 0] }}
            transition={{ duration: 3, repeat: Infinity }}
            className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-amber-500 via-rose-500 to-amber-600 flex items-center justify-center shadow-lg shadow-rose-500/20 border border-white/10"
          >
            <span className="text-xs sm:text-sm font-black text-white">VS</span>
          </motion.div>
          <div className="text-center">
            <span className="text-[10px] font-bold text-slate-500 block">الجولة</span>
            <span className="text-sm font-black text-white">{round}<span className="text-slate-500">/{totalRounds}</span></span>
          </div>
        </div>

        {/* Team 2 Score Panel */}
        <motion.div
          animate={currentTeam === 2 && phase === "playing" ? { scale: [1, 1.02, 1] } : {}}
          transition={{ duration: 2, repeat: Infinity }}
          className={cn(
            "flex-1 rounded-2xl border-2 p-3 sm:p-4 relative overflow-hidden transition-all",
            currentTeam === 2 && phase === "playing"
              ? "bg-gradient-to-br from-rose-950/80 to-rose-900/40 border-rose-500/60 shadow-lg shadow-rose-500/20"
              : "bg-slate-900/60 border-slate-700/40"
          )}
        >
          {/* Progress bar background */}
          <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-slate-800/60">
            <motion.div
              animate={{ width: `${(team2Score / maxScore) * 100}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="h-full bg-gradient-to-l from-rose-400 to-rose-600 rounded-r-full"
            />
          </div>
          {/* Active indicator pulse */}
          {currentTeam === 2 && phase === "playing" && (
            <motion.div
              animate={{ opacity: [0.3, 0.7, 0.3] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="absolute top-2 right-2 w-2.5 h-2.5 rounded-full bg-rose-400 shadow-lg shadow-rose-400/50"
            />
          )}
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xl sm:text-2xl">🏛️</span>
            <p className="text-xs font-bold text-rose-400/70 truncate">{team2Name}</p>
          </div>
          <motion.p
            key={team2Score}
            initial={{ scale: 1.2 }}
            animate={{ scale: 1 }}
            className="text-2xl sm:text-3xl font-black text-rose-300 tabular-nums leading-none"
          >
            {team2Score}
          </motion.p>
        </motion.div>
      </div>

      {/* Question + Points Remaining */}
      <div className="text-center py-1">
        <h2 className="text-base sm:text-lg font-black text-white leading-relaxed">
          &quot;{question}&quot;
        </h2>
        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mt-1.5 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800/60 border border-slate-700/40"
        >
          <Zap className="w-3 h-3" />
          <span
            className={cn(
              "text-xs font-bold tabular-nums",
              pointsRemaining > totalPoints * 0.5
                ? "text-amber-400"
                : pointsRemaining > totalPoints * 0.2
                  ? "text-yellow-400"
                  : "text-red-400"
            )}
          >
            النقاط المتبقية: {pointsRemaining}
          </span>
        </motion.div>
      </div>

      {/* Answer Search Input */}
      {phase === "playing" && (
        <div className="relative">
          <div className="relative">
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث عن إجابة..."
              className="bg-slate-800/60 border-slate-700/40 text-slate-200 placeholder:text-slate-600 h-9 text-xs pr-8"
              dir="rtl"
            />
            <span className="absolute top-1/2 right-3 -translate-y-1/2 text-xs text-slate-500">
              🔍
            </span>
          </div>
          {/* Search Dropdown */}
          <AnimatePresence>
            {searchQuery.trim().length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -5, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -5, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute top-full left-0 right-0 mt-1 z-40 bg-slate-800 border border-slate-700/60 rounded-xl overflow-hidden shadow-xl"
              >
                {searchMatches.length > 0 ? (
                  <div className="py-1 max-h-32 overflow-y-auto">
                    {searchMatches.map((a) => {
                      const idx = answers.indexOf(a);
                      return (
                        <button
                          key={idx}
                          onClick={() => {
                            onRevealAnswer(idx);
                            setSearchQuery("");
                          }}
                          className="w-full flex items-center justify-between px-3 py-2 hover:bg-emerald-900/40 transition-colors text-right cursor-pointer"
                        >
                          <span className="text-xs text-emerald-300 font-bold">{a.text}</span>
                          <span className="text-[10px] text-slate-500">{a.points} نقطة</span>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="px-3 py-2.5 text-center">
                    <span className="text-xs text-slate-500">لا تطابق</span>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Strike Marks */}
      <div className="flex justify-center gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <StrikeMark key={i} show={i < strikes} index={i} />
        ))}
      </div>

      {/* Phase Indicator */}
      <div className="text-center">
        <Badge
          className={cn(
            "text-xs font-bold",
            phase === "steal"
              ? "bg-gradient-to-l from-rose-600 to-amber-600 text-white animate-pulse"
              : currentTeam === 1
                ? "bg-amber-900/60 border border-amber-500/40 text-amber-300"
                : "bg-rose-900/60 border border-rose-500/40 text-rose-300"
          )}
        >
          {phase === "steal"
            ? "⚡ فرصة السرقة!"
            : `دور ${currentTeam === 1 ? team1Name : team2Name}`}
        </Badge>
        {phase === "playing" && (
          <p className="text-[10px] text-emerald-400/60 mt-0.5">
            +{roundScore} نقاط في هذه الجولة
          </p>
        )}
      </div>

      {/* Round Progress Bar */}
      <div className="px-1">
        <div className="flex items-center gap-2">
          <div className="flex-1 h-2 bg-slate-800/60 rounded-full overflow-hidden">
            <motion.div
              animate={{ width: `${(answers.filter((a) => a.revealed).length / Math.max(answers.length, 1)) * 100}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className={cn(
                "h-full rounded-full",
                phase === "steal"
                  ? "bg-gradient-to-l from-rose-400 to-amber-500"
                  : currentTeam === 1
                    ? "bg-gradient-to-l from-amber-400 to-amber-600"
                    : "bg-gradient-to-l from-rose-400 to-rose-600"
              )}
            />
          </div>
          <span className="text-[10px] font-bold text-slate-500 tabular-nums shrink-0">
            {answers.filter((a) => a.revealed).length}/{answers.length}
          </span>
        </div>
      </div>

      {/* Answer Board */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 flex-1 max-h-[45vh] overflow-y-auto scrollbar-thin">
        {answers.map((answer, i) => (
          <HostAnswerSlot
            key={i}
            answer={answer}
            index={i}
            onReveal={() => onRevealAnswer(i)}
            revealed={answer.revealed}
          />
        ))}
      </div>

      {/* Host Controls */}
      <div className="mt-auto space-y-2">
        {phase === "playing" && (
          <div className="flex gap-2">
            <Button
              onClick={onAddStrike}
              disabled={strikes >= 3}
              className="flex-1 bg-gradient-to-l from-red-700 to-red-900 hover:from-red-600 hover:to-red-800 text-white font-bold h-10 text-sm disabled:opacity-40"
            >
              <XCircle className="w-4 h-4 ml-1" />
              إخفاق ({strikes}/3)
            </Button>
            <Button
              onClick={onPassToOtherTeam}
              className="flex-1 bg-gradient-to-l from-slate-700 to-slate-800 hover:from-slate-600 hover:to-slate-700 text-white font-bold h-10 text-sm"
            >
              <SkipForward className="w-4 h-4 ml-1" />
              تمرير الدور
            </Button>
          </div>
        )}

        {phase === "steal" && (
          <div className="space-y-3">
            {/* Dramatic steal banner */}
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ type: "spring", stiffness: 300 }}
              className="relative overflow-hidden rounded-2xl border-2 border-rose-500/50 bg-gradient-to-l from-rose-950/80 via-amber-950/60 to-rose-950/80 p-4 text-center"
            >
              <motion.div
                animate={{ opacity: [0.3, 0.7, 0.3] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute inset-0 bg-gradient-to-l from-rose-500/10 to-amber-500/10 pointer-events-none"
              />
              <div className="relative z-10">
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="text-2xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-l from-amber-300 via-rose-300 to-amber-300 mb-1"
                >
                  ⚡ فرصة السرقة! ⚡
                </motion.div>
                <p className="text-xs sm:text-sm text-slate-300">
                  <span className="text-red-300 font-bold">{currentTeam === 1 ? team2Name : team1Name}</span>
                  {" "}أخذ 3 إخفاقات ← فرصة السرقة لـ{" "}
                  <span className={cn(
                    "font-black px-3 py-0.5 rounded-full",
                    currentTeam === 1
                      ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                      : "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                  )}>
                    {currentTeam === 1 ? team1Name : team2Name}
                  </span>
                </p>
              </div>
            </motion.div>

            <div className="flex gap-3">
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={onSteal}
                className="flex-1 relative rounded-2xl bg-gradient-to-l from-emerald-600 to-emerald-800 hover:from-emerald-500 hover:to-emerald-700 text-white font-bold p-4 text-center overflow-hidden border border-emerald-400/40 shadow-lg shadow-emerald-500/20 cursor-pointer"
              >
                <motion.div
                  animate={{ opacity: [0.2, 0.5, 0.2] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="absolute inset-0 bg-gradient-to-l from-emerald-400/20 to-transparent pointer-events-none"
                />
                <div className="relative z-10">
                  <div className="text-2xl mb-1">🎯</div>
                  <div className="text-sm sm:text-base font-black">سرقة ناجحة</div>
                  <div className="text-[10px] text-emerald-200/60 mt-0.5">الفريق يسرق كل النقاط</div>
                </div>
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={onNoSteal}
                className="flex-1 relative rounded-2xl bg-gradient-to-l from-red-700 to-red-900 hover:from-red-600 hover:to-red-800 text-white font-bold p-4 text-center overflow-hidden border border-red-400/40 shadow-lg shadow-red-500/20 cursor-pointer"
              >
                <motion.div
                  animate={{ opacity: [0.2, 0.4, 0.2] }}
                  transition={{ duration: 2, repeat: Infinity, delay: 1 }}
                  className="absolute inset-0 bg-gradient-to-l from-red-400/20 to-transparent pointer-events-none"
                />
                <div className="relative z-10">
                  <div className="text-2xl mb-1">🛡️</div>
                  <div className="text-sm sm:text-base font-black">سرقة فاشلة</div>
                  <div className="text-[10px] text-red-200/60 mt-0.5">الفريق يحتفظ بنقاطه</div>
                </div>
              </motion.button>
            </div>
          </div>
        )}

        {phase !== "steal" && (
        <Button
          onClick={onRevealAll}
          variant="outline"
          className="w-full border-slate-700 text-slate-400 hover:text-slate-200 hover:bg-slate-800 h-9 text-xs"
        >
          <Eye className="w-3 h-3 ml-1" />
          كشف جميع الإجابات
        </Button>
        )}
      </div>
    </div>
  );
}

// ============================================================
// FAST MONEY SCREEN
// ============================================================
function FastMoneyScreen({
  team1Name,
  team2Name,
  team1Score,
  team2Score,
  fmQuestions,
  fmAnswers1,
  fmAnswers2,
  fmRevealed1,
  fmRevealed2,
  onRevealFM1,
  onRevealFM2,
  onInputFM1,
  onInputFM2,
  onStartTimer,
  timeLeft,
  timerRunning,
  roundScore,
}: {
  team1Name: string;
  team2Name: string;
  team1Score: number;
  team2Score: number;
  fmQuestions: Question[];
  fmAnswers1: string[];
  fmAnswers2: string[];
  fmRevealed1: boolean[];
  fmRevealed2: boolean[];
  onRevealFM1: (i: number) => void;
  onRevealFM2: (i: number) => void;
  onInputFM1: (i: number, v: string) => void;
  onInputFM2: (i: number, v: string) => void;
  onStartTimer: () => void;
  timeLeft: number;
  timerRunning: boolean;
  roundScore: number;
}) {
  const [phase, setPhase] = useState<"intro" | "team1" | "team2" | "results">("intro");

  if (phase === "intro") {
    return (
      <div className="flex-1 flex items-center justify-center p-4" dir="rtl">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-md"
        >
          <motion.div
            animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="text-6xl mb-4"
          >
            💰
          </motion.div>
          <h2 className="text-2xl sm:text-3xl font-black mb-3">
            <span className="bg-gradient-to-l from-amber-400 via-yellow-300 to-amber-400 bg-clip-text text-transparent">
              جولة المال السريع!
            </span>
          </h2>
          <Card className="bg-amber-950/30 border-amber-500/30 mt-4">
            <CardContent className="p-4 text-xs text-slate-400 space-y-2">
              <p>🎯 كل فريق يجيب على 5 أسئلة</p>
              <p>⏱️ 20 ثانية لكل فريق</p>
              <p>💰 النقاط تتضاعف في هذه الجولة</p>
              <p>🏆 الفريق الأعلى نقاطاً يفوز!</p>
            </CardContent>
          </Card>
          <Button
            onClick={() => setPhase("team1")}
            className="mt-6 bg-gradient-to-l from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 text-white font-bold px-8 py-5"
          >
            ابدأ جولة المال السريع
            <ChevronLeft className="w-4 h-4 mr-2" />
          </Button>
        </motion.div>
      </div>
    );
  }

  if (phase === "team1") {
    return (
      <div className="flex-1 flex flex-col p-3 sm:p-4 gap-3" dir="rtl">
        {/* Header */}
        <div className="flex items-center justify-between gap-2">
          <div className="bg-amber-950/50 border border-amber-500/40 rounded-xl px-3 py-2">
            <p className="text-[10px] text-amber-400/60">{team1Name}</p>
            <p className="text-lg font-black text-amber-300">{team1Score}</p>
          </div>
          <Badge className="bg-gradient-to-l from-amber-600 to-yellow-600 text-white">
            💰 المال السريع
          </Badge>
          <div className="bg-rose-950/50 border border-rose-500/40 rounded-xl px-3 py-2">
            <p className="text-[10px] text-rose-400/60">{team2Name}</p>
            <p className="text-lg font-black text-rose-300">{team2Score}</p>
          </div>
        </div>

        <div className="text-center">
          <Badge className="bg-amber-900/60 border border-amber-500/40 text-amber-300">
            👑 دور {team1Name} - يبدأ أولاً
          </Badge>
        </div>

        {/* Timer */}
        <div className="text-center">
          {!timerRunning ? (
            <Button
              onClick={() => {
                setPhase("team1");
                onStartTimer();
              }}
              className="bg-gradient-to-l from-amber-600 to-yellow-600 text-white font-bold"
            >
              <Play className="w-4 h-4 ml-1" />
              ابدأ المؤقت (20 ثانية)
            </Button>
          ) : (
            <motion.div
              animate={{ scale: timeLeft <= 5 ? [1, 1.1, 1] : 1 }}
              transition={{ repeat: timeLeft <= 5 ? Infinity : 0, duration: 0.5 }}
              className={cn(
                "text-5xl font-black tabular-nums",
                timeLeft <= 5 ? "text-red-400" : "text-amber-400"
              )}
            >
              {timeLeft}
            </motion.div>
          )}
        </div>

        {/* Questions */}
        <div className="flex-1 max-h-[50vh] overflow-y-auto space-y-2">
          {fmQuestions.map((q, i) => (
            <Card key={i} className="bg-slate-900/80 border-slate-700/40">
              <CardContent className="p-3">
                <p className="text-xs font-bold text-white mb-2">
                  {i + 1}. {q.question}
                </p>
                <div className="flex gap-2">
                  <Input
                    value={fmAnswers1[i] || ""}
                    onChange={(e) => onInputFM1(i, e.target.value)}
                    placeholder="إجابة اللاعب..."
                    className="flex-1 bg-slate-800/60 border-amber-900/40 text-amber-100 placeholder:text-amber-800/30 h-9 text-sm"
                    dir="rtl"
                  />
                  <Button
                    onClick={() => onRevealFM1(i)}
                    variant="outline"
                    size="sm"
                    className="border-slate-700 text-slate-400 hover:text-slate-200 h-9 px-3"
                  >
                    <Eye className="w-3 h-3" />
                  </Button>
                </div>
                {fmRevealed1[i] && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-2 space-y-1"
                  >
                    {q.answers.map((a, j) => (
                      <div
                        key={j}
                        className={cn(
                          "flex items-center justify-between text-xs px-2 py-1 rounded",
                          fmAnswers1[i] &&
                            a.text.includes(fmAnswers1[i].trim().charAt(0))
                            ? "bg-emerald-900/40 border border-emerald-500/30"
                            : "bg-slate-800/40"
                        )}
                      >
                        <span className="text-slate-300">{a.text}</span>
                        <span className="text-slate-500">{a.points}</span>
                      </div>
                    ))}
                  </motion.div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        <Button
          onClick={() => setPhase("team2")}
          className="bg-gradient-to-l from-rose-600 to-rose-800 text-white font-bold h-10"
        >
          التالي - دور {team2Name}
          <ChevronLeft className="w-4 h-4 mr-2" />
        </Button>
      </div>
    );
  }

  if (phase === "team2") {
    return (
      <div className="flex-1 flex flex-col p-3 sm:p-4 gap-3" dir="rtl">
        {/* Header */}
        <div className="flex items-center justify-between gap-2">
          <div className="bg-amber-950/50 border border-amber-500/40 rounded-xl px-3 py-2">
            <p className="text-[10px] text-amber-400/60">{team1Name}</p>
            <p className="text-lg font-black text-amber-300">{team1Score}</p>
          </div>
          <Badge className="bg-gradient-to-l from-amber-600 to-yellow-600 text-white">
            💰 المال السريع
          </Badge>
          <div className="bg-rose-950/50 border border-rose-500/40 rounded-xl px-3 py-2">
            <p className="text-[10px] text-rose-400/60">{team2Name}</p>
            <p className="text-lg font-black text-rose-300">{team2Score}</p>
          </div>
        </div>

        <div className="text-center">
          <Badge className="bg-rose-900/60 border border-rose-500/40 text-rose-300">
            🏛️ دور {team2Name}
          </Badge>
        </div>

        {/* Timer */}
        <div className="text-center">
          {!timerRunning ? (
            <Button
              onClick={onStartTimer}
              className="bg-gradient-to-l from-rose-600 to-rose-800 text-white font-bold"
            >
              <Play className="w-4 h-4 ml-1" />
              ابدأ المؤقت (20 ثانية)
            </Button>
          ) : (
            <motion.div
              animate={{ scale: timeLeft <= 5 ? [1, 1.1, 1] : 1 }}
              transition={{ repeat: timeLeft <= 5 ? Infinity : 0, duration: 0.5 }}
              className={cn(
                "text-5xl font-black tabular-nums",
                timeLeft <= 5 ? "text-red-400" : "text-rose-400"
              )}
            >
              {timeLeft}
            </motion.div>
          )}
        </div>

        {/* Questions */}
        <div className="flex-1 max-h-[50vh] overflow-y-auto space-y-2">
          {fmQuestions.map((q, i) => (
            <Card key={i} className="bg-slate-900/80 border-slate-700/40">
              <CardContent className="p-3">
                <p className="text-xs font-bold text-white mb-2">
                  {i + 1}. {q.question}
                </p>
                <div className="flex gap-2">
                  <Input
                    value={fmAnswers2[i] || ""}
                    onChange={(e) => onInputFM2(i, e.target.value)}
                    placeholder="إجابة اللاعب..."
                    className="flex-1 bg-slate-800/60 border-rose-900/40 text-rose-100 placeholder:text-rose-800/30 h-9 text-sm"
                    dir="rtl"
                  />
                  <Button
                    onClick={() => onRevealFM2(i)}
                    variant="outline"
                    size="sm"
                    className="border-slate-700 text-slate-400 hover:text-slate-200 h-9 px-3"
                  >
                    <Eye className="w-3 h-3" />
                  </Button>
                </div>
                {fmRevealed2[i] && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-2 space-y-1"
                  >
                    {q.answers.map((a, j) => (
                      <div
                        key={j}
                        className={cn(
                          "flex items-center justify-between text-xs px-2 py-1 rounded",
                          fmAnswers2[i] &&
                            a.text.includes(fmAnswers2[i].trim().charAt(0))
                            ? "bg-emerald-900/40 border border-emerald-500/30"
                            : "bg-slate-800/40"
                        )}
                      >
                        <span className="text-slate-300">{a.text}</span>
                        <span className="text-slate-500">{a.points}</span>
                      </div>
                    ))}
                  </motion.div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        <Button
          onClick={() => setPhase("results")}
          className="bg-gradient-to-l from-amber-600 to-yellow-600 text-white font-bold h-10"
        >
          عرض النتائج
          <Trophy className="w-4 h-4 mr-2" />
        </Button>
      </div>
    );
  }

  // Results phase - handled by parent
  return null;
}

// ============================================================
// GAME OVER SCREEN
// ============================================================
function GameOverScreen({
  team1Name,
  team2Name,
  team1Score,
  team2Score,
  onRestart,
  onHome,
  roundHistory,
}: {
  team1Name: string;
  team2Name: string;
  team1Score: number;
  team2Score: number;
  onRestart: () => void;
  onHome: () => void;
  roundHistory: { round: number; team: 1 | 2; points: number; type: string }[];
}) {
  const winner =
    team1Score > team2Score
      ? team1Name
      : team2Score > team1Score
        ? team2Name
        : null;
  const isTie = team1Score === team2Score;

  return (
    <div className="flex-1 flex items-center justify-center p-4" dir="rtl">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center max-w-md w-full"
      >
        <ConfettiOverlay />

        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.3, type: "spring" }}
          className="text-6xl mb-4"
        >
          🏆
        </motion.div>

        <h2 className="text-3xl sm:text-4xl font-black mb-4">
          {isTie ? (
            <span className="bg-gradient-to-l from-slate-300 to-slate-400 bg-clip-text text-transparent">
              تعادل!
            </span>
          ) : (
            <span className="bg-gradient-to-l from-amber-400 via-yellow-300 to-amber-400 bg-clip-text text-transparent">
              فاز {winner}! 🎉
            </span>
          )}
        </h2>

        {/* Score Cards */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <Card
            className={cn(
              team1Score >= team2Score
                ? "bg-amber-950/40 border-amber-500/40"
                : "bg-slate-900/60 border-slate-800/30"
            )}
          >
            <CardContent className="p-4">
              <p className="text-2xl mb-1">👑</p>
              <p className="text-sm font-bold text-amber-300">{team1Name}</p>
              <p className="text-2xl font-black text-amber-400">{team1Score}</p>
              {team1Score >= team2Score && !isTie && (
                <Badge className="mt-2 bg-amber-600 text-white text-[10px]">
                  🏆 الفائز
                </Badge>
              )}
            </CardContent>
          </Card>

          <Card
            className={cn(
              team2Score > team1Score
                ? "bg-rose-950/40 border-rose-500/40"
                : "bg-slate-900/60 border-slate-800/30"
            )}
          >
            <CardContent className="p-4">
              <p className="text-2xl mb-1">🏛️</p>
              <p className="text-sm font-bold text-rose-300">{team2Name}</p>
              <p className="text-2xl font-black text-rose-400">{team2Score}</p>
              {team2Score > team1Score && !isTie && (
                <Badge className="mt-2 bg-rose-600 text-white text-[10px]">
                  🏆 الفائز
                </Badge>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="flex gap-3">
          <Button
            onClick={onRestart}
            className="flex-1 bg-gradient-to-l from-amber-600 to-rose-600 hover:from-amber-500 hover:to-rose-500 text-white font-bold py-5"
          >
            <RotateCcw className="w-4 h-4 ml-1" />
            لعب مرة أخرى
          </Button>
          <Button
            onClick={onHome}
            variant="outline"
            className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-800 py-5"
          >
            <HomeIcon className="w-4 h-4 ml-1" />
            الرئيسية
          </Button>
        </div>

        {/* Round History */}
        {roundHistory.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="mt-6 text-right"
          >
            <p className="text-xs text-slate-500 font-bold mb-2 text-center">📊 ملخص الجولات</p>
            <div className="flex flex-wrap gap-1.5 justify-center">
              {roundHistory.map((rh, i) => (
                <div
                  key={i}
                  className={cn(
                    "flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold border",
                    rh.team === 1
                      ? "bg-amber-950/60 border-amber-500/30 text-amber-300"
                      : "bg-rose-950/60 border-rose-500/30 text-rose-300"
                  )}
                >
                  <span>{rh.type === "سرقة" ? "🎯" : rh.type === "محفوظ" ? "🛡️" : rh.type === "كشف" ? "👁️" : "⚡"}</span>
                  <span>ج{rh.round}</span>
                  <span>+{rh.points}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}

// ============================================================
// MAIN PAGE COMPONENT
// ============================================================
export default function FamilyFeudPage() {
  const mounted = useHydrated();
  const { playCorrect, playBuzz, playStrike, playReveal, playSteal, playWin, playCountdown } = useSoundEffects();

  // Navigation state
  const [uiPhase, setUiPhase] = useState<
    "landing" | "godfather_setup" | "diwaniya_setup" | "game"
  >("landing");

  // Game state
  const [team1Name, setTeam1Name] = useState("فريق 1");
  const [team2Name, setTeam2Name] = useState("فريق 2");
  const [team1Score, setTeam1Score] = useState(0);
  const [team2Score, setTeam2Score] = useState(0);
  const [currentTeam, setCurrentTeam] = useState<1 | 2>(1);
  const [strikes, setStrikes] = useState(0);
  const [round, setRound] = useState(1);
  const totalRounds = 5;
  const [gamePhase, setGamePhase] = useState<"faceoff" | "gameboard" | "steal" | "fast_money" | "game_over">("faceoff");

  // Questions
  const [selectedQuestions, setSelectedQuestions] = useState<Question[]>([]);
  const [currentAnswers, setCurrentAnswers] = useState<Answer[]>([]);
  const [roundScore, setRoundScore] = useState(0);

  // Fast Money
  const [fmQuestions, setFmQuestions] = useState<Question[]>([]);
  const [fmAnswers1, setFmAnswers1] = useState<string[]>([]);
  const [fmAnswers2, setFmAnswers2] = useState<string[]>([]);
  const [fmRevealed1, setFmRevealed1] = useState<boolean[]>([]);
  const [fmRevealed2, setFmRevealed2] = useState<boolean[]>([]);
  const [fmScore1, setFmScore1] = useState(0);
  const [fmScore2, setFmScore2] = useState(0);
  const [timeLeft, setTimeLeft] = useState(20);
  const [timerRunning, setTimerRunning] = useState(false);
  const [fmPhase, setFmPhase] = useState<"intro" | "team1" | "team2" | "results">("intro");
  const [showGameOver, setShowGameOver] = useState(false);

  // Feedback
  const [feedback, setFeedback] = useState<{
    show: boolean;
    correct: boolean;
    answer?: string;
  }>({ show: false, correct: false });

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Refs for bug-free steal logic
  const strikesTeamRef = useRef<1 | 2>(1); // Which team got 3 strikes
  const roundPointsAwardedRef = useRef(false); // Whether points were awarded this round

  // Round result display
  const [showRoundResult, setShowRoundResult] = useState(false);
  const [roundResultType, setRoundResultType] = useState<"steal_success" | "steal_fail" | "round_complete">("round_complete");
  const [roundResultTeamName, setRoundResultTeamName] = useState("");
  const [roundResultPoints, setRoundResultPoints] = useState(0);

  // Round history
  const [roundHistory, setRoundHistory] = useState<{ round: number; team: 1 | 2; points: number; type: string }[]>([]);

  // Shuffle and pick questions
  const initializeQuestions = useCallback(() => {
    const shuffled = [...ALL_QUESTIONS].sort(() => Math.random() - 0.5);
    const picked = shuffled.slice(0, totalRounds).map((q) => ({
      ...q,
      answers: q.answers.map((a) => ({ ...a, revealed: false })),
    }));
    setSelectedQuestions(picked);

    const fmShuffled = [...FAST_MONEY_QUESTIONS]
      .sort(() => Math.random() - 0.5)
      .slice(0, 5)
      .map((q) => ({
        ...q,
        answers: q.answers.map((a) => ({ ...a, revealed: false })),
      }));
    setFmQuestions(fmShuffled);
  }, []);

  // Start game
  const handleStartGame = useCallback(
    (t1Name: string, t2Name: string) => {
      setTeam1Name(t1Name);
      setTeam2Name(t2Name);
      setTeam1Score(0);
      setTeam2Score(0);
      setRound(1);
      setCurrentTeam(1);
      setStrikes(0);
      setGamePhase("faceoff");
      setUiPhase("game");
      setShowGameOver(false);
      initializeQuestions();
    },
    [initializeQuestions]
  );

  // Setup current round
  useEffect(() => {
    if (round <= totalRounds && selectedQuestions.length > 0) {
      const q = selectedQuestions[round - 1];
      if (q) {
        roundPointsAwardedRef.current = false;
        const t = setTimeout(() => {
          setCurrentAnswers(q.answers.map((a) => ({ ...a, revealed: false })));
          setRoundScore(0);
        }, 0);
        return () => clearTimeout(t);
      }
    }
  }, [round, selectedQuestions, totalRounds]);

  // Handle face-off team selection
  const handleFaceOffStart = useCallback(
    (team: 1 | 2) => {
      setCurrentTeam(team);
      setStrikes(0);
      setGamePhase("gameboard");
    },
    []
  );

  // Reveal answer
  const handleRevealAnswer = useCallback(
    (index: number) => {
      setCurrentAnswers((prev) => {
        const updated = [...prev];
        if (!updated[index].revealed) {
          updated[index] = { ...updated[index], revealed: true };
          setRoundScore((rs) => rs + updated[index].points);
          setFeedback({
            show: true,
            correct: true,
            answer: `${updated[index].text} - ${updated[index].points} نقاط`,
          });
          setTimeout(() => setFeedback({ show: false, correct: false }), 1500);
          playReveal();
          setTimeout(() => playCorrect(), 200);
        }
        return updated;
      });
    },
    [playReveal, playCorrect]
  );

  // Add strike
  const handleAddStrike = useCallback(() => {
    playStrike();
    setStrikes((prev) => {
      const newStrikes = prev + 1;
      if (newStrikes >= 3) {
        strikesTeamRef.current = currentTeam;
        playSteal();
        setGamePhase("steal");
      }
      return newStrikes;
    });
    setFeedback({ show: true, correct: false });
    setTimeout(() => setFeedback({ show: false, correct: false }), 1500);
  }, [playStrike, playSteal, currentTeam]);

  // Pass to other team
  const handlePassToOtherTeam = useCallback(() => {
    setCurrentTeam((prev) => (prev === 1 ? 2 : 1));
    setStrikes(0);
  }, []);

  // Handle steal
  // Next round
  const handleNextRound = useCallback(() => {
    if (round >= totalRounds) {
      setGamePhase("fast_money");
      setFmPhase("intro");
      setFmAnswers1(Array(5).fill(""));
      setFmAnswers2(Array(5).fill(""));
      setFmRevealed1(Array(5).fill(false));
      setFmRevealed2(Array(5).fill(false));
      setFmScore1(0);
      setFmScore2(0);
      setTimerRunning(false);
      setTimeLeft(20);
    } else {
      setRound((prev) => prev + 1);
      setStrikes(0);
      setGamePhase("faceoff");
    }
  }, [round, totalRounds]);

  // Award round points (if not yet awarded) then go to next round
  const handleAwardAndNextRound = useCallback(() => {
    if (!roundPointsAwardedRef.current && currentAnswers.length > 0) {
      const allPoints = currentAnswers.reduce((sum, a) => sum + a.points, 0);
      if (currentTeam === 1) {
        setTeam1Score((prev) => prev + allPoints);
      } else {
        setTeam2Score((prev) => prev + allPoints);
      }
      roundPointsAwardedRef.current = true;
      playCorrect();

      // Track history
      setRoundHistory((prev) => [...prev, { round, team: currentTeam, points: allPoints, type: "كامل" }]);

      // Show result card briefly
      setRoundResultType("round_complete");
      setRoundResultTeamName(currentTeam === 1 ? team1Name : team2Name);
      setRoundResultPoints(allPoints);
      setShowRoundResult(true);
      setTimeout(() => setShowRoundResult(false), 1500);
    }
    handleNextRound();
  }, [currentAnswers, currentTeam, handleNextRound, playCorrect, round, team1Name, team2Name]);

  // Handle steal (successful) - OTHER team gets ALL round points
  const handleSteal = useCallback(() => {
    const teamThatGotStrikes = strikesTeamRef.current;
    const stealingTeam: 1 | 2 = teamThatGotStrikes === 1 ? 2 : 1;
    const allPoints = currentAnswers.reduce((sum, a) => sum + a.points, 0);

    if (stealingTeam === 1) {
      setTeam1Score((prev) => prev + allPoints);
    } else {
      setTeam2Score((prev) => prev + allPoints);
    }

    setCurrentAnswers((prev) => prev.map((a) => ({ ...a, revealed: true })));
    setRoundScore(0);
    roundPointsAwardedRef.current = true;
    playCorrect();

    // Show big result card
    const stealingTeamName = stealingTeam === 1 ? team1Name : team2Name;
    setRoundResultType("steal_success");
    setRoundResultTeamName(stealingTeamName);
    setRoundResultPoints(allPoints);
    setShowRoundResult(true);

    // Track history
    setRoundHistory((prev) => [...prev, { round, team: stealingTeam, points: allPoints, type: "سرقة" }]);

    setTimeout(() => {
      setShowRoundResult(false);
      handleNextRound();
    }, 2800);
  }, [currentAnswers, team1Name, team2Name, handleNextRound, playCorrect, round]);

  // No steal (failed steal) - ORIGINAL team keeps revealed points
  const handleNoSteal = useCallback(() => {
    const teamThatGotStrikes = strikesTeamRef.current;
    const revealedPoints = currentAnswers
      .filter((a) => a.revealed)
      .reduce((sum, a) => sum + a.points, 0);

    if (teamThatGotStrikes === 1) {
      setTeam1Score((prev) => prev + revealedPoints);
    } else {
      setTeam2Score((prev) => prev + revealedPoints);
    }

    setCurrentAnswers((prev) => prev.map((a) => ({ ...a, revealed: true })));
    setRoundScore(0);
    roundPointsAwardedRef.current = true;
    playStrike();

    // Show big result card
    const originalTeamName = teamThatGotStrikes === 1 ? team1Name : team2Name;
    setRoundResultType("steal_fail");
    setRoundResultTeamName(originalTeamName);
    setRoundResultPoints(revealedPoints);
    setShowRoundResult(true);

    // Track history
    setRoundHistory((prev) => [...prev, { round, team: teamThatGotStrikes, points: revealedPoints, type: "محفوظ" }]);

    setTimeout(() => {
      setShowRoundResult(false);
      handleNextRound();
    }, 2800);
  }, [currentAnswers, team1Name, team2Name, handleNextRound, playStrike, round]);

  // Reveal all
  const handleRevealAll = useCallback(() => {
    const points = currentAnswers.reduce((sum, a) => {
      if (!a.revealed) return sum + a.points;
      return sum;
    }, 0);
    setCurrentAnswers((prev) => prev.map((a) => ({ ...a, revealed: true })));
    const totalAwarded = roundScore + points;
    if (currentTeam === 1) {
      setTeam1Score((prev) => prev + totalAwarded);
    } else {
      setTeam2Score((prev) => prev + totalAwarded);
    }
    roundPointsAwardedRef.current = true;
    setRoundScore(0);

    // Track history
    setRoundHistory((prev) => [...prev, { round, team: currentTeam, points: totalAwarded, type: "كشف" }]);

    // Show result card
    setRoundResultType("round_complete");
    setRoundResultTeamName(currentTeam === 1 ? team1Name : team2Name);
    setRoundResultPoints(totalAwarded);
    setShowRoundResult(true);
    setTimeout(() => setShowRoundResult(false), 2500);
  }, [currentAnswers, currentTeam, roundScore, round, team1Name, team2Name]);

  // Timer for Fast Money
  useEffect(() => {
    if (timerRunning && timeLeft > 0) {
      if (timeLeft <= 5) {
        playCountdown();
      }
      timerRef.current = setTimeout(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timerRunning && timeLeft === 0) {
      timerRef.current = setTimeout(() => {
        setTimerRunning(false);
        playBuzz();
      }, 0);
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [timerRunning, timeLeft, playCountdown, playBuzz]);

  const handleStartTimer = useCallback(() => {
    setTimeLeft(20);
    setTimerRunning(true);
  }, []);

  // Fast Money reveal handlers
  const handleRevealFM1 = useCallback(
    (i: number) => {
      setFmRevealed1((prev) => {
        const updated = [...prev];
        updated[i] = true;
        // Score check
        const answer = fmAnswers1[i]?.trim() || "";
        const question = fmQuestions[i];
        if (question) {
          const match = question.answers.find(
            (a) =>
              answer.length > 0 &&
              (a.text === answer || a.text.includes(answer) || answer.includes(a.text))
          );
          if (match) {
            setFmScore1((prev) => prev + match.points * 2);
          }
        }
        return updated;
      });
    },
    [fmAnswers1, fmQuestions]
  );

  const handleRevealFM2 = useCallback(
    (i: number) => {
      setFmRevealed2((prev) => {
        const updated = [...prev];
        updated[i] = true;
        const answer = fmAnswers2[i]?.trim() || "";
        const question = fmQuestions[i];
        if (question) {
          const match = question.answers.find(
            (a) =>
              answer.length > 0 &&
              (a.text === answer || a.text.includes(answer) || answer.includes(a.text))
          );
          if (match) {
            setFmScore2((prev) => prev + match.points * 2);
          }
        }
        return updated;
      });
    },
    [fmAnswers2, fmQuestions]
  );

  // End game
  const handleEndGame = useCallback(() => {
    setTeam1Score((prev) => prev + fmScore1);
    setTeam2Score((prev) => prev + fmScore2);
    setShowGameOver(true);
    setGamePhase("game_over");
    playWin();
  }, [fmScore1, fmScore2, playWin]);

  // Reset
  const handleReset = useCallback(() => {
    setUiPhase("landing");
    setGamePhase("faceoff");
    setTeam1Score(0);
    setTeam2Score(0);
    setRound(1);
    setCurrentTeam(1);
    setStrikes(0);
    setShowGameOver(false);
    setFmPhase("intro");
    setTimerRunning(false);
    setTimeLeft(20);
  }, []);

  // ============================
  // LOADING STATE
  // ============================
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

  // ============================
  // SETUP PHASES (with header/footer)
  // ============================
  if (uiPhase === "landing") {
    return (
      <div className="min-h-screen flex flex-col bg-slate-950">
        <BrandedHeader />
        <main className="flex-1">
          <LandingPage
            onStartGodfather={() => setUiPhase("godfather_setup")}
            onStartDiwaniya={() => setUiPhase("diwaniya_setup")}
          />
        </main>
        <BrandedFooter />
      </div>
    );
  }

  if (uiPhase === "godfather_setup") {
    return (
      <div className="min-h-screen flex flex-col bg-slate-950">
        <BrandedHeader />
        <main className="flex-1">
          <TeamSetup onStartGame={handleStartGame} />
        </main>
        <BrandedFooter />
      </div>
    );
  }

  if (uiPhase === "diwaniya_setup") {
    return (
      <div className="min-h-screen flex flex-col bg-slate-950">
        <BrandedHeader />
        <main className="flex-1">
          <DiwaniyaPlaceholder />
        </main>
        <BrandedFooter />
      </div>
    );
  }

  // ============================
  // GAME PHASES
  // ============================
  const currentQuestion = selectedQuestions[round - 1];

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 relative overflow-hidden">
      {/* Animated gradient background during gameplay */}
      {uiPhase === "game" && (
        <div className="fixed inset-0 pointer-events-none z-0">
          <motion.div
            animate={{
              background: [
                "radial-gradient(ellipse at 20% 50%, rgba(120,53,15,0.12) 0%, transparent 60%)",
                "radial-gradient(ellipse at 80% 30%, rgba(136,19,55,0.12) 0%, transparent 60%)",
                "radial-gradient(ellipse at 50% 80%, rgba(120,53,15,0.10) 0%, transparent 60%)",
                "radial-gradient(ellipse at 20% 50%, rgba(120,53,15,0.12) 0%, transparent 60%)",
              ],
            }}
            transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0"
          />
          <motion.div
            animate={{
              opacity: [0.3, 0.6, 0.3],
              scale: [1, 1.2, 1],
            }}
            transition={{ duration: 8, repeat: Infinity }}
            className="absolute -top-40 -right-40 w-80 h-80 bg-amber-500/8 rounded-full blur-[100px]"
          />
          <motion.div
            animate={{
              opacity: [0.2, 0.5, 0.2],
              scale: [1, 1.2, 1],
            }}
            transition={{ duration: 8, repeat: Infinity, delay: 4 }}
            className="absolute -bottom-40 -left-40 w-80 h-80 bg-rose-500/8 rounded-full blur-[100px]"
          />
        </div>
      )}

      {/* Feedback Overlay */}
      <div className="relative z-10 flex flex-col min-h-screen">
      <FeedbackOverlay
        show={feedback.show}
        correct={feedback.correct}
        answer={feedback.answer}
      />

      {/* Round Result Card */}
      <RoundResultCard
        show={showRoundResult}
        type={roundResultType}
        teamName={roundResultTeamName}
        points={roundResultPoints}
      />

      {showGameOver ? (
        <GameOverScreen
          team1Name={team1Name}
          team2Name={team2Name}
          team1Score={team1Score}
          team2Score={team2Score}
          onRestart={handleReset}
          onHome={handleReset}
          roundHistory={roundHistory}
        />
      ) : gamePhase === "faceoff" && currentQuestion ? (
        <div className="flex-1 flex flex-col">
          {/* Game top bar */}
          <div className="sticky top-0 z-50 border-b border-slate-800/50 bg-slate-950/90 backdrop-blur-sm">
            <div className="max-w-md mx-auto flex items-center justify-between px-3 py-1.5">
              <Button
                onClick={handleReset}
                variant="ghost"
                className="text-slate-400 hover:text-red-400 hover:bg-red-950/30 gap-1.5 text-xs h-8 px-2"
              >
                <HomeIcon className="w-4 h-4" />
              </Button>
              <Badge variant="outline" className="border-amber-500/50 text-amber-400 text-[10px] px-2">
                الجولة {round}/{totalRounds}
              </Badge>
              <div className="flex items-center gap-2">
                <span className="text-xs text-amber-400 font-bold">{team1Score}</span>
                <span className="text-slate-600">-</span>
                <span className="text-xs text-rose-400 font-bold">{team2Score}</span>
              </div>
            </div>
          </div>

          <FaceOffScreen
            question={currentQuestion.question}
            team1Name={team1Name}
            team2Name={team2Name}
            onTeam1Start={() => handleFaceOffStart(1)}
            onTeam2Start={() => handleFaceOffStart(2)}
          />
        </div>
      ) : gamePhase === "gameboard" && currentQuestion ? (
        <div className="flex-1 flex flex-col">
          {/* Game top bar */}
          <div className="sticky top-0 z-50 border-b border-slate-800/50 bg-slate-950/90 backdrop-blur-sm">
            <div className="max-w-md mx-auto flex items-center justify-between px-3 py-1.5">
              <Button
                onClick={handleReset}
                variant="ghost"
                className="text-slate-400 hover:text-red-400 hover:bg-red-950/30 gap-1.5 text-xs h-8 px-2"
              >
                <HomeIcon className="w-4 h-4" />
              </Button>
              <Badge variant="outline" className="border-amber-500/50 text-amber-400 text-[10px] px-2">
                👑 العراب - الجولة {round}/{totalRounds}
              </Badge>
              <div className="flex items-center gap-2">
                <motion.span
                  key={team1Score}
                  initial={{ scale: 1.3, color: "#fbbf24" }}
                  animate={{ scale: 1 }}
                  className="text-xs font-black tabular-nums"
                >
                  <span className="text-amber-400">👑 {team1Score}</span>
                </motion.span>
                <span className="text-slate-600 text-[10px]">VS</span>
                <motion.span
                  key={team2Score}
                  initial={{ scale: 1.3 }}
                  animate={{ scale: 1 }}
                  className="text-xs font-black tabular-nums"
                >
                  <span className="text-rose-400">🏛️ {team2Score}</span>
                </motion.span>
              </div>
            </div>
            {/* Round History Indicator */}
            {roundHistory.length > 0 && (
              <div className="max-w-md mx-auto px-3 pb-1.5 flex gap-1 overflow-x-auto scrollbar-thin">
                {roundHistory.map((rh, i) => (
                  <div
                    key={i}
                    className={cn(
                      "flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold shrink-0 border",
                      rh.team === 1
                        ? "bg-amber-900/30 border-amber-500/20 text-amber-400"
                        : "bg-rose-900/30 border-rose-500/20 text-rose-400"
                    )}
                  >
                    <span>{rh.team === 1 ? "👑" : "🏛️"}</span>
                    <span>+{rh.points}</span>
                    <span className="text-slate-500">{rh.type}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <GameBoardView
            question={currentQuestion.question}
            answers={currentAnswers}
            currentTeam={currentTeam}
            team1Score={team1Score}
            team2Score={team2Score}
            team1Name={team1Name}
            team2Name={team2Name}
            strikes={strikes}
            onRevealAnswer={handleRevealAnswer}
            onAddStrike={handleAddStrike}
            onPassToOtherTeam={handlePassToOtherTeam}
            onSteal={handleSteal}
            onNoSteal={handleNoSteal}
            onRevealAll={handleRevealAll}
            phase="playing"
            round={round}
            totalRounds={totalRounds}
            roundScore={roundScore}
          />

          {/* Next Round Button */}
          {currentAnswers.every((a) => a.revealed) && (
            <div className="px-3 pb-3">
              <Button
                onClick={handleAwardAndNextRound}
                className="w-full bg-gradient-to-l from-amber-600 to-rose-600 text-white font-bold h-11"
              >
                {round >= totalRounds
                  ? "💰 جولة المال السريع"
                  : "الجولة التالية"}
                <ChevronLeft className="w-4 h-4 mr-2" />
              </Button>
            </div>
          )}
        </div>
      ) : gamePhase === "steal" && currentQuestion ? (
        <div className="flex-1 flex flex-col">
          {/* Game top bar */}
          <div className="sticky top-0 z-50 border-b border-rose-500/30 bg-slate-950/90 backdrop-blur-sm">
            <div className="max-w-md mx-auto flex items-center justify-between px-3 py-1.5">
              <Button
                onClick={handleReset}
                variant="ghost"
                className="text-slate-400 hover:text-red-400 hover:bg-red-950/30 gap-1.5 text-xs h-8 px-2"
              >
                <HomeIcon className="w-4 h-4" />
              </Button>
              <Badge variant="outline" className="border-rose-500/50 text-rose-400 text-[10px] px-2 animate-pulse">
                ⚡ فرصة السرقة
              </Badge>
              <div className="flex items-center gap-2">
                <span className="text-xs text-amber-400 font-bold">{team1Score}</span>
                <span className="text-slate-600">-</span>
                <span className="text-xs text-rose-400 font-bold">{team2Score}</span>
              </div>
            </div>
          </div>

          {/* Pulsing border during steal phase */}
          <motion.div
            animate={{
              borderColor: [
                "rgba(244,63,94,0.3)",
                "rgba(251,146,60,0.5)",
                "rgba(244,63,94,0.3)",
              ],
            }}
            transition={{ duration: 2, repeat: Infinity }}
            className="flex-1 flex flex-col mx-2 my-2 sm:mx-4 sm:my-3 border-2 rounded-3xl overflow-hidden"
          >
            <GameBoardView
              question={currentQuestion.question}
              answers={currentAnswers}
              currentTeam={currentTeam === 1 ? 2 : 1}
              team1Score={team1Score}
              team2Score={team2Score}
              team1Name={team1Name}
              team2Name={team2Name}
              strikes={strikes}
              onRevealAnswer={handleRevealAnswer}
              onAddStrike={handleAddStrike}
              onPassToOtherTeam={handlePassToOtherTeam}
              onSteal={handleSteal}
              onNoSteal={handleNoSteal}
              onRevealAll={handleRevealAll}
              phase="steal"
              round={round}
              totalRounds={totalRounds}
              roundScore={roundScore}
            />
          </motion.div>
        </div>
      ) : gamePhase === "fast_money" ? (
        <div className="flex-1 flex flex-col">
          {/* Game top bar */}
          <div className="sticky top-0 z-50 border-b border-slate-800/50 bg-slate-950/90 backdrop-blur-sm">
            <div className="max-w-md mx-auto flex items-center justify-between px-3 py-1.5">
              <Button
                onClick={handleReset}
                variant="ghost"
                className="text-slate-400 hover:text-red-400 hover:bg-red-950/30 gap-1.5 text-xs h-8 px-2"
              >
                <HomeIcon className="w-4 h-4" />
              </Button>
              <Badge className="bg-gradient-to-l from-amber-600 to-yellow-600 text-white text-[10px] px-2">
                💰 المال السريع
              </Badge>
              <div className="flex items-center gap-2">
                <span className="text-xs text-amber-400 font-bold">
                  {team1Score + fmScore1}
                </span>
                <span className="text-slate-600">-</span>
                <span className="text-xs text-rose-400 font-bold">
                  {team2Score + fmScore2}
                </span>
              </div>
            </div>
          </div>

          <FastMoneyScreen
            team1Name={team1Name}
            team2Name={team2Name}
            team1Score={team1Score}
            team2Score={team2Score}
            fmQuestions={fmQuestions}
            fmAnswers1={fmAnswers1}
            fmAnswers2={fmAnswers2}
            fmRevealed1={fmRevealed1}
            fmRevealed2={fmRevealed2}
            onRevealFM1={handleRevealFM1}
            onRevealFM2={handleRevealFM2}
            onInputFM1={(i, v) => {
              setFmAnswers1((prev) => {
                const updated = [...prev];
                updated[i] = v;
                return updated;
              });
            }}
            onInputFM2={(i, v) => {
              setFmAnswers2((prev) => {
                const updated = [...prev];
                updated[i] = v;
                return updated;
              });
            }}
            onStartTimer={handleStartTimer}
            timeLeft={timeLeft}
            timerRunning={timerRunning}
            roundScore={fmScore1 + fmScore2}
          />

          {/* Fast Money Results */}
          {fmPhase === "results" && (
            <div className="px-3 pb-4">
              <Card className="bg-slate-900/80 border-amber-500/30 mb-3">
                <CardContent className="p-4">
                  <h3 className="text-sm font-bold text-white mb-3 text-center">
                    نتائج المال السريع
                  </h3>
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div className="text-center">
                      <p className="text-xs text-amber-400">{team1Name}</p>
                      <p className="text-xl font-black text-amber-300">
                        +{fmScore1}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-rose-400">{team2Name}</p>
                      <p className="text-xl font-black text-rose-300">
                        +{fmScore2}
                      </p>
                    </div>
                  </div>
                  <Button
                    onClick={handleEndGame}
                    className="w-full bg-gradient-to-l from-amber-600 to-yellow-600 text-white font-bold"
                  >
                    <Trophy className="w-4 h-4 ml-1" />
                    إنهاء اللعبة
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      ) : null}
      </div>
    </div>
  );
}
