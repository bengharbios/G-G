'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

// shadcn/ui
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';

// Lucide icons
import {
  LayoutDashboard,
  Calendar,
  Users,
  Star,
  Gem,
  LogOut,
  Search,
  Plus,
  Pencil,
  Trash2,
  Trophy,
  Crown,
  Medal,
  Award,
  TrendingUp,
  Activity,
  Shield,
  ChevronLeft,
  Loader2,
  X,
  Check,
  Clock,
  Image as ImageIcon,
  Save,
  RefreshCw,
  BarChart3,
  UserCheck,
  Store,
} from 'lucide-react';

// ──────────────────────────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────────────────────────

interface Stats {
  totalPlayers: number;
  totalGames: number;
  totalGemsSold: number;
  totalEvents: number;
  activeEvents: number;
  premiumSold: number;
}

interface EventRow {
  id: string;
  title: string;
  description: string;
  type: string;
  rewardType: string;
  rewardAmount: number;
  rewardBadge: string | null;
  isActive: boolean;
  startsAt: string | null;
  endsAt: string | null;
  imageUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

interface PlayerRow {
  id: string;
  name: string;
  level: number;
  xp: number;
  gamesPlayed: number;
  gamesWon: number;
  gems: number;
  rankBadge: string;
  createdAt: string;
  updatedAt: string;
}

interface PremiumIdRow {
  id: string;
  displayName: string;
  priceGems: number;
  status: string;
  soldTo: string | null;
  soldDate: string | null;
  createdAt: string;
}

interface GemOrderRow {
  id: string;
  playerName: string;
  packageName: string;
  gems: number;
  priceSAR: number;
  paymentMethod: string;
  status: string;
  adminNotes: string | null;
  createdAt: string;
  updatedAt: string;
}

type ViewType = 'login' | 'dashboard' | 'events' | 'players' | 'premium' | 'orders';

type TabType = 'dashboard' | 'events' | 'players' | 'premium' | 'orders';

interface EventFormData {
  title: string;
  description: string;
  type: string;
  rewardType: string;
  rewardAmount: number;
  rewardBadge: string;
  isActive: boolean;
  startsAt: string;
  endsAt: string;
  imageUrl: string;
}

const emptyEventForm: EventFormData = {
  title: '',
  description: '',
  type: 'permanent',
  rewardType: 'gems',
  rewardAmount: 0,
  rewardBadge: '',
  isActive: true,
  startsAt: '',
  endsAt: '',
  imageUrl: '',
};

// ──────────────────────────────────────────────────────────────────────
// Helper
// ──────────────────────────────────────────────────────────────────────

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—';
  try {
    return new Date(dateStr).toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateStr;
  }
}

function getStatusBadge(status: string) {
  switch (status) {
    case 'active':
    case 'confirmed':
    case 'نشط':
      return (
        <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
          {status === 'confirmed' ? 'مؤكد' : status === 'active' || status === 'نشط' ? 'نشط' : status}
        </Badge>
      );
    case 'inactive':
    case 'rejected':
      return (
        <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
          {status === 'rejected' ? 'مرفوض' : status === 'inactive' ? 'غير نشط' : status}
        </Badge>
      );
    case 'pending':
      return (
        <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">
          قيد الانتظار
        </Badge>
      );
    case 'available':
      return (
        <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
          متاح
        </Badge>
      );
    case 'sold':
      return (
        <Badge className="bg-slate-500/20 text-slate-400 border-slate-500/30">
          مباع
        </Badge>
      );
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

function getRewardTypeLabel(type: string) {
  switch (type) {
    case 'gems': return '💎 جواهر';
    case 'xp': return '⚡ خبرة';
    case 'badge': return '🏅 شارة';
    case 'coins': return '🪙 عملات';
    default: return type;
  }
}

function getEventTypeLabel(type: string) {
  switch (type) {
    case 'permanent': return 'دائم';
    case 'seasonal': return 'موسمي';
    case 'special': return 'خاص';
    default: return type;
  }
}

// ──────────────────────────────────────────────────────────────────────
// Custom scrollbar CSS
// ──────────────────────────────────────────────────────────────────────

const scrollbarStyles = `
  .admin-scroll::-webkit-scrollbar { width: 6px; height: 6px; }
  .admin-scroll::-webkit-scrollbar-track { background: transparent; }
  .admin-scroll::-webkit-scrollbar-thumb { background: rgba(148,163,184,0.3); border-radius: 3px; }
  .admin-scroll::-webkit-scrollbar-thumb:hover { background: rgba(148,163,184,0.5); }
`;

// ──────────────────────────────────────────────────────────────────────
// Main Page
// ──────────────────────────────────────────────────────────────────────

export default function AdminPage() {
  const [view, setView] = useState<ViewType>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');

  // Dashboard
  const [stats, setStats] = useState<Stats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  // Events
  const [events, setEvents] = useState<EventRow[]>([]);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [showEventForm, setShowEventForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState<EventRow | null>(null);
  const [eventForm, setEventForm] = useState<EventFormData>(emptyEventForm);
  const [eventFormLoading, setEventFormLoading] = useState(false);

  // Players
  const [players, setPlayers] = useState<PlayerRow[]>([]);
  const [playersLoading, setPlayersLoading] = useState(false);
  const [playerSearch, setPlayerSearch] = useState('');

  // Premium IDs
  const [premiumIds, setPremiumIds] = useState<PremiumIdRow[]>([]);
  const [premiumLoading, setPremiumLoading] = useState(false);
  const [showPremiumForm, setShowPremiumForm] = useState(false);
  const [premiumFormName, setPremiumFormName] = useState('');
  const [premiumFormPrice, setPremiumFormPrice] = useState('100');
  const [premiumFormLoading, setPremiumFormLoading] = useState(false);

  // Gem Orders
  const [orders, setOrders] = useState<GemOrderRow[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [orderFilter, setOrderFilter] = useState('all');
  const [orderNoteDialog, setOrderNoteDialog] = useState<GemOrderRow | null>(null);
  const [orderNoteText, setOrderNoteText] = useState('');

  // Delete confirmations
  const [deleteEventId, setDeleteEventId] = useState<string | null>(null);
  const [deletePremiumId, setDeletePremiumId] = useState<string | null>(null);

  // Sidebar on mobile
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // ─── API helpers ──────────────────────────────────────────────────

  const apiCall = useCallback(async (url: string, options?: RequestInit) => {
    const res = await fetch(url, {
      ...options,
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });
    if (res.status === 401) {
      setView('login');
      throw new Error('unauthorized');
    }
    return res;
  }, []);

  // ─── Auth ──────────────────────────────────────────────────────────

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setLoginLoading(true);
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setLoginError(data.error || 'بيانات الدخول غير صحيحة');
        return;
      }
      setUsername(username);
      setView('dashboard');
      toast.success('تم تسجيل الدخول بنجاح');
    } catch {
      setLoginError('حدث خطأ في الاتصال');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = () => {
    document.cookie = 'admin_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    setView('login');
    setUsername('');
    setPassword('');
    setStats(null);
    setActiveTab('dashboard');
    toast.success('تم تسجيل الخروج');
  };

  const checkSession = useCallback(async () => {
    try {
      const res = await apiCall('/api/admin/stats');
      if (res.ok) {
        const data = await res.json();
        setStats(data);
        setStatsLoading(false);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, [apiCall]);

  // ─── Stats ─────────────────────────────────────────────────────────

  const fetchStats = useCallback(async () => {
    try {
      setStatsLoading(true);
      const res = await apiCall('/api/admin/stats');
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch {
      // handled by apiCall
    } finally {
      setStatsLoading(false);
    }
  }, [apiCall]);

  // ─── Events ────────────────────────────────────────────────────────

  const fetchEvents = useCallback(async () => {
    try {
      setEventsLoading(true);
      const res = await apiCall('/api/admin/events');
      if (res.ok) {
        const data = await res.json();
        setEvents(data.events);
      }
    } catch {
      // handled
    } finally {
      setEventsLoading(false);
    }
  }, [apiCall]);

  const handleCreateEvent = async () => {
    if (!eventForm.title.trim()) {
      toast.error('العنوان مطلوب');
      return;
    }
    setEventFormLoading(true);
    try {
      const res = await apiCall('/api/admin/events', {
        method: 'POST',
        body: JSON.stringify(eventForm),
      });
      if (res.ok) {
        toast.success('تم إنشاء الحدث بنجاح');
        setShowEventForm(false);
        setEventForm(emptyEventForm);
        fetchEvents();
      } else {
        const data = await res.json();
        toast.error(data.error || 'حدث خطأ');
      }
    } catch {
      toast.error('حدث خطأ في الاتصال');
    } finally {
      setEventFormLoading(false);
    }
  };

  const handleUpdateEvent = async () => {
    if (!editingEvent || !eventForm.title.trim()) {
      toast.error('العنوان مطلوب');
      return;
    }
    setEventFormLoading(true);
    try {
      const res = await apiCall(`/api/admin/events/${editingEvent.id}`, {
        method: 'PUT',
        body: JSON.stringify(eventForm),
      });
      if (res.ok) {
        toast.success('تم تحديث الحدث بنجاح');
        setShowEventForm(false);
        setEditingEvent(null);
        setEventForm(emptyEventForm);
        fetchEvents();
      } else {
        const data = await res.json();
        toast.error(data.error || 'حدث خطأ');
      }
    } catch {
      toast.error('حدث خطأ في الاتصال');
    } finally {
      setEventFormLoading(false);
    }
  };

  const handleDeleteEvent = async (id: string) => {
    try {
      const res = await apiCall(`/api/admin/events/${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        toast.success('تم حذف الحدث');
        setDeleteEventId(null);
        fetchEvents();
      } else {
        toast.error('حدث خطأ');
      }
    } catch {
      toast.error('حدث خطأ في الاتصال');
    }
  };

  const openEditEvent = (event: EventRow) => {
    setEditingEvent(event);
    setEventForm({
      title: event.title,
      description: event.description,
      type: event.type,
      rewardType: event.rewardType,
      rewardAmount: event.rewardAmount,
      rewardBadge: event.rewardBadge || '',
      isActive: event.isActive,
      startsAt: event.startsAt ? event.startsAt.slice(0, 16) : '',
      endsAt: event.endsAt ? event.endsAt.slice(0, 16) : '',
      imageUrl: event.imageUrl || '',
    });
    setShowEventForm(true);
  };

  // ─── Players ───────────────────────────────────────────────────────

  const fetchPlayers = useCallback(async (search?: string) => {
    try {
      setPlayersLoading(true);
      const params = search ? `?search=${encodeURIComponent(search)}` : '';
      const res = await apiCall(`/api/admin/players${params}`);
      if (res.ok) {
        const data = await res.json();
        setPlayers(data.players);
      }
    } catch {
      // handled
    } finally {
      setPlayersLoading(false);
    }
  }, [apiCall]);

  // ─── Premium IDs ───────────────────────────────────────────────────

  const fetchPremiumIds = useCallback(async () => {
    try {
      setPremiumLoading(true);
      const res = await apiCall('/api/admin/premium-ids');
      if (res.ok) {
        const data = await res.json();
        setPremiumIds(data.premiumIds);
      }
    } catch {
      // handled
    } finally {
      setPremiumLoading(false);
    }
  }, [apiCall]);

  const handleCreatePremiumId = async () => {
    if (!premiumFormName.trim()) {
      toast.error('اسم العرض مطلوب');
      return;
    }
    setPremiumFormLoading(true);
    try {
      const res = await apiCall('/api/admin/premium-ids', {
        method: 'POST',
        body: JSON.stringify({
          displayName: premiumFormName.trim(),
          priceGems: parseInt(premiumFormPrice) || 100,
        }),
      });
      if (res.ok) {
        toast.success('تم إنشاء رقم مميز بنجاح');
        setShowPremiumForm(false);
        setPremiumFormName('');
        setPremiumFormPrice('100');
        fetchPremiumIds();
      } else {
        const data = await res.json();
        toast.error(data.error || 'حدث خطأ');
      }
    } catch {
      toast.error('حدث خطأ في الاتصال');
    } finally {
      setPremiumFormLoading(false);
    }
  };

  const handleDeletePremiumId = async (id: string) => {
    try {
      const res = await apiCall(`/api/admin/premium-ids/${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        toast.success('تم حذف الرقم المميز');
        setDeletePremiumId(null);
        fetchPremiumIds();
      } else {
        toast.error('حدث خطأ');
      }
    } catch {
      toast.error('حدث خطأ في الاتصال');
    }
  };

  // ─── Gem Orders ────────────────────────────────────────────────────

  const fetchOrders = useCallback(async (status?: string) => {
    try {
      setOrdersLoading(true);
      const params = status && status !== 'all' ? `?status=${status}` : '';
      const res = await apiCall(`/api/admin/gem-orders${params}`);
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders);
      }
    } catch {
      // handled
    } finally {
      setOrdersLoading(false);
    }
  }, [apiCall]);

  const handleUpdateOrderStatus = async (orderId: string, status: string) => {
    try {
      const res = await apiCall('/api/admin/gem-orders', {
        method: 'PUT',
        body: JSON.stringify({ id: orderId, status }),
      });
      if (res.ok) {
        toast.success('تم تحديث حالة الطلب');
        fetchOrders(orderFilter);
        fetchStats();
      } else {
        toast.error('حدث خطأ');
      }
    } catch {
      toast.error('حدث خطأ في الاتصال');
    }
  };

  const handleSaveOrderNote = async () => {
    if (!orderNoteDialog) return;
    try {
      const res = await apiCall('/api/admin/gem-orders', {
        method: 'PUT',
        body: JSON.stringify({ id: orderNoteDialog.id, adminNotes: orderNoteText }),
      });
      if (res.ok) {
        toast.success('تم حفظ الملاحظة');
        setOrderNoteDialog(null);
        setOrderNoteText('');
        fetchOrders(orderFilter);
      } else {
        toast.error('حدث خطأ');
      }
    } catch {
      toast.error('حدث خطأ في الاتصال');
    }
  };

  // ─── Effects ───────────────────────────────────────────────────────

  useEffect(() => {
    const init = async () => {
      const ok = await checkSession();
      if (ok) setView('dashboard');
      else setStatsLoading(false);
    };
    init();
  }, [checkSession]);

  useEffect(() => {
    if (view === 'login') return;
    fetchStats();
  }, [view, fetchStats]);

  useEffect(() => {
    if (activeTab === 'events') fetchEvents();
    else if (activeTab === 'players') fetchPlayers();
    else if (activeTab === 'premium') fetchPremiumIds();
    else if (activeTab === 'orders') fetchOrders();
  }, [activeTab, fetchEvents, fetchPlayers, fetchPremiumIds, fetchOrders]);

  // ─── Tab change ────────────────────────────────────────────────────

  const handleTabChange = (tab: string) => {
    setActiveTab(tab as TabType);
    setSidebarOpen(false);
  };

  // ────────────────────────────────────────────────────────────────────
  // LOGIN VIEW
  // ────────────────────────────────────────────────────────────────────

  if (view === 'login') {
    return (
      <>
        <style>{scrollbarStyles}</style>
        <div dir="rtl" className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="w-full max-w-md"
          >
            <Card className="bg-slate-900/80 border-slate-800 backdrop-blur-xl rounded-2xl shadow-2xl shadow-black/40">
              <CardHeader className="flex flex-col items-center gap-4 pb-2 pt-8">
                <motion.img
                  src="/platform-logo.png"
                  alt="ألعاب الغريب"
                  className="w-20 h-20 rounded-2xl"
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
                />
                <div className="text-center">
                  <h1 className="text-2xl font-bold bg-gradient-to-l from-amber-400 to-red-500 bg-clip-text text-transparent">
                    ألعاب الغريب
                  </h1>
                  <p className="text-slate-400 text-sm mt-1">لوحة التحكم</p>
                </div>
              </CardHeader>
              <CardContent className="px-8 pb-8">
                <form onSubmit={handleLogin} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="username" className="text-slate-300 text-sm">
                      اسم المستخدم
                    </Label>
                    <Input
                      id="username"
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="أدخل اسم المستخدم"
                      className="bg-slate-800/60 border-slate-700 text-white placeholder:text-slate-500 focus:border-red-500/50 focus:ring-red-500/20 h-12 rounded-xl"
                      autoFocus
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-slate-300 text-sm">
                      كلمة المرور
                    </Label>
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="أدخل كلمة المرور"
                      className="bg-slate-800/60 border-slate-700 text-white placeholder:text-slate-500 focus:border-red-500/50 focus:ring-red-500/20 h-12 rounded-xl"
                    />
                  </div>

                  {loginError && (
                    <motion.div
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-red-400 text-sm text-center"
                    >
                      {loginError}
                    </motion.div>
                  )}

                  <Button
                    type="submit"
                    disabled={loginLoading}
                    className="w-full h-12 bg-gradient-to-l from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white rounded-xl font-semibold text-base shadow-lg shadow-red-500/20 transition-all duration-200"
                  >
                    {loginLoading ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        جاري تسجيل الدخول...
                      </span>
                    ) : (
                      'تسجيل الدخول'
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </>
    );
  }

  // ────────────────────────────────────────────────────────────────────
  // ADMIN PANEL (main layout)
  // ────────────────────────────────────────────────────────────────────

  const navItems: { id: TabType; label: string; icon: React.ReactNode }[] = [
    { id: 'dashboard', label: 'لوحة المعلومات', icon: <LayoutDashboard className="w-5 h-5" /> },
    { id: 'events', label: 'الأحداث', icon: <Calendar className="w-5 h-5" /> },
    { id: 'players', label: 'اللاعبين', icon: <Users className="w-5 h-5" /> },
    { id: 'premium', label: 'الأرقام المميزة', icon: <Star className="w-5 h-5" /> },
    { id: 'orders', label: 'طلبات الجواهر', icon: <Gem className="w-5 h-5" /> },
  ];

  const statCards = [
    { label: 'إجمالي اللاعبين', value: stats?.totalPlayers ?? 0, icon: <Users className="w-5 h-5" />, color: 'text-blue-400', bg: 'bg-blue-500/10' },
    { label: 'إجمالي الألعاب', value: stats?.totalGames ?? 0, icon: <Activity className="w-5 h-5" />, color: 'text-amber-400', bg: 'bg-amber-500/10' },
    { label: 'الجواهر المباعة', value: stats?.totalGemsSold ?? 0, icon: <Gem className="w-5 h-5" />, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    { label: 'الأحداث', value: stats?.totalEvents ?? 0, icon: <Calendar className="w-5 h-5" />, color: 'text-purple-400', bg: 'bg-purple-500/10' },
    { label: 'الأحداث النشطة', value: stats?.activeEvents ?? 0, icon: <TrendingUp className="w-5 h-5" />, color: 'text-red-400', bg: 'bg-red-500/10' },
    { label: 'الأرقام المباعة', value: stats?.premiumSold ?? 0, icon: <Star className="w-5 h-5" />, color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
  ];

  return (
    <>
      <style>{scrollbarStyles}</style>
      <div dir="rtl" className="min-h-screen bg-slate-950 flex">
        {/* ─── Sidebar (Desktop) ─── */}
        <aside className="hidden lg:flex flex-col w-64 min-h-screen bg-slate-900/60 border-l border-slate-800/60 p-4 gap-2 fixed right-0 top-0 z-30">
          <div className="flex items-center gap-3 px-3 py-4 mb-4">
            <img src="/platform-logo.png" alt="Logo" className="w-10 h-10 rounded-xl" />
            <div>
              <h2 className="font-bold text-white text-sm">ألعاب الغريب</h2>
              <p className="text-slate-500 text-xs">لوحة التحكم</p>
            </div>
          </div>
          <Separator className="bg-slate-800/60 mb-2" />
          <nav className="flex flex-col gap-1 flex-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleTabChange(item.id)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                  activeTab === item.id
                    ? 'bg-red-500/15 text-red-400 shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                {item.icon}
                {item.label}
              </button>
            ))}
          </nav>
          <Separator className="bg-slate-800/60 mb-2" />
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center text-red-400">
              <Shield className="w-4 h-4" />
            </div>
            <span className="text-slate-300 text-sm flex-1 truncate">{username || 'مدير'}</span>
            <button onClick={handleLogout} className="text-slate-500 hover:text-red-400 transition-colors" title="تسجيل الخروج">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </aside>

        {/* ─── Mobile sidebar overlay ─── */}
        <AnimatePresence>
          {sidebarOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/60 z-40 lg:hidden"
                onClick={() => setSidebarOpen(false)}
              />
              <motion.aside
                initial={{ x: 300 }}
                animate={{ x: 0 }}
                exit={{ x: 300 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                className="fixed right-0 top-0 bottom-0 w-72 bg-slate-900 border-l border-slate-800 z-50 p-4 flex flex-col lg:hidden"
              >
                <div className="flex items-center justify-between px-3 py-3 mb-2">
                  <div className="flex items-center gap-3">
                    <img src="/platform-logo.png" alt="Logo" className="w-9 h-9 rounded-xl" />
                    <h2 className="font-bold text-white text-sm">لوحة التحكم</h2>
                  </div>
                  <button onClick={() => setSidebarOpen(false)} className="text-slate-400 hover:text-white">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <Separator className="bg-slate-800 mb-2" />
                <nav className="flex flex-col gap-1 flex-1">
                  {navItems.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => handleTabChange(item.id)}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                        activeTab === item.id
                          ? 'bg-red-500/15 text-red-400'
                          : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                      }`}
                    >
                      {item.icon}
                      {item.label}
                    </button>
                  ))}
                </nav>
                <Separator className="bg-slate-800 mb-2" />
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-red-400 hover:bg-red-500/10 text-sm font-medium transition-all"
                >
                  <LogOut className="w-5 h-5" />
                  تسجيل الخروج
                </button>
              </motion.aside>
            </>
          )}
        </AnimatePresence>

        {/* ─── Main Content ─── */}
        <main className="flex-1 lg:mr-64 min-h-screen">
          {/* Top bar */}
          <header className="sticky top-0 z-20 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/60 px-4 sm:px-6 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="lg:hidden text-slate-400 hover:text-white p-1"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
                <h1 className="text-lg font-bold text-white">لوحة التحكم</h1>
                <Badge variant="outline" className="hidden sm:inline-flex text-slate-500 text-xs border-slate-700">
                  ألعاب الغريب
                </Badge>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    fetchStats();
                    if (activeTab === 'events') fetchEvents();
                    else if (activeTab === 'players') fetchPlayers(playerSearch || undefined);
                    else if (activeTab === 'premium') fetchPremiumIds();
                    else if (activeTab === 'orders') fetchOrders(orderFilter);
                  }}
                  className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800/60 transition-all"
                  title="تحديث"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
                <span className="hidden sm:inline text-slate-400 text-sm">{username || 'مدير'}</span>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 text-sm text-slate-400 hover:text-red-400 p-2 rounded-lg hover:bg-red-500/10 transition-all"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden sm:inline">خروج</span>
                </button>
              </div>
            </div>
          </header>

          <div className="p-4 sm:p-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.25 }}
              >
                {/* ══════════════════════════════════════════════════════ */}
                {/* DASHBOARD TAB                                          */}
                {/* ══════════════════════════════════════════════════════ */}
                {activeTab === 'dashboard' && (
                  <div className="space-y-6">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                      <BarChart3 className="w-6 h-6 text-red-400" />
                      نظرة عامة
                    </h2>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4">
                      {statCards.map((card, i) => (
                        <motion.div
                          key={card.label}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.06 }}
                        >
                          <Card className="bg-slate-900/80 border-slate-800/60 rounded-2xl py-4 px-4 hover:border-slate-700/80 transition-all duration-300 hover:shadow-lg hover:shadow-black/20">
                            <CardContent className="p-0 space-y-2">
                              <div className={`w-9 h-9 rounded-xl ${card.bg} flex items-center justify-center ${card.color}`}>
                                {card.icon}
                              </div>
                              {statsLoading ? (
                                <Skeleton className="h-7 w-16 bg-slate-800" />
                              ) : (
                                <p className={`text-2xl font-bold ${card.color}`}>
                                  {typeof card.value === 'number' ? card.value.toLocaleString('ar-SA') : card.value}
                                </p>
                              )}
                              <p className="text-slate-500 text-xs">{card.label}</p>
                            </CardContent>
                          </Card>
                        </motion.div>
                      ))}
                    </div>

                    {/* Quick Actions */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {[
                        { label: 'إدارة الأحداث', desc: 'إنشاء وتعديل أحداث المنصة', icon: <Calendar className="w-8 h-8" />, tab: 'events' as TabType, gradient: 'from-amber-500/10 to-orange-500/10', iconColor: 'text-amber-400', borderColor: 'border-amber-500/20 hover:border-amber-500/40' },
                        { label: 'لوحة المتصدرين', desc: 'عرض ترتيب اللاعبين', icon: <Trophy className="w-8 h-8" />, tab: 'players' as TabType, gradient: 'from-emerald-500/10 to-teal-500/10', iconColor: 'text-emerald-400', borderColor: 'border-emerald-500/20 hover:border-emerald-500/40' },
                        { label: 'طلبات الجواهر', desc: 'إدارة طلبات شراء الجواهر', icon: <Gem className="w-8 h-8" />, tab: 'orders' as TabType, gradient: 'from-rose-500/10 to-pink-500/10', iconColor: 'text-rose-400', borderColor: 'border-rose-500/20 hover:border-rose-500/40' },
                      ].map((action, i) => (
                        <motion.button
                          key={action.label}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.3 + i * 0.08 }}
                          onClick={() => handleTabChange(action.tab)}
                          className={`bg-gradient-to-br ${action.gradient} border ${action.borderColor} rounded-2xl p-5 text-right transition-all duration-300 group`}
                        >
                          <div className="flex items-start gap-4">
                            <div className={action.iconColor}>{action.icon}</div>
                            <div>
                              <h3 className="font-bold text-white text-sm group-hover:text-slate-100">{action.label}</h3>
                              <p className="text-slate-500 text-xs mt-1">{action.desc}</p>
                            </div>
                            <ChevronLeft className="w-4 h-4 text-slate-600 mr-auto mt-1 group-hover:translate-x-[-4px] transition-transform" />
                          </div>
                        </motion.button>
                      ))}
                    </div>
                  </div>
                )}

                {/* ══════════════════════════════════════════════════════ */}
                {/* EVENTS TAB                                             */}
                {/* ══════════════════════════════════════════════════════ */}
                {activeTab === 'events' && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <Calendar className="w-6 h-6 text-amber-400" />
                        إدارة الأحداث
                      </h2>
                      <Button
                        onClick={() => {
                          setEditingEvent(null);
                          setEventForm(emptyEventForm);
                          setShowEventForm(true);
                        }}
                        className="bg-gradient-to-l from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white rounded-xl shadow-lg shadow-amber-500/20"
                      >
                        <Plus className="w-4 h-4 ml-2" />
                        حدث جديد
                      </Button>
                    </div>

                    {eventsLoading ? (
                      <div className="space-y-3">
                        {[1, 2, 3].map((i) => (
                          <Skeleton key={i} className="h-24 w-full bg-slate-900 rounded-2xl" />
                        ))}
                      </div>
                    ) : events.length === 0 ? (
                      <Card className="bg-slate-900/60 border-slate-800/60 rounded-2xl py-12">
                        <CardContent className="flex flex-col items-center justify-center text-slate-500 gap-3">
                          <Calendar className="w-12 h-12 opacity-30" />
                          <p>لا توجد أحداث بعد</p>
                        </CardContent>
                      </Card>
                    ) : (
                      <div className="space-y-3">
                        {events.map((event, i) => (
                          <motion.div
                            key={event.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.04 }}
                          >
                            <Card className="bg-slate-900/80 border-slate-800/60 rounded-2xl hover:border-slate-700/80 transition-all duration-200 overflow-hidden">
                              <CardContent className="p-4 sm:p-5">
                                <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                                  {/* Image */}
                                  {event.imageUrl && (
                                    <img
                                      src={event.imageUrl}
                                      alt={event.title}
                                      className="w-full sm:w-32 h-40 sm:h-20 object-cover rounded-xl"
                                    />
                                  )}
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-2">
                                      <div>
                                        <h3 className="font-bold text-white text-base truncate">{event.title}</h3>
                                        <p className="text-slate-400 text-sm mt-0.5 line-clamp-2">{event.description || 'بدون وصف'}</p>
                                      </div>
                                      <div className="flex items-center gap-2 shrink-0">
                                        {getStatusBadge(event.isActive ? 'active' : 'inactive')}
                                        <Badge variant="outline" className="border-slate-700 text-slate-400 text-xs">
                                          {getEventTypeLabel(event.type)}
                                        </Badge>
                                      </div>
                                    </div>
                                    {/* Reward Info */}
                                    <div className="mt-3 flex flex-wrap items-center gap-2">
                                      <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl px-3 py-1.5 flex items-center gap-2">
                                        <span className="text-xs text-slate-400">المكافأة:</span>
                                        <span className="text-sm font-semibold text-amber-400">
                                          {getRewardTypeLabel(event.rewardType)}
                                        </span>
                                        <span className="text-sm font-bold text-white">{event.rewardAmount}</span>
                                      </div>
                                      {event.rewardBadge && (
                                        <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl px-3 py-1.5 flex items-center gap-2">
                                          <span className="text-xs text-slate-400">الشارة:</span>
                                          <span className="text-sm font-semibold text-purple-400">{event.rewardBadge}</span>
                                        </div>
                                      )}
                                    </div>
                                    {/* Date info */}
                                    <div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-500">
                                      {event.startsAt && (
                                        <span className="flex items-center gap-1">
                                          <Clock className="w-3 h-3" />
                                          {formatDate(event.startsAt)}
                                        </span>
                                      )}
                                      {event.endsAt && (
                                        <span className="flex items-center gap-1">
                                          <Clock className="w-3 h-3" />
                                          حتى: {formatDate(event.endsAt)}
                                        </span>
                                      )}
                                    </div>
                                    {/* Actions */}
                                    <div className="mt-3 flex items-center gap-2">
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => openEditEvent(event)}
                                        className="text-slate-400 hover:text-amber-400 hover:bg-amber-500/10 h-8 px-3 rounded-lg"
                                      >
                                        <Pencil className="w-3.5 h-3.5 ml-1" />
                                        تعديل
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setDeleteEventId(event.id)}
                                        className="text-slate-400 hover:text-red-400 hover:bg-red-500/10 h-8 px-3 rounded-lg"
                                      >
                                        <Trash2 className="w-3.5 h-3.5 ml-1" />
                                        حذف
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* ══════════════════════════════════════════════════════ */}
                {/* PLAYERS TAB (Leaderboard)                              */}
                {/* ══════════════════════════════════════════════════════ */}
                {activeTab === 'players' && (
                  <div className="space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <Trophy className="w-6 h-6 text-amber-400" />
                        لوحة المتصدرين
                      </h2>
                      <div className="relative w-full sm:w-72">
                        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <Input
                          value={playerSearch}
                          onChange={(e) => {
                            setPlayerSearch(e.target.value);
                            fetchPlayers(e.target.value);
                          }}
                          placeholder="ابحث عن لاعب..."
                          className="bg-slate-900/80 border-slate-800 text-white placeholder:text-slate-500 h-10 rounded-xl pr-10"
                        />
                      </div>
                    </div>

                    {playersLoading ? (
                      <div className="space-y-3">
                        {[1, 2, 3, 4, 5].map((i) => (
                          <Skeleton key={i} className="h-16 w-full bg-slate-900 rounded-xl" />
                        ))}
                      </div>
                    ) : players.length === 0 ? (
                      <Card className="bg-slate-900/60 border-slate-800/60 rounded-2xl py-12">
                        <CardContent className="flex flex-col items-center justify-center text-slate-500 gap-3">
                          <Users className="w-12 h-12 opacity-30" />
                          <p>{playerSearch ? 'لا توجد نتائج' : 'لا يوجد لاعبون بعد'}</p>
                        </CardContent>
                      </Card>
                    ) : (
                      <div className="bg-slate-900/80 border-slate-800/60 rounded-2xl overflow-hidden">
                        <ScrollArea className="max-h-[70vh]">
                          <Table>
                            <TableHeader>
                              <TableRow className="border-slate-800/60 hover:bg-transparent">
                                <TableHead className="text-slate-400 text-xs w-12">#</TableHead>
                                <TableHead className="text-slate-400 text-xs">اللاعب</TableHead>
                                <TableHead className="text-slate-400 text-xs text-center">المستوى</TableHead>
                                <TableHead className="text-slate-400 text-xs text-center min-w-[120px]">الخبرة</TableHead>
                                <TableHead className="text-slate-400 text-xs text-center hidden sm:table-cell">الألعاب</TableHead>
                                <TableHead className="text-slate-400 text-xs text-center hidden md:table-cell">نسبة الفوز</TableHead>
                                <TableHead className="text-slate-400 text-xs text-center">الجواهر</TableHead>
                                <TableHead className="text-slate-400 text-xs text-center">الرتبة</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {players.map((player, i) => {
                                const rank = i + 1;
                                const winRate = player.gamesPlayed > 0
                                  ? Math.round((player.gamesWon / player.gamesPlayed) * 100)
                                  : 0;
                                const maxXP = players.length > 0 ? players[0].xp : 1;
                                const xpPercent = maxXP > 0 ? Math.round((player.xp / maxXP) * 100) : 0;

                                const rankStyle = rank === 1
                                  ? 'bg-amber-500/10 border-amber-500/20'
                                  : rank === 2
                                    ? 'bg-slate-400/10 border-slate-400/20'
                                    : rank === 3
                                      ? 'bg-orange-500/10 border-orange-500/20'
                                      : '';

                                const rankIcon = rank === 1
                                  ? <Crown className="w-5 h-5 text-amber-400" />
                                  : rank === 2
                                    ? <Medal className="w-5 h-5 text-slate-300" />
                                    : rank === 3
                                      ? <Award className="w-5 h-5 text-orange-400" />
                                      : <span className="text-slate-500 text-sm font-medium">{rank}</span>;

                                return (
                                  <TableRow
                                    key={player.id}
                                    className={`border-slate-800/40 hover:bg-slate-800/40 transition-colors ${rankStyle}`}
                                  >
                                    <TableCell className="py-3">
                                      <div className="flex items-center justify-center">{rankIcon}</div>
                                    </TableCell>
                                    <TableCell className="py-3">
                                      <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-red-500/30 to-amber-500/30 flex items-center justify-center text-white text-xs font-bold shrink-0">
                                          {player.name.charAt(0)}
                                        </div>
                                        <span className="text-white text-sm font-medium truncate">{player.name}</span>
                                      </div>
                                    </TableCell>
                                    <TableCell className="py-3 text-center">
                                      <Badge variant="outline" className="border-slate-700 text-slate-300 text-xs">
                                        {player.level}
                                      </Badge>
                                    </TableCell>
                                    <TableCell className="py-3">
                                      <div className="flex flex-col items-center gap-1">
                                        <span className="text-white text-xs font-semibold">{player.xp.toLocaleString('ar-SA')}</span>
                                        <Progress value={xpPercent} className="h-1.5 w-full bg-slate-800 [&>div]:bg-gradient-to-l [&>div]:from-amber-500 [&>div]:to-red-500" />
                                      </div>
                                    </TableCell>
                                    <TableCell className="py-3 text-center text-slate-400 text-xs hidden sm:table-cell">
                                      {player.gamesPlayed}
                                    </TableCell>
                                    <TableCell className="py-3 text-center hidden md:table-cell">
                                      <span className={`text-xs font-semibold ${winRate >= 60 ? 'text-emerald-400' : winRate >= 40 ? 'text-amber-400' : 'text-slate-400'}`}>
                                        {winRate}%
                                      </span>
                                    </TableCell>
                                    <TableCell className="py-3 text-center">
                                      <span className="text-emerald-400 text-xs font-semibold flex items-center justify-center gap-1">
                                        <Gem className="w-3 h-3" />
                                        {player.gems.toLocaleString('ar-SA')}
                                      </span>
                                    </TableCell>
                                    <TableCell className="py-3 text-center">
                                      <Badge className={`text-xs ${player.rankBadge === 'beginner' ? 'bg-slate-500/20 text-slate-400 border-slate-500/30' : 'bg-amber-500/20 text-amber-400 border-amber-500/30'}`}>
                                        {player.rankBadge === 'beginner' ? 'مبتدئ' : player.rankBadge}
                                      </Badge>
                                    </TableCell>
                                  </TableRow>
                                );
                              })}
                            </TableBody>
                          </Table>
                        </ScrollArea>
                      </div>
                    )}
                  </div>
                )}

                {/* ══════════════════════════════════════════════════════ */}
                {/* PREMIUM IDS TAB                                        */}
                {/* ══════════════════════════════════════════════════════ */}
                {activeTab === 'premium' && (
                  <div className="space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                          <Star className="w-6 h-6 text-amber-400" />
                          الأرقام المميزة
                        </h2>
                        <div className="flex items-center gap-3 mt-2">
                          <Badge variant="outline" className="border-slate-700 text-slate-400 text-xs">
                            الإجمالي: {premiumIds.length}
                          </Badge>
                          <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-xs">
                            متاح: {premiumIds.filter((p) => p.status === 'available').length}
                          </Badge>
                          <Badge className="bg-slate-500/20 text-slate-400 border-slate-500/30 text-xs">
                            مباع: {premiumIds.filter((p) => p.status === 'sold').length}
                          </Badge>
                        </div>
                      </div>
                      <Button
                        onClick={() => setShowPremiumForm(true)}
                        className="bg-gradient-to-l from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white rounded-xl shadow-lg shadow-amber-500/20"
                      >
                        <Plus className="w-4 h-4 ml-2" />
                        رقم مميز جديد
                      </Button>
                    </div>

                    {premiumLoading ? (
                      <div className="space-y-3">
                        {[1, 2, 3].map((i) => (
                          <Skeleton key={i} className="h-20 w-full bg-slate-900 rounded-2xl" />
                        ))}
                      </div>
                    ) : premiumIds.length === 0 ? (
                      <Card className="bg-slate-900/60 border-slate-800/60 rounded-2xl py-12">
                        <CardContent className="flex flex-col items-center justify-center text-slate-500 gap-3">
                          <Star className="w-12 h-12 opacity-30" />
                          <p>لا توجد أرقام مميزة بعد</p>
                        </CardContent>
                      </Card>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {premiumIds.map((item, i) => (
                          <motion.div
                            key={item.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.04 }}
                          >
                            <Card className={`bg-slate-900/80 border rounded-2xl hover:shadow-lg transition-all duration-200 ${
                              item.status === 'available' ? 'border-slate-800/60 hover:border-emerald-500/30' : 'border-slate-800/60'
                            }`}>
                              <CardContent className="p-4">
                                <div className="flex items-start justify-between">
                                  <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                                      item.status === 'available' ? 'bg-amber-500/15' : 'bg-slate-500/15'
                                    }`}>
                                      {item.status === 'available'
                                        ? <Store className="w-5 h-5 text-amber-400" />
                                        : <UserCheck className="w-5 h-5 text-slate-400" />
                                      }
                                    </div>
                                    <div>
                                      <h3 className="font-bold text-white text-sm">{item.displayName}</h3>
                                      <div className="flex items-center gap-1 mt-0.5">
                                        <Gem className="w-3 h-3 text-emerald-400" />
                                        <span className="text-emerald-400 text-xs font-semibold">{item.priceGems}</span>
                                        <span className="text-slate-500 text-xs">جوهرة</span>
                                      </div>
                                    </div>
                                  </div>
                                  {getStatusBadge(item.status)}
                                </div>
                                {item.status === 'sold' && (
                                  <div className="mt-3 pt-3 border-t border-slate-800/60 space-y-1">
                                    <p className="text-xs text-slate-500">
                                      <span className="text-slate-400">باع لـ:</span> {item.soldTo || '—'}
                                    </p>
                                    {item.soldDate && (
                                      <p className="text-xs text-slate-500">
                                        <span className="text-slate-400">تاريخ البيع:</span> {formatDate(item.soldDate)}
                                      </p>
                                    )}
                                  </div>
                                )}
                                <div className="mt-3 flex items-center gap-2">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setDeletePremiumId(item.id)}
                                    className="text-slate-400 hover:text-red-400 hover:bg-red-500/10 h-8 px-3 rounded-lg"
                                  >
                                    <Trash2 className="w-3.5 h-3.5 ml-1" />
                                    حذف
                                  </Button>
                                </div>
                              </CardContent>
                            </Card>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* ══════════════════════════════════════════════════════ */}
                {/* GEM ORDERS TAB                                         */}
                {/* ══════════════════════════════════════════════════════ */}
                {activeTab === 'orders' && (
                  <div className="space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <Gem className="w-6 h-6 text-emerald-400" />
                        طلبات الجواهر
                      </h2>
                    </div>

                    {/* Status filter tabs */}
                    <Tabs value={orderFilter} onValueChange={(v) => { setOrderFilter(v); fetchOrders(v); }}>
                      <TabsList className="bg-slate-900 border border-slate-800 rounded-xl h-10">
                        <TabsTrigger value="all" className="text-xs data-[state=active]:bg-slate-800 data-[state=active]:text-white rounded-lg px-4">
                          الكل
                        </TabsTrigger>
                        <TabsTrigger value="pending" className="text-xs data-[state=active]:bg-amber-500/15 data-[state=active]:text-amber-400 rounded-lg px-4">
                          قيد الانتظار
                        </TabsTrigger>
                        <TabsTrigger value="confirmed" className="text-xs data-[state=active]:bg-emerald-500/15 data-[state=active]:text-emerald-400 rounded-lg px-4">
                          مؤكد
                        </TabsTrigger>
                        <TabsTrigger value="rejected" className="text-xs data-[state=active]:bg-red-500/15 data-[state=active]:text-red-400 rounded-lg px-4">
                          مرفوض
                        </TabsTrigger>
                      </TabsList>
                    </Tabs>

                    {ordersLoading ? (
                      <div className="space-y-3">
                        {[1, 2, 3].map((i) => (
                          <Skeleton key={i} className="h-24 w-full bg-slate-900 rounded-2xl" />
                        ))}
                      </div>
                    ) : orders.length === 0 ? (
                      <Card className="bg-slate-900/60 border-slate-800/60 rounded-2xl py-12">
                        <CardContent className="flex flex-col items-center justify-center text-slate-500 gap-3">
                          <Gem className="w-12 h-12 opacity-30" />
                          <p>لا توجد طلبات</p>
                        </CardContent>
                      </Card>
                    ) : (
                      <div className="space-y-3">
                        {orders.map((order, i) => (
                          <motion.div
                            key={order.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.04 }}
                          >
                            <Card className="bg-slate-900/80 border-slate-800/60 rounded-2xl hover:border-slate-700/80 transition-all duration-200 overflow-hidden">
                              <CardContent className="p-4 sm:p-5">
                                <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-2">
                                      <div>
                                        <h3 className="font-bold text-white text-sm">{order.playerName}</h3>
                                        <p className="text-slate-400 text-xs mt-0.5">{order.packageName}</p>
                                      </div>
                                      {getStatusBadge(order.status)}
                                    </div>
                                    <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-3">
                                      <div>
                                        <p className="text-slate-500 text-xs">الجواهر</p>
                                        <p className="text-emerald-400 text-sm font-semibold flex items-center gap-1">
                                          <Gem className="w-3.5 h-3.5" />
                                          {order.gems.toLocaleString('ar-SA')}
                                        </p>
                                      </div>
                                      <div>
                                        <p className="text-slate-500 text-xs">السعر</p>
                                        <p className="text-white text-sm font-semibold">{order.priceSAR} ر.س</p>
                                      </div>
                                      <div>
                                        <p className="text-slate-500 text-xs">طريقة الدفع</p>
                                        <p className="text-white text-sm">{order.paymentMethod === 'manual' ? 'يدوي' : order.paymentMethod}</p>
                                      </div>
                                      <div>
                                        <p className="text-slate-500 text-xs">التاريخ</p>
                                        <p className="text-slate-300 text-xs">{formatDate(order.createdAt)}</p>
                                      </div>
                                    </div>
                                    {order.adminNotes && (
                                      <div className="mt-3 bg-slate-800/50 rounded-lg p-2.5 border border-slate-700/50">
                                        <p className="text-xs text-slate-500 mb-0.5">ملاحظة:</p>
                                        <p className="text-slate-300 text-xs">{order.adminNotes}</p>
                                      </div>
                                    )}
                                  </div>
                                  {/* Actions */}
                                  <div className="flex sm:flex-col gap-2 shrink-0">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => {
                                        setOrderNoteDialog(order);
                                        setOrderNoteText(order.adminNotes || '');
                                      }}
                                      className="text-slate-400 hover:text-white hover:bg-slate-800/60 h-8 px-3 rounded-lg"
                                    >
                                      <Pencil className="w-3.5 h-3.5 ml-1" />
                                      ملاحظة
                                    </Button>
                                    {order.status === 'pending' && (
                                      <>
                                        <Button
                                          size="sm"
                                          onClick={() => handleUpdateOrderStatus(order.id, 'confirmed')}
                                          className="bg-emerald-600 hover:bg-emerald-500 text-white h-8 px-3 rounded-lg text-xs"
                                        >
                                          <Check className="w-3.5 h-3.5 ml-1" />
                                          تأكيد
                                        </Button>
                                        <Button
                                          size="sm"
                                          onClick={() => handleUpdateOrderStatus(order.id, 'rejected')}
                                          className="bg-red-600 hover:bg-red-500 text-white h-8 px-3 rounded-lg text-xs"
                                        >
                                          <X className="w-3.5 h-3.5 ml-1" />
                                          رفض
                                        </Button>
                                      </>
                                    )}
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* ─── Mobile Bottom Navigation ─── */}
          <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur-xl border-t border-slate-800/60 z-30 safe-area-pb">
            <div className="flex items-center justify-around py-2 px-1">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleTabChange(item.id)}
                  className={`flex flex-col items-center gap-0.5 py-1 px-2 rounded-lg transition-all ${
                    activeTab === item.id
                      ? 'text-red-400'
                      : 'text-slate-500'
                  }`}
                >
                  {item.icon}
                  <span className="text-[10px]">{item.label}</span>
                </button>
              ))}
            </div>
          </nav>
        </main>

        {/* ─── DIALOGS ─── */}

        {/* Event Form Dialog */}
        <Dialog open={showEventForm} onOpenChange={(open) => {
          if (!open) {
            setShowEventForm(false);
            setEditingEvent(null);
            setEventForm(emptyEventForm);
          }
        }}>
          <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-lg max-h-[90vh] overflow-y-auto admin-scroll" dir="rtl">
            <DialogHeader>
              <DialogTitle className="text-lg">
                {editingEvent ? 'تعديل الحدث' : 'إنشاء حدث جديد'}
              </DialogTitle>
              <DialogDescription className="text-slate-400">
                {editingEvent ? 'قم بتعديل تفاصيل الحدث' : 'أدخل تفاصيل الحدث الجديد'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label className="text-slate-300 text-sm">العنوان *</Label>
                <Input
                  value={eventForm.title}
                  onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
                  placeholder="عنوان الحدث"
                  className="bg-slate-800/60 border-slate-700 text-white placeholder:text-slate-500 h-11 rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300 text-sm">الوصف</Label>
                <Textarea
                  value={eventForm.description}
                  onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
                  placeholder="وصف الحدث..."
                  className="bg-slate-800/60 border-slate-700 text-white placeholder:text-slate-500 rounded-xl min-h-[80px] resize-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-slate-300 text-sm">النوع</Label>
                  <Select value={eventForm.type} onValueChange={(v) => setEventForm({ ...eventForm, type: v })}>
                    <SelectTrigger className="bg-slate-800/60 border-slate-700 text-white h-11 rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-slate-800">
                      <SelectItem value="permanent">دائم</SelectItem>
                      <SelectItem value="seasonal">موسمي</SelectItem>
                      <SelectItem value="special">خاص</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-300 text-sm">الحالة</Label>
                  <div className="flex items-center gap-2 h-11 px-3 bg-slate-800/60 border border-slate-700 rounded-xl">
                    <Switch
                      checked={eventForm.isActive}
                      onCheckedChange={(checked) => setEventForm({ ...eventForm, isActive: checked })}
                    />
                    <span className="text-sm text-slate-300">{eventForm.isActive ? 'نشط' : 'غير نشط'}</span>
                  </div>
                </div>
              </div>

              <Separator className="bg-slate-800" />
              <p className="text-sm font-semibold text-amber-400 flex items-center gap-1">
                <Award className="w-4 h-4" />
                حقل المكافآت
              </p>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-slate-300 text-sm">نوع المكافأة</Label>
                  <Select value={eventForm.rewardType} onValueChange={(v) => setEventForm({ ...eventForm, rewardType: v })}>
                    <SelectTrigger className="bg-slate-800/60 border-slate-700 text-white h-11 rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-slate-800">
                      <SelectItem value="gems">💎 جواهر</SelectItem>
                      <SelectItem value="xp">⚡ خبرة</SelectItem>
                      <SelectItem value="badge">🏅 شارة</SelectItem>
                      <SelectItem value="coins">🪙 عملات</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-300 text-sm">الكمية</Label>
                  <Input
                    type="number"
                    value={eventForm.rewardAmount}
                    onChange={(e) => setEventForm({ ...eventForm, rewardAmount: parseInt(e.target.value) || 0 })}
                    className="bg-slate-800/60 border-slate-700 text-white h-11 rounded-xl"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300 text-sm">اسم الشارة (اختياري)</Label>
                <Input
                  value={eventForm.rewardBadge}
                  onChange={(e) => setEventForm({ ...eventForm, rewardBadge: e.target.value })}
                  placeholder="مثال: بطل الموسم"
                  className="bg-slate-800/60 border-slate-700 text-white placeholder:text-slate-500 h-11 rounded-xl"
                />
              </div>

              <Separator className="bg-slate-800" />

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-slate-300 text-sm">تاريخ البدء</Label>
                  <Input
                    type="datetime-local"
                    value={eventForm.startsAt}
                    onChange={(e) => setEventForm({ ...eventForm, startsAt: e.target.value })}
                    className="bg-slate-800/60 border-slate-700 text-white h-11 rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-300 text-sm">تاريخ الانتهاء</Label>
                  <Input
                    type="datetime-local"
                    value={eventForm.endsAt}
                    onChange={(e) => setEventForm({ ...eventForm, endsAt: e.target.value })}
                    className="bg-slate-800/60 border-slate-700 text-white h-11 rounded-xl"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300 text-sm flex items-center gap-1">
                  <ImageIcon className="w-3.5 h-3.5" />
                  رابط الصورة (اختياري)
                </Label>
                <Input
                  value={eventForm.imageUrl}
                  onChange={(e) => setEventForm({ ...eventForm, imageUrl: e.target.value })}
                  placeholder="https://..."
                  className="bg-slate-800/60 border-slate-700 text-white placeholder:text-slate-500 h-11 rounded-xl"
                  dir="ltr"
                />
              </div>
            </div>
            <DialogFooter className="flex gap-2 sm:gap-0">
              <Button
                variant="outline"
                onClick={() => {
                  setShowEventForm(false);
                  setEditingEvent(null);
                  setEventForm(emptyEventForm);
                }}
                className="border-slate-700 text-slate-300 hover:bg-slate-800 rounded-xl"
              >
                إلغاء
              </Button>
              <Button
                onClick={editingEvent ? handleUpdateEvent : handleCreateEvent}
                disabled={eventFormLoading}
                className="bg-gradient-to-l from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white rounded-xl shadow-lg shadow-red-500/20"
              >
                {eventFormLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <span className="flex items-center gap-1">
                    <Save className="w-4 h-4" />
                    {editingEvent ? 'حفظ التعديلات' : 'إنشاء الحدث'}
                  </span>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Premium ID Form Dialog */}
        <Dialog open={showPremiumForm} onOpenChange={(open) => {
          if (!open) {
            setShowPremiumForm(false);
            setPremiumFormName('');
            setPremiumFormPrice('100');
          }
        }}>
          <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-md" dir="rtl">
            <DialogHeader>
              <DialogTitle className="text-lg">إنشاء رقم مميز جديد</DialogTitle>
              <DialogDescription className="text-slate-400">أدخل اسم العرض وسعر الجواهر</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label className="text-slate-300 text-sm">اسم العرض *</Label>
                <Input
                  value={premiumFormName}
                  onChange={(e) => setPremiumFormName(e.target.value)}
                  placeholder="مثال: قاتل السونيك"
                  className="bg-slate-800/60 border-slate-700 text-white placeholder:text-slate-500 h-11 rounded-xl"
                  autoFocus
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300 text-sm flex items-center gap-1">
                  <Gem className="w-3.5 h-3.5 text-emerald-400" />
                  السعر (جواهر)
                </Label>
                <Input
                  type="number"
                  value={premiumFormPrice}
                  onChange={(e) => setPremiumFormPrice(e.target.value)}
                  className="bg-slate-800/60 border-slate-700 text-white h-11 rounded-xl"
                />
              </div>
            </div>
            <DialogFooter className="flex gap-2 sm:gap-0">
              <Button
                variant="outline"
                onClick={() => {
                  setShowPremiumForm(false);
                  setPremiumFormName('');
                  setPremiumFormPrice('100');
                }}
                className="border-slate-700 text-slate-300 hover:bg-slate-800 rounded-xl"
              >
                إلغاء
              </Button>
              <Button
                onClick={handleCreatePremiumId}
                disabled={premiumFormLoading}
                className="bg-gradient-to-l from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white rounded-xl shadow-lg shadow-amber-500/20"
              >
                {premiumFormLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <span className="flex items-center gap-1">
                    <Plus className="w-4 h-4" />
                    إنشاء
                  </span>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Order Note Dialog */}
        <Dialog open={!!orderNoteDialog} onOpenChange={(open) => {
          if (!open) {
            setOrderNoteDialog(null);
            setOrderNoteText('');
          }
        }}>
          <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-md" dir="rtl">
            <DialogHeader>
              <DialogTitle className="text-lg">إضافة ملاحظة</DialogTitle>
              <DialogDescription className="text-slate-400">
                طلب: {orderNoteDialog?.playerName} — {orderNoteDialog?.packageName}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label className="text-slate-300 text-sm">الملاحظة</Label>
                <Textarea
                  value={orderNoteText}
                  onChange={(e) => setOrderNoteText(e.target.value)}
                  placeholder="أضف ملاحظتك هنا..."
                  className="bg-slate-800/60 border-slate-700 text-white placeholder:text-slate-500 rounded-xl min-h-[100px] resize-none"
                  autoFocus
                />
              </div>
            </div>
            <DialogFooter className="flex gap-2 sm:gap-0">
              <Button
                variant="outline"
                onClick={() => {
                  setOrderNoteDialog(null);
                  setOrderNoteText('');
                }}
                className="border-slate-700 text-slate-300 hover:bg-slate-800 rounded-xl"
              >
                إلغاء
              </Button>
              <Button
                onClick={handleSaveOrderNote}
                className="bg-gradient-to-l from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white rounded-xl"
              >
                <Save className="w-4 h-4 ml-1" />
                حفظ
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Event Confirmation */}
        <AlertDialog open={!!deleteEventId} onOpenChange={(open) => !open && setDeleteEventId(null)}>
          <AlertDialogContent className="bg-slate-900 border-slate-800" dir="rtl">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-white">هل أنت متأكد من حذف هذا الحدث؟</AlertDialogTitle>
              <AlertDialogDescription className="text-slate-400">
                لا يمكن التراجع عن هذا الإجراء.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="flex gap-2 sm:gap-0">
              <AlertDialogCancel className="border-slate-700 text-slate-300 hover:bg-slate-800 rounded-xl">
                إلغاء
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={() => deleteEventId && handleDeleteEvent(deleteEventId)}
                className="bg-red-600 hover:bg-red-500 text-white rounded-xl"
              >
                حذف
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Delete Premium ID Confirmation */}
        <AlertDialog open={!!deletePremiumId} onOpenChange={(open) => !open && setDeletePremiumId(null)}>
          <AlertDialogContent className="bg-slate-900 border-slate-800" dir="rtl">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-white">هل أنت متأكد من حذف هذا الرقم المميز؟</AlertDialogTitle>
              <AlertDialogDescription className="text-slate-400">
                لا يمكن التراجع عن هذا الإجراء.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="flex gap-2 sm:gap-0">
              <AlertDialogCancel className="border-slate-700 text-slate-300 hover:bg-slate-800 rounded-xl">
                إلغاء
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={() => deletePremiumId && handleDeletePremiumId(deletePremiumId)}
                className="bg-red-600 hover:bg-red-500 text-white rounded-xl"
              >
                حذف
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </>
  );
}
