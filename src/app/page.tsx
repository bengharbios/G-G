'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Gamepad2,
  Globe,
  Smartphone,
  ShieldCheck,
  Users,
  ChevronLeft,
  Search,
  Bell,
  Settings,
  Star,
  Zap,
  Clock,
  HelpCircle,
  Home,
  Play,
  Crown,
  Gift,
  Store,
  Trophy,
  User,
} from 'lucide-react';

// ─── Game Data ────────────────────────────────────────────────────────────────

interface GameData {
  id: string;
  title: string;
  titleEn: string;
  emoji: string;
  description: string;
  href: string | null;
  bgImage: string | null;
  themeColor: string;
  themeBorder: string;
  themeBg: string;
  themeBadge: string;
  features: string[];
  status: 'available' | 'coming_soon';
  players: string;
  category: string;
}

const games: GameData[] = [
  {
    id: 'mafia',
    title: 'المافيا',
    titleEn: 'Mafia',
    emoji: '🕵️',
    description:
      'لعبة المافيا الكلاسيكية مع أدوار متعددة! اكتشف من هو المافيا قبل أن يسيطروا على المدينة.',
    href: '/mafia',
    bgImage: '/mafia-bg.png',
    themeColor: 'text-red-400',
    themeBorder: 'border-red-500/30 hover:border-red-500/60',
    themeBg: 'from-red-950/80 to-red-900/40',
    themeBadge: 'bg-red-500/20 border-red-500/40 text-red-300',
    features: ['العراب', 'الديوانية', 'أدوار متعددة', 'تصويت ذكي'],
    status: 'available',
    players: '4-14 لاعب',
    category: 'اجتماعية',
  },
  {
    id: 'tobol',
    title: 'طبول الحرب',
    titleEn: 'War Drums',
    emoji: '🥁',
    description:
      'حرب استراتيجية حقيقية مع 64 سلاح و60 زر هجوم! خطط واستولِ على أراضي العدو.',
    href: '/tobol',
    bgImage: '/img/war/card-bg.png',
    themeColor: 'text-orange-400',
    themeBorder: 'border-orange-500/30 hover:border-orange-500/60',
    themeBg: 'from-orange-950/80 to-red-900/40',
    themeBadge: 'bg-orange-500/20 border-orange-500/40 text-orange-300',
    features: ['العراب', '64 سلاح', '60 زر', 'هجوم وفخاخ'],
    status: 'available',
    players: '2-8 لاعب',
    category: 'حربية',
  },
  {
    id: 'tabot',
    title: 'الهروب من التابوت',
    titleEn: 'Escape the Coffin',
    emoji: '🪦',
    description:
      'هل تستطيع الهروب من التابوت قبل فوات الأوان؟ لعبة مليئة بالمفاجآت والرعب!',
    href: '/tabot',
    bgImage: '/tabot-bg.png',
    themeColor: 'text-purple-400',
    themeBorder: 'border-purple-500/30 hover:border-purple-500/60',
    themeBg: 'from-purple-950/80 to-purple-900/40',
    themeBadge: 'bg-purple-500/20 border-purple-500/40 text-purple-300',
    features: ['العراب', 'الديوانية', 'فرق وقادة', 'أبواب مفاجأة'],
    status: 'available',
    players: '4-16 لاعب',
    category: 'رعب',
  },
  {
    id: 'prison',
    title: 'السجن',
    titleEn: 'The Prison',
    emoji: '🔒',
    description:
      'سجن مليء بالمفاجآت! حبس خصومك، حرر أصدقائك، وتجنب الإعدام في لعبة الاستراتيجية والحظ.',
    href: '/prison',
    bgImage: null,
    themeColor: 'text-amber-400',
    themeBorder: 'border-amber-500/30 hover:border-amber-500/60',
    themeBg: 'from-amber-950/80 to-orange-900/40',
    themeBadge: 'bg-amber-500/20 border-amber-500/40 text-amber-300',
    features: ['العراب', 'الديوانية', 'زنزانات مفاجأة', 'حبس وإعدام'],
    status: 'available',
    players: '4-16 لاعب',
    category: 'استراتيجية',
  },
  {
    id: 'risk',
    title: 'المجازفة',
    titleEn: 'Risk',
    emoji: '💣',
    description:
      'ادفع حظك! اسحب البطاقات واجمع النقاط، لكن احذر القنابل! لعبة استراتيجية ومجازفة ممتعة.',
    href: '/risk',
    bgImage: '/images/risk/risk_1.webp',
    themeColor: 'text-violet-400',
    themeBorder: 'border-violet-500/30 hover:border-violet-500/60',
    themeBg: 'from-violet-950/80 to-purple-900/40',
    themeBadge: 'bg-violet-500/20 border-violet-500/40 text-violet-300',
    features: ['العراب', 'الديوانية', '2-4 فرق', 'قنابل ومجازفة'],
    status: 'available',
    players: '2-8 لاعب',
    category: 'مجازفة',
  },
  {
    id: 'risk2',
    title: 'المجازفة 2',
    titleEn: 'Risk 2',
    emoji: '🎴',
    description:
      'كاشف البطاقات! اختر أرقام مختلفة واحفظ نقاطك. 50 بطاقة و5 بطاقات خاصة ذهبية مضاعفة وقواعد مطابقة الأرقام.',
    href: '/risk2',
    bgImage: '/images/risk/risk2_banner.webp',
    themeColor: 'text-orange-400',
    themeBorder: 'border-orange-500/30 hover:border-orange-500/60',
    themeBg: 'from-orange-950/80 to-red-900/40',
    themeBadge: 'bg-orange-500/20 border-orange-500/40 text-orange-300',
    features: ['العراب', 'الديوانية', '5 ألوان', 'مطابقة أرقام', 'بطاقات ذهبية مضاعفة'],
    status: 'available',
    players: '2-10 لاعب',
    category: 'مجازفة',
  },
  {
    id: 'baharharb',
    title: 'بحر و حرب',
    titleEn: 'Sea & War',
    emoji: '🌊⚔️',
    description:
      'لعبة ذكاء وكلمات عربية! أجب على الأسئلة واكشف الكلمات المشتركة. فريقين أو أفراد، 600+ سؤال متنوع.',
    href: '/baharharb',
    bgImage: null,
    themeColor: 'text-teal-400',
    themeBorder: 'border-teal-500/30 hover:border-teal-500/60',
    themeBg: 'from-teal-950/80 to-cyan-900/40',
    themeBadge: 'bg-teal-500/20 border-teal-500/40 text-teal-300',
    features: ['العراب', 'فرق أو أفراد', '600+ سؤال', 'أدوات سحب عشوائي'],
    status: 'available',
    players: '2-20 لاعب',
    category: 'ذكاء',
  },
  {
    id: 'familyfeud',
    title: 'فاميلي فيود',
    titleEn: 'Family Feud',
    emoji: '🏆',
    description:
      'لعبة فاميلي فيود الكلاسيكية! المستضيف يتحكم باللعبة ويرى الإجابات، الفريقين يتنافسون لتخمين الإجابات الأكثر شعبية.',
    href: '/familyfeud',
    bgImage: '/images/familyfeud/familyfeud_banner.webp',
    themeColor: 'text-amber-400',
    themeBorder: 'border-amber-500/30 hover:border-amber-500/60',
    themeBg: 'from-amber-950/80 to-rose-900/40',
    themeBadge: 'bg-amber-500/20 border-amber-500/40 text-amber-300',
    features: ['العراب كمستضيف', 'الديوانية أونلاين', '95+ سؤال', 'جولة الجائزة المالية'],
    status: 'available',
    players: '2-10 لاعب',
    category: 'اجتماعية',
  },
  {
    id: 'words',
    title: 'لعبة الكلمات',
    titleEn: 'Word Game',
    emoji: '📝',
    description:
      'اختبر ذكاءك ومفرداتك في لعبة الكلمات التنافسية مع مستويات صعوبة متعددة وتصنيف عالمي.',
    href: null,
    bgImage: '/words-bg.png',
    themeColor: 'text-blue-400',
    themeBorder: 'border-blue-500/30 hover:border-blue-500/60',
    themeBg: 'from-blue-950/80 to-blue-900/40',
    themeBadge: 'bg-blue-500/20 border-blue-500/40 text-blue-300',
    features: ['جولات متعددة', 'مستويات صعوبة', 'تصنيف عالمي'],
    status: 'coming_soon',
    players: '2-20 لاعب',
    category: 'ذكاء',
  },
  {
    id: 'draw',
    title: 'تخمين الرسم',
    titleEn: 'Draw & Guess',
    emoji: '🎨',
    description:
      'ارسم وتخمّن مع أصحابك! غرف خاصة وتحديات يومية مع نظام رسم بالوقت الحقيقي.',
    href: null,
    bgImage: null,
    themeColor: 'text-pink-400',
    themeBorder: 'border-pink-500/30 hover:border-pink-500/60',
    themeBg: 'from-pink-950/80 to-purple-900/40',
    themeBadge: 'bg-pink-500/20 border-pink-500/40 text-pink-300',
    features: ['رسم بالوقت', 'غرف خاصة', 'تحديات يومية'],
    status: 'coming_soon',
    players: '2-12 لاعب',
    category: 'إبداعية',
  },
  {
    id: 'strategy',
    title: 'حرب الاستراتيجية',
    titleEn: 'Strategy War',
    emoji: '⚔️',
    description:
      'حرب استراتيجية شاملة مع خرائط متنوعة ووحدات عسكرية مختلفة وتحالفات مع لاعبين آخرين.',
    href: null,
    bgImage: null,
    themeColor: 'text-amber-400',
    themeBorder: 'border-amber-500/30 hover:border-amber-500/60',
    themeBg: 'from-amber-950/80 to-orange-900/40',
    themeBadge: 'bg-amber-500/20 border-amber-500/40 text-amber-300',
    features: ['خرائط متنوعة', 'وحدات عسكرية', 'تحالفات'],
    status: 'coming_soon',
    players: '2-10 لاعب',
    category: 'استراتيجية',
  },
];

// ─── Features Data ────────────────────────────────────────────────────────────

const platformFeatures = [
  {
    icon: <Gamepad2 className="w-7 h-7" />,
    title: 'ألعاب متنوعة',
    description: 'مجموعة ألعاب اجتماعية وحربية تلبي جميع الأذواق',
  },
  {
    icon: <Globe className="w-7 h-7" />,
    title: 'لعب جماعي',
    description: 'العب مع أصحابك في نفس الوقت من أي مكان',
  },
  {
    icon: <Smartphone className="w-7 h-7" />,
    title: 'متوافق مع الجوال',
    description: 'يعمل على جميع الأجهزة بسلاسة وبدون تطبيق',
  },
  {
    icon: <ShieldCheck className="w-7 h-7" />,
    title: 'آمن وخاص',
    description: 'لا نحتاج بيانات شخصية، العب بخصوصية تامة',
  },
];

// ─── How to Start Steps ──────────────────────────────────────────────────────

const steps = [
  {
    step: '١',
    title: 'اختر لعبتك المفضلة',
    description: 'استعرض الألعاب المتاحة واختر ما يناسبك',
    icon: <Gamepad2 className="w-8 h-8 text-red-400" />,
  },
  {
    step: '٢',
    title: 'شارك الرابط مع أصحابك',
    description: 'أرسل رابط اللعبة لصحابك وانضموا معاً',
    icon: <Users className="w-8 h-8 text-blue-400" />,
  },
  {
    step: '٣',
    title: 'ابدأ اللعب واستمتع!',
    description: 'استمتع بلحظات ممتعة مع أصحابك',
    icon: <Zap className="w-8 h-8 text-amber-400" />,
  },
];

// ─── Floating Emojis ──────────────────────────────────────────────────────────

const floatingEmojis = [
  { emoji: '🥁', x: '10%', y: '20%', delay: 0, duration: 6 },
  { emoji: '🕵️', x: '85%', y: '15%', delay: 1, duration: 7 },
  { emoji: '🪦', x: '15%', y: '70%', delay: 2, duration: 5 },
  { emoji: '💣', x: '75%', y: '75%', delay: 0.5, duration: 8 },
  { emoji: '🔒', x: '90%', y: '50%', delay: 1.5, duration: 6.5 },
  { emoji: '🎨', x: '5%', y: '45%', delay: 3, duration: 7.5 },
];

// ─── Testimonials Data ──────────────────────────────────────────────────────

const testimonials = [
  {
    name: 'أحمد',
    location: 'الرياض 🇸🇦',
    text: 'لعبة فاميلي فيود مذهلة! سهرنا ونلعبها كل يوم مع العيلة 👨‍👩‍👧‍👦',
    rating: 5,
    avatar: '👨‍💻',
  },
  {
    name: 'سارة',
    location: 'جدة 🇸🇦',
    text: 'أحلى منصة ألعاب عربية، نلعب مع صحباتي من أي مكان 🎮',
    rating: 5,
    avatar: '👩‍🎓',
  },
  {
    name: 'خالد',
    location: 'الدمام 🇸🇦',
    text: 'لعبة المافيا تجنن! نسبة الفوز عندنا ٥٠/٥٠ كل مرة 😂',
    rating: 5,
    avatar: '👨‍🔧',
  },
];

// ─── Banner Data ──────────────────────────────────────────────────────────────

const bannerItems = [
  { emoji: '🎪', title: 'بطولة المافيا الأسبوعية', subtitle: 'جائزة 500 💎 للفائز', gradient: 'from-red-900/60 via-rose-900/40 to-orange-900/60' },
  { emoji: '🔥', title: 'تحدي طبول الحرب', subtitle: 'تحدى أصدقائك الآن', gradient: 'from-orange-900/60 via-amber-900/40 to-red-900/60' },
  { emoji: '🎁', title: 'مكافآت يومية مجانية', subtitle: 'سجل دخولك واكسب جوائز', gradient: 'from-amber-900/60 via-yellow-900/40 to-orange-900/60' },
  { emoji: '🏆', title: 'تصنيف أفضل اللاعبين', subtitle: 'نافس وتصدر لوحة المتصدرين', gradient: 'from-emerald-900/60 via-teal-900/40 to-cyan-900/60' },
  { emoji: '⚡', title: 'لعبة جديدة قريباً', subtitle: 'ترقبوا مفاجآت قادمة', gradient: 'from-purple-900/60 via-violet-900/40 to-fuchsia-900/60' },
];

// ─── Quick Actions Data ──────────────────────────────────────────────────────

const quickActions = [
  { emoji: '📅', label: 'الأحداث', gradient: 'from-rose-500 to-amber-500' },
  { emoji: '🛒', label: 'المتجر', gradient: 'from-amber-500 to-yellow-500' },
  { emoji: '🏆', label: 'التصنيف', gradient: 'from-emerald-500 to-teal-500' },
  { emoji: '🎁', label: 'ادعُ أصدقاءك', gradient: 'from-purple-500 to-pink-500' },
  { emoji: '👑', label: 'VIP', gradient: 'from-yellow-400 to-amber-500' },
];

// ─── Daily Rewards Day Data ──────────────────────────────────────────────────

const dailyDays = [
  { dayLabel: 'أحد', icon: '💎', claimed: true, today: false, special: false },
  { dayLabel: 'اثن', icon: '❤️', claimed: true, today: false, special: false },
  { dayLabel: 'ثلا', icon: '✨', claimed: false, today: true, special: false },
  { dayLabel: 'أرب', icon: '💎', claimed: false, today: false, special: false },
  { dayLabel: 'خمي', icon: '💎', claimed: false, today: false, special: false },
  { dayLabel: 'جمع', icon: '💎', claimed: false, today: false, special: false },
  { dayLabel: 'سبت', icon: '🎁', claimed: false, today: false, special: true },
];

// ─── Smooth Scroll Helper ───────────────────────────────────────────────────

function smoothScrollTo(e: React.MouseEvent<HTMLAnchorElement>, id: string) {
  e.preventDefault();
  const el = document.querySelector(id);
  el?.scrollIntoView({ behavior: 'smooth' });
}

// ─── Active Players Hook ─────────────────────────────────────────────────────

function useActivePlayers() {
  const [count, setCount] = useState(214);
  const [visible, setVisible] = useState(true);
  const countRef = useRef(214);

  useEffect(() => {
    countRef.current = count;
  }, [count]);

  useEffect(() => {
    const randomBetween = (min: number, max: number) =>
      Math.floor(Math.random() * (max - min + 1)) + min;

    const changeCount = () => {
      setVisible(false);
      setTimeout(() => {
        const delta = randomBetween(-8, 8);
        const next = Math.max(142, Math.min(287, countRef.current + delta));
        setCount(next);
        setVisible(true);
      }, 300);
    };

    const timeout = setTimeout(changeCount, randomBetween(10000, 30000));
    const interval = setInterval(changeCount, randomBetween(10000, 30000));

    return () => {
      clearTimeout(timeout);
      clearInterval(interval);
    };
  }, []);

  return { count, visible };
}

// ─── Animation Variants ───────────────────────────────────────────────────────

const fadeInUp = {
  hidden: { opacity: 0, y: 40 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.6, ease: 'easeOut' },
  }),
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.12 },
  },
};

const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.5 } },
};

// ─── Header Component ─────────────────────────────────────────────────────────

function Header() {
  const { count, visible: countVisible } = useActivePlayers();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-slate-950/95 backdrop-blur-md border-b border-slate-800/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-14 sm:h-16 gap-3">
          {/* Logo + Title */}
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-amber-500 to-rose-600 flex items-center justify-center shadow-lg shadow-amber-500/20 shrink-0">
              <img
                src="/platform-logo.png"
                alt="ألعاب الغريب"
                className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg object-contain"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  target.parentElement!.innerHTML =
                    '<span class="text-white text-lg font-black">غ</span>';
                }}
              />
            </div>
            <h1 className="text-base sm:text-xl font-black bg-gradient-to-l from-amber-400 via-yellow-300 to-amber-400 bg-clip-text text-transparent truncate">
              ألعاب الغريب
            </h1>
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Active Players - hidden on small mobile */}
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-green-400 font-medium">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
              </span>
              <span className="transition-opacity duration-300">
                {countVisible ? count : count}
              </span>
              <span className="text-slate-500">متصل</span>
            </div>

            {/* Search */}
            <button
              className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700/50 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
              aria-label="بحث"
            >
              <Search className="w-4 h-4" />
            </button>

            {/* Gems */}
            <div className="flex items-center gap-1 bg-slate-800/80 border border-amber-500/30 rounded-full px-2.5 py-1">
              <span className="text-sm">💎</span>
              <span className="text-xs font-bold text-amber-400">2,450</span>
            </div>

            {/* Notification Bell */}
            <button
              className="relative w-9 h-9 rounded-full bg-slate-800 border border-slate-700/50 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
              aria-label="الإشعارات"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute -top-1 -left-1 w-4.5 h-4.5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                3
              </span>
            </button>

            {/* Profile Avatar */}
            <div className="relative group hidden sm:flex">
              <button
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-amber-500 to-rose-600 flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-amber-500/20"
                aria-label="الملف الشخصي"
              >
                غ
              </button>
              <span className="absolute -bottom-1.5 -left-1 text-[9px] font-bold bg-slate-800 border border-slate-600 text-amber-400 px-1 rounded-full leading-tight">
                12
              </span>
            </div>

            {/* Admin Link */}
            <a
              href="/admin"
              className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700/50 flex items-center justify-center text-slate-500 hover:text-slate-300 transition-colors"
              title="لوحة التحكم"
            >
              <Settings className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>
    </header>
  );
}

// ─── Banner Carousel ─────────────────────────────────────────────────────────

function BannerCarousel() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const animFrameRef = useRef<number>(0);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    let speed = 0.5;
    const step = () => {
      if (el) {
        el.scrollLeft += speed;
        const halfWidth = el.scrollWidth / 2;
        if (el.scrollLeft >= halfWidth) {
          el.scrollLeft -= halfWidth;
        }
      }
      animFrameRef.current = requestAnimationFrame(step);
    };
    animFrameRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, []);

  const doubled = [...bannerItems, ...bannerItems];

  return (
    <div className="relative">
      {/* Fade edges */}
      <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-l from-transparent to-slate-950 z-10 pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-r from-transparent to-slate-950 z-10 pointer-events-none" />

      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto scrollbar-none py-1 px-1"
        style={{ scrollBehavior: 'auto' }}
      >
        {doubled.map((item, i) => (
          <div
            key={i}
            className={`flex-shrink-0 w-72 sm:w-80 h-28 sm:h-32 rounded-2xl bg-gradient-to-br ${item.gradient} border border-slate-700/30 p-4 sm:p-5 flex flex-col justify-center backdrop-blur-sm`}
          >
            <span className="text-2xl sm:text-3xl mb-1.5">{item.emoji}</span>
            <h3 className="text-sm sm:text-base font-bold text-white leading-tight mb-1">{item.title}</h3>
            <p className="text-xs sm:text-sm text-slate-300">{item.subtitle}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Quick Actions ────────────────────────────────────────────────────────────

function QuickActions() {
  return (
    <div className="flex items-center justify-center gap-4 sm:gap-6 py-2">
      {quickActions.map((action, i) => (
        <motion.button
          key={i}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 + i * 0.08, duration: 0.4 }}
          className="flex flex-col items-center gap-1.5 group"
        >
          <div
            className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br ${action.gradient} flex items-center justify-center text-xl sm:text-2xl shadow-lg hover:scale-110 active:scale-95 transition-transform duration-200`}
          >
            {action.emoji}
          </div>
          <span className="text-[10px] sm:text-xs text-slate-400 group-hover:text-white transition-colors font-medium">
            {action.label}
          </span>
        </motion.button>
      ))}
    </div>
  );
}

// ─── Daily Rewards Section ───────────────────────────────────────────────────

function DailyRewardsSection() {
  const [spinning, setSpinning] = useState(false);
  const [spinComplete, setSpinComplete] = useState(false);

  const handleSpin = useCallback(() => {
    if (spinning) return;
    setSpinning(true);
    setSpinComplete(false);
    setTimeout(() => {
      setSpinning(false);
      setSpinComplete(true);
      setTimeout(() => setSpinComplete(false), 3000);
    }, 3000);
  }, [spinning]);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
      {/* Daily Rewards Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="rounded-2xl border border-slate-800/60 bg-gradient-to-b from-slate-900/80 to-slate-950/90 p-4 sm:p-6"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-xl">🔥</span>
            <h3 className="text-base sm:text-lg font-bold text-white">المكافآت اليومية</h3>
          </div>
          <Badge className="bg-amber-500/20 border-amber-500/40 text-amber-300 text-[10px] sm:text-xs font-bold">
            اليوم 3/7
          </Badge>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden mb-4">
          <motion.div
            initial={{ width: '0%' }}
            animate={{ width: '42.8%' }}
            transition={{ delay: 0.5, duration: 1, ease: 'easeOut' }}
            className="h-full bg-gradient-to-l from-amber-400 to-amber-600 rounded-full"
          />
        </div>

        {/* Day Buttons */}
        <div className="flex items-center justify-between gap-1.5 sm:gap-2">
          {dailyDays.map((day, i) => (
            <div
              key={i}
              className={`flex flex-col items-center gap-1 ${
                day.claimed ? 'opacity-100' : !day.today ? 'opacity-40' : 'opacity-100'
              }`}
            >
              <button
                className={`relative w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center text-base sm:text-lg transition-all duration-200 ${
                  day.claimed
                    ? 'bg-amber-500/20 border border-amber-500/40 shadow-md shadow-amber-500/10'
                    : day.today
                      ? 'bg-gradient-to-br from-amber-500 to-orange-500 border border-amber-400/60 shadow-lg shadow-amber-500/30 scale-110'
                      : 'bg-slate-800 border border-slate-700/50'
                }`}
              >
                {day.today && (
                  <motion.span
                    className="absolute -top-1 -right-1 text-xs"
                    animate={{ scale: [1, 1.3, 1], opacity: [0.7, 1, 0.7] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    ✨
                  </motion.span>
                )}
                {day.icon}
              </button>
              <span className="text-[9px] sm:text-[10px] text-slate-500 font-medium">{day.dayLabel}</span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Lucky Wheel Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35, duration: 0.5 }}
        className="rounded-2xl border border-slate-800/60 bg-gradient-to-b from-slate-900/80 to-slate-950/90 p-4 sm:p-6 flex flex-col items-center text-center"
      >
        <h3 className="text-base sm:text-lg font-bold text-white mb-1 flex items-center gap-2">
          <span>🔄</span>
          <span>عجلة الحظ</span>
        </h3>
        <p className="text-xs sm:text-sm text-slate-400 mb-4 leading-relaxed">
          الفّ العجلة يومياً واكسب جوائز رائعة! 💎🎁
        </p>

        {/* Wheel Button */}
        <motion.button
          onClick={handleSpin}
          animate={{ rotate: spinning ? 360 * 5 : 0 }}
          transition={{ duration: 3, ease: 'easeInOut' }}
          className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-full mb-4 focus:outline-none"
          style={{
            background: 'conic-gradient(from 0deg, #f59e0b, #f43f5e, #a855f7, #f59e0b)',
            padding: '3px',
          }}
        >
          <div className="w-full h-full rounded-full bg-slate-900 flex flex-col items-center justify-center gap-1 overflow-hidden">
            {/* Gradient quarters */}
            <div className="absolute inset-0 grid grid-cols-2 grid-rows-2 rounded-full">
              <div className="bg-amber-900/20 rounded-tr-full" />
              <div className="bg-rose-900/20 rounded-tl-full" />
              <div className="bg-purple-900/20 rounded-br-full" />
              <div className="bg-amber-900/20 rounded-bl-full" />
            </div>
            <span className="relative text-2xl sm:text-3xl">🎰</span>
            <span className="relative text-xs sm:text-sm font-bold text-white">
              {spinning ? '...' : spinComplete ? '🎉' : 'لف!'}
            </span>
          </div>
        </motion.button>

        <Badge className="bg-slate-800/80 border-slate-700/50 text-slate-400 text-[10px]">
          متاح مرة واحدة يومياً
        </Badge>
      </motion.div>
    </div>
  );
}

// ─── Game Card Component ──────────────────────────────────────────────────────

function GameCard({ game, index }: { game: GameData; index: number }) {
  const isAvailable = game.status === 'available';
  const isComingSoon = game.status === 'coming_soon';

  const CardWrapper = isAvailable ? 'a' : 'div';
  const linkProps = isAvailable ? { href: game.href } : {};

  // Animated gradient border colors per game theme
  const gradientColors = isAvailable
    ? game.themeBorder.includes('red')
      ? ['#ef4444', '#a855f7', '#f59e0b', '#ef4444']
      : game.themeBorder.includes('orange')
        ? ['#f97316', '#ef4444', '#f59e0b', '#f97316']
        : game.themeBorder.includes('purple')
          ? ['#a855f7', '#6366f1', '#ec4899', '#a855f7']
          : game.themeBorder.includes('amber')
            ? ['#f59e0b', '#f97316', '#ef4444', '#f59e0b']
            : game.themeBorder.includes('violet')
              ? ['#8b5cf6', '#a855f7', '#6366f1', '#8b5cf6']
              : game.themeBorder.includes('teal')
                ? ['#14b8a6', '#06b6d4', '#10b981', '#14b8a6']
                : ['#ef4444', '#a855f7', '#f59e0b', '#ef4444']
    : null;

  return (
    <motion.div
      custom={index}
      variants={fadeInUp}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-50px' }}
    >
      {/* Animated gradient border wrapper */}
      <div
        className="relative rounded-2xl p-[2px]"
        style={
          isAvailable && gradientColors
            ? {
                background: `linear-gradient(var(--gradient-angle, 0deg), ${gradientColors.join(', ')})`,
                animation: 'card-border-spin 6s linear infinite',
              }
            : undefined
        }
      >
        <CardWrapper
          {...(linkProps as Record<string, unknown>)}
          className={`group relative block rounded-[14px] border ${game.themeBorder} overflow-hidden transition-all duration-300 ${
            isAvailable
              ? 'hover:shadow-xl hover:shadow-black/30 hover:-translate-y-1 cursor-pointer'
              : 'opacity-70 cursor-default'
          }`}
        >
          {/* Background Image Layer */}
          <div
            className={`absolute inset-0 bg-gradient-to-b ${game.themeBg}`}
            style={
              game.bgImage
                ? {
                    backgroundImage: `url(${game.bgImage})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                  }
                : undefined
            }
          >
            {game.bgImage && (
              <div
                className={`absolute inset-0 bg-gradient-to-b ${game.themeBg}`}
              />
            )}
          </div>

          {/* Hover dark overlay */}
          {isAvailable && (
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-300 z-[5]" />
          )}

          {/* Coming Soon Overlay */}
          {isComingSoon && (
            <div className="absolute inset-0 z-[5] bg-gradient-to-b from-slate-950/30 via-slate-900/10 to-slate-950/40 backdrop-blur-[1px]" />
          )}

          {/* Content */}
          <div className="relative z-10 p-4 sm:p-5 flex flex-col gap-3 min-h-[220px] sm:min-h-[260px]">
            {/* Top Row: Status Badge + Emoji */}
            <div className="flex items-start justify-between">
              <Badge
                className={`${game.themeBadge} text-[9px] sm:text-[10px] font-bold backdrop-blur-sm ${
                  isComingSoon ? 'animate-pulse' : ''
                }`}
              >
                {isAvailable ? '🟢 متاحة' : '✨ قريباً'}
              </Badge>
              <motion.div
                className="text-3xl sm:text-4xl"
                whileHover={
                  isAvailable
                    ? {
                        scale: 1.3,
                        rotate: [0, -10, 10, -5, 0],
                        transition: { duration: 0.5 },
                      }
                    : {}
                }
              >
                {game.emoji}
              </motion.div>
            </div>

            {/* Title */}
            <div>
              <h3
                className={`text-lg sm:text-xl font-black ${game.themeColor} mb-0.5 ${
                  isComingSoon ? 'opacity-80' : ''
                }`}
              >
                {game.title}
              </h3>
              <p className="text-[10px] sm:text-xs text-slate-500 font-medium">
                {game.titleEn}
              </p>
            </div>

            {/* Description */}
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed line-clamp-2 flex-1">
              {game.description}
            </p>

            {/* Meta */}
            <div className="flex items-center gap-2 text-[10px] sm:text-xs text-slate-500">
              <span className="flex items-center gap-1">
                <Users className="w-3 h-3" />
                {game.players}
              </span>
              <span className="text-slate-700">|</span>
              <span>{game.category}</span>
            </div>

            {/* Action */}
            <div className="mt-auto pt-1">
              {isAvailable ? (
                <div className="flex items-center justify-between text-xs sm:text-sm font-bold text-red-400 group-hover:text-red-300 transition-colors">
                  <span>ابدأ اللعب</span>
                  <ChevronLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                  <motion.span
                    className="inline-block"
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 2.5, repeat: Infinity }}
                  >
                    🚧
                  </motion.span>
                  <span>قيد التطوير</span>
                </div>
              )}
            </div>
          </div>

          {/* Play button overlay (appears on hover) */}
          {isAvailable && (
            <div className="absolute inset-0 z-[6] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                whileHover={{ scale: 1 }}
                className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-white/95 flex items-center justify-center shadow-2xl shadow-black/40"
              >
                <Play className="w-6 h-6 sm:w-7 sm:h-7 text-slate-900 mr-[-2px]" fill="currentColor" />
              </motion.div>
            </div>
          )}
        </CardWrapper>
      </div>
    </motion.div>
  );
}

// ─── Games Section ───────────────────────────────────────────────────────────

function GamesSection() {
  const availableCount = games.filter(g => g.status === 'available').length;

  return (
    <section id="games" className="relative py-8 sm:py-12 bg-slate-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="flex items-center justify-between mb-6 sm:mb-8"
        >
          <div className="flex items-center gap-2.5">
            <span className="text-xl sm:text-2xl">🎮</span>
            <h2 className="text-lg sm:text-2xl font-black text-white">الألعاب</h2>
            <Badge className="bg-emerald-500/20 border-emerald-500/40 text-emerald-300 text-[10px] sm:text-xs font-bold">
              {availableCount} متاحة
            </Badge>
          </div>
          <span className="text-xs sm:text-sm text-slate-500 font-medium">الكل ({games.length})</span>
        </motion.div>

        {/* Games Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4 lg:gap-5">
          {games.map((game, i) => (
            <GameCard key={game.id} game={game} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Features Section ────────────────────────────────────────────────────────

function FeaturesSection() {
  return (
    <section
      id="features"
      className="relative py-16 sm:py-24 bg-gradient-to-b from-slate-950 via-slate-900/50 to-slate-950"
    >
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-purple-900/10 via-transparent to-transparent" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-14"
        >
          <Badge
            variant="outline"
            className="border-purple-500/30 text-purple-400 mb-4 text-xs"
          >
            ✨ لماذا نحن؟
          </Badge>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white mb-4">
            مميزات{' '}
            <span className="bg-gradient-to-l from-purple-400 to-pink-400 bg-clip-text text-transparent">
              المنصة
            </span>
          </h2>
          <p className="text-slate-400 max-w-xl mx-auto text-base sm:text-lg">
            صُممت لتجربة لعب مثالية للاعبين العرب
          </p>
        </motion.div>

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6"
        >
          {platformFeatures.map((feature, i) => (
            <motion.div
              key={i}
              variants={fadeInUp}
              custom={i}
            >
              <Card className="bg-slate-900/80 border-slate-800/50 hover:border-slate-700/80 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-black/20 group h-full">
                <CardContent className="p-6 flex flex-col items-center text-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-800/50 border border-slate-700/50 flex items-center justify-center text-red-400 group-hover:scale-110 transition-transform duration-300">
                    {feature.icon}
                  </div>
                  <h3 className="text-lg font-bold text-white">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-slate-400 leading-relaxed">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

// ─── Testimonials Section ────────────────────────────────────────────────────

function TestimonialsSection() {
  return (
    <section
      id="testimonials"
      className="relative py-16 sm:py-24 bg-gradient-to-b from-slate-950 via-slate-900/30 to-slate-950"
    >
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-green-900/10 via-transparent to-transparent" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-14"
        >
          <Badge
            variant="outline"
            className="border-green-500/30 text-green-400 mb-4 text-xs"
          >
            💬 آراء اللاعبين
          </Badge>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white mb-4">
            شنو يقولون{' '}
            <span className="bg-gradient-to-l from-green-400 to-emerald-400 bg-clip-text text-transparent">
              اللاعبين؟
            </span>
          </h2>
          <p className="text-slate-400 max-w-xl mx-auto text-base sm:text-lg">
            آراء حقيقية من لاعبين يستمتعون بالمنصة
          </p>
        </motion.div>

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8"
        >
          {testimonials.map((t, i) => (
            <motion.div key={i} variants={fadeInUp} custom={i}>
              <div className="relative h-full rounded-2xl border border-slate-700/40 bg-slate-800/30 backdrop-blur-md p-6 sm:p-8 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-black/20 hover:border-slate-600/50">
                <div className="absolute top-4 left-4 text-4xl text-slate-700/50 select-none pointer-events-none">
                  ❝
                </div>

                <div className="flex items-center gap-0.5 mb-4">
                  {Array.from({ length: 5 }).map((_, si) => (
                    <span
                      key={si}
                      className={`text-sm ${si < t.rating ? 'text-amber-400' : 'text-slate-700'}`}
                    >
                      ⭐
                    </span>
                  ))}
                </div>

                <p className="text-base text-slate-300 leading-relaxed mb-6 relative z-10">
                  {t.text}
                </p>

                <div className="flex items-center gap-3 pt-4 border-t border-slate-700/40">
                  <span className="text-3xl">{t.avatar}</span>
                  <div>
                    <p className="font-bold text-white text-sm">{t.name}</p>
                    <p className="text-xs text-slate-500">{t.location}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

// ─── How to Start Section ────────────────────────────────────────────────────

function HowToStartSection() {
  return (
    <section
      id="how-to-start"
      className="relative py-16 sm:py-24 bg-slate-950"
    >
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-14"
        >
          <Badge
            variant="outline"
            className="border-amber-500/30 text-amber-400 mb-4 text-xs"
          >
            🚀 سهل وسريع
          </Badge>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white mb-4">
            كيف{' '}
            <span className="bg-gradient-to-l from-amber-400 to-orange-400 bg-clip-text text-transparent">
              تبدأ؟
            </span>
          </h2>
          <p className="text-slate-400 max-w-xl mx-auto text-base sm:text-lg">
            ثلاث خطوات بسيطة وتبدأ اللعب مع أصحابك
          </p>
        </motion.div>

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8"
        >
          {steps.map((step, i) => (
            <motion.div key={i} variants={fadeInUp} custom={i}>
              <Card className="bg-slate-900/80 border-slate-800/50 hover:border-slate-700/80 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-black/20 h-full">
                <CardContent className="p-6 sm:p-8 flex flex-col items-center text-center gap-4 relative">
                  <div className="absolute -top-3 -right-3 w-10 h-10 rounded-full bg-gradient-to-br from-red-600 to-red-700 flex items-center justify-center text-white text-lg font-black shadow-lg shadow-red-500/25">
                    {step.step}
                  </div>

                  <div className="w-16 h-16 rounded-2xl bg-slate-800/80 border border-slate-700/50 flex items-center justify-center">
                    {step.icon}
                  </div>

                  <h3 className="text-lg font-bold text-white">{step.title}</h3>

                  <p className="text-sm text-slate-400 leading-relaxed">
                    {step.description}
                  </p>

                  {i < steps.length - 1 && (
                    <div className="hidden md:block absolute -left-4 top-1/2 -translate-y-1/2 w-8 border-t-2 border-dashed border-slate-700" />
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="text-center mt-12"
        >
          <Button
            asChild
            size="lg"
            className="bg-gradient-to-l from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-bold text-lg px-10 py-6 shadow-xl shadow-red-500/25"
          >
            <a href="#games" onClick={(e) => smoothScrollTo(e, '#games')}>
              <Gamepad2 className="w-5 h-5 ml-2" />
              جاهز؟ ابدأ اللعب الآن!
            </a>
          </Button>
        </motion.div>
      </div>
    </section>
  );
}

// ─── Footer ──────────────────────────────────────────────────────────────────

function Footer() {
  return (
    <footer className="relative">
      <div className="h-[3px] bg-gradient-to-r from-transparent via-red-500 via-purple-500 via-amber-500 to-transparent" />

      <div className="bg-gradient-to-b from-slate-950 to-slate-900/80">
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage:
              'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
            backgroundSize: '32px 32px',
          }}
        />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-col items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-purple-600 flex items-center justify-center shadow-lg shadow-red-500/15">
                <img
                  src="/platform-logo.png"
                  alt="ألعاب الغريب"
                  className="w-8 h-8 rounded-lg object-contain"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    target.parentElement!.innerHTML =
                      '<span class="text-white text-sm font-black">غ</span>';
                  }}
                />
              </div>
              <span className="text-lg font-black bg-gradient-to-l from-red-400 via-yellow-300 to-red-400 bg-clip-text text-transparent">
                ألعاب الغريب
              </span>
            </div>

            <div className="w-48 h-px bg-gradient-to-r from-transparent via-slate-700 to-transparent" />

            <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-8">
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-500">💻 برمجة</span>
                <span className="text-sm font-bold bg-gradient-to-l from-yellow-400 to-amber-500 bg-clip-text text-transparent">
                  الغريب
                </span>
              </div>
              <span className="hidden sm:block text-slate-700">•</span>
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-500">🏠 برعاية</span>
                <span className="text-sm font-bold bg-gradient-to-l from-blue-400 to-purple-400 bg-clip-text text-transparent">
                  ANA VIP 100034
                </span>
              </div>
            </div>

            <div className="flex flex-col items-center gap-3 mt-1">
              <span className="text-xs text-slate-500 font-medium">
                تابعنا
              </span>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  className="w-10 h-10 rounded-xl bg-slate-800/60 border border-slate-700/50 flex items-center justify-center text-lg hover:bg-slate-700/60 hover:border-slate-600/50 hover:scale-110 transition-all duration-200"
                  aria-label="تابعنا على الجوال"
                >
                  📱
                </button>
                <button
                  type="button"
                  className="w-10 h-10 rounded-xl bg-slate-800/60 border border-slate-700/50 flex items-center justify-center text-lg hover:bg-slate-700/60 hover:border-slate-600/50 hover:scale-110 transition-all duration-200"
                  aria-label="تابعنا على انستغرام"
                >
                  📸
                </button>
                <button
                  type="button"
                  className="w-10 h-10 rounded-xl bg-slate-800/60 border border-slate-700/50 flex items-center justify-center text-lg hover:bg-slate-700/60 hover:border-slate-600/50 hover:scale-110 transition-all duration-200"
                  aria-label="فعّل الإشعارات"
                >
                  🔔
                </button>
              </div>
            </div>

            <div className="w-48 h-px bg-gradient-to-r from-transparent via-slate-700 to-transparent" />

            <p className="text-xs text-slate-600">
              © {new Date().getFullYear()} ألعاب الغريب — جميع الحقوق محفوظة
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}

// ─── Bottom Navigation Bar (Mobile) ─────────────────────────────────────────

function BottomNavBar() {
  const [activeTab, setActiveTab] = useState('home');

  const tabs = [
    { id: 'home', label: 'الرئيسية', icon: Home },
    { id: 'games', label: 'الألعاب', icon: Gamepad2 },
    { id: 'store', label: 'المتجر', icon: Store },
    { id: 'rewards', label: 'المكافآت', icon: Gift },
    { id: 'profile', label: 'الملف', icon: User },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-slate-950/95 backdrop-blur-md border-t border-slate-800/50 safe-area-pb">
      <div className="flex items-center justify-around px-2 py-1.5">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="flex flex-col items-center gap-0.5 py-1 px-3 rounded-xl transition-colors"
            >
              <Icon
                className={`w-5 h-5 transition-colors ${
                  isActive ? 'text-amber-400' : 'text-slate-500'
                }`}
              />
              <span
                className={`text-[10px] font-medium transition-colors ${
                  isActive ? 'text-amber-400' : 'text-slate-500'
                }`}
              >
                {tab.label}
              </span>
              {isActive && (
                <motion.div
                  layoutId="bottomNavIndicator"
                  className="absolute -top-1.5 w-6 h-0.5 rounded-full bg-amber-400"
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function HomePage() {
  return (
    <div dir="rtl" className="min-h-screen bg-slate-950 text-white">
      <Header />

      {/* Main Content - with padding for fixed header and bottom nav */}
      <main className="pt-14 sm:pt-16 pb-20 md:pb-0">
        {/* Scrolling Banner Carousel */}
        <section className="relative pt-4 sm:pt-6 pb-4 sm:pb-6 max-w-7xl mx-auto px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.6 }}
          >
            <BannerCarousel />
          </motion.div>
        </section>

        {/* Quick Action Buttons */}
        <section className="py-3 sm:py-5 max-w-7xl mx-auto px-4 sm:px-6">
          <QuickActions />
        </section>

        {/* Daily Rewards Section */}
        <section className="py-3 sm:py-5 max-w-7xl mx-auto px-4 sm:px-6">
          <DailyRewardsSection />
        </section>

        {/* Games Section */}
        <GamesSection />

        {/* Features Section */}
        <FeaturesSection />

        {/* Testimonials Section */}
        <TestimonialsSection />

        {/* How to Start Section */}
        <HowToStartSection />
      </main>

      {/* Footer */}
      <Footer />

      {/* Bottom Navigation (mobile only) */}
      <BottomNavBar />

      {/* Global CSS for animations */}
      <style jsx global>{`
        @property --gradient-angle {
          syntax: '<angle>';
          initial-value: 0deg;
          inherits: false;
        }
        @keyframes card-border-spin {
          to {
            --gradient-angle: 360deg;
          }
        }
        .scrollbar-none::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-none {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .safe-area-pb {
          padding-bottom: env(safe-area-inset-bottom, 0px);
        }
      `}</style>
    </div>
  );
}
