'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  Crown,
  Gift,
  Gamepad2,
  Clock,
  Calendar,
  Shield,
  Copy,
  CheckCircle2,
  Gem,
  Trophy,
  Star,
  Pencil,
  KeyRound,
  LogOut,
  Loader2,
  Eye,
  EyeOff,
  X,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Zap,
  Settings,
  Fingerprint,
  TrendingUp,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────

interface AuthUser {
  id: string;
  username: string;
  email: string;
  displayName: string;
  phone: string;
  avatar: string;
  role: string;
  subscriptionId: string | null;
  lastLoginAt: string | null;
  createdAt: string;
}

interface SubscriptionData {
  name: string;
  email: string;
  phone: string;
  subscriptionCode: string;
  plan: string;
  isTrial: boolean;
  isActive: boolean;
  startDate: string;
  endDate: string | null;
  expiresAt: string | null;
  allowedGames: string[];
  allowedGamesInfo: Array<{ slug: string; name: string; emoji: string; color: string } | null>;
  daysRemaining: number;
  gemsBalance: number;
}

interface TrialInfo {
  sessionsUsed: number;
  maxSessions: number;
  expiresAt: string | null;
  daysLeft: number;
}

interface XPData {
  playerId: string | null;
  total: number;
  level: number;
  currentLevelXP: number;
  nextLevelXP: number;
  progress: number;
  isMaxLevel: boolean;
}

// ─── Game Configuration ──────────────────────────────────────────────

const GAMES_CONFIG: Record<string, { name: string; emoji: string; color: string }> = {
  mafia: { name: 'المافيا', emoji: '🕵️', color: 'from-red-500/20 to-red-600/5' },
  tobol: { name: 'طبول الحرب', emoji: '🥁', color: 'from-orange-500/20 to-orange-600/5' },
  tabot: { name: 'الهروب من التابوت', emoji: '⚰️', color: 'from-purple-500/20 to-purple-600/5' },
  prison: { name: 'السجن', emoji: '🔒', color: 'from-amber-500/20 to-amber-600/5' },
  risk: { name: 'المجازفة', emoji: '💣', color: 'from-violet-500/20 to-violet-600/5' },
  risk2: { name: 'المجازفة 2', emoji: '🎴', color: 'from-orange-500/20 to-orange-600/5' },
  familyfeud: { name: 'فاميلي فيود', emoji: '🏆', color: 'from-amber-500/20 to-amber-600/5' },
  baharharb: { name: 'بحر و حرب', emoji: '🌊⚔️', color: 'from-teal-500/20 to-teal-600/5' },
};

// ─── Level Tier Configuration ────────────────────────────────────────

function getLevelTier(level: number) {
  if (level >= 91) return {
    name: 'أسطوري',
    gradient: 'from-rose-500 to-red-600',
    gradientBg: 'from-rose-500/20 to-red-600/10',
    ringFrom: '#f43f5e',
    ringTo: '#dc2626',
    glowColor: 'rgba(244, 63, 94, 0.25)',
    textColor: 'text-rose-400',
    borderColor: 'border-rose-500/30',
    bgLight: 'bg-rose-500/10',
  };
  if (level >= 61) return {
    name: 'ألماسي',
    gradient: 'from-violet-500 to-purple-600',
    gradientBg: 'from-violet-500/20 to-purple-600/10',
    ringFrom: '#8b5cf6',
    ringTo: '#7c3aed',
    glowColor: 'rgba(139, 92, 246, 0.25)',
    textColor: 'text-violet-400',
    borderColor: 'border-violet-500/30',
    bgLight: 'bg-violet-500/10',
  };
  if (level >= 31) return {
    name: 'ذهبي',
    gradient: 'from-amber-500 to-yellow-500',
    gradientBg: 'from-amber-500/20 to-yellow-500/10',
    ringFrom: '#f59e0b',
    ringTo: '#eab308',
    glowColor: 'rgba(245, 158, 11, 0.25)',
    textColor: 'text-amber-400',
    borderColor: 'border-amber-500/30',
    bgLight: 'bg-amber-500/10',
  };
  if (level >= 11) return {
    name: 'فضي',
    gradient: 'from-emerald-500 to-green-600',
    gradientBg: 'from-emerald-500/20 to-green-600/10',
    ringFrom: '#10b981',
    ringTo: '#16a34a',
    glowColor: 'rgba(16, 185, 129, 0.25)',
    textColor: 'text-emerald-400',
    borderColor: 'border-emerald-500/30',
    bgLight: 'bg-emerald-500/10',
  };
  return {
    name: 'مبتدئ',
    gradient: 'from-slate-400 to-slate-500',
    gradientBg: 'from-slate-400/20 to-slate-500/10',
    ringFrom: '#94a3b8',
    ringTo: '#64748b',
    glowColor: 'rgba(148, 163, 184, 0.2)',
    textColor: 'text-slate-400',
    borderColor: 'border-slate-500/30',
    bgLight: 'bg-slate-500/10',
  };
}

// ─── Plan Helpers ─────────────────────────────────────────────────────

function getPlanBadge(plan: string, isTrial?: boolean) {
  if (isTrial) {
    return {
      label: 'تجربة',
      gradient: 'from-violet-500 to-purple-600',
      bg: 'bg-violet-500/10',
      border: 'border-violet-500/30',
      textColor: 'text-violet-300',
      icon: <Gift className="w-3 h-3" />,
    };
  }
  switch (plan) {
    case 'paid':
      return {
        label: 'مميز',
        gradient: 'from-amber-500 to-yellow-500',
        bg: 'bg-amber-500/10',
        border: 'border-amber-500/30',
        textColor: 'text-amber-300',
        icon: <Crown className="w-3 h-3" />,
      };
    default:
      return {
        label: 'مجاني',
        gradient: 'from-slate-400 to-slate-500',
        bg: 'bg-slate-500/10',
        border: 'border-slate-500/30',
        textColor: 'text-slate-400',
        icon: <User className="w-3 h-3" />,
      };
  }
}

// ─── Format Helpers ───────────────────────────────────────────────────

function formatDate(dateStr: string | undefined | null): string {
  if (!dateStr) return '—';
  try {
    return new Date(dateStr).toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

function formatNumber(num: number): string {
  return new Intl.NumberFormat('ar-SA').format(num);
}

// ─── Countdown Timer Hook ─────────────────────────────────────────────

function useCountdown(targetDate: string | undefined | null) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0, expired: true });

  useEffect(() => {
    if (!targetDate) return;
    const calc = () => {
      const diff = Math.max(0, new Date(targetDate).getTime() - Date.now());
      setTimeLeft({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((diff / (1000 * 60)) % 60),
        seconds: Math.floor((diff / 1000) % 60),
        expired: diff <= 0,
      });
    };
    calc();
    const interval = setInterval(calc, 1000);
    return () => clearInterval(interval);
  }, [targetDate]);

  return timeLeft;
}

// ─── Animation Variants ───────────────────────────────────────────────

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.4, ease: 'easeOut' },
  }),
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
};

const itemVariant = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } },
};

// ─── Countdown Display ────────────────────────────────────────────────

function CountdownDisplay({
  days,
  hours,
  minutes,
  seconds,
  expired,
}: {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  expired: boolean;
}) {
  if (expired) {
    return <span className="text-sm text-rose-400 font-bold">منتهي الصلاحية</span>;
  }
  return (
    <div className="flex items-center justify-center gap-1.5" dir="ltr">
      {[
        { value: days, label: 'ي' },
        { value: hours, label: 'س' },
        { value: minutes, label: 'د' },
        { value: seconds, label: 'ث' },
      ].map((unit) => (
        <div key={unit.label} className="text-center">
          <div className="w-10 h-10 rounded-lg bg-slate-900/80 border border-amber-500/20 flex items-center justify-center">
            <span className="text-sm font-black font-mono text-white">
              {String(unit.value).padStart(2, '0')}
            </span>
          </div>
          <span className="text-[8px] text-slate-500 mt-0.5 block">{unit.label}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Level Ring SVG ───────────────────────────────────────────────────

function LevelRing({
  level,
  progress,
  tier,
}: {
  level: number;
  progress: number;
  tier: ReturnType<typeof getLevelTier>;
}) {
  const size = 88;
  const strokeWidth = 5;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className="relative flex flex-col items-center">
      <div
        className="absolute rounded-full"
        style={{
          width: size + 16,
          height: size + 16,
          top: -8,
          left: '50%',
          transform: 'translateX(-50%)',
          background: `radial-gradient(circle, ${tier.glowColor}, transparent 70%)`,
          filter: 'blur(4px)',
        }}
      />
      <svg width={size} height={size} className="transform -rotate-90 drop-shadow-lg">
        <defs>
          <linearGradient id={`profile-level-ring`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={tier.ringFrom} />
            <stop offset="100%" stopColor={tier.ringTo} />
          </linearGradient>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(30, 41, 59, 0.8)"
          strokeWidth={strokeWidth}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="url(#profile-level-ring)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1.2, ease: 'easeOut', delay: 0.3 }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-black text-white drop-shadow-lg">{level}</span>
      </div>
      <span className={`mt-1 text-[10px] font-bold bg-gradient-to-l ${tier.gradient} bg-clip-text text-transparent`}>
        {tier.name}
      </span>
    </div>
  );
}

// ─── Loading Skeleton ─────────────────────────────────────────────────

function ProfileSkeleton() {
  return (
    <div className="min-h-screen bg-slate-950" dir="rtl">
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">
        {/* Header skeleton */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-slate-800 animate-pulse" />
          <div className="h-6 w-32 rounded-lg bg-slate-800 animate-pulse" />
        </div>
        {/* Hero skeleton */}
        <div className="bg-slate-900/60 rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-24 h-24 rounded-full bg-slate-800 animate-pulse" />
            <div className="flex-1 space-y-2">
              <div className="h-7 w-40 rounded-lg bg-slate-800 animate-pulse" />
              <div className="h-4 w-28 rounded bg-slate-800 animate-pulse" />
              <div className="h-5 w-20 rounded-full bg-slate-800 animate-pulse" />
            </div>
          </div>
        </div>
        {/* Stats skeleton */}
        <div className="grid grid-cols-3 gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-slate-900/60 rounded-xl p-4 space-y-2 animate-pulse">
              <div className="h-4 w-16 rounded bg-slate-800" />
              <div className="h-8 w-12 rounded bg-slate-800" />
            </div>
          ))}
        </div>
        {/* Cards skeleton */}
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-slate-900/60 rounded-xl p-5 space-y-3 animate-pulse">
            <div className="h-5 w-24 rounded bg-slate-800" />
            <div className="h-4 w-full rounded bg-slate-800" />
            <div className="h-4 w-3/4 rounded bg-slate-800" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main Profile Page ───────────────────────────────────────────────

export default function ProfilePage() {
  const { toast } = useToast();

  // Data state
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [trialInfo, setTrialInfo] = useState<TrialInfo | null>(null);
  const [xpData, setXpData] = useState<XPData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // UI state
  const [codeCopied, setCodeCopied] = useState(false);
  const [playerIdCopied, setPlayerIdCopied] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editDisplayName, setEditDisplayName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Password state
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [passwordCurrent, setPasswordCurrent] = useState('');
  const [passwordNew, setPasswordNew] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);

  // Frames state
  const [userFrames, setUserFrames] = useState<Array<{
    id: string; frameId: string; isEquipped: boolean; obtainedFrom: string; obtainedNote: string; obtainedAt: string;
    frame: { id: string; name: string; nameAr: string; description: string; rarity: string; gradientFrom: string; gradientTo: string; borderColor: string; glowColor: string; pattern: string; price: number; isFree: boolean; isActive: boolean; sortOrder: number; };
  }>>([]);
  const [framesLoading, setFramesLoading] = useState(false);

  // Delete confirmation
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const planBadge = getPlanBadge(subscription?.plan || 'free', subscription?.isTrial);
  const displayLevel = xpData?.level ?? 1;
  const displayProgress = xpData?.isMaxLevel ? 100 : (xpData?.progress ?? 0);
  const levelTier = getLevelTier(displayLevel);
  const referenceDate = subscription?.endDate || subscription?.expiresAt;
  const countdown = useCountdown(referenceDate);

  // ─── Fetch Data ────────────────────────────────────────────────────

  useEffect(() => {
    let cancelled = false;

    async function fetchAllData() {
      setLoading(true);
      setError(null);

      try {
        // Fetch auth user
        const meRes = await fetch('/api/auth/me');
        if (!meRes.ok) {
          // Not logged in - redirect
          if (!cancelled) {
            window.location.href = '/';
            return;
          }
        }
        const meData = await meRes.json();
        if (!cancelled && meData.success && meData.user) {
          setAuthUser(meData.user);
        }

        // Fetch subscription profile
        const savedCode = localStorage.getItem('gg_sub_code');
        if (savedCode) {
          const subRes = await fetch('/api/subscription/profile', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code: savedCode }),
          });
          if (subRes.ok) {
            const subData = await subRes.json();
            if (!cancelled && subData.success) {
              setSubscription(subData.subscriber);
              if (subData.trialInfo) {
                setTrialInfo(subData.trialInfo);
              }
            }
          }

          // Fetch XP data
          const xpRes = await fetch(`/api/player/xp?code=${encodeURIComponent(savedCode)}`);
          if (xpRes.ok) {
            const xpResData = await xpRes.json();
            if (!cancelled && xpResData.success && xpResData.xp) {
              setXpData({
                playerId: xpResData.playerId ?? null,
                total: xpResData.xp.total ?? 0,
                level: xpResData.xp.level ?? 1,
                currentLevelXP: xpResData.xp.currentLevelXP ?? 0,
                nextLevelXP: xpResData.xp.nextLevelXP ?? 0,
                progress: xpResData.xp.progress ?? 0,
                isMaxLevel: xpResData.xp.isMaxLevel ?? false,
              });
            }
          }
        }
      } catch (err) {
        if (!cancelled) {
          console.error('Profile fetch error:', err);
          setError('حدث خطأ أثناء تحميل البيانات');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchAllData();
    // Fetch user frames
    try {
      const framesRes = await fetch('/api/frames');
      if (framesRes.ok) {
        const framesData = await framesRes.json();
        if (framesData.success) {
          setUserFrames(framesData.userFrames || []);
        }
      }
    } catch (err) {
      console.error('Frames fetch error:', err);
    }

    return () => { cancelled = true; };
  }, []);

  // Initialize edit fields
  useEffect(() => {
    if (isEditMode) {
      setEditDisplayName(authUser?.displayName ?? '');
      setEditPhone(authUser?.phone ?? '');
    }
  }, [isEditMode, authUser]);

  // ─── Handlers ──────────────────────────────────────────────────────

  const handleLogout = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch { /* ignore */ }
    localStorage.removeItem('gg_sub_code');
    localStorage.removeItem('gg_sub_info');
    toast({ title: 'تم تسجيل الخروج', description: 'تم تسجيل خروجك بنجاح' });
    window.location.href = '/';
  }, [toast]);

  const handleCopyCode = useCallback(() => {
    if (!subscription?.subscriptionCode) return;
    navigator.clipboard.writeText(subscription.subscriptionCode).then(() => {
      setCodeCopied(true);
      toast({ title: 'تم النسخ', description: `تم نسخ الكود: ${subscription.subscriptionCode}` });
      setTimeout(() => setCodeCopied(false), 2000);
    });
  }, [subscription?.subscriptionCode, toast]);

  const handleCopyPlayerId = useCallback(() => {
    if (!xpData?.playerId) return;
    navigator.clipboard.writeText(xpData.playerId).then(() => {
      setPlayerIdCopied(true);
      toast({ title: 'تم نسخ معرف اللاعب' });
      setTimeout(() => setPlayerIdCopied(false), 2000);
    });
  }, [xpData?.playerId, toast]);

  const handleSaveProfile = useCallback(async () => {
    setIsSavingProfile(true);
    try {
      const res = await fetch('/api/auth/update-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ displayName: editDisplayName, phone: editPhone }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast({ title: 'تم تحديث الملف الشخصي', description: 'تم حفظ التغييرات بنجاح' });
        setIsEditMode(false);
        // Refresh user data
        const meRes = await fetch('/api/auth/me');
        if (meRes.ok) {
          const meData = await meRes.json();
          if (meData.success && meData.user) {
            setAuthUser(meData.user);
          }
        }
      } else {
        toast({ title: 'خطأ', description: data.error || 'حدث خطأ أثناء التحديث', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'خطأ في الاتصال', description: 'تعذر الاتصال بالخادم', variant: 'destructive' });
    } finally {
      setIsSavingProfile(false);
    }
  }, [editDisplayName, editPhone, toast]);

  const handleChangePassword = useCallback(async () => {
    if (!passwordCurrent || !passwordNew || !passwordConfirm) {
      toast({ title: 'حقول مطلوبة', description: 'يرجى ملء جميع حقول كلمة المرور', variant: 'destructive' });
      return;
    }
    if (passwordNew !== passwordConfirm) {
      toast({ title: 'كلمات المرور غير متطابقة', description: 'كلمة المرور الجديدة وتأكيدها غير متطابقتين', variant: 'destructive' });
      return;
    }
    if (passwordNew.length < 6) {
      toast({ title: 'كلمة مرور ضعيفة', description: 'يجب أن تكون كلمة المرور 6 أحرف على الأقل', variant: 'destructive' });
      return;
    }
    setIsChangingPassword(true);
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword: passwordCurrent, newPassword: passwordNew }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast({ title: 'تم تغيير كلمة المرور', description: 'تم تحديث كلمة المرور بنجاح' });
        setShowChangePassword(false);
        setPasswordCurrent('');
        setPasswordNew('');
        setPasswordConfirm('');
      } else {
        toast({ title: 'خطأ', description: data.error || 'حدث خطأ أثناء التغيير', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'خطأ في الاتصال', description: 'تعذر الاتصال بالخادم', variant: 'destructive' });
    } finally {
      setIsChangingPassword(false);
    }
  }, [passwordCurrent, passwordNew, passwordConfirm, toast]);

  // ─── Loading State ─────────────────────────────────────────────────

  if (loading) return <ProfileSkeleton />;

  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4" dir="rtl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-4"
        >
          <div className="w-16 h-16 mx-auto rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center">
            <AlertTriangle className="w-8 h-8 text-rose-400" />
          </div>
          <h2 className="text-lg font-bold text-white">{error}</h2>
          <Button onClick={() => window.location.href = '/'} variant="outline" className="border-slate-700 text-slate-300">
            <ArrowLeft className="w-4 h-4 ml-2" />
            العودة للرئيسية
          </Button>
        </motion.div>
      </div>
    );
  }

  // ─── Render ─────────────────────────────────────────────────────────

  const displayName = authUser?.displayName || subscription?.name || 'مستخدم';
  const username = authUser?.username || '';
  const role = authUser?.role || 'user';
  const roleBadge = role === 'admin'
    ? { label: 'مدير', color: 'bg-rose-500/10 border-rose-500/30 text-rose-300' }
    : role === 'moderator'
      ? { label: 'مشرف', color: 'bg-amber-500/10 border-amber-500/30 text-amber-300' }
      : { label: 'عضو', color: 'bg-slate-500/10 border-slate-500/30 text-slate-400' };

  const resolvedGames = useMemo(() => {
    if (!subscription?.allowedGamesInfo) return [];
    return subscription.allowedGamesInfo.filter(Boolean) as Array<{ slug: string; name: string; emoji: string; color: string }>;
  }, [subscription?.allowedGamesInfo]);

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col" dir="rtl">
      {/* Custom scrollbar */}
      <style>{`
        .profile-scroll::-webkit-scrollbar { width: 4px; }
        .profile-scroll::-webkit-scrollbar-track { background: transparent; }
        .profile-scroll::-webkit-scrollbar-thumb { background: rgba(100,116,139,0.3); border-radius: 4px; }
        .profile-scroll::-webkit-scrollbar-thumb:hover { background: rgba(100,116,139,0.5); }
      `}</style>

      <div className="flex-1">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="max-w-2xl mx-auto px-4 py-4 sm:py-6 space-y-5 profile-scroll"
        >
          {/* ─── Page Header ─── */}
          <motion.div variants={itemVariant} className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => window.location.href = '/'}
                className="w-9 h-9 rounded-xl bg-slate-900/80 border border-slate-800/60 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <h1 className="text-lg sm:text-xl font-black bg-gradient-to-l from-amber-300 via-yellow-300 to-amber-400 bg-clip-text text-transparent">
                الملف الشخصي
              </h1>
            </div>
            <button
              onClick={handleLogout}
              className="w-9 h-9 rounded-xl bg-slate-900/80 border border-slate-800/60 flex items-center justify-center text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 hover:border-rose-500/30 transition-all"
              title="تسجيل الخروج"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </motion.div>

          {/* ─── Profile Hero ─── */}
          <motion.div
            custom={0}
            variants={fadeInUp}
            className="relative rounded-2xl overflow-hidden"
          >
            {/* Top gradient */}
            <div className="relative h-28 sm:h-32 overflow-hidden">
              <div className={`absolute inset-0 bg-gradient-to-bl ${
                subscription?.isTrial
                  ? 'from-violet-900/80 via-purple-900/60 to-slate-950'
                  : subscription?.plan === 'paid'
                    ? 'from-amber-900/80 via-orange-900/50 to-slate-950'
                    : 'from-slate-800/60 via-slate-900/40 to-slate-950'
              }`} />
              <motion.div
                className="absolute -top-10 -left-10 w-40 h-40 rounded-full opacity-10"
                style={{
                  background: subscription?.isTrial
                    ? 'radial-gradient(circle, #8b5cf6, transparent)'
                    : subscription?.plan === 'paid'
                      ? 'radial-gradient(circle, #f59e0b, transparent)'
                      : 'radial-gradient(circle, #64748b, transparent)',
                }}
                animate={{ scale: [1, 1.2, 1], opacity: [0.08, 0.15, 0.08] }}
                transition={{ repeat: Infinity, duration: 4 }}
              />
              <div
                className="absolute inset-0 opacity-[0.03]"
                style={{
                  backgroundImage: 'linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)',
                  backgroundSize: '20px 20px',
                }}
              />
            </div>

            {/* Avatar + Info */}
            <div className="relative bg-slate-900/70 backdrop-blur-sm border border-slate-800/50 border-t-0 rounded-b-2xl px-4 sm:px-6 pb-5 pt-12 sm:pt-14">
              <div className="absolute -top-10 right-5 sm:right-6">
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.2, type: 'spring', stiffness: 300 }}
                  className="relative"
                >
                  {/* Equipped frame glow */}
                  {userFrames.find(f => f.isEquipped) && (() => {
                    const ef = userFrames.find(f => f.isEquipped)!;
                    return (
                      <div
                        className="absolute -inset-2 rounded-full"
                        style={{
                          background: `linear-gradient(135deg, ${ef.frame.gradientFrom}, ${ef.frame.gradientTo})`,
                          padding: '4px',
                          boxShadow: ef.frame.pattern === 'animated'
                            ? `0 0 20px ${ef.frame.glowColor}, 0 0 40px ${ef.frame.glowColor}`
                            : `0 0 12px ${ef.frame.glowColor}`,
                        }}
                      >
                        {ef.frame.pattern === 'double' && (
                          <div className="absolute inset-0 rounded-full" style={{
                            background: 'transparent',
                            border: '2px solid ' + ef.frame.borderColor,
                          }} />
                        )}
                      </div>
                    );
                  })()}
                  <div className={`absolute -inset-1 rounded-full bg-gradient-to-br ${planBadge.gradient} opacity-40 blur-sm`} />
                  <div className={`relative w-20 h-20 sm:w-[88px] sm:h-[88px] rounded-full bg-gradient-to-br ${planBadge.gradient} flex items-center justify-center border-4 border-slate-950 shadow-2xl overflow-hidden`}>
                    {authUser?.avatar ? (
                      <img src={authUser.avatar} alt={displayName} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-3xl sm:text-4xl font-black text-white drop-shadow-lg">
                        {displayName.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  {/* Plan badge */}
                  <div className="absolute -bottom-1 -left-1 px-2.5 py-0.5 rounded-full bg-slate-900 border border-slate-700/50 shadow-lg">
                    <span className={`bg-gradient-to-l ${planBadge.gradient} bg-clip-text text-transparent text-[10px] font-bold flex items-center gap-0.5`}>
                      {planBadge.icon}
                      {planBadge.label}
                    </span>
                  </div>
                </motion.div>
              </div>

              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-black text-white">{displayName}</h2>
                    {username && (
                      <p className="text-xs text-slate-500 mt-0.5">@{username}</p>
                    )}
                  </div>
                  <Badge variant="outline" className={`text-[10px] px-2 py-0.5 ${roleBadge.color} border shrink-0`}>
                    {roleBadge.label}
                  </Badge>
                </div>
                {authUser?.createdAt && (
                  <p className="text-xs text-slate-500 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    عضو منذ {formatDate(authUser.createdAt)}
                  </p>
                )}
              </div>
            </div>
          </motion.div>

          {/* ─── Stats Cards ─── */}
          <motion.div custom={1} variants={fadeInUp} className="grid grid-cols-3 gap-3">
            {/* Level Card */}
            <Card className="bg-slate-900/60 border-slate-800/50 overflow-hidden">
              <CardContent className="p-3 sm:p-4 flex flex-col items-center text-center">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-600/5 border border-amber-500/20 flex items-center justify-center mb-2">
                  <Trophy className="w-5 h-5 text-amber-400" />
                </div>
                <span className="text-xl sm:text-2xl font-black text-white">{displayLevel}</span>
                <span className="text-[10px] text-slate-500 mt-0.5">المستوى</span>
                <Progress value={displayProgress} className="h-1 mt-2 w-full bg-slate-800" />
                <span className="text-[9px] text-slate-500 mt-1">
                  {xpData ? `${formatNumber(xpData.total)} XP` : '—'}
                </span>
              </CardContent>
            </Card>

            {/* Gems Card */}
            <Card className="bg-slate-900/60 border-slate-800/50 overflow-hidden">
              <CardContent className="p-3 sm:p-4 flex flex-col items-center text-center">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 to-cyan-600/5 border border-cyan-500/20 flex items-center justify-center mb-2">
                  <Gem className="w-5 h-5 text-cyan-400" />
                </div>
                <span className="text-xl sm:text-2xl font-black text-white">{subscription?.gemsBalance ? formatNumber(subscription.gemsBalance) : '0'}</span>
                <span className="text-[10px] text-slate-500 mt-0.5">الجواهر</span>
              </CardContent>
            </Card>

            {/* Games Card */}
            <Card className="bg-slate-900/60 border-slate-800/50 overflow-hidden">
              <CardContent className="p-3 sm:p-4 flex flex-col items-center text-center">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-600/5 border border-emerald-500/20 flex items-center justify-center mb-2">
                  <Gamepad2 className="w-5 h-5 text-emerald-400" />
                </div>
                <span className="text-xl sm:text-2xl font-black text-white">{resolvedGames.length}</span>
                <span className="text-[10px] text-slate-500 mt-0.5">الألعاب</span>
              </CardContent>
            </Card>
          </motion.div>

          {/* ─── Level Progress Section ─── */}
          {xpData && (
            <motion.div custom={2} variants={fadeInUp}>
              <Card className="bg-slate-900/60 border-slate-800/50 overflow-hidden">
                <CardContent className="p-4 sm:p-5">
                  <div className="flex items-center gap-5">
                    <LevelRing level={displayLevel} progress={displayProgress} tier={levelTier} />
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-white">تقدم المستوى</span>
                        <span className={`text-xs font-bold ${levelTier.textColor}`}>
                          {xpData.isMaxLevel ? 'أقصى مستوى!' : `${formatNumber(xpData.currentLevelXP)} / ${formatNumber(xpData.nextLevelXP)}`}
                        </span>
                      </div>
                      <Progress value={displayProgress} className="h-2.5 bg-slate-800">
                        <div className={`h-full rounded-full bg-gradient-to-l ${levelTier.gradient} transition-all duration-700`} style={{ width: `${displayProgress}%` }} />
                      </Progress>
                      {xpData.isMaxLevel ? (
                        <div className="flex items-center gap-1.5 text-xs text-amber-400">
                          <Star className="w-3.5 h-3.5" />
                          <span>وصلت لأقصى مستوى! أنت {levelTier.name}</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-xs text-slate-500">
                          <TrendingUp className="w-3.5 h-3.5" />
                          <span>تحتاج {formatNumber(xpData.nextLevelXP - xpData.currentLevelXP)} XP للمستوى القادم</span>
                        </div>
                      )}
                      {xpData.playerId && (
                        <div className="flex items-center gap-2 mt-1">
                          <Fingerprint className="w-3 h-3 text-slate-600" />
                          <span className="text-[10px] text-slate-600 font-mono" dir="ltr">{xpData.playerId}</span>
                          <button
                            onClick={handleCopyPlayerId}
                            className="text-slate-600 hover:text-slate-400 transition-colors"
                          >
                            {playerIdCopied ? <CheckCircle2 className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* ─── Subscription Info ─── */}
          {subscription && (
            <motion.div custom={3} variants={fadeInUp}>
              <Card className="bg-slate-900/60 border-slate-800/50 overflow-hidden">
                <CardContent className="p-4 sm:p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {subscription.isTrial ? (
                        <Gift className="w-5 h-5 text-violet-400" />
                      ) : subscription.plan === 'paid' ? (
                        <Crown className="w-5 h-5 text-amber-400" />
                      ) : (
                        <Shield className="w-5 h-5 text-slate-400" />
                      )}
                      <h3 className="text-sm font-bold text-white">
                        {subscription.isTrial ? 'اشتراك تجريبي' : subscription.plan === 'paid' ? 'اشتراك مميز' : 'الاشتراك'}
                      </h3>
                    </div>
                    <Badge variant="outline" className={`text-[10px] px-2 py-0.5 ${planBadge.bg} ${planBadge.border} ${planBadge.textColor} border`}>
                      {planBadge.icon}
                      {planBadge.label}
                    </Badge>
                  </div>

                  {/* Subscription Code */}
                  <div className="bg-slate-800/40 rounded-xl p-3 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] text-slate-500 mb-0.5">كود الاشتراك</p>
                      <p className="text-sm font-mono font-bold text-white" dir="ltr">{subscription.subscriptionCode}</p>
                    </div>
                    <button
                      onClick={handleCopyCode}
                      className="w-9 h-9 rounded-lg bg-slate-700/50 border border-slate-600/30 flex items-center justify-center text-slate-400 hover:text-emerald-400 hover:border-emerald-500/30 transition-all"
                    >
                      {codeCopied ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>

                  {/* Dates */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-slate-800/40 rounded-lg p-3">
                      <p className="text-[10px] text-slate-500 mb-1">تاريخ البداية</p>
                      <p className="text-xs font-bold text-slate-300">{formatDate(subscription.startDate)}</p>
                    </div>
                    <div className="bg-slate-800/40 rounded-lg p-3">
                      <p className="text-[10px] text-slate-500 mb-1">
                        {referenceDate ? (countdown.expired ? 'تاريخ الانتهاء' : 'ينتهي في') : 'تاريخ الانتهاء'}
                      </p>
                      <p className="text-xs font-bold text-slate-300">{formatDate(referenceDate)}</p>
                    </div>
                  </div>

                  {/* Countdown */}
                  {referenceDate && !countdown.expired && (
                    <div className="bg-slate-800/40 rounded-xl p-3 flex items-center justify-center">
                      <Clock className="w-4 h-4 text-amber-400 ml-2" />
                      <CountdownDisplay
                        days={countdown.days}
                        hours={countdown.hours}
                        minutes={countdown.minutes}
                        seconds={countdown.seconds}
                        expired={false}
                      />
                    </div>
                  )}

                  {/* Trial Info */}
                  {trialInfo && (
                    <div className="bg-violet-950/20 border border-violet-500/20 rounded-xl p-4 space-y-3">
                      <h4 className="text-xs font-bold text-violet-300 flex items-center gap-1.5">
                        <Gift className="w-3.5 h-3.5" />
                        معلومات التجربة
                      </h4>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-slate-800/40 rounded-lg p-2.5 text-center">
                          <Gamepad2 className="w-4 h-4 mx-auto text-violet-400 mb-1" />
                          <p className="text-sm font-black text-white">{trialInfo.sessionsUsed}/{trialInfo.maxSessions}</p>
                          <p className="text-[9px] text-slate-500">الجولات</p>
                        </div>
                        <div className="bg-slate-800/40 rounded-lg p-2.5 text-center">
                          <Clock className="w-4 h-4 mx-auto text-violet-400 mb-1" />
                          <p className="text-sm font-black text-white">{trialInfo.daysLeft}</p>
                          <p className="text-[9px] text-slate-500">أيام متبقية</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Allowed Games */}
                  {resolvedGames.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-xs font-bold text-slate-400">الألعاب المتاحة</h4>
                      <div className="grid grid-cols-2 gap-2">
                        {resolvedGames.map((game) => (
                          <motion.div
                            key={game.slug}
                            whileHover={{ scale: 1.02 }}
                            className={`bg-gradient-to-br ${GAMES_CONFIG[game.slug]?.color || 'from-slate-500/20 to-slate-600/5'} rounded-xl p-3 flex items-center gap-2.5 border border-slate-800/30`}
                          >
                            <span className="text-xl">{game.emoji}</span>
                            <span className="text-xs font-bold text-slate-300">{game.name}</span>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* ─── Account Info ─── */}
          <motion.div custom={4} variants={fadeInUp}>
            <Card className="bg-slate-900/60 border-slate-800/50 overflow-hidden">
              <CardContent className="p-4 sm:p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <User className="w-4 h-4 text-slate-400" />
                    معلومات الحساب
                  </h3>
                  {!isEditMode && (
                    <button
                      onClick={() => setIsEditMode(true)}
                      className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1 transition-colors"
                    >
                      <Pencil className="w-3 h-3" />
                      تعديل
                    </button>
                  )}
                </div>

                <AnimatePresence>
                  {isEditMode ? (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <div className="bg-gradient-to-br from-amber-950/30 to-slate-900/50 border border-amber-500/20 rounded-xl p-4 space-y-4">
                        <div className="flex items-center gap-2 mb-1">
                          <Pencil className="w-4 h-4 text-amber-400" />
                          <h4 className="text-xs font-bold text-amber-200">تعديل الملف الشخصي</h4>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs text-slate-400">الاسم المعروض</Label>
                          <Input
                            value={editDisplayName}
                            onChange={(e) => setEditDisplayName(e.target.value)}
                            placeholder="أدخل اسمك المعروض"
                            className="h-10 bg-slate-800/60 border-slate-700/50 text-white text-sm placeholder:text-slate-600 focus:border-amber-500/50"
                            dir="rtl"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs text-slate-400">رقم الهاتف</Label>
                          <Input
                            value={editPhone}
                            onChange={(e) => setEditPhone(e.target.value)}
                            placeholder="أدخل رقم هاتفك"
                            className="h-10 bg-slate-800/60 border-slate-700/50 text-white text-sm placeholder:text-slate-600 focus:border-amber-500/50"
                            dir="ltr"
                            type="tel"
                          />
                        </div>
                        <div className="flex items-center gap-2 pt-1">
                          <Button
                            onClick={handleSaveProfile}
                            disabled={isSavingProfile}
                            className="flex-1 h-10 bg-gradient-to-l from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-bold text-xs border border-amber-500/20 disabled:opacity-50"
                          >
                            {isSavingProfile ? <Loader2 className="w-4 h-4 ml-1.5 animate-spin" /> : <CheckCircle2 className="w-4 h-4 ml-1.5" />}
                            حفظ التغييرات
                          </Button>
                          <Button
                            onClick={() => setIsEditMode(false)}
                            variant="outline"
                            className="h-10 bg-slate-800/50 hover:bg-slate-700/50 text-slate-300 font-bold text-xs border border-slate-700/50 px-4"
                          >
                            إلغاء
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
                      {/* Username */}
                      {username && (
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-slate-800/60 border border-slate-700/30 flex items-center justify-center shrink-0">
                            <User className="w-4 h-4 text-slate-400" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-[10px] text-slate-500">اسم المستخدم</p>
                            <p className="text-sm text-slate-300 truncate">@{username}</p>
                          </div>
                        </div>
                      )}
                      {/* Email */}
                      {(authUser?.email || subscription?.email) && (
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-slate-800/60 border border-slate-700/30 flex items-center justify-center shrink-0">
                            <Mail className="w-4 h-4 text-slate-400" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-[10px] text-slate-500">البريد الإلكتروني</p>
                            <p className="text-sm text-slate-300 truncate">{authUser?.email || subscription?.email}</p>
                          </div>
                        </div>
                      )}
                      {/* Phone */}
                      {(authUser?.phone || subscription?.phone) && (
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-slate-800/60 border border-slate-700/30 flex items-center justify-center shrink-0">
                            <Phone className="w-4 h-4 text-slate-400" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-[10px] text-slate-500">رقم الهاتف</p>
                            <p className="text-sm text-slate-300" dir="ltr">{authUser?.phone || subscription?.phone || '—'}</p>
                          </div>
                        </div>
                      )}
                      {/* Last Login */}
                      {authUser?.lastLoginAt && (
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-slate-800/60 border border-slate-700/30 flex items-center justify-center shrink-0">
                            <Clock className="w-4 h-4 text-slate-400" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-[10px] text-slate-500">آخر دخول</p>
                            <p className="text-sm text-slate-300">{formatDate(authUser.lastLoginAt)}</p>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </CardContent>
            </Card>
          </motion.div>

          {/* ─── Change Password ─── */}
          <motion.div custom={5} variants={fadeInUp}>
            <Card className="bg-slate-900/60 border-slate-800/50 overflow-hidden">
              <CardContent className="p-4 sm:p-5">
                <button
                  onClick={() => setShowChangePassword(!showChangePassword)}
                  className="w-full flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <KeyRound className="w-4 h-4 text-slate-400" />
                    <h3 className="text-sm font-bold text-white">تغيير كلمة المرور</h3>
                  </div>
                  {showChangePassword ? (
                    <ChevronUp className="w-4 h-4 text-slate-500" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-500" />
                  )}
                </button>

                <AnimatePresence>
                  {showChangePassword && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <Separator className="bg-slate-800/60 my-4" />
                      <div className="space-y-3">
                        {/* Current Password */}
                        <div className="space-y-1.5">
                          <Label className="text-xs text-slate-400">كلمة المرور الحالية</Label>
                          <div className="relative">
                            <Input
                              value={passwordCurrent}
                              onChange={(e) => setPasswordCurrent(e.target.value)}
                              type={showCurrentPw ? 'text' : 'password'}
                              placeholder="••••••"
                              className="h-10 bg-slate-800/60 border-slate-700/50 text-white text-sm placeholder:text-slate-600 focus:border-amber-500/50 pl-10"
                              dir="ltr"
                            />
                            <button
                              type="button"
                              onClick={() => setShowCurrentPw(!showCurrentPw)}
                              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                            >
                              {showCurrentPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>
                        {/* New Password */}
                        <div className="space-y-1.5">
                          <Label className="text-xs text-slate-400">كلمة المرور الجديدة</Label>
                          <div className="relative">
                            <Input
                              value={passwordNew}
                              onChange={(e) => setPasswordNew(e.target.value)}
                              type={showNewPw ? 'text' : 'password'}
                              placeholder="6 أحرف على الأقل"
                              className="h-10 bg-slate-800/60 border-slate-700/50 text-white text-sm placeholder:text-slate-600 focus:border-amber-500/50 pl-10"
                              dir="ltr"
                            />
                            <button
                              type="button"
                              onClick={() => setShowNewPw(!showNewPw)}
                              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                            >
                              {showNewPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>
                        {/* Confirm Password */}
                        <div className="space-y-1.5">
                          <Label className="text-xs text-slate-400">تأكيد كلمة المرور الجديدة</Label>
                          <div className="relative">
                            <Input
                              value={passwordConfirm}
                              onChange={(e) => setPasswordConfirm(e.target.value)}
                              type={showConfirmPw ? 'text' : 'password'}
                              placeholder="أعد كتابة كلمة المرور"
                              className="h-10 bg-slate-800/60 border-slate-700/50 text-white text-sm placeholder:text-slate-600 focus:border-amber-500/50 pl-10"
                              dir="ltr"
                            />
                            <button
                              type="button"
                              onClick={() => setShowConfirmPw(!showConfirmPw)}
                              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                            >
                              {showConfirmPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>

                        <Button
                          onClick={handleChangePassword}
                          disabled={isChangingPassword}
                          className="w-full h-10 bg-gradient-to-l from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-bold text-xs border border-amber-500/20 disabled:opacity-50"
                        >
                          {isChangingPassword ? <Loader2 className="w-4 h-4 ml-1.5 animate-spin" /> : <Shield className="w-4 h-4 ml-1.5" />}
                          تحديث كلمة المرور
                        </Button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </CardContent>
            </Card>
          </motion.div>

          {/* ─── My Frames ─── */}
          <motion.div custom={6} variants={fadeInUp}>
            <Card className="bg-slate-900/60 border-slate-800/50 overflow-hidden">
              <CardContent className="p-4 sm:p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500/20 to-purple-500/20 border border-amber-500/20 flex items-center justify-center">
                      <span className="text-sm">🖼️</span>
                    </div>
                    <h3 className="text-sm font-bold text-white">إطاراتي</h3>
                  </div>
                  <Badge variant="outline" className="text-[10px] px-2 py-0.5 bg-slate-800/50 border-slate-700/50 text-slate-400">
                    {userFrames.length} إطار
                  </Badge>
                </div>

                {userFrames.length === 0 ? (
                  <div className="text-center py-6 space-y-2">
                    <div className="w-14 h-14 mx-auto rounded-full bg-slate-800/60 border border-slate-700/30 flex items-center justify-center">
                      <span className="text-2xl opacity-50">🖼️</span>
                    </div>
                    <p className="text-xs text-slate-500">لا تملك أي إطارات بعد</p>
                    <p className="text-[10px] text-slate-600">احصل على إطارات من الأحداث أو الوصول لمستويات جديدة</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                    {userFrames.map((uf) => {
                      const rarityConfig: Record<string, { label: string; color: string; border: string }> = {
                        common: { label: 'عادي', color: 'bg-slate-500/10 text-slate-400', border: 'border-slate-500/30' },
                        rare: { label: 'نادر', color: 'bg-cyan-500/10 text-cyan-400', border: 'border-cyan-500/30' },
                        epic: { label: 'ملحمي', color: 'bg-violet-500/10 text-violet-400', border: 'border-violet-500/30' },
                        legendary: { label: 'أسطوري', color: 'bg-amber-500/10 text-amber-400', border: 'border-amber-500/30' },
                      };
                      const rarity = rarityConfig[uf.frame.rarity] || rarityConfig.common;
                      const isAnimated = uf.frame.pattern === 'animated';

                      return (
                        <motion.button
                          key={uf.id}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={async () => {
                            if (uf.isEquipped) {
                              // Unequip
                              await fetch('/api/frames', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ action: 'equip', frameId: null }),
                              });
                              setUserFrames(prev => prev.map(f => ({ ...f, isEquipped: false })));
                              toast({ title: 'تم إزالة الإطار', description: 'لم تعد تستخدم أي إطار' });
                            } else {
                              // Equip
                              await fetch('/api/frames', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ action: 'equip', frameId: uf.frameId }),
                              });
                              setUserFrames(prev => prev.map(f => ({ ...f, isEquipped: f.frameId === uf.frameId })));
                              toast({ title: 'تم تفعيل الإطار', description: uf.frame.nameAr });
                            }
                          }}
                          className={`relative p-3 rounded-xl transition-all duration-200 ${
                            uf.isEquipped
                              ? 'bg-slate-800/80 border-2'
                              : 'bg-slate-800/40 border border-slate-700/30 hover:border-slate-600/50'
                          }`}
                          style={uf.isEquipped ? { borderColor: uf.frame.gradientFrom } : undefined}
                        >
                          {/* Frame preview */}
                          <div className="relative w-14 h-14 mx-auto mb-2">
                            <motion.div
                              animate={isAnimated && uf.isEquipped ? {
                                boxShadow: [
                                  `0 0 8px ${uf.frame.glowColor}`,
                                  `0 0 20px ${uf.frame.glowColor}`,
                                  `0 0 8px ${uf.frame.glowColor}`,
                                ],
                              } : {}}
                              transition={isAnimated ? { repeat: Infinity, duration: 2 } : undefined}
                              className="absolute -inset-1 rounded-full"
                              style={{
                                background: `linear-gradient(135deg, ${uf.frame.gradientFrom}, ${uf.frame.gradientTo})`,
                                padding: '3px',
                                boxShadow: !isAnimated ? `0 0 8px ${uf.frame.glowColor}` : undefined,
                              }}
                            >
                              {uf.frame.pattern === 'double' && (
                                <div className="absolute inset-0 rounded-full" style={{
                                  border: '1.5px solid ' + uf.frame.borderColor,
                                  background: 'transparent',
                                  margin: '3px',
                                }} />
                              )}
                              <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center">
                                <span className="text-lg">
                                  {authUser?.avatar ? (
                                    <img src={authUser.avatar} alt="" className="w-full h-full rounded-full object-cover" />
                                  ) : (
                                    displayName.charAt(0).toUpperCase()
                                  )}
                                </span>
                              </div>
                            </motion.div>
                            {/* Equipped indicator */}
                            {uf.isEquipped && (
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-slate-900 flex items-center justify-center"
                              >
                                <CheckCircle2 className="w-3 h-3 text-white" />
                              </motion.div>
                            )}
                          </div>
                          {/* Frame name */}
                          <p className="text-[10px] font-bold text-slate-300 text-center truncate">{uf.frame.nameAr}</p>
                          {/* Rarity badge */}
                          <Badge variant="outline" className={`text-[8px] px-1.5 py-0 mt-1 mx-auto block w-fit ${rarity.color} ${rarity.border} border`}>
                            {rarity.label}
                          </Badge>
                        </motion.button>
                      );
                    })}
                  </div>
                )}

                {userFrames.length > 0 && (
                  <p className="text-[10px] text-slate-600 text-center mt-2">
                    اضغط على إطار لتفعيله أو إزالته
                  </p>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* ─── Danger Zone ─── */}
          <motion.div custom={7} variants={fadeInUp} className="pb-6">
            <Card className="bg-slate-900/40 border-rose-500/10 overflow-hidden">
              <CardContent className="p-4 sm:p-5">
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle className="w-4 h-4 text-rose-400" />
                  <h3 className="text-sm font-bold text-rose-400">منطقة الخطر</h3>
                </div>
                <p className="text-xs text-slate-500 mb-4">
                  حذف الحساب سيؤدي لإزالة جميع بياناتك بشكل نهائي. هذا الإجراء لا يمكن التراجع عنه.
                </p>
                <Button
                  onClick={() => setShowDeleteDialog(true)}
                  variant="outline"
                  className="w-full h-10 border-rose-500/30 text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 hover:border-rose-500/50 text-sm font-bold transition-all"
                >
                  حذف الحساب نهائياً
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      </div>

      {/* ─── Sticky Footer ─── */}
      <footer className="sticky bottom-0 bg-slate-950/95 backdrop-blur-lg border-t border-slate-800/40 py-3 px-4">
        <div className="max-w-2xl mx-auto flex items-center justify-center gap-3">
          <Button
            onClick={() => window.location.href = '/'}
            variant="outline"
            className="h-10 bg-slate-900/60 hover:bg-slate-800/60 text-slate-300 font-bold text-xs border border-slate-700/50 px-5"
          >
            <ArrowLeft className="w-4 h-4 ml-2" />
            العودة للرئيسية
          </Button>
        </div>
      </footer>

      {/* ─── Delete Account Dialog ─── */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="sm:max-w-[380px] bg-slate-900 border-slate-800/60" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-lg font-black text-white flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-rose-400" />
              تأكيد حذف الحساب
            </DialogTitle>
            <DialogDescription className="text-sm text-slate-400">
              هل أنت متأكد من حذف حسابك؟ سيتم حذف جميع بياناتك بشكل نهائي ولا يمكن التراجع عن هذا الإجراء.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center gap-2 mt-4">
            <Button
              onClick={() => {
                setShowDeleteDialog(false);
                toast({ title: 'لم يتم الحذف', description: 'تم إلغاء عملية الحذف' });
              }}
              variant="outline"
              className="flex-1 h-10 bg-slate-800/50 text-slate-300 font-bold text-sm border border-slate-700/50"
            >
              إلغاء
            </Button>
            <Button
              onClick={() => {
                setShowDeleteDialog(false);
                toast({
                  title: 'ميزة قيد التطوير',
                  description: 'حذف الحساب سيكون متاحاً قريباً',
                  variant: 'destructive',
                });
              }}
              className="flex-1 h-10 bg-rose-600 hover:bg-rose-500 text-white font-bold text-sm"
            >
              حذف نهائي
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
