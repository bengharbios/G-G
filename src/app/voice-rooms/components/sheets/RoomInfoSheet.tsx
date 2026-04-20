'use client';

import {
  Users,
  Mic,
  Globe,
  Key,
  EyeOff,
  Shield,
  Copy,
  Check,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { useState, useCallback } from 'react';
import BottomSheetOverlay from '../shared/BottomSheetOverlay';
import { TUI, ROLE_LABELS, type VoiceRoom, type RoomMode } from '../../types';
import { useToast } from '@/hooks/use-toast';

interface RoomInfoSheetProps {
  isOpen: boolean;
  onClose: () => void;
  room: VoiceRoom;
  participantCount: number;
}

export default function RoomInfoSheet({
  isOpen,
  onClose,
  room,
  participantCount,
}: RoomInfoSheetProps) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const handleCopyLink = useCallback(async () => {
    try {
      const url = `${window.location.origin}/voice-rooms?room=${room.id}`;
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast({ title: 'تم نسخ الرابط' });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ title: 'فشل في نسخ الرابط', variant: 'destructive' });
    }
  }, [room.id, toast]);

  const modeIcon: Record<RoomMode, React.ReactNode> = {
    public: <Globe size={14} />,
    key: <Key size={14} />,
    private: <EyeOff size={14} />,
  };

  const modeLabel: Record<RoomMode, string> = {
    public: 'عام',
    key: 'بكلمة سر',
    private: 'خاص',
  };

  return (
    <BottomSheetOverlay
      isOpen={isOpen}
      onClose={onClose}
      height="auto"
      title="معلومات الغرفة"
      showClose
    >
      {/* ── Room Name ── */}
      <p
        className="mb-2"
        style={{
          fontSize: TUI.font.title20.size,
          fontWeight: TUI.font.title20.weight as unknown as number,
          color: TUI.font.title20.color,
          lineHeight: 1.4,
        }}
      >
        {room.name}
      </p>

      {/* ── Room ID ── */}
      <p
        className="mb-3"
        style={{
          fontSize: TUI.font.captionG5.size,
          color: TUI.colors.G5,
          direction: 'ltr',
          textAlign: 'right',
        }}
      >
        ID: {room.id}
      </p>

      {/* ── Description ── */}
      {room.description && (
        <p
          className="mb-4"
          style={{
            fontSize: TUI.font.body14.size,
            color: TUI.colors.G7,
            lineHeight: 1.6,
          }}
        >
          {room.description}
        </p>
      )}

      {/* ── Stats Row ── */}
      <div
        className="flex items-center gap-4 mb-4 p-3 rounded-lg"
        style={{
          backgroundColor: TUI.colors.blue30,
        }}
      >
        {/* Participant Count */}
        <div className="flex items-center gap-2">
          <Users size={16} color={TUI.colors.G6} />
          <div>
            <span
              style={{
                fontSize: TUI.font.title16.size,
                fontWeight: 600,
                color: TUI.colors.white,
              }}
            >
              {participantCount}
            </span>
            <span
              className="mr-1"
              style={{
                fontSize: TUI.font.captionG6.size,
                color: TUI.colors.G6,
              }}
            >
              / {room.maxParticipants}
            </span>
          </div>
        </div>

        {/* Seat Count */}
        <div className="flex items-center gap-2">
          <Mic size={16} color={TUI.colors.G6} />
          <span
            style={{
              fontSize: TUI.font.captionG6.size,
              color: TUI.colors.G6,
            }}
          >
            {room.micSeatCount} مقاعد
          </span>
        </div>

        {/* Room Mode */}
        <div className="flex items-center gap-2">
          {modeIcon[room.roomMode]}
          <span
            style={{
              fontSize: TUI.font.captionG6.size,
              color: TUI.colors.G6,
            }}
          >
            {modeLabel[room.roomMode]}
          </span>
        </div>
      </div>

      {/* ── Room Settings / Rules List ── */}
      <div className="mb-4">
        <p
          className="mb-2"
          style={{
            fontSize: TUI.font.body14.size,
            fontWeight: 500,
            color: TUI.colors.G7,
          }}
        >
          إعدادات الغرفة
        </p>

        <div className="flex flex-col gap-0">
          {/* Room Mode */}
          <div
            className="flex items-center justify-between py-2.5"
            style={{ borderBottom: `1px solid ${TUI.colors.G3Divider}` }}
          >
            <span style={{ fontSize: TUI.font.captionG6.size, color: TUI.colors.G6 }}>
              نوع الغرفة
            </span>
            <div className="flex items-center gap-1.5">
              {modeIcon[room.roomMode]}
              <span style={{ fontSize: TUI.font.captionG6.size, color: TUI.colors.G7 }}>
                {modeLabel[room.roomMode]}
              </span>
            </div>
          </div>

          {/* Chat Muted */}
          <div
            className="flex items-center justify-between py-2.5"
            style={{ borderBottom: `1px solid ${TUI.colors.G3Divider}` }}
          >
            <span style={{ fontSize: TUI.font.captionG6.size, color: TUI.colors.G6 }}>
              المحادثة
            </span>
            <div className="flex items-center gap-1.5">
              {room.chatMuted ? (
                <VolumeX size={14} color={TUI.colors.red} />
              ) : (
                <Volume2 size={14} color={TUI.colors.green} />
              )}
              <span
                style={{
                  fontSize: TUI.font.captionG6.size,
                  color: room.chatMuted ? TUI.colors.red : TUI.colors.green,
                }}
              >
                {room.chatMuted ? 'مكتومة' : 'مفتوحة'}
              </span>
            </div>
          </div>

          {/* Auto Mode */}
          <div
            className="flex items-center justify-between py-2.5"
            style={{ borderBottom: `1px solid ${TUI.colors.G3Divider}` }}
          >
            <span style={{ fontSize: TUI.font.captionG6.size, color: TUI.colors.G6 }}>
              وضع المقاعد
            </span>
            <span style={{ fontSize: TUI.font.captionG6.size, color: TUI.colors.G7 }}>
              {room.isAutoMode ? 'جلوس حر' : 'يحتاج موافقة'}
            </span>
          </div>

          {/* Host */}
          <div className="flex items-center justify-between py-2.5">
            <span style={{ fontSize: TUI.font.captionG6.size, color: TUI.colors.G6 }}>
              المالك
            </span>
            <div className="flex items-center gap-1.5">
              <Shield size={14} color={TUI.colors.G6} />
              <span style={{ fontSize: TUI.font.captionG6.size, color: TUI.colors.G7 }}>
                {room.hostName || '—'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Copy Link Button ── */}
      <button
        onClick={handleCopyLink}
        className="w-full flex items-center justify-center gap-2 transition-all"
        style={{
          height: 40,
          backgroundColor: TUI.colors.B1,
          color: TUI.colors.white,
          borderRadius: TUI.radius.pill,
          fontSize: '14px',
          fontWeight: 500,
          border: 'none',
          cursor: 'pointer',
        }}
      >
        {copied ? (
          <>
            <Check size={16} />
            تم النسخ
          </>
        ) : (
          <>
            <Copy size={16} />
            نسخ الرابط
          </>
        )}
      </button>
    </BottomSheetOverlay>
  );
}
