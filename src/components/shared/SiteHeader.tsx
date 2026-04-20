'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Search, Bell, Gem, Settings, UserPlus, Mic, LogIn, LogOut,
} from 'lucide-react';

interface SiteHeaderProps {
  /** Pass auth user from parent (recommended). Falls back to /api/auth/me if not provided. */
  authUser?: {
    id: string;
    username: string;
    email?: string;
    displayName?: string;
    phone?: string;
    avatar?: string;
    role?: string;
    vipLevel?: number;
  } | null;
  /** Optional extra content to render on the right side of the header */
  extraContent?: React.ReactNode;
  /** Called when profile avatar is clicked */
  onProfileClick?: () => void;
  /** Called when login button is clicked */
  onLoginClick?: () => void;
  /** Called when logout is clicked (if not provided, default logout is used) */
  onLogout?: () => void;
}

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

export default function SiteHeader({
  authUser: authUserProp,
  extraContent,
  onProfileClick,
  onLoginClick,
  onLogout,
}: SiteHeaderProps) {
  // If no authUser prop provided, fetch from /api/auth/me
  const [fetchedUser, setFetchedUser] = useState<SiteHeaderProps['authUser']>(null);
  const authUser = authUserProp !== undefined ? authUserProp : fetchedUser;

  useEffect(() => {
    // Only fetch if no prop is provided
    if (authUserProp !== undefined) return;
    fetch('/api/auth/me')
      .then(r => r.json())
      .then(d => {
        if (d.success && d.user) {
          setFetchedUser(d.user);
        }
      })
      .catch(() => {});
  }, [authUserProp]);

  const { count, visible: countVisible } = useActivePlayers();

  const isAdmin = authUser?.role === 'admin';
  const avatarLetter = authUser?.displayName?.charAt(0) || 'غ';

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-slate-950/90 backdrop-blur-lg border-b border-slate-800/40">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6">
        <div className="flex items-center justify-between h-14 sm:h-16">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <a href="/" className="flex items-center gap-2 shrink-0">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-amber-500 to-rose-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
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
            </a>
            <div className="hidden sm:block">
              <a href="/" className="text-base sm:text-lg font-black bg-gradient-to-l from-amber-300 via-yellow-300 to-amber-400 bg-clip-text text-transparent hover:from-amber-200 hover:via-yellow-200 hover:to-amber-300 transition-all">
                ألعاب الغريب
              </a>
            </div>
          </div>

          {/* Center: Online Players (desktop) */}
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span className="transition-opacity duration-300">
              {countVisible ? count : count}
            </span>
            <span className="text-slate-500">متصل</span>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Search */}
            <button
              className="w-9 h-9 rounded-full bg-slate-800/60 border border-slate-700/40 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700/60 transition-all"
              aria-label="بحث"
            >
              <Search className="w-4 h-4" />
            </button>

            {/* Gems - only when logged in */}
            {authUser && (
              <div className="hidden sm:flex items-center gap-1.5 bg-slate-800/60 border border-slate-700/40 rounded-full px-3 py-1.5">
                <Gem className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-bold text-amber-300">2,450</span>
              </div>
            )}

            {/* Admin Panel */}
            {isAdmin && (
              <a
                href="/admin"
                className="w-9 h-9 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 hover:text-rose-300 hover:bg-rose-500/20 transition-all"
                aria-label="لوحة التحكم"
                title="لوحة التحكم"
              >
                <Settings className="w-4 h-4" />
              </a>
            )}

            {/* Friends */}
            {authUser && (
              <a
                href="/friends"
                className="w-9 h-9 rounded-full bg-slate-800/60 border border-slate-700/40 flex items-center justify-center text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 hover:border-emerald-500/30 transition-all"
                aria-label="الأصدقاء"
                title="الأصدقاء"
              >
                <UserPlus className="w-4 h-4" />
              </a>
            )}

            {/* Voice Rooms */}
            {authUser && (
              <a
                href="/voice-rooms"
                className="w-9 h-9 rounded-full bg-slate-800/60 border border-slate-700/40 flex items-center justify-center text-slate-400 hover:text-purple-400 hover:bg-purple-500/10 hover:border-purple-500/30 transition-all"
                aria-label="الغرف الصوتية"
                title="الغرف الصوتية"
              >
                <Mic className="w-4 h-4" />
              </a>
            )}

            {/* Notifications */}
            {authUser && (
              <button
                className="relative w-9 h-9 rounded-full bg-slate-800/60 border border-slate-700/40 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700/60 transition-all"
                aria-label="إشعارات"
              >
                <Bell className="w-4 h-4" />
              </button>
            )}

            {/* Extra content slot (e.g., create room button) */}
            {extraContent}

            {/* Avatar / Login */}
            {authUser ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onLogout?.()}
                  className="w-9 h-9 rounded-full bg-slate-800/60 border border-slate-700/40 flex items-center justify-center text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 hover:border-rose-500/30 transition-all"
                  aria-label="تسجيل الخروج"
                  title="تسجيل الخروج"
                >
                  <LogOut className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onProfileClick?.()}
                  className="relative w-9 h-9 rounded-full bg-gradient-to-br from-amber-500 to-rose-500 flex items-center justify-center text-white text-sm font-bold shadow-lg shadow-amber-500/20"
                  aria-label="الملف الشخصي"
                >
                  {avatarLetter}
                </button>
              </div>
            ) : (
              <button
                onClick={() => onLoginClick?.()}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-l from-amber-600 to-rose-600 hover:from-amber-500 hover:to-rose-500 text-white text-xs font-bold shadow-lg shadow-amber-500/20 transition-all"
                aria-label="تسجيل الدخول"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">دخول</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
