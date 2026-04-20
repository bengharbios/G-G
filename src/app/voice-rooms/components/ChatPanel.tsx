'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Send, MicOff, Gift, Crown } from 'lucide-react';
import type { ChatMessage, AuthUser } from '../types';
import { getAvatarColor, getSenderColor } from '../types';

/* ═══════════════════════════════════════════════════════════════════════
   ChatPanel — TUILiveKit Business Player Chat Panel Design
   RTL Arabic interface with smart auto-scroll, entrance animations,
   host badges, gift styling, and accessible input area.
   ═══════════════════════════════════════════════════════════════════════ */

interface ChatPanelProps {
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
  isRoomMuted: boolean;
  authUser: AuthUser | null;
  isOnSeat: boolean;
  hostId?: string;
}

// ─── Animation Variants ────────────────────────────────────────────────────

const messageVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -4 },
};

const giftVariants = {
  hidden: { opacity: 0, scale: 0.8, y: 10 },
  visible: { opacity: 1, scale: 1, y: 0 },
  exit: { opacity: 0, scale: 0.9 },
};

// ─── Component ─────────────────────────────────────────────────────────────

export default function ChatPanel({
  messages,
  onSendMessage,
  isRoomMuted,
  authUser,
  isOnSeat,
  hostId,
}: ChatPanelProps) {
  const [input, setInput] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomSentinelRef = useRef<HTMLDivElement>(null);
  const isAtBottomRef = useRef(true);
  const shouldScrollRef = useRef(false);

  /* ── Smart auto-scroll via IntersectionObserver ── */
  useEffect(() => {
    const sentinel = bottomSentinelRef.current;
    const scrollContainer = scrollRef.current;
    if (!sentinel || !scrollContainer) return;

    const observer = new IntersectionObserver(
      (entries) => {
        // Update our ref tracking whether the sentinel (bottom) is visible
        const entry = entries[0];
        isAtBottomRef.current = entry.isIntersecting;
      },
      { root: scrollContainer, threshold: 0.1 },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);

  /* ── Auto-scroll on new messages (only if user is at bottom) ── */
  useEffect(() => {
    if (messages.length === 0) return;
    shouldScrollRef.current = isAtBottomRef.current;
  }, [messages.length]);

  useEffect(() => {
    if (shouldScrollRef.current) {
      // Use requestAnimationFrame for smooth scroll after render
      requestAnimationFrame(() => {
        bottomSentinelRef.current?.scrollIntoView({ behavior: 'smooth' });
      });
    }
  }, [messages]);

  /* ── Scroll to bottom on initial mount ── */
  useEffect(() => {
    requestAnimationFrame(() => {
      bottomSentinelRef.current?.scrollIntoView({ behavior: 'instant' as ScrollBehavior });
    });
  }, []);

  /* ── Send handler ── */
  const handleSend = useCallback(() => {
    const trimmed = input.trim();
    if (!trimmed) return;
    onSendMessage(trimmed);
    setInput('');
  }, [input, onSendMessage]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend],
  );

  /* ── Determine disabled state ── */
  const isDisabled = !authUser || isRoomMuted || !isOnSeat;
  const canSend = !isDisabled && input.trim().length > 0;

  /* ── Placeholder logic ── */
  const placeholder = !authUser
    ? 'سجل دخولك للمشاركة في المحادثة'
    : isRoomMuted
      ? 'الغرفة مكتومة'
      : !isOnSeat
        ? 'اجلس على المايك للمشاركة'
        : 'اكتب رسالة...';

  /* ── Render helpers ── */
  const isSelf = (msg: ChatMessage) => !!authUser && msg.userId === authUser.id;
  const isHost = (msg: ChatMessage) => !!hostId && msg.userId === hostId;

  const formatMessageTime = (time: string): string => {
    if (!time) return '';
    try {
      const d = new Date(time);
      return d.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  return (
    <>
      {/* ═══ MESSAGE LIST ═══ */}
      <section
        ref={scrollRef}
        className="tuilivekit-scroll flex-1 overflow-y-auto"
        style={{
          backgroundColor: '#1F2024',
          padding: '12px 12px 16px',
          minHeight: 0,
          userSelect: 'text',
        }}
      >
        <div className="flex flex-col" style={{ gap: '4px' }}>
          {/* Empty state */}
          {messages.length === 0 && (
            <div className="flex items-center justify-center py-8">
              <span className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>
                ابدأ المحادثة...
              </span>
            </div>
          )}

          <AnimatePresence mode="popLayout" initial={false}>
            {messages.map((msg) => {
              /* ── System message ── */
              if (msg.isSystem) {
                return (
                  <motion.div
                    key={msg.id}
                    variants={messageVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    transition={{ duration: 0.3, ease: 'easeOut' }}
                    className="flex justify-center"
                  >
                    <span
                      className="text-center px-3 py-0.5 rounded-full"
                      style={{
                        fontSize: '11px',
                        color: 'rgba(255,255,255,0.35)',
                        background: 'rgba(255,255,255,0.04)',
                      }}
                    >
                      {msg.text}
                    </span>
                  </motion.div>
                );
              }

              /* ── Gift message ── */
              if (msg.isGift) {
                return (
                  <motion.div
                    key={msg.id}
                    variants={giftVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    transition={{ duration: 0.4, ease: [0.175, 0.885, 0.32, 1.275] }}
                    className="flex justify-center"
                  >
                    <div
                      className="flex items-center gap-1.5 rounded-full px-3 py-1"
                      style={{
                        background: 'rgba(245,158,11,0.1)',
                        border: '1px solid rgba(245,158,11,0.2)',
                      }}
                    >
                      {msg.giftEmoji && (
                        <span className="text-base leading-none">{msg.giftEmoji}</span>
                      )}
                      <span className="text-xs font-medium" style={{ color: '#f59e0b' }}>
                        {msg.text}
                      </span>
                    </div>
                  </motion.div>
                );
              }

              /* ── Regular chat message ── */
              const self = isSelf(msg);
              const host = isHost(msg);
              const senderColor = getSenderColor(msg.userId);
              const avatarBg = getAvatarColor(msg.userId);
              const timeStr = formatMessageTime(msg.time);

              return (
                <motion.div
                  key={msg.id}
                  variants={messageVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  transition={{ duration: 0.3, ease: 'easeOut' }}
                  className="flex items-start gap-2"
                  style={{
                    borderRadius: '10px',
                    padding: self ? '6px 8px' : '4px 8px',
                    background: self ? 'rgba(108,99,255,0.15)' : 'transparent',
                    maxWidth: '100%',
                  }}
                >
                  {/* Avatar — right side in RTL (first in DOM) */}
                  <div
                    className="flex-shrink-0 mt-0.5"
                    style={{ width: '28px', height: '28px' }}
                  >
                    <div
                      className="w-full h-full rounded-full flex items-center justify-center overflow-hidden"
                      style={{ background: avatarBg }}
                    >
                      {msg.avatar ? (
                        <img
                          src={msg.avatar}
                          alt={msg.displayName}
                          className="w-full h-full rounded-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <span
                          className="font-bold text-white leading-none"
                          style={{ fontSize: '11px' }}
                        >
                          {msg.displayName.charAt(0)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Message content */}
                  <div className="flex-1 min-w-0">
                    {/* Name row + optional host badge */}
                    <div className="flex items-center gap-1.5" style={{ marginBottom: '2px' }}>
                      <span
                        className="font-bold leading-tight truncate"
                        style={{ fontSize: '12px', color: senderColor }}
                      >
                        {msg.displayName}
                      </span>
                      {host && (
                        <span
                          className="inline-flex items-center gap-0.5 flex-shrink-0"
                          style={{
                            fontSize: '9px',
                            fontWeight: 600,
                            color: '#f59e0b',
                            background: 'rgba(245,158,11,0.12)',
                            padding: '1px 5px',
                            borderRadius: '4px',
                            lineHeight: '14px',
                          }}
                        >
                          <Crown className="w-2.5 h-2.5" style={{ marginRight: '1px' }} />
                          المالك
                        </span>
                      )}
                      {timeStr && (
                        <span
                          className="flex-shrink-0"
                          style={{ fontSize: '10px', color: 'rgba(255,255,255,0.25)' }}
                        >
                          {timeStr}
                        </span>
                      )}
                    </div>

                    {/* Text bubble */}
                    <p
                      className="break-words leading-relaxed"
                      style={{
                        fontSize: '13px',
                        color: 'rgba(255,255,255,0.85)',
                        margin: 0,
                      }}
                    >
                      {msg.text}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {/* Bottom sentinel for IntersectionObserver */}
          <div ref={bottomSentinelRef} className="h-px w-full flex-shrink-0" />
        </div>
      </section>

      {/* ═══ INPUT AREA ═══ */}
      <footer
        className="flex-shrink-0"
        style={{
          padding: '8px 12px',
          paddingBottom: '16px',
          borderTop: '1px solid rgba(255,255,255,0.08)',
          background: '#1F2024',
        }}
      >
        <div
          className="flex items-center gap-2"
          style={{ minHeight: '40px' }}
        >
          {/* Input wrapper */}
          <div
            className="flex-1 flex items-center gap-2 transition-shadow duration-200"
            style={{
              height: '32px',
              minHeight: '32px',
              background: 'rgba(255,255,255,0.06)',
              borderRadius: '16px',
              padding: '0 4px 0 12px',
              border: '1px solid rgba(255,255,255,0.08)',
              boxShadow: isFocused
                ? '0 0 0 2px rgba(108,99,255,0.3), 0 0 12px rgba(108,99,255,0.08)'
                : 'none',
            }}
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder={placeholder}
              disabled={isDisabled}
              dir="rtl"
              className="flex-1 bg-transparent border-none outline-none text-white placeholder:text-[rgba(255,255,255,0.3)] disabled:opacity-40 disabled:cursor-not-allowed"
              style={{
                fontSize: '13px',
                height: '100%',
                lineHeight: '32px',
              }}
            />
          </div>

          {/* Send / Muted indicator button */}
          {isRoomMuted ? (
            <div
              className="flex items-center justify-center flex-shrink-0"
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: 'rgba(239,68,68,0.12)',
              }}
            >
              <MicOff className="w-4 h-4" style={{ color: '#ef4444' }} />
            </div>
          ) : (
            <button
              onClick={handleSend}
              disabled={!canSend}
              className="flex items-center justify-center flex-shrink-0 transition-all duration-200 active:scale-90 disabled:opacity-25 disabled:cursor-not-allowed"
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: canSend ? '#6c63ff' : 'rgba(255,255,255,0.08)',
                boxShadow: canSend ? '0 2px 8px rgba(108,99,255,0.35)' : 'none',
              }}
              aria-label="إرسال"
            >
              <Send className="w-4 h-4 text-white" style={{ transform: 'rotate(180deg)' }} />
            </button>
          )}
        </div>
      </footer>

      {/* ═══ TUILiveKit Scrollbar Styles ═══ */}
      <style>{`
        /* TUILiveKit @mixin scrollbar exact */
        .tuilivekit-scroll {
          scrollbar-width: thin;
          scrollbar-color: #58585A transparent;
        }
        .tuilivekit-scroll::-webkit-scrollbar {
          width: 6px;
          background: transparent;
        }
        .tuilivekit-scroll::-webkit-scrollbar-track {
          background: transparent;
        }
        .tuilivekit-scroll::-webkit-scrollbar-thumb {
          background: #58585A;
          border-radius: 3px;
          border: 2px solid transparent;
          background-clip: padding-box;
        }
        .tuilivekit-scroll::-webkit-scrollbar-thumb:hover {
          background: #58585A;
        }
      `}</style>
    </>
  );
}
