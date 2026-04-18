'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import {
  Mic, MicOff, LogOut, Gift, Plus, Users, Lock, Volume2,
  X, Loader2, Crown, Send, Radio, Eye, MessageCircle,
  ChevronDown, ChevronUp, Sparkles, ArrowLeft, Settings,
  Headphones
} from 'lucide-react';

/* ─── Types ──────────────────────────────────────────────────────────── */

interface AuthUser {
  id: string;
  username: string;
  displayName: string;
  avatar: string;
}

interface Room {
  id: string;
  name: string;
  description: string;
  hostId: string;
  hostName: string;
  maxParticipants: number;
  isPrivate: boolean;
  micSeatCount: number;
  participantCount: number;
  createdAt: string;
}

interface Participant {
  id: string;
  userId: string;
  username: string;
  displayName: string;
  avatar: string;
  isMuted: boolean;
}

interface GiftItem {
  id: string;
  name: string;
  nameAr: string;
  emoji: string;
  price: number;
}

interface ChatMessage {
  id: string;
  userId: string;
  displayName: string;
  avatar: string;
  text: string;
  time: string;
}

const MIC_LAYOUTS = [
  { value: 5, label: '5 مايكات', desc: '5 مقاعد فقط' },
  { value: 10, label: '10 مايكات', desc: 'صفين × 5' },
  { value: 11, label: '11 مايك', desc: 'مقدم + 10 مقاعد' },
  { value: 15, label: '15 مايك', desc: '3 صفوف × 5' },
] as const;

const FALLBACK_AVATARS = [
  'from-purple-500 to-pink-600',
  'from-blue-500 to-cyan-600',
  'from-green-500 to-emerald-600',
  'from-amber-500 to-orange-600',
  'from-rose-500 to-red-600',
  'from-indigo-500 to-violet-600',
  'from-teal-500 to-green-600',
  'from-fuchsia-500 to-pink-600',
];

function getAvatarGradient(userId: string) {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  return FALLBACK_AVATARS[Math.abs(hash) % FALLBACK_AVATARS.length];
}

/* ─── Mic Seat Component ────────────────────────────────────────────── */

function MicSeat({
  participant,
  isHost,
  isCurrentUser,
  onToggleMic,
  onGift,
}: {
  participant: Participant | null;
  isHost: boolean;
  isCurrentUser: boolean;
  onToggleMic: () => void;
  onGift: () => void;
}) {
  const gradient = participant ? getAvatarGradient(participant.userId) : 'from-slate-700 to-slate-800';

  return (
    <div className="flex flex-col items-center gap-1.5 group">
      <div className={`relative w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center border-2 transition-all duration-300 ${
        participant
          ? isHost
            ? 'border-amber-400 shadow-lg shadow-amber-500/30'
            : 'border-purple-500/50 shadow-lg shadow-purple-500/20'
          : 'border-slate-700/50'
      }`}>
        {participant ? (
          <>
            {participant.avatar ? (
              <img src={participant.avatar} alt="" className="w-full h-full rounded-full object-cover" />
            ) : (
              <span className="text-xl sm:text-2xl font-bold text-white">
                {participant.displayName.charAt(0)}
              </span>
            )}
            {/* Muted indicator */}
            {participant.isMuted && (
              <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-slate-900 border-2 border-slate-700 rounded-full flex items-center justify-center">
                <MicOff className="w-3.5 h-3.5 text-red-400" />
              </div>
            )}
            {/* Speaking animation */}
            {!participant.isMuted && (
              <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-emerald-500/20 border-2 border-emerald-500/50 rounded-full flex items-center justify-center animate-pulse">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center gap-1">
            <Mic className="w-5 h-5 sm:w-6 sm:h-6 text-slate-600" />
          </div>
        )}

        {/* Host crown */}
        {isHost && participant && (
          <div className="absolute -top-2 left-1/2 -translate-x-1/2">
            <Crown className="w-5 h-5 text-amber-400 drop-shadow-lg" />
          </div>
        )}
      </div>

      {/* Name */}
      {participant && (
        <div className="text-center w-20 sm:w-24">
          <p className="text-[10px] sm:text-xs font-medium text-white truncate">
            {participant.displayName}
          </p>
          {isCurrentUser && (
            <button
              onClick={onToggleMic}
              className={`mt-0.5 text-[9px] font-medium px-2 py-0.5 rounded-full transition-colors ${
                participant.isMuted
                  ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                  : 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
              }`}
            >
              {participant.isMuted ? 'فتح المايك' : 'كتم'}
            </button>
          )}
          {!isCurrentUser && participant && (
            <button
              onClick={onGift}
              className="mt-0.5 text-[9px] font-medium px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 transition-colors"
            >
              <Gift className="w-3 h-3 inline ml-0.5" /> هدية
            </button>
          )}
        </div>
      )}

      {!participant && (
        <div className="w-20 sm:w-24 h-4" /> /* spacer */
      )}
    </div>
  );
}

/* ─── Audience Avatars Row ──────────────────────────────────────────── */

function AudienceRow({ participants, hostId }: { participants: Participant[]; hostId: string }) {
  const audience = participants.filter(p => p.userId !== hostId);
  if (audience.length === 0) return null;

  return (
    <div className="mt-4 pt-3 border-t border-slate-800/40">
      <div className="flex items-center gap-2 mb-2">
        <Eye className="w-3.5 h-3.5 text-slate-500" />
        <span className="text-[11px] text-slate-500 font-medium">المشاهدون ({audience.length})</span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {audience.slice(0, 20).map((p) => {
          const gradient = getAvatarGradient(p.userId);
          return (
            <div key={p.id} className="relative group" title={p.displayName}>
              <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center border border-slate-700/50 transition-transform hover:scale-110`}>
                {p.avatar ? (
                  <img src={p.avatar} alt="" className="w-full h-full rounded-full object-cover" />
                ) : (
                  <span className="text-xs font-bold text-white">{p.displayName.charAt(0)}</span>
                )}
              </div>
            </div>
          );
        })}
        {audience.length > 20 && (
          <div className="w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700/50">
            <span className="text-[10px] text-slate-400">+{audience.length - 20}</span>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Mic Grid Layout ──────────────────────────────────────────────── */

function MicGridLayout({
  participants,
  micSeatCount,
  hostId,
  currentUserId,
  onToggleMic,
  onGift,
}: {
  participants: Participant[];
  micSeatCount: number;
  hostId: string;
  currentUserId: string;
  onToggleMic: (userId: string) => void;
  onGift: (userId: string) => void;
}) {
  // Sort: host first, then by joinedAt
  const sorted = [...participants].sort((a, b) => {
    if (a.userId === hostId) return -1;
    if (b.userId === hostId) return 1;
    return 0;
  });

  // Build seat array
  const seats: (Participant | null)[] = [];
  for (let i = 0; i < micSeatCount; i++) {
    seats.push(sorted[i] || null);
  }

  // Determine grid layout based on micSeatCount
  const getGridConfig = () => {
    switch (micSeatCount) {
      case 5:  return { cols: 5, rows: 1 };
      case 10: return { cols: 5, rows: 2 };
      case 11: return { cols: 6, rows: 2, isHostLayout: true }; // 1 host top + 5+5 bottom
      case 15: return { cols: 5, rows: 3 };
      default: return { cols: 5, rows: Math.ceil(micSeatCount / 5) };
    }
  };

  const config = getGridConfig();

  // For 11-layout: host at top center, then 5+5 below
  if (config.isHostLayout) {
    const host = participants.find(p => p.userId === hostId);
    const others = participants.filter(p => p.userId !== hostId);
    const row1: (Participant | null)[] = [host || null];
    const row2: (Participant | null)[] = [];
    const row3: (Participant | null)[] = [];

    others.forEach((p, i) => {
      if (i < 5) row2.push(p);
      else if (i < 10) row3.push(p);
    });
    while (row2.length < 5) row2.push(null);
    while (row3.length < 5) row3.push(null);

    return (
      <div className="flex flex-col items-center gap-4">
        {/* Host row */}
        <div className="flex justify-center gap-3">
          {row1.map((p, i) => (
            <MicSeat
              key={`host-${i}`}
              participant={p}
              isHost={true}
              isCurrentUser={p?.userId === currentUserId}
              onToggleMic={() => p && onToggleMic(p.userId)}
              onGift={() => p && onGift(p.userId)}
            />
          ))}
        </div>

        {/* Decorative divider */}
        <div className="flex items-center gap-3 w-full max-w-sm px-4">
          <div className="flex-1 h-px bg-gradient-to-l from-purple-500/40 to-transparent" />
          <Sparkles className="w-4 h-4 text-purple-400/60" />
          <div className="flex-1 h-px bg-gradient-to-r from-purple-500/40 to-transparent" />
        </div>

        {/* Two rows of 5 */}
        {[row2, row3].map((row, rowIdx) => (
          <div key={rowIdx} className="flex flex-wrap justify-center gap-3">
            {row.map((p, i) => (
              <MicSeat
                key={`r${rowIdx}-${i}`}
                participant={p}
                isHost={false}
                isCurrentUser={p?.userId === currentUserId}
                onToggleMic={() => p && onToggleMic(p.userId)}
                onGift={() => p && onGift(p.userId)}
              />
            ))}
          </div>
        ))}
      </div>
    );
  }

  // Standard grid: rows × cols
  const rows: (Participant | null)[][] = [];
  for (let r = 0; r < config.rows; r++) {
    const row: (Participant | null)[] = [];
    for (let c = 0; c < config.cols; c++) {
      const idx = r * config.cols + c;
      row.push(idx < seats.length ? seats[idx] : null);
    }
    rows.push(row);
  }

  return (
    <div className="flex flex-col items-center gap-4">
      {rows.map((row, rowIdx) => (
        <div key={rowIdx} className="flex flex-wrap justify-center gap-3">
          {row.map((p, i) => (
            <MicSeat
              key={`r${rowIdx}-${i}`}
              participant={p}
              isHost={p?.userId === hostId}
              isCurrentUser={p?.userId === currentUserId}
              onToggleMic={() => p && onToggleMic(p.userId)}
              onGift={() => p && onGift(p.userId)}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

/* ─── Main Page ─────────────────────────────────────────────────────── */

export default function VoiceRoomsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [activeRoom, setActiveRoom] = useState<Room | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [gifts, setGifts] = useState<GiftItem[]>([]);
  const [showGifts, setShowGifts] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: '',
    description: '',
    maxParticipants: 50,
    isPrivate: false,
    micSeatCount: 10,
  });
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [showChat, setShowChat] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((data) => {
        if (data.success && data.user) setUser(data.user);
        else router.push('/');
        setLoading(false);
      })
      .catch(() => {
        router.push('/');
        setLoading(false);
      });
    loadRooms();
  }, []);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages]);

  // Poll participants when in a room
  useEffect(() => {
    if (activeRoom) {
      pollRef.current = setInterval(() => {
        loadParticipants(activeRoom.id);
      }, 5000);
      return () => {
        if (pollRef.current) clearInterval(pollRef.current);
      };
    }
  }, [activeRoom]);

  const loadRooms = async () => {
    try {
      const res = await fetch('/api/voice-rooms');
      const data = await res.json();
      if (data.success) setRooms(data.rooms);
    } catch { /* silent */ }
  };

  const joinRoom = async (room: Room) => {
    if (!user) return;
    try {
      const res = await fetch(
        `/api/voice-rooms/${room.id}?action=join`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: user.username,
            displayName: user.displayName || user.username,
            avatar: user.avatar,
          }),
        }
      );
      const data = await res.json();
      if (data.success) {
        setActiveRoom(room);
        loadParticipants(room.id);
        loadGifts();
      } else {
        toast({ title: 'خطأ', description: data.error, variant: 'destructive' });
      }
    } catch {
      toast({ title: 'خطأ', description: 'فشل الاتصال', variant: 'destructive' });
    }
  };

  const loadParticipants = async (roomId: string) => {
    try {
      const res = await fetch(`/api/voice-rooms/${roomId}?action=participants`);
      const data = await res.json();
      if (data.success) setParticipants(data.participants);
    } catch { /* silent */ }
  };

  const loadGifts = async () => {
    try {
      const res = await fetch('/api/voice-rooms/general?action=gifts');
      const data = await res.json();
      if (data.success && data.gifts) setGifts(data.gifts);
    } catch { /* silent */ }
  };

  const leaveRoom = async () => {
    if (!activeRoom) return;
    await fetch(`/api/voice-rooms/${activeRoom.id}?action=leave`, { method: 'POST' });
    setActiveRoom(null);
    setParticipants([]);
    setChatMessages([]);
    setShowChat(false);
    if (pollRef.current) clearInterval(pollRef.current);
    loadRooms();
  };

  const toggleMic = async (userId: string) => {
    if (!activeRoom) return;
    const res = await fetch(
      `/api/voice-rooms/${activeRoom.id}?action=toggle-mic`,
      { method: 'PUT' }
    );
    const data = await res.json();
    if (data.success) loadParticipants(activeRoom.id);
  };

  const sendGift = async (giftId: string, toUserId: string) => {
    if (!activeRoom) return;
    const res = await fetch(
      `/api/voice-rooms/${activeRoom.id}?action=gift`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ giftId, toUserId }),
      }
    );
    const data = await res.json();
    if (data.success) {
      toast({ title: 'تم إرسال الهدية!' });
      setShowGifts(null);
    }
  };

  const createRoom = async () => {
    if (!user || !createForm.name.trim()) return;
    try {
      const res = await fetch('/api/voice-rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: createForm.name,
          description: createForm.description,
          hostName: user.displayName || user.username,
          maxParticipants: createForm.maxParticipants,
          isPrivate: createForm.isPrivate,
          micSeatCount: createForm.micSeatCount,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast({ title: 'تم إنشاء الغرفة!' });
        setShowCreate(false);
        setCreateForm({
          name: '',
          description: '',
          maxParticipants: 50,
          isPrivate: false,
          micSeatCount: 10,
        });
        loadRooms();
      } else {
        toast({ title: 'خطأ', description: data.error, variant: 'destructive' });
      }
    } catch {
      toast({ title: 'خطأ', description: 'فشل الاتصال', variant: 'destructive' });
    }
  };

  const deleteRoom = async (roomId: string) => {
    const res = await fetch(`/api/voice-rooms/${roomId}`, { method: 'DELETE' });
    const data = await res.json();
    if (data.success) {
      toast({ title: 'تم إغلاق الغرفة' });
      leaveRoom();
    }
  };

  const sendChat = () => {
    if (!chatInput.trim() || !user) return;
    const msg: ChatMessage = {
      id: crypto.randomUUID(),
      userId: user.id,
      displayName: user.displayName || user.username,
      avatar: user.avatar,
      text: chatInput.trim(),
      time: new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' }),
    };
    setChatMessages((prev) => [...prev, msg]);
    setChatInput('');
  };

  /* ─── Loading State ──────────────────────────────────────────────── */

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
      </div>
    );
  }

  /* ─── Active Room View ───────────────────────────────────────────── */

  if (activeRoom) {
    const micSeats = activeRoom.micSeatCount || 10;
    const micParticipants = participants.slice(0, micSeats);
    const audienceCount = Math.max(0, participants.length - micSeats);

    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-950 via-purple-950/20 to-slate-950 text-white" dir="rtl">
        {/* Header */}
        <div className="bg-slate-900/60 backdrop-blur-xl border-b border-purple-500/20 px-4 py-3 sticky top-0 z-40">
          <div className="max-w-2xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                <Radio className="w-4 h-4 text-purple-400" />
              </div>
              <div className="min-w-0">
                <h1 className="font-bold text-white text-sm truncate">{activeRoom.name}</h1>
                <div className="flex items-center gap-2 text-[10px] text-slate-500">
                  <span>بفضل {activeRoom.hostName}</span>
                  <span>·</span>
                  <span>{participants.length} مشارك</span>
                  {activeRoom.isPrivate && (
                    <>
                      <span>·</span>
                      <Lock className="w-2.5 h-2.5" />
                    </>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              {user?.id === activeRoom.hostId && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-rose-400 hover:bg-rose-500/10 h-8 px-2"
                  onClick={() => deleteRoom(activeRoom.id)}
                >
                  <X className="w-4 h-4 ml-1" />
                  <span className="text-[10px]">إغلاق</span>
                </Button>
              )}
              <Button
                size="sm"
                variant="ghost"
                className="text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 h-8 px-2"
                onClick={leaveRoom}
              >
                <LogOut className="w-4 h-4 ml-1" />
                <span className="text-[10px]">مغادرة</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Room Content */}
        <div className="max-w-2xl mx-auto px-4 py-6">
          {/* Viewer count */}
          <div className="flex items-center justify-center gap-2 mb-6">
            <div className="flex items-center gap-1.5 bg-slate-900/60 rounded-full px-3 py-1 border border-slate-800/40">
              <Eye className="w-3.5 h-3.5 text-purple-400" />
              <span className="text-xs text-slate-300 font-medium">{participants.length}</span>
              <span className="text-[10px] text-slate-500">مستمع</span>
            </div>
          </div>

          {/* Mic Grid */}
          <MicGridLayout
            participants={micParticipants}
            micSeatCount={micSeats}
            hostId={activeRoom.hostId}
            currentUserId={user?.id || ''}
            onToggleMic={toggleMic}
            onGift={(userId) => setShowGifts(showGifts === userId ? null : userId)}
          />

          {/* Audience section */}
          {audienceCount > 0 && (
            <AudienceRow participants={participants} hostId={activeRoom.hostId} />
          )}

          {/* Description */}
          {activeRoom.description && (
            <p className="text-center text-xs text-slate-500 mt-4 px-4">
              {activeRoom.description}
            </p>
          )}

          {/* Room Chat */}
          {showChat && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 bg-slate-900/60 border border-slate-800/40 rounded-xl overflow-hidden"
            >
              <div className="max-h-48 overflow-y-auto p-3 space-y-2">
                {chatMessages.length === 0 && (
                  <p className="text-center text-xs text-slate-600 py-4">
                    ابدأ المحادثة...
                  </p>
                )}
                {chatMessages.map((msg) => (
                  <div key={msg.id} className="flex items-start gap-2">
                    <div className={`w-6 h-6 rounded-full bg-gradient-to-br ${getAvatarGradient(msg.userId)} flex items-center justify-center flex-shrink-0`}>
                      {msg.avatar ? (
                        <img src={msg.avatar} alt="" className="w-full h-full rounded-full object-cover" />
                      ) : (
                        <span className="text-[8px] font-bold text-white">{msg.displayName.charAt(0)}</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-medium text-purple-300">{msg.displayName}</span>
                        <span className="text-[8px] text-slate-600">{msg.time}</span>
                      </div>
                      <p className="text-[11px] text-slate-300 leading-relaxed">{msg.text}</p>
                    </div>
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>
              <div className="flex items-center gap-2 p-2 border-t border-slate-800/40">
                <Input
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && sendChat()}
                  placeholder="اكتب رسالة..."
                  className="h-8 text-xs bg-slate-800/60 border-slate-700/50 text-white placeholder:text-slate-600"
                />
                <Button
                  size="sm"
                  onClick={sendChat}
                  className="h-8 w-8 p-0 bg-purple-600 hover:bg-purple-500"
                >
                  <Send className="w-3.5 h-3.5" />
                </Button>
              </div>
            </motion.div>
          )}

          {/* Bottom Controls */}
          <div className="fixed bottom-0 left-0 right-0 bg-slate-950/90 backdrop-blur-xl border-t border-slate-800/40 z-40">
            <div className="max-w-2xl mx-auto flex items-center justify-center gap-4 py-3 px-4">
              <button
                onClick={() => setShowChat(!showChat)}
                className={`flex flex-col items-center gap-0.5 transition-colors ${
                  showChat ? 'text-purple-400' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                <MessageCircle className="w-5 h-5" />
                <span className="text-[9px]">محادثة</span>
              </button>

              {/* Self mic toggle */}
              {(() => {
                const me = participants.find((p) => p.userId === user?.id);
                return me ? (
                  <button
                    onClick={() => toggleMic(me.userId)}
                    className={`flex flex-col items-center gap-0.5 transition-colors ${
                      me.isMuted ? 'text-red-400' : 'text-emerald-400'
                    }`}
                  >
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      me.isMuted
                        ? 'bg-red-500/20 border-2 border-red-500/50'
                        : 'bg-emerald-500/20 border-2 border-emerald-500/50'
                    }`}>
                      {me.isMuted ? (
                        <MicOff className="w-5 h-5" />
                      ) : (
                        <Mic className="w-5 h-5" />
                      )}
                    </div>
                    <span className="text-[9px]">
                      {me.isMuted ? 'مكتوم' : 'مفتوح'}
                    </span>
                  </button>
                ) : null;
              })()}

              <button
                onClick={leaveRoom}
                className="flex flex-col items-center gap-0.5 text-rose-400 hover:text-rose-300 transition-colors"
              >
                <div className="w-12 h-12 rounded-full bg-rose-500/20 border-2 border-rose-500/50 flex items-center justify-center">
                  <LogOut className="w-5 h-5" />
                </div>
                <span className="text-[9px]">مغادرة</span>
              </button>
            </div>
          </div>

          {/* Gift Panel */}
          <AnimatePresence>
            {showGifts && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="fixed bottom-20 left-4 right-4 max-w-sm mx-auto z-50 bg-slate-900 border border-slate-800/60 rounded-2xl p-4 shadow-2xl shadow-black/50"
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold text-amber-400 flex items-center gap-1.5">
                    <Gift className="w-4 h-4" /> إرسال هدية
                  </h3>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 w-6 p-0 text-slate-500"
                    onClick={() => setShowGifts(null)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {gifts.length > 0 ? (
                    gifts.map((gift) => (
                      <button
                        key={gift.id}
                        onClick={() => sendGift(gift.id, showGifts)}
                        className="flex flex-col items-center gap-1 p-2 rounded-xl bg-slate-800/60 hover:bg-slate-700/60 transition-all hover:scale-105"
                      >
                        <span className="text-2xl">{gift.emoji}</span>
                        <span className="text-[9px] text-slate-400">{gift.nameAr || gift.name}</span>
                        <span className="text-[8px] text-amber-400">{gift.price > 0 ? `${gift.price} جوهرة` : 'مجاني'}</span>
                      </button>
                    ))
                  ) : (
                    ['🌹', '❤️', '⭐', '👑', '💎', '🔥', '🎁', '🚀'].map((emoji, i) => (
                      <button
                        key={i}
                        onClick={() => sendGift(`gift-${i}`, showGifts)}
                        className="flex flex-col items-center gap-1 p-2 rounded-xl bg-slate-800/60 hover:bg-slate-700/60 transition-all hover:scale-105"
                      >
                        <span className="text-2xl">{emoji}</span>
                        <span className="text-[9px] text-slate-400">هدية</span>
                        <span className="text-[8px] text-amber-400">مجاني</span>
                      </button>
                    ))
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Bottom padding for fixed controls */}
        <div className="h-24" />
      </div>
    );
  }

  /* ─── Rooms List View ────────────────────────────────────────────── */

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-purple-950/10 to-slate-950 text-white" dir="rtl">
      {/* Header */}
      <div className="bg-slate-900/60 backdrop-blur-xl border-b border-purple-500/20 px-4 py-4 sticky top-0 z-40">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push('/')}
                className="w-8 h-8 rounded-lg bg-slate-800/60 flex items-center justify-center hover:bg-slate-700/60 transition-colors"
              >
                <ArrowLeft className="w-4 h-4 text-slate-400" />
              </button>
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/20 to-indigo-500/20 border border-purple-500/30 flex items-center justify-center">
                <Headphones className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-white">المجلس</h1>
                <p className="text-[11px] text-slate-400">غرف صوتية تفاعلية</p>
              </div>
            </div>
            <Dialog open={showCreate} onOpenChange={setShowCreate}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-l from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-lg shadow-purple-500/20 rounded-xl">
                  <Plus className="w-4 h-4 ml-1.5" />
                  إنشاء غرفة
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-slate-900 border-slate-800 text-white sm:max-w-md" dir="rtl">
                <DialogHeader>
                  <DialogTitle className="text-white flex items-center gap-2">
                    <Radio className="w-5 h-5 text-purple-400" />
                    إنشاء غرفة صوتية
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-2">
                  <Input
                    placeholder="اسم الغرفة"
                    value={createForm.name}
                    onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                    className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
                  />
                  <Input
                    placeholder="الوصف (اختياري)"
                    value={createForm.description}
                    onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                    className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
                  />

                  {/* Mic Layout Selection */}
                  <div>
                    <label className="text-sm text-slate-300 mb-2 block font-medium">
                      <Mic className="w-4 h-4 inline ml-1 text-purple-400" />
                      توزيع المقاعد
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {MIC_LAYOUTS.map((layout) => (
                        <button
                          key={layout.value}
                          onClick={() => setCreateForm({ ...createForm, micSeatCount: layout.value })}
                          className={`p-3 rounded-xl border transition-all text-right ${
                            createForm.micSeatCount === layout.value
                              ? 'bg-purple-500/20 border-purple-500/50 text-purple-300'
                              : 'bg-slate-800/60 border-slate-700/50 text-slate-400 hover:border-slate-600'
                          }`}
                        >
                          <p className="text-sm font-bold">{layout.label}</p>
                          <p className="text-[10px] mt-0.5 opacity-70">{layout.desc}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Max participants */}
                  <div>
                    <label className="text-sm text-slate-300 mb-2 block font-medium">
                      <Users className="w-4 h-4 inline ml-1 text-purple-400" />
                      الحد الأقصى للمشاركين
                    </label>
                    <Input
                      type="number"
                      min={2}
                      max={200}
                      value={createForm.maxParticipants}
                      onChange={(e) => setCreateForm({ ...createForm, maxParticipants: parseInt(e.target.value) || 50 })}
                      className="bg-slate-800 border-slate-700 text-white"
                    />
                  </div>

                  {/* Private toggle */}
                  <div className="flex items-center justify-between bg-slate-800/40 rounded-xl p-3">
                    <div className="flex items-center gap-2">
                      <Lock className="w-4 h-4 text-slate-400" />
                      <span className="text-sm text-slate-300">غرفة خاصة</span>
                    </div>
                    <Switch
                      checked={createForm.isPrivate}
                      onCheckedChange={(v) => setCreateForm({ ...createForm, isPrivate: v })}
                    />
                  </div>

                  <Button
                    onClick={createRoom}
                    disabled={!createForm.name.trim()}
                    className="w-full bg-gradient-to-l from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-purple-500/20 disabled:opacity-50"
                  >
                    إنشاء الغرفة
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Quick Stats */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 bg-slate-800/40 rounded-full px-3 py-1">
              <Radio className="w-3 h-3 text-emerald-400" />
              <span className="text-[11px] text-slate-300 font-medium">{rooms.length}</span>
              <span className="text-[10px] text-slate-500">غرفة نشطة</span>
            </div>
            <div className="flex items-center gap-1.5 bg-slate-800/40 rounded-full px-3 py-1">
              <Users className="w-3 h-3 text-blue-400" />
              <span className="text-[11px] text-slate-300 font-medium">
                {rooms.reduce((sum, r) => sum + r.participantCount, 0)}
              </span>
              <span className="text-[10px] text-slate-500">مستمع</span>
            </div>
          </div>
        </div>
      </div>

      {/* Rooms Grid */}
      <div className="max-w-2xl mx-auto p-4 pb-24">
        <AnimatePresence mode="wait">
          {rooms.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-16"
            >
              <div className="w-20 h-20 rounded-2xl bg-slate-900/60 border border-slate-800/40 flex items-center justify-center mx-auto mb-4">
                <Headphones className="w-10 h-10 text-slate-700" />
              </div>
              <p className="text-slate-400 text-sm font-medium">لا توجد غرف صوتية</p>
              <p className="text-slate-600 text-xs mt-1">أنشئ غرفتك الأولى وابدأ المحادثة!</p>
              <Button
                onClick={() => setShowCreate(true)}
                className="mt-4 bg-gradient-to-l from-purple-600 to-indigo-600 text-white rounded-xl"
              >
                <Plus className="w-4 h-4 ml-1.5" /> إنشاء غرفة
              </Button>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {rooms.map((room, i) => {
                const gradientColors = [
                  'from-purple-600/20 to-pink-600/20',
                  'from-blue-600/20 to-cyan-600/20',
                  'from-emerald-600/20 to-teal-600/20',
                  'from-amber-600/20 to-orange-600/20',
                  'from-rose-600/20 to-red-600/20',
                  'from-indigo-600/20 to-violet-600/20',
                ];
                const gradient = gradientColors[i % gradientColors.length];

                return (
                  <motion.div
                    key={room.id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <Card
                      className={`bg-gradient-to-br ${gradient} border-slate-800/50 hover:border-purple-500/30 transition-all cursor-pointer overflow-hidden group`}
                      onClick={() => joinRoom(room)}
                    >
                      <CardContent className="p-4">
                        {/* Top: Room visual indicator */}
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
                              <Radio className="w-5 h-5 text-white" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <h3 className="font-bold text-white text-sm truncate flex items-center gap-1.5">
                                {room.name}
                                {room.isPrivate && <Lock className="w-3 h-3 text-slate-500 flex-shrink-0" />}
                              </h3>
                              <p className="text-[10px] text-slate-400 truncate">{room.hostName}</p>
                            </div>
                          </div>
                        </div>

                        {/* Mic layout indicator */}
                        <div className="flex items-center gap-1.5 mb-3">
                          <Mic className="w-3 h-3 text-purple-400" />
                          <span className="text-[10px] text-slate-400">{room.micSeatCount || 10} مايك</span>
                          <span className="text-slate-700">·</span>
                          <Users className="w-3 h-3 text-blue-400" />
                          <span className="text-[10px] text-slate-400">{room.participantCount} مشارك</span>
                        </div>

                        {/* Description */}
                        {room.description && (
                          <p className="text-[11px] text-slate-500 line-clamp-2 mb-3 leading-relaxed">
                            {room.description}
                          </p>
                        )}

                        {/* Bottom: Join button */}
                        <Button
                          size="sm"
                          className="w-full bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/30 h-9 rounded-xl text-xs font-medium group-hover:bg-purple-500/40 transition-colors"
                        >
                          انضمام
                        </Button>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
