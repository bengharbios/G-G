'use client';

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { ArrowLeft } from 'lucide-react';
import type { ChatMessage, AuthUser } from '../types';
import { TUI, getSenderColor } from '../types';

/* ═══════════════════════════════════════════════════════════════════════
   ChatPanel — TUILiveKit Barrage Display Widget
   Exact port of barrage_display_widget.dart / Business Chat

   Position: fixed left:16px bottom:84px, 305×224
   Transparent bg, auto-scroll, fadeSlideIn, 20s opacity decay
   ═══════════════════════════════════════════════════════════════════════ */

interface ChatPanelProps {
  messages: ChatMessage[];
  isMuted: boolean;
  onSendChat: (text: string) => void;
  authUser: AuthUser | null;
}

// ─── Constants ────────────────────────────────────────────────────────────────
const FADE_THRESHOLD_MS = 20_000;   // Messages older than 20s fade to opacity 0.4
const FADE_START_MS = 15_000;       // Start fading at 15s
const MAX_BUFFER = 32;              // Max messages kept in memory
const ANIM_DURATION = '400ms';

// ─── Keyframes (injected once via <style>) ────────────────────────────────────
const KEYFRAMES = `
@keyframes fadeSlideIn {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
`;

// ─── Component ────────────────────────────────────────────────────────────────
export default function ChatPanel({ messages, isMuted, onSendChat, authUser }: ChatPanelProps) {
  const [inputText, setInputText] = useState('');
  const [showInput, setShowInput] = useState(false);
  // tick triggers re-render every second for opacity decay
  const [, setTick] = useState(0);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // ── Inject keyframes once ──
  useEffect(() => {
    const id = 'chatpanel-keyframes';
    if (document.getElementById(id)) return;
    const style = document.createElement('style');
    style.id = id;
    style.textContent = KEYFRAMES;
    document.head.appendChild(style);
    return () => { document.getElementById(id)?.remove(); };
  }, []);

  // ── Auto-scroll to bottom on new message ──
  useEffect(() => {
    requestAnimationFrame(() => {
      endRef.current?.scrollIntoView({ behavior: 'smooth' });
    });
  }, [messages.length]);

  // ── Tick every second for live opacity updates ──
  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  // ── Keep only recent messages for performance ──
  const visibleMessages = useMemo(() => {
    if (messages.length <= MAX_BUFFER) return messages;
    return messages.slice(-MAX_BUFFER);
  }, [messages]);

  // ── Opacity based on message age ──
  const getMessageOpacity = useCallback((time: string): number => {
    if (!time) return 1;
    const age = Date.now() - new Date(time).getTime();
    if (age > FADE_THRESHOLD_MS) return 0.4;
    if (age > FADE_START_MS) {
      const progress = (age - FADE_START_MS) / (FADE_THRESHOLD_MS - FADE_START_MS);
      return 1 - progress * 0.6; // 1.0 → 0.4
    }
    return 1;
  }, []);

  // ── Send handler ──
  const handleSend = useCallback(() => {
    const trimmed = inputText.trim();
    if (!trimmed || isMuted || !authUser) return;
    onSendChat(trimmed);
    setInputText('');
    inputRef.current?.blur();
  }, [inputText, isMuted, authUser, onSendChat]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend],
  );

  return (
    <div
      className="fixed z-30 flex flex-col pointer-events-none"
      style={{
        left: TUI.dim.barrageLeft,
        bottom: TUI.dim.barrageBottom,
        width: TUI.dim.barrageWidth,
        height: TUI.dim.barrageHeight,
      }}
    >
      {/* ── Message List (transparent bg, bottom-aligned, fade mask at top) ── */}
      <div
        className="flex-1 flex flex-col justify-end overflow-hidden"
        style={{
          maskImage: 'linear-gradient(to top, black 55%, transparent 100%)',
          WebkitMaskImage: 'linear-gradient(to top, black 55%, transparent 100%)',
        }}
      >
        {visibleMessages.map((msg) => {
          const opacity = getMessageOpacity(msg.time);

          return (
            <div
              key={msg.id}
              className="flex-shrink-0"
              style={{
                opacity,
                transition: 'opacity 1s ease',
                animation: `${ANIM_DURATION} cubic-bezier(.4,0,.2,1) fadeSlideIn`,
                marginBottom: 4,
              }}
            >
              {msg.isSystem ? (
                /* ── System Message: full-width centered ── */
                <div
                  className="w-full text-center py-0.5 px-2"
                  style={{
                    fontSize: 12,
                    color: TUI.colors.G5,
                    lineHeight: '18px',
                  }}
                >
                  {msg.text}
                </div>
              ) : (
                /* ── Normal / Gift Message bubble ── */
                <div
                  className="w-full"
                  style={{
                    padding: '6px 10px',
                    maxWidth: '100%',
                    background: TUI.colors.black4D,
                    borderRadius: TUI.radius.sm,
                    display: 'inline-flex',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    lineHeight: '18px',
                    fontSize: 12,
                  }}
                >
                  {/* Username (colored + bold) */}
                  <span
                    style={{
                      fontWeight: 700,
                      color: getSenderColor(msg.userId),
                      whiteSpace: 'nowrap',
                      flexShrink: 0,
                    }}
                  >
                    {msg.displayName}
                    <span
                      style={{
                        color: 'rgba(255,255,255,0.5)',
                        fontWeight: 400,
                        margin: '0 4px',
                      }}
                    >
                      :
                    </span>
                  </span>

                  {/* Gift emoji prefix */}
                  {msg.isGift && msg.giftEmoji && (
                    <span style={{ flexShrink: 0 }}>{msg.giftEmoji}</span>
                  )}

                  {/* Message body */}
                  <span
                    style={{
                      color: TUI.colors.white,
                      wordBreak: 'break-word',
                    }}
                  >
                    {msg.text}
                  </span>
                </div>
              )}
            </div>
          );
        })}

        {/* Scroll anchor */}
        <div ref={endRef} className="h-px w-full flex-shrink-0" />
      </div>

      {/* ── Chat Input Bar (appears on focus) ── */}
      {showInput && (
        <div
          className="pointer-events-auto mt-1"
          style={{
            width: TUI.dim.barrageWidth,
            height: TUI.dim.barrageInputH,
          }}
        >
          <div
            className="flex items-center h-full overflow-hidden"
            style={{
              background: TUI.colors.bgInput,
              borderRadius: TUI.radius.md,
            }}
          >
            {/* Send button (right in LTR visual = left in RTL) */}
            <button
              onClick={handleSend}
              disabled={!inputText.trim() || isMuted}
              className="flex items-center justify-center flex-shrink-0 h-full transition-opacity duration-150"
              style={{
                width: 36,
                opacity: inputText.trim() && !isMuted ? 1 : 0.4,
                color: TUI.colors.white,
              }}
              aria-label="إرسال"
            >
              <ArrowLeft size={16} />
            </button>

            {/* Text input */}
            <input
              ref={inputRef}
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => setShowInput(true)}
              onBlur={() => {
                setTimeout(() => {
                  if (!inputText.trim()) setShowInput(false);
                }, 200);
              }}
              placeholder={
                isMuted
                  ? 'الغرفة مكتومة'
                  : !authUser
                    ? 'سجل دخولك للمشاركة'
                    : 'قل شيئاً...'
              }
              disabled={isMuted || !authUser}
              maxLength={200}
              dir="rtl"
              className="flex-1 h-full bg-transparent outline-none"
              style={{
                fontSize: 13,
                color: TUI.colors.white,
                caretColor: TUI.colors.B1,
                paddingLeft: 8,
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
