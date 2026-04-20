'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Loader2, Volume2, Users } from 'lucide-react';
import SiteHeader from '@/components/shared/SiteHeader';
import SiteBottomNav from '@/components/shared/SiteBottomNav';
import CreateRoomDialog from './dialogs/CreateRoomDialog';
import type { VoiceRoom, AuthUser, RoomMode } from '../types';

export default function RoomListView({
  onJoinRoom,
  onCreateRoom,
  authUser,
}: {
  onJoinRoom: (room: VoiceRoom) => void;
  onCreateRoom: (data: {
    name: string; description: string; micSeatCount: number;
    roomMode: RoomMode; roomPassword: string; maxParticipants: number;
    isAutoMode: boolean; micTheme: string;
  }) => void;
  authUser: AuthUser | null;
}) {
  const [rooms, setRooms] = useState<VoiceRoom[]>([]);
  const [myRoom, setMyRoom] = useState<VoiceRoom | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  const hasRoom = !!myRoom;

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await fetch('/api/voice-rooms');
        const data = await res.json();
        if (!cancelled && data.success) {
          setRooms(data.rooms || []);
          setMyRoom(data.myRoom || null);
        }
      } catch { /* ignore */ }
      if (!cancelled) setLoading(false);
    };
    load();
    return () => { cancelled = true; };
  }, []);

  const modeLabel: Record<RoomMode, string> = {
    public: 'عام', key: '🔒', private: '✨ خاص',
  };

  const modeColor: Record<RoomMode, string> = {
    public: 'bg-[rgba(34,197,94,0.2)] text-[#22c55e] border-[rgba(34,197,94,0.4)]',
    key: 'bg-[rgba(245,158,11,0.2)] text-[#f59e0b] border-[rgba(245,158,11,0.4)]',
    private: 'bg-[rgba(108,99,255,0.2)] text-[#a78bfa] border-[rgba(108,99,255,0.4)]',
  };

  return (
    <div className="min-h-screen bg-slate-950" dir="rtl">
      {/* Shared Header */}
      <SiteHeader
        authUser={authUser}
        onProfileClick={() => { window.location.href = '/profile'; }}
        extraContent={
          !hasRoom ? (
            <button
              onClick={() => setShowCreate(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-l from-amber-500 to-red-500 text-white text-sm font-medium"
            >
              <span>+</span>
              <span className="hidden sm:inline">إنشاء</span>
            </button>
          ) : undefined
        }
      />

      {/* Spacer for fixed header */}
      <div className="h-14 sm:h-16" />

      {/* Room Grid */}
      <div className="p-4">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-[#6c63ff] animate-spin" />
          </div>
        ) : rooms.length === 0 && !hasRoom ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-full bg-[#1c2035] flex items-center justify-center mb-4">
              <Volume2 className="w-8 h-8 text-[#5a6080]" />
            </div>
            <p className="text-[#9ca3c4] text-sm mb-1">لا توجد غرف صوتية</p>
            <p className="text-[#5a6080] text-xs mb-4">كن أول من ينشئ غرفة!</p>
            <button onClick={() => setShowCreate(true)} className="px-6 py-2.5 rounded-xl bg-[#6c63ff] text-white text-sm font-medium hover:bg-[#6c63ff]/80 transition-colors">
              إنشاء غرفة جديدة
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* My room - pinned */}
            {hasRoom && (
              <div className="mb-2">
                <div className="text-[10px] text-[#5a6080] font-semibold mb-2 px-1">غرفتي</div>
                <motion.button
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  onClick={() => onJoinRoom(myRoom!)}
                  className="w-full bg-[#141726] border-2 border-[rgba(245,158,11,0.3)] rounded-2xl overflow-hidden text-right hover:border-[rgba(245,158,11,0.5)] transition-all group"
                >
                  <div className="h-28 relative overflow-hidden">
                    {myRoom.roomImage ? (
                      <img src={myRoom.roomImage} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-l from-[#6c63ff]/30 to-[#a78bfa]/10" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#141726] via-transparent to-transparent" />
                    <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5">
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-[rgba(34,197,94,0.2)] text-[#22c55e] border border-[rgba(34,197,94,0.4)]">
                        <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#22c55e] animate-live-pulse ml-1" />
                        مباشر
                      </span>
                    </div>
                    <div className="absolute bottom-2.5 left-2.5">
                      <div className="flex items-center gap-1 bg-[rgba(245,158,11,0.15)] rounded-full px-2 py-0.5">
                        <span className="text-[9px] font-bold text-[#f59e0b]">LV</span>
                        <span className="text-[9px] font-bold text-[#f0f0f8]">{myRoom.roomLevel || 1}</span>
                      </div>
                    </div>
                    <div className="absolute bottom-2.5 right-2.5 flex items-center gap-1 text-[#c0c0d0] text-[10px]">
                      <Users className="w-3 h-3" />
                      <span>{myRoom.participantCount || 0}</span>
                    </div>
                  </div>
                  <div className="px-4 py-3">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="text-[15px] font-bold text-[#f0f0f8] truncate group-hover:text-[#f59e0b] transition-colors">
                        {myRoom.name}
                      </h3>
                      <span className="text-[10px] font-mono text-[#5a6080]">#{myRoom.hostId?.substring(0, 8)}</span>
                    </div>
                    <p className="text-[11px] text-[#5a6080] truncate">{myRoom.description || 'بدون وصف'}</p>
                  </div>
                </motion.button>
              </div>
            )}

            {/* Other rooms */}
            {rooms.length > 0 && (
              <div>
                {!hasRoom && rooms.length > 0 && <div className="text-[10px] text-[#5a6080] font-semibold mb-2 px-1">الغرف العامة</div>}
                <div className="grid grid-cols-2 gap-3">
                  {rooms.map((room, i) => (
                    <motion.button
                      key={room.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      onClick={() => onJoinRoom(room)}
                      className="bg-[#141726] border border-[rgba(255,255,255,0.07)] rounded-2xl overflow-hidden text-right hover:border-[rgba(108,99,255,0.3)] transition-all group"
                    >
                      {room.roomImage ? (
                        <div className="h-20 overflow-hidden">
                          <img src={room.roomImage} alt="" className="w-full h-full object-cover" />
                          <div className="relative inset-0 bg-gradient-to-t from-[#141726] to-transparent" />
                        </div>
                      ) : null}
                      <div className={`${room.roomImage ? 'px-3 pt-2.5 pb-3' : 'p-4'}`}>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className={`text-[10px] px-2 py-0.5 rounded-full border ${modeColor[room.roomMode || 'public']}`}>
                            {modeLabel[room.roomMode || 'public']}
                          </span>
                          <div className="flex items-center gap-1 text-[#5a6080] text-[10px]">
                            <Users className="w-3 h-3" />
                            <span>{room.participantCount || 0}</span>
                          </div>
                        </div>
                        <h3 className="text-sm font-bold text-[#f0f0f8] truncate mb-1 group-hover:text-[#a78bfa] transition-colors">
                          {room.name}
                        </h3>
                        <p className="text-[11px] text-[#5a6080] truncate">{room.description || 'بدون وصف'}</p>
                        <div className="flex items-center gap-1.5 mt-1.5">
                          <div className="w-5 h-5 rounded-full bg-[#6c63ff] flex items-center justify-center">
                            <span className="text-[8px] font-bold text-white">{(room.hostName || '?').charAt(0)}</span>
                          </div>
                          <span className="text-[10px] text-[#5a6080]">{room.hostName || 'مجهول'}</span>
                        </div>
                      </div>
                    </motion.button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <CreateRoomDialog
        isOpen={showCreate}
        onClose={() => setShowCreate(false)}
        onCreate={onCreateRoom}
      />

      {/* Shared Bottom Navigation */}
      <SiteBottomNav activeTab="council" />
    </div>
  );
}
