'use client';

import { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Send } from 'lucide-react';
import type { ChatMessage, VoiceRoomParticipant, RoomRole } from '../types';
import { getAvatarColor, getSenderColor } from '../types';

export default function ChatPanel({
  messages,
  chatInput,
  setChatInput,
  onSendChat,
  isRoomMuted,
  authUser,
  participants,
  roomId,
  onProfileClick,
}: {
  messages: ChatMessage[];
  chatInput: string;
  setChatInput: (val: string) => void;
  onSendChat: () => void;
  isRoomMuted: boolean;
  authUser: { id: string; displayName: string; avatar: string } | null;
  participants: VoiceRoomParticipant[];
  roomId: string;
  onProfileClick: (p: VoiceRoomParticipant) => void;
}) {
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleProfileClickFromMsg = (msg: ChatMessage) => {
    const p = participants.find(p => p.userId === msg.userId);
    if (p) {
      onProfileClick(p);
    } else {
      onProfileClick({
        id: '', roomId, userId: msg.userId, username: '',
        displayName: msg.displayName, avatar: msg.avatar || '',
        isMuted: false, micFrozen: false, role: 'visitor' as RoomRole,
        seatIndex: -1, seatStatus: 'open' as RoomRole, vipLevel: 0,
        joinedAt: new Date().toISOString(),
      });
    }
  };

  return (
    <>
      {/* Chat messages */}
      <section className="flex-1 overflow-y-auto px-3 py-2.5 scrollbar-hide" style={{ minHeight: 0 }}>
        <div className="flex flex-col gap-1.5">
          {messages.length === 0 && (
            <p className="text-center text-[10px] text-[#5a6080] py-4">ابدأ المحادثة...</p>
          )}

          {messages.map((msg) => (
            <div key={msg.id}>
              {msg.isGift ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8, y: 8 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ duration: 0.4, ease: 'easeOut' }}
                  className="self-center flex justify-center"
                >
                  <div className="bg-[rgba(245,158,11,0.1)] border border-[rgba(245,158,11,0.2)] rounded-full px-3.5 py-1 text-[10.5px] text-[#f59e0b] flex items-center gap-1.5">
                    {msg.giftEmoji && <span className="text-[16px]">{msg.giftEmoji}</span>}
                    <span>{msg.text}</span>
                  </div>
                </motion.div>
              ) : msg.isSystem ? (
                <p className="text-center text-[10px] text-[#5a6080] py-0.5 italic animate-fade-up">{msg.text}</p>
              ) : (
                <div className="flex items-start gap-1.5 animate-fade-up">
                  <button
                    onClick={() => handleProfileClickFromMsg(msg)}
                    className="flex-shrink-0 mt-0.5 active:scale-95 transition-transform"
                  >
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center overflow-hidden"
                      style={{ background: getAvatarColor(msg.userId) }}
                    >
                      {msg.avatar ? (
                        <img src={msg.avatar} alt="" className="w-full h-full rounded-full object-cover" />
                      ) : (
                        <span className="text-[9px] font-bold text-white">{msg.displayName.charAt(0)}</span>
                      )}
                    </div>
                  </button>
                  <div className="bg-[#1c2035] border border-[rgba(255,255,255,0.07)] rounded-[12px_4px_12px_12px] px-2.5 py-1.5 max-w-[75%]">
                    <button
                      onClick={() => handleProfileClickFromMsg(msg)}
                      className="text-[10px] font-bold mb-0.5 text-right w-full"
                      style={{ color: getSenderColor(msg.userId) }}
                    >
                      {msg.displayName}
                    </button>
                    <div className="text-[12px] text-[#9ca3c4] leading-relaxed break-words">{msg.text}</div>
                  </div>
                </div>
              )}
            </div>
          ))}

          <div ref={chatEndRef} />
        </div>
      </section>

      {/* Chat input */}
      <footer className="bg-transparent border-t border-[rgba(108,99,255,0.18)] px-3 py-2.5 pb-5 flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="flex-1 bg-[#1c2035] border border-[rgba(255,255,255,0.07)] rounded-full flex items-center px-3.5 h-[38px] gap-1.5">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && onSendChat()}
              placeholder={!authUser ? 'سجل دخولك للمشاركة في المحادثة' : isRoomMuted ? 'المحادثة مكتومة' : 'اكتب رسالة...'}
              disabled={isRoomMuted || !authUser}
              className="flex-1 bg-transparent border-none outline-none text-[13px] text-[#f0f0f8] placeholder:text-[#5a6080] disabled:opacity-50"
              dir="rtl"
            />
            <button
              onClick={onSendChat}
              disabled={!chatInput.trim() || isRoomMuted || !authUser}
              className="w-[26px] h-[26px] rounded-full bg-[#6c63ff] flex items-center justify-center flex-shrink-0 disabled:opacity-30 transition-opacity"
            >
              <Send className="w-3 h-3 text-white" />
            </button>
          </div>
        </div>
      </footer>
    </>
  );
}
