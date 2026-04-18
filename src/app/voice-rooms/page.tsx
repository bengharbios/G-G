'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Mic, MicOff, LogOut, Gift, Plus, Users, Lock, Volume2, X, Loader2, Crown, Send } from 'lucide-react';

interface AuthUser { id: string; username: string; displayName: string; avatar: string; }
interface Room { id: string; name: string; description: string; hostId: string; hostName: string; maxParticipants: number; isPrivate: boolean; participantCount: number; createdAt: string; }
interface Participant { id: string; userId: string; username: string; displayName: string; avatar: string; isMuted: boolean; }
interface GiftItem { id: string; name: string; nameAr: string; emoji: string; price: number; }

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
  const [createForm, setCreateForm] = useState({ name: '', description: '', maxParticipants: 10, isPrivate: false });

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(data => {
      if (data.success && data.user) setUser(data.user);
      else router.push('/');
      setLoading(false);
    }).catch(() => { router.push('/'); setLoading(false); });
    loadRooms();
  }, []);

  const loadRooms = async () => {
    const res = await fetch('/api/voice-rooms');
    const data = await res.json();
    if (data.success) setRooms(data.rooms);
  };

  const joinRoom = async (room: Room) => {
    if (!user) return;
    const res = await fetch(`/api/voice-rooms/${room.id}?action=join`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: user.username, displayName: user.displayName || user.username, avatar: user.avatar }) });
    const data = await res.json();
    if (data.success) { setActiveRoom(room); loadParticipants(room.id); loadGifts(); }
    else toast({ title: 'خطأ', description: data.error, variant: 'destructive' });
  };

  const loadParticipants = async (roomId: string) => {
    const res = await fetch(`/api/voice-rooms/${roomId}?action=participants`);
    const data = await res.json();
    if (data.success) setParticipants(data.participants);
  };

  const loadGifts = async () => {
    const res = await fetch('/api/voice-rooms/general?action=gifts');
    const res2 = await fetch('/api/voice-rooms/none?action=gifts');
  };

  const leaveRoom = async () => {
    if (!activeRoom) return;
    await fetch(`/api/voice-rooms/${activeRoom.id}?action=leave`, { method: 'POST' });
    setActiveRoom(null); setParticipants([]); loadRooms();
  };

  const toggleMic = async (userId: string) => {
    const res = await fetch(`/api/voice-rooms/${activeRoom?.id}?action=toggle-mic`, { method: 'PUT' });
    const data = await res.json();
    if (data.success && activeRoom) loadParticipants(activeRoom.id);
  };

  const sendGift = async (giftId: string, toUserId: string) => {
    if (!activeRoom) return;
    const res = await fetch(`/api/voice-rooms/${activeRoom.id}?action=gift`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ giftId, toUserId }) });
    const data = await res.json();
    if (data.success) { toast({ title: 'تم إرسال الهدية!' }); setShowGifts(null); }
  };

  const createRoom = async () => {
    if (!user || !createForm.name.trim()) return;
    const res = await fetch('/api/voice-rooms', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: createForm.name, description: createForm.description, hostName: user.displayName || user.username, maxParticipants: createForm.maxParticipants, isPrivate: createForm.isPrivate }) });
    const data = await res.json();
    if (data.success) { toast({ title: 'تم إنشاء الغرفة!' }); setShowCreate(false); setCreateForm({ name: '', description: '', maxParticipants: 10, isPrivate: false }); loadRooms(); }
    else toast({ title: 'خطأ', description: data.error, variant: 'destructive' });
  };

  const deleteRoom = async (roomId: string) => {
    const res = await fetch(`/api/voice-rooms/${roomId}`, { method: 'DELETE' });
    const data = await res.json();
    if (data.success) { toast({ title: 'تم إغلاق الغرفة' }); leaveRoom(); }
  };

  if (loading) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-purple-400" /></div>
  );

  // Active Room View
  if (activeRoom) {
    return (
      <div className="min-h-screen bg-slate-950 text-white" dir="rtl">
        <div className="bg-slate-900/80 border-b border-purple-500/20 px-4 py-3">
          <div className="max-w-2xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Volume2 className="w-5 h-5 text-purple-400" />
              <h1 className="font-bold text-white">{activeRoom.name}</h1>
              {activeRoom.isPrivate && <Lock className="w-3.5 h-3.5 text-slate-500" />}
            </div>
            <div className="flex gap-2">
              {user?.id === activeRoom.hostId && (
                <Button size="sm" variant="ghost" className="text-rose-400 hover:bg-rose-500/10" onClick={() => deleteRoom(activeRoom.id)}>
                  <X className="w-4 h-4 ml-1" /> إغلاق
                </Button>
              )}
              <Button size="sm" variant="ghost" className="text-slate-400 hover:text-rose-400 hover:bg-rose-500/10" onClick={leaveRoom}>
                <LogOut className="w-4 h-4 ml-1" /> مغادرة
              </Button>
            </div>
          </div>
        </div>

        <div className="max-w-2xl mx-auto p-4">
          <p className="text-xs text-slate-500 mb-3">{activeRoom.description || 'لا يوجد وصف'}</p>
          <div className="space-y-2 mb-4">
            <AnimatePresence>
              {participants.map((p, i) => (
                <motion.div key={p.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}>
                  <Card className="bg-slate-900/60 border-slate-800/50">
                    <CardContent className="flex items-center justify-between p-3">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <div className="w-11 h-11 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-white font-bold">
                            {p.avatar ? <img src={p.avatar} className="w-full h-full rounded-full object-cover" /> : p.displayName.charAt(0)}
                          </div>
                          {p.isMuted && <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 bg-slate-800 border border-slate-600 rounded-full flex items-center justify-center"><MicOff className="w-2.5 h-2.5 text-slate-400" /></div>}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white flex items-center gap-1.5">{p.displayName}
                            {p.userId === activeRoom.hostId && <Crown className="w-3.5 h-3.5 text-amber-400" />}
                          </p>
                          <p className="text-xs text-slate-500">@{p.username}</p>
                        </div>
                      </div>
                      <div className="flex gap-1.5">
                        {user?.id === p.userId && (
                          <Button size="sm" variant="ghost" className={`h-8 px-2.5 ${p.isMuted ? 'text-rose-400 hover:bg-rose-500/10' : 'text-emerald-400 hover:bg-emerald-500/10'}`} onClick={() => toggleMic(p.userId)}>
                            {p.isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                          </Button>
                        )}
                        {user?.id !== p.userId && (
                          <Button size="sm" variant="ghost" className="text-amber-400 hover:bg-amber-500/10 h-8 px-2.5" onClick={() => setShowGifts(showGifts === p.userId ? null : p.userId)}>
                            <Gift className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Gift panel */}
          <AnimatePresence>
            {showGifts && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="bg-slate-900 border border-slate-800 rounded-xl p-3">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-bold text-amber-400">إرسال هدية</h3>
                  <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-slate-500" onClick={() => setShowGifts(null)}><X className="w-4 h-4" /></Button>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {['🌹', '❤️', '⭐', '👑', '💎', '🔥', '🎁', '🚀'].map((emoji, i) => (
                    <button key={i} onClick={() => sendGift(`gift-${i}`, showGifts)} className="flex flex-col items-center gap-1 p-2 rounded-lg bg-slate-800/60 hover:bg-slate-700/60 transition-colors">
                      <span className="text-2xl">{emoji}</span>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    );
  }

  // Rooms List View
  return (
    <div className="min-h-screen bg-slate-950 text-white" dir="rtl">
      <div className="bg-slate-900/80 border-b border-purple-500/20 px-4 py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center">
              <Volume2 className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">الغرف الصوتية</h1>
              <p className="text-xs text-slate-400">تحدث مع أصدقائك مباشرة</p>
            </div>
          </div>
          <Dialog open={showCreate} onOpenChange={setShowCreate}>
            <DialogTrigger asChild>
              <Button className="bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 border border-purple-500/30">
                <Plus className="w-4 h-4 ml-1.5" /> إنشاء غرفة
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-slate-900 border-slate-800 text-white" dir="rtl">
              <DialogHeader><DialogTitle className="text-white">إنشاء غرفة صوتية جديدة</DialogTitle></DialogHeader>
              <div className="space-y-3 mt-2">
                <Input placeholder="اسم الغرفة" value={createForm.name} onChange={e => setCreateForm({ ...createForm, name: e.target.value })} className="bg-slate-800 border-slate-700 text-white" />
                <Input placeholder="الوصف (اختياري)" value={createForm.description} onChange={e => setCreateForm({ ...createForm, description: e.target.value })} className="bg-slate-800 border-slate-700 text-white" />
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-400">غرفة خاصة</span>
                  <Switch checked={createForm.isPrivate} onCheckedChange={v => setCreateForm({ ...createForm, isPrivate: v })} />
                </div>
                <Button onClick={createRoom} className="w-full bg-purple-600 hover:bg-purple-500 text-white">إنشاء</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-4">
        <AnimatePresence mode="wait">
          {rooms.length === 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-12">
              <Volume2 className="w-16 h-16 text-slate-700 mx-auto mb-3" />
              <p className="text-slate-400 text-sm">لا توجد غرف صوتية</p>
              <p className="text-slate-500 text-xs mt-1">أنشئ غرفتك الأولى!</p>
            </motion.div>
          ) : (
            <div className="space-y-3">
              {rooms.map((room, i) => (
                <motion.div key={room.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                  <Card className="bg-slate-900/60 border-slate-800/50 hover:border-purple-500/30 transition-colors">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-bold text-white text-sm truncate">{room.name}</h3>
                            {room.isPrivate && <Lock className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />}
                          </div>
                          <p className="text-xs text-slate-500 line-clamp-1">{room.description || 'لا يوجد وصف'}</p>
                          <div className="flex items-center gap-3 mt-2">
                            <Badge variant="secondary" className="text-[10px] bg-slate-800 text-slate-400"><Users className="w-3 h-3 ml-1" />{room.participantCount}/{room.maxParticipants}</Badge>
                            <span className="text-[10px] text-slate-600">بفضل {room.hostName}</span>
                          </div>
                        </div>
                        <Button size="sm" className="bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 border border-purple-500/30 h-8 px-4 flex-shrink-0" onClick={() => joinRoom(room)}>
                          انضمام
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
