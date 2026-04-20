'use client';

import { useState, useRef, useCallback } from 'react';
import { X, Settings, Link2, Eye } from 'lucide-react';
import InjectStyles from './shared/InjectStyles';
import MicSeatGrid from './MicSeatGrid';
import GiftAnimations from './GiftAnimations';
import LikeAnimation, { type LikeAnimationRef } from './LikeAnimation';
import ChatPanel from './ChatPanel';
import AudienceRow from './AudienceRow';
import BottomBar from './BottomBar';
import MicMenuSheet from './sheets/MicMenuSheet';
import ProfileSheet from './sheets/ProfileSheet';
import GiftSheet from './sheets/GiftSheet';
import SettingsSheet from './sheets/SettingsSheet';
import RoomInfoSheet from './RoomInfoSheet';
import MembershipDialog from './dialogs/MembershipDialog';
import MicInviteDialog from './dialogs/MicInviteDialog';
import KickDurationDialog from './dialogs/KickDurationDialog';
import { useVoiceRoom } from '../hooks/useVoiceRoom';
import { canDo } from '../types';
import type { AuthUser, VoiceRoom } from '../types';

/* ═══════════════════════════════════════════════════════════════════════
   RoomInteriorView — TUILiveKit LivePlayerPC Layout

   .live-player-pc:
     display: flex, flex-direction: row, gap: 6px, border-radius: 8px
     overflow: hidden, @include scrollbar (6px width, transparent bg, gray3 thumb)

   .main-left:
     flex: 1, display: flex, flex-direction: column, overflow: hidden
     background-color: #1F2024
     └ .main-left-top (56px header, stroke separator)
     └ .main-left-center (mic grid, bg black, overflow hidden)
     └ .main-left-bottom (bottom toolbar, border-top stroke)

   .main-right:
     height: 100%, width: 20%, min-width: 160px, max-width: 360px
     display: flex, flex-direction: column, gap: 6px
     └ .main-right-top (audience, 30% height)
     └ .main-right-bottom (chat, flex 1)

   Responsive: @media (max-width: 1000px) adjusted margins/padding
   ═══════════════════════════════════════════════════════════════════════ */

export default function RoomInteriorView({
  room: initialRoom,
  onExit,
  authUser,
  onRoomUpdate,
}: {
  room: VoiceRoom;
  onExit: (alreadyCalledLeave?: boolean) => void;
  authUser: AuthUser | null;
  onRoomUpdate: (updatedRoom: VoiceRoom) => void;
}) {
  const [infoSheetOpen, setInfoSheetOpen] = useState(false);
  const likeRef = useRef<LikeAnimationRef>(null);

  const vr = useVoiceRoom(initialRoom, authUser, onRoomUpdate);

  const handleLike = useCallback(() => {
    likeRef.current?.play(1);
  }, []);

  const handleLeaveRoom = async () => {
    await vr.handleLeaveRoom();
    onExit(true);
  };

  const audienceCount = vr.participants.filter((p) => p.seatIndex < 0).length;

  /* ── Loading spinner ── */
  if (vr.loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: '#0a0e1a' }}
        dir="rtl"
      >
        <div className="w-10 h-10 border-[3px] border-[#6c63ff] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <>
      <InjectStyles />

      {/* ═══ TUILiveKit Scrollbar + Responsive Breakpoint Styles ═══ */}
      <style>{`
        .tui-live-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: transparent transparent;
        }
        .tui-live-scrollbar::-webkit-scrollbar {
          width: 6px;
          background: transparent;
        }
        .tui-live-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .tui-live-scrollbar::-webkit-scrollbar-thumb {
          background: #58585A;
          border-radius: 3px;
          border: 2px solid transparent;
          background-clip: padding-box;
        }
        .tui-live-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #6a6a6c;
        }

        @media (max-width: 1000px) {
          .main-left {
            margin-left: 8px;
          }
          .main-left-top {
            height: 48px !important;
            padding-left: 8px !important;
          }
          .main-right {
            margin-right: 8px;
          }
          .main-right-top,
          .main-right-bottom {
            padding: 8px !important;
          }
          .card-title {
            padding-top: 8px !important;
            padding-bottom: 8px !important;
          }
        }
      `}</style>

      <div
        className="h-screen relative overflow-hidden voice-room-root"
        dir="rtl"
        style={{ backgroundColor: '#0a0e1a' }}
      >
        {/* ── Room background image (behind everything) ── */}
        {vr.room.roomImage && (
          <div className="absolute inset-0 z-0">
            <img
              src={vr.room.roomImage}
              alt=""
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-[#0a0e1a]/80" />
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════
           .live-player-pc
           display: flex, flex-direction: row, gap: 6px, border-radius: 8px
           overflow: hidden
           ══════════════════════════════════════════════════════════════ */}
        <div
          className="tui-live-scrollbar relative z-10 flex flex-row"
          style={{
            gap: '6px',
            borderRadius: '8px',
            overflow: 'hidden',
            height: '100%',
            padding: '6px',
          }}
        >
          {/* ══════════════════════════════════════════════════════════════
             .main-left
             flex: 1, display: flex, flex-direction: column, overflow: hidden
             background-color: #1F2024 (--bg-color-operate)
             ══════════════════════════════════════════════════════════════ */}
          <div
            className="main-left"
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              backgroundColor: '#1F2024',
              borderRadius: '8px',
            }}
          >
            {/* ── .main-left-top: Header bar (56px) ──
                display: flex, height: 56px, gap: 10px, padding-left: 16px
                align-items: center, position: relative
                ::after stroke separator (bottom 0, left 16px, right 16px) */}
            <div
              className="main-left-top"
              style={{
                display: 'flex',
                height: '56px',
                gap: '10px',
                paddingLeft: '16px',
                alignItems: 'center',
                position: 'relative',
                flexShrink: 0,
              }}
            >
              {/* Exit button (RTL visual right) */}
              <button
                onClick={handleLeaveRoom}
                className="w-9 h-9 rounded-xl flex items-center justify-center transition-colors active:scale-95 flex-shrink-0"
                style={{
                  backgroundColor: 'rgba(239,68,68,0.1)',
                  border: '1px solid rgba(239,68,68,0.25)',
                }}
                aria-label="خروج"
              >
                <X className="w-4 h-4 text-[#ef4444]" />
              </button>

              {/* LIVE badge + Room name (center, text-size-16 / text-primary) */}
              <div className="flex items-center gap-2 min-w-0 flex-1 justify-center">
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <div
                    className="w-[7px] h-[7px] rounded-full animate-live-pulse flex-shrink-0"
                    style={{ backgroundColor: '#059669' }}
                  />
                  <span
                    className="text-[10px] font-bold tracking-wider"
                    style={{ color: '#059669' }}
                  >
                    LIVE
                  </span>
                </div>
                <button
                  onClick={() => setInfoSheetOpen(true)}
                  className="active:scale-[0.97] transition-transform min-w-0"
                >
                  <span
                    className="text-sm font-bold truncate block max-w-[180px]"
                    style={{ color: 'rgba(255,255,255,0.90)' }}
                  >
                    {vr.room.name}
                  </span>
                </button>
              </div>

              {/* Settings + Share + Listener count (RTL visual left) */}
              <div className="flex items-center gap-2 flex-shrink-0">
                {canDo(vr.myRole, 'admin') && (
                  <button
                    onClick={() => vr.setSettingsOpen(true)}
                    className="w-9 h-9 rounded-xl flex items-center justify-center transition-colors active:scale-95"
                    style={{
                      backgroundColor: 'rgba(255,255,255,0.06)',
                      border: '1px solid rgba(255,255,255,0.08)',
                    }}
                    aria-label="إعدادات"
                  >
                    <Settings
                      className="w-4 h-4"
                      style={{ color: 'rgba(255,255,255,0.60)' }}
                    />
                  </button>
                )}
                <button
                  onClick={vr.handleCopyLink}
                  className="w-9 h-9 rounded-xl flex items-center justify-center transition-colors active:scale-95"
                  style={{
                    backgroundColor: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.08)',
                  }}
                  aria-label="مشاركة"
                >
                  <Link2
                    className="w-4 h-4"
                    style={{ color: 'rgba(255,255,255,0.60)' }}
                  />
                </button>
                <div
                  className="flex items-center gap-1 rounded-full px-2 py-1"
                  style={{ backgroundColor: 'rgba(108,99,255,0.12)' }}
                >
                  <Eye className="w-3 h-3" style={{ color: '#a78bfa' }} />
                  <span
                    className="text-[11px] font-bold tabular-nums"
                    style={{ color: '#a78bfa' }}
                  >
                    {vr.listenerCount}
                  </span>
                </div>
              </div>

              {/* ::after stroke separator — height: 1px, bg rgba(255,255,255,0.08),
                  position: absolute, bottom: 0, left: 16px, right: 16px */}
              <div
                style={{
                  position: 'absolute',
                  bottom: 0,
                  left: '16px',
                  right: '16px',
                  height: '1px',
                  backgroundColor: 'rgba(255,255,255,0.08)',
                }}
              />
            </div>

            {/* ── .main-left-center: Mic Seat Grid ──
                position: relative, flex: 1, min-width: 0, min-height: 0
                background: #000, overflow: hidden */}
            <div
              style={{
                position: 'relative',
                flex: 1,
                minWidth: 0,
                minHeight: 0,
                background: '#000',
                overflow: 'hidden',
              }}
            >
              <MicSeatGrid
                seats={vr.seats}
                currentUserId={vr.currentUserId}
                onSeatClick={vr.handleSeatClick}
              />
            </div>

            {/* ── .main-left-bottom: Bottom Toolbar ──
                padding: 6px 0, border-top: 1px solid rgba(255,255,255,0.08)
                background-color: #1F2024, display: flex */}
            <div
              style={{
                padding: '6px 0',
                borderTop: '1px solid rgba(255,255,255,0.08)',
                backgroundColor: '#1F2024',
                display: 'flex',
              }}
            >
              <BottomBar
                myRole={vr.myRole}
                isOnSeat={!!vr.isOnSeat}
                isMicMuted={vr.isMicMuted}
                isRoomMuted={vr.isRoomMuted}
                onToggleMic={vr.handleToggleMic}
                onToggleRoomMute={vr.handleToggleRoomMute}
                onGiftOpen={() => vr.setGiftSheetOpen(true)}
                onLike={handleLike}
              />
            </div>
          </div>

          {/* ══════════════════════════════════════════════════════════════
             .main-right
             height: 100%, width: 20%, min-width: 160px, max-width: 360px
             display: flex, flex-direction: column, gap: 6px
             ══════════════════════════════════════════════════════════════ */}
          <div
            className="main-right"
            style={{
              height: '100%',
              width: '20%',
              minWidth: '160px',
              maxWidth: '360px',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
            }}
          >
            {/* ── .main-right-top: Audience Section (30% height) ──
                background-color: #1F2024, height: 30%, padding: 16px
                .main-right-top-title: display flex, align-items center, height 40px
                .title-text: text-size-16 (16px/600), color text-primary
                .title-count: font-weight 400, color text-secondary */}
            <div
              className="main-right-top"
              style={{
                backgroundColor: '#1F2024',
                height: '30%',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                borderRadius: '8px',
                overflow: 'hidden',
              }}
            >
              <div
                className="main-right-top-title"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  height: '40px',
                  flexShrink: 0,
                }}
              >
                <span
                  className="title-text"
                  style={{
                    fontSize: '16px',
                    fontWeight: 600,
                    color: 'rgba(255,255,255,0.90)',
                  }}
                >
                  الأعضاء
                </span>
                <span
                  className="title-count"
                  style={{
                    fontWeight: 400,
                    color: 'rgba(255,255,255,0.45)',
                    marginInlineStart: '8px',
                  }}
                >
                  ({audienceCount})
                </span>
              </div>

              <div style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
                <AudienceRow
                  participants={vr.participants}
                  weeklyGems={vr.weeklyGems}
                  onProfileClick={(p) => vr.setProfileSheet(p)}
                />
              </div>
            </div>

            {/* ── .main-right-bottom: Chat Section ──
                flex: 1, background-color: #1F2024, overflow: hidden
                display: flex, flex-direction: column, padding: 16px
                .card-title: text-size-16 (16px/600), padding-bottom 16px
                  border-bottom 1px solid stroke-primary
                .message-list-container: flex 1 1 auto, user-select text */}
            <div
              className="main-right-bottom"
              style={{
                flex: 1,
                backgroundColor: '#1F2024',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                borderRadius: '8px',
              }}
            >
              {/* .card-title — 16px/600, dividing line */}
              <div
                className="card-title"
                style={{
                  fontSize: '16px',
                  fontWeight: 600,
                  padding: '16px 16px',
                  borderBottom: '1px solid rgba(255,255,255,0.08)',
                  color: 'rgba(255,255,255,0.90)',
                  flexShrink: 0,
                }}
              >
                المحادثة
              </div>

              {/* .message-list-container — flex 1 1 auto, user-select text */}
              <div
                className="message-list-container"
                style={{
                  flex: '1 1 auto',
                  userSelect: 'text',
                  minHeight: 0,
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <ChatPanel
                  messages={vr.chatMessages}
                  onSendMessage={vr.handleSendChat}
                  isRoomMuted={vr.isRoomMuted}
                  authUser={authUser}
                  isOnSeat={!!vr.isOnSeat}
                  hostId={vr.room.hostId}
                />
              </div>
            </div>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════════
           OVERLAYS — Rendered conditionally, fixed position
           ══════════════════════════════════════════════════════════════ */}

        {/* Gift animation overlay (canvas-based particles) */}
        <GiftAnimations animation={vr.activeGiftAnimation} />

        {/* Like animation overlay (floating hearts, ref-driven) */}
        <LikeAnimation ref={likeRef} />

        {/* ── Mic Menu Sheet ── */}
        <MicMenuSheet
          isOpen={vr.micMenuSheet.isOpen}
          onClose={() =>
            vr.setMicMenuSheet((prev) => ({ ...prev, isOpen: false }))
          }
          seatIndex={vr.micMenuSheet.seatIndex}
          participant={vr.micMenuSheet.participant}
          isSeatLocked={(vr.room.lockedSeats || []).includes(
            vr.micMenuSheet.seatIndex,
          )}
          onAction={vr.handleMicMenuAction}
          currentUserId={vr.currentUserId}
          myRole={vr.myRole}
          mySeatIndex={vr.micMenuSheet.mySeatIndex}
        />

        {/* ── Profile Sheet ── */}
        <ProfileSheet
          isOpen={!!vr.profileSheet}
          onClose={() => vr.setProfileSheet(null)}
          participant={vr.profileSheet}
          stats={vr.profileStats}
          onGiftClick={() => vr.setGiftSheetOpen(true)}
          myRole={vr.myRole}
          authUserId={authUser?.id || ''}
          hostId={vr.room.hostId}
          onInviteToMic={vr.handleInviteToMic}
          onRemoveRole={vr.handleRemoveRole}
          onKickTemp={vr.handleProfileKickTemp}
          onBanUser={vr.handleProfileBan}
          onChangeRole={vr.handleChangeRole}
        />

        {/* ── Gift Sheet ── */}
        <GiftSheet
          isOpen={vr.giftSheetOpen}
          onClose={() => vr.setGiftSheetOpen(false)}
          gifts={vr.gifts}
          onSendGift={vr.handleSendGift}
        />

        {/* ── Settings Sheet (admin+) ── */}
        <SettingsSheet
          isOpen={vr.settingsOpen}
          onClose={() => vr.setSettingsOpen(false)}
          room={vr.room}
          onUpdate={vr.handleUpdateSettings}
        />

        {/* ── Room Info Sheet ── */}
        <RoomInfoSheet
          isOpen={infoSheetOpen}
          onClose={() => setInfoSheetOpen(false)}
          room={{
            id: vr.room.id,
            name: vr.room.name,
            description: vr.room.description || '',
            hostId: vr.room.hostId,
            hostName: vr.room.hostName || '',
            roomLevel: vr.room.roomLevel || 1,
            roomImage: vr.room.roomImage || '',
            micSeatCount: vr.room.micSeatCount || 10,
            maxParticipants: vr.room.maxParticipants || 50,
            joinPrice:
              (vr.room as Record<string, unknown>).joinPrice as number || 0,
            isAutoMode: vr.room.isAutoMode !== false,
            roomMode: vr.room.roomMode || 'public',
          }}
          participantCount={vr.participants.length}
          weeklyGems={vr.weeklyGems}
          onJoin={() => {
            setInfoSheetOpen(false);
          }}
          onFollow={() => {}}
          isFollowing={false}
          isJoined={!!vr.myParticipant}
          members={vr.participants
            .filter((p) =>
              ['owner', 'coowner', 'admin', 'member'].includes(p.role),
            )
            .map((p) => ({
              userId: p.userId,
              displayName: p.displayName,
              avatar: p.avatar,
              role: p.role,
              joinedAt: p.joinedAt,
            }))}
          topGifts={vr.topGifts}
          userGems={0}
        />

        {/* ── Kick Duration Dialog ── */}
        <KickDurationDialog
          isOpen={vr.kickDialogOpen}
          onClose={() => vr.setKickDialogOpen(false)}
          onConfirm={(minutes) => {
            if (vr.micMenuSheet.participant) {
              vr.handleKickTemp(
                minutes,
                vr.micMenuSheet.participant.userId,
              );
            }
            vr.setKickDialogOpen(false);
          }}
        />

        {/* ── Membership Invite Dialog ── */}
        <MembershipDialog
          isOpen={!!vr.pendingInvite}
          onClose={() => vr.setPendingInvite('')}
          onAccept={vr.handleAcceptInvite}
          onReject={vr.handleRejectInvite}
          pendingRole={vr.pendingInvite}
        />

        {/* ── Mic Invite Dialog ── */}
        <MicInviteDialog
          isOpen={vr.pendingMicInvite >= 0}
          onClose={() => vr.setPendingMicInvite(-1)}
          onAccept={vr.handleAcceptMicInvite}
          onReject={vr.handleRejectMicInvite}
          seatIndex={vr.pendingMicInvite}
        />
      </div>
    </>
  );
}
