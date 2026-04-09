'use client';

import { useState } from 'react';
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
  Menu,
  X,
  Star,
  Zap,
  Clock,
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
  { emoji: '🔒', x: '75%', y: '75%', delay: 0.5, duration: 8 },
  { emoji: '🎨', x: '90%', y: '50%', delay: 1.5, duration: 6.5 },
  { emoji: '⚔️', x: '5%', y: '45%', delay: 3, duration: 7.5 },
];

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

const heroTextVariant = {
  hidden: { opacity: 0, y: 30, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] },
  },
};

const statsVariant = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: (i: number) => ({
    opacity: 1,
    scale: 1,
    transition: { delay: 0.8 + i * 0.15, duration: 0.5, ease: 'easeOut' },
  }),
};

// ─── Header Component ─────────────────────────────────────────────────────────

function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-slate-950/95 backdrop-blur-md border-b border-slate-800/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo + Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-purple-600 flex items-center justify-center shadow-lg shadow-red-500/20">
              <img
                src="/platform-logo.png"
                alt="ألعاب الغريب"
                className="w-8 h-8 rounded-lg object-contain"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  target.parentElement!.innerHTML =
                    '<span class="text-white text-xl font-black">غ</span>';
                }}
              />
            </div>
            <h1 className="text-lg sm:text-xl font-black bg-gradient-to-l from-red-400 via-yellow-300 to-red-400 bg-clip-text text-transparent">
              ألعاب الغريب
            </h1>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-6">
            <a
              href="#games"
              className="text-sm text-slate-300 hover:text-white transition-colors"
            >
              الألعاب
            </a>
            <a
              href="#features"
              className="text-sm text-slate-300 hover:text-white transition-colors"
            >
              المميزات
            </a>
            <a
              href="#how-to-start"
              className="text-sm text-slate-300 hover:text-white transition-colors"
            >
              كيف تبدأ؟
            </a>
            <Button
              asChild
              className="bg-gradient-to-l from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-bold shadow-lg shadow-red-500/25"
            >
              <a href="#games">
                <Gamepad2 className="w-4 h-4 ml-2" />
                العب الآن
              </a>
            </Button>
          </nav>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden text-slate-300 hover:text-white p-2 rounded-lg hover:bg-slate-800/50 transition-colors"
          >
            {mobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-slate-950 border-t border-slate-800/50 overflow-hidden"
          >
            <nav className="flex flex-col px-4 py-4 gap-3">
              <a
                href="#games"
                onClick={() => setMobileMenuOpen(false)}
                className="text-slate-300 hover:text-white transition-colors py-2 px-3 rounded-lg hover:bg-slate-800/50"
              >
                🎮 الألعاب
              </a>
              <a
                href="#features"
                onClick={() => setMobileMenuOpen(false)}
                className="text-slate-300 hover:text-white transition-colors py-2 px-3 rounded-lg hover:bg-slate-800/50"
              >
                ✨ المميزات
              </a>
              <a
                href="#how-to-start"
                onClick={() => setMobileMenuOpen(false)}
                className="text-slate-300 hover:text-white transition-colors py-2 px-3 rounded-lg hover:bg-slate-800/50"
              >
                🚀 كيف تبدأ؟
              </a>
              <Button
                asChild
                className="bg-gradient-to-l from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-bold mt-2"
              >
                <a href="#games" onClick={() => setMobileMenuOpen(false)}>
                  <Gamepad2 className="w-4 h-4 ml-2" />
                  العب الآن
                </a>
              </Button>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

// ─── Hero Section ────────────────────────────────────────────────────────────

function HeroSection() {
  const heroStats = [
    { icon: <Gamepad2 className="w-5 h-5" />, value: '5+', label: 'ألعاب' },
    { icon: <Users className="w-5 h-5" />, value: 'حتى 20', label: 'لاعب' },
    { icon: <Star className="w-5 h-5" />, value: '∞', label: 'متعة' },
  ];

  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden pt-16">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-red-900/20 via-transparent to-transparent" />
      <div className="absolute top-20 left-1/4 w-96 h-96 bg-red-500/10 rounded-full blur-3xl" />
      <div className="absolute bottom-20 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />

      {/* Floating Emojis */}
      {floatingEmojis.map((item, i) => (
        <motion.div
          key={i}
          className="absolute text-3xl sm:text-4xl opacity-20 select-none pointer-events-none"
          style={{ left: item.x, top: item.y }}
          animate={{
            y: [0, -20, 0, 15, 0],
            rotate: [0, 10, -5, 8, 0],
            scale: [1, 1.1, 0.95, 1.05, 1],
          }}
          transition={{
            duration: item.duration,
            repeat: Infinity,
            delay: item.delay,
            ease: 'easeInOut',
          }}
        >
          {item.emoji}
        </motion.div>
      ))}

      {/* Content */}
      <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
        {/* Platform badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 bg-slate-800/60 border border-slate-700/50 rounded-full px-4 py-2 mb-8 backdrop-blur-sm"
        >
          <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
          <span className="text-sm text-slate-300">
            🎮 منصة ألعاب جماعية عربية
          </span>
        </motion.div>

        {/* Main Title */}
        <motion.h2
          variants={heroTextVariant}
          initial="hidden"
          animate="visible"
          className="text-4xl sm:text-6xl md:text-7xl font-black mb-6 leading-tight"
        >
          <span className="bg-gradient-to-l from-red-400 via-yellow-300 via-orange-300 to-red-500 bg-clip-text text-transparent">
            العب مع أصحابك
          </span>
        </motion.h2>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed"
        >
          منصة ألعاب اجتماعية عربية، العب مع أصحابك في نفس الوقت من أي مكان!
          <br />
          <span className="text-slate-500">بدون تسجيل، بدون تطبيق، فقط شارك الرابط والعب</span>
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="flex flex-col sm:flex-row gap-4 justify-center mb-14"
        >
          <Button
            asChild
            size="lg"
            className="bg-gradient-to-l from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-bold text-lg px-8 py-6 shadow-xl shadow-red-500/25 hover:shadow-red-500/40 transition-shadow"
          >
            <a href="#games">
              <Gamepad2 className="w-5 h-5 ml-2" />
              ابدأ اللعب الآن
            </a>
          </Button>
          <Button
            asChild
            variant="outline"
            size="lg"
            className="border-slate-700 text-slate-300 hover:bg-slate-800/50 hover:text-white font-bold text-lg px-8 py-6"
          >
            <a href="#how-to-start">
              <Clock className="w-5 h-5 ml-2" />
              كيف تبدأ؟
            </a>
          </Button>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial="hidden"
          animate="visible"
          className="flex justify-center gap-6 sm:gap-12"
        >
          {heroStats.map((stat, i) => (
            <motion.div
              key={i}
              variants={statsVariant}
              custom={i}
              className="flex flex-col items-center gap-1"
            >
              <div className="flex items-center gap-2 text-slate-400 mb-1">
                {stat.icon}
              </div>
              <span className="text-2xl sm:text-3xl font-black text-white">
                {stat.value}
              </span>
              <span className="text-sm text-slate-500">{stat.label}</span>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-slate-950 to-transparent" />
    </section>
  );
}

// ─── Game Card Component ──────────────────────────────────────────────────────

function GameCard({ game, index }: { game: GameData; index: number }) {
  const isAvailable = game.status === 'available';

  const CardWrapper = isAvailable ? 'a' : 'div';
  const linkProps = isAvailable ? { href: game.href } : {};

  return (
    <motion.div
      custom={index}
      variants={fadeInUp}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-50px' }}
    >
      <CardWrapper
        {...(linkProps as any)}
        className={`group relative block rounded-2xl border ${game.themeBorder} overflow-hidden transition-all duration-300 ${
          isAvailable
            ? 'hover:shadow-xl hover:shadow-black/30 hover:-translate-y-1 cursor-pointer'
            : 'opacity-70 cursor-default'
        }`}
      >
        {/* Background Image Layer */}
        <div
          className={`absolute inset-0 bg-gradient-to-b ${game.themeBg} ${
            game.bgImage
              ? ''
              : ''
          }`}
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

        {/* Content */}
        <div className="relative z-10 p-5 sm:p-6 flex flex-col gap-4 min-h-[280px]">
          {/* Top Row: Status Badge + Emoji */}
          <div className="flex items-start justify-between">
            <Badge
              className={`${game.themeBadge} text-[10px] sm:text-xs font-bold backdrop-blur-sm`}
            >
              {isAvailable ? '🟢 متاحة الآن' : '⏳ قريباً'}
            </Badge>
            <motion.div
              className="text-4xl sm:text-5xl"
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
              className={`text-xl sm:text-2xl font-black ${game.themeColor} mb-1`}
            >
              {game.title}
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              {game.titleEn}
            </p>
          </div>

          {/* Description */}
          <p className="text-sm text-slate-400 leading-relaxed line-clamp-2 flex-1">
            {game.description}
          </p>

          {/* Meta: Players + Category */}
          <div className="flex items-center gap-3 text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <Users className="w-3.5 h-3.5" />
              {game.players}
            </span>
            <span className="text-slate-700">|</span>
            <span>{game.category}</span>
          </div>

          {/* Feature Tags */}
          <div className="flex flex-wrap gap-1.5">
            {game.features.map((feature, i) => (
              <span
                key={i}
                className={`text-[10px] sm:text-xs px-2 py-0.5 rounded-full border border-slate-700/50 text-slate-400 bg-slate-800/50 backdrop-blur-sm`}
              >
                {feature}
              </span>
            ))}
          </div>

          {/* Action */}
          <div className="mt-auto pt-2">
            {isAvailable ? (
              <div className="flex items-center justify-between text-sm font-bold text-red-400 group-hover:text-red-300 transition-colors">
                <span>ابدأ اللعب الآن</span>
                <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              </div>
            ) : (
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <span>🚧 قيد التطوير</span>
              </div>
            )}
          </div>
        </div>
      </CardWrapper>
    </motion.div>
  );
}

// ─── Games Section ───────────────────────────────────────────────────────────

function GamesSection() {
  return (
    <section id="games" className="relative py-20 sm:py-28 bg-slate-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-14"
        >
          <Badge
            variant="outline"
            className="border-red-500/30 text-red-400 mb-4 text-xs"
          >
            🎮 الألعاب المتاحة
          </Badge>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white mb-4">
            اختر{' '}
            <span className="bg-gradient-to-l from-red-400 to-orange-400 bg-clip-text text-transparent">
              لعبتك
            </span>{' '}
            المفضلة
          </h2>
          <p className="text-slate-400 max-w-xl mx-auto text-base sm:text-lg">
            مجموعة ألعاب اجتماعية وحربية مصممة خصيصاً للاعبين العرب
          </p>
        </motion.div>

        {/* Games Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5 sm:gap-6">
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
      className="relative py-20 sm:py-28 bg-gradient-to-b from-slate-950 via-slate-900/50 to-slate-950"
    >
      {/* Decorative bg */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-purple-900/10 via-transparent to-transparent" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
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

        {/* Features Grid */}
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

// ─── How to Start Section ────────────────────────────────────────────────────

function HowToStartSection() {
  return (
    <section
      id="how-to-start"
      className="relative py-20 sm:py-28 bg-slate-950"
    >
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
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

        {/* Steps */}
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
                  {/* Step Number */}
                  <div className="absolute -top-3 -right-3 w-10 h-10 rounded-full bg-gradient-to-br from-red-600 to-red-700 flex items-center justify-center text-white text-lg font-black shadow-lg shadow-red-500/25">
                    {step.step}
                  </div>

                  {/* Icon */}
                  <div className="w-16 h-16 rounded-2xl bg-slate-800/80 border border-slate-700/50 flex items-center justify-center">
                    {step.icon}
                  </div>

                  {/* Title */}
                  <h3 className="text-lg font-bold text-white">{step.title}</h3>

                  {/* Description */}
                  <p className="text-sm text-slate-400 leading-relaxed">
                    {step.description}
                  </p>

                  {/* Connector line (not on last item in md+) */}
                  {i < steps.length - 1 && (
                    <div className="hidden md:block absolute -left-4 top-1/2 -translate-y-1/2 w-8 border-t-2 border-dashed border-slate-700" />
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* CTA */}
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
            <a href="#games">
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
    <footer className="relative bg-slate-950 border-t border-slate-800/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col items-center gap-4">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-red-500 to-purple-600 flex items-center justify-center">
              <img
                src="/platform-logo.png"
                alt="ألعاب الغريب"
                className="w-6 h-6 rounded-md object-contain"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  target.parentElement!.innerHTML =
                    '<span class="text-white text-sm font-black">غ</span>';
                }}
              />
            </div>
            <span className="text-sm font-bold bg-gradient-to-l from-red-400 via-yellow-300 to-red-400 bg-clip-text text-transparent">
              ألعاب الغريب
            </span>
          </div>

          {/* Credits */}
          <div className="flex flex-col items-center gap-2">
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

          {/* Copyright */}
          <p className="text-[11px] text-slate-600 mt-2">
            © {new Date().getFullYear()} ألعاب الغريب — جميع الحقوق محفوظة
          </p>
        </div>
      </div>
    </footer>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function HomePage() {
  return (
    <div dir="rtl" className="min-h-screen bg-slate-950 text-white">
      <Header />
      <HeroSection />
      <GamesSection />
      <FeaturesSection />
      <HowToStartSection />
      <Footer />
    </div>
  );
}
