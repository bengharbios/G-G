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
   RoomInteriorView — TUILiveKit LivePlayerPC / LivePlayerH5 inspired

   - Full-screen, no native scroll, flex column fills viewport
   - Header bar (48px) with exit, LIVE badge, room name, actions
   - Responsive: md+ = two-column (mic grid right, chat left)
                 <768 = stacked (audience → mic grid → chat)
   - Bottom toolbar (56px) with mic/like/gift/volume buttons
   - Overlay sheets & dialogs rendered conditionally
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

      <div
        className="h-screen flex flex-col relative overflow-hidden voice-room-root"
        dir="rtl"
        style={{ backgroundColor: '#0a0e1a' }}
      >
        {/* ── Room background image with dark overlay ── */}
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

        <div className="relative z-10 flex flex-col h-full">

          {/* ══════════════════════════════════════════════════════════════
             HEADER BAR  —  48px, #111827, border-bottom
             Left (visual): Exit
             Center: LIVE badge + Room name (clickable → RoomInfoSheet)
             Right (visual): Settings (admin+) + Share + Listener count
             ══════════════════════════════════════════════════════════════ */}
          <header
            className="flex items-center justify-between px-4 flex-shrink-0"
            style={{
              height: '48px',
              backgroundColor: '#111827',
              borderBottom: '1px solid rgba(255,255,255,0.08)',
            }}
          >
            {/* ── Left (visual) — Exit button ── */}
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

            {/* ── Center — LIVE badge + Room name ── */}
            <div className="flex items-center gap-2 min-w-0 flex-1 justify-center px-3">
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

            {/* ── Right (visual) — Settings + Share + Listener count ── */}
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
          </header>

          {/* ══════════════════════════════════════════════════════════════
             MAIN CONTENT AREA
             md+ : two columns — mic grid (right) | chat (left)
             <md : stacked — audience → mic grid → chat
             ══════════════════════════════════════════════════════════════ */}
          <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden">
            {/* ── Right column (RTL first child) — Audience + Mic Grid ── */}
            <div className="md:w-[44%] lg:w-[40%] flex flex-col flex-shrink-0 overflow-y-auto md:overflow-y-auto">
              <AudienceRow
                participants={vr.participants}
                weeklyGems={vr.weeklyGems}
                onProfileClick={(p) => vr.setProfileSheet(p)}
              />
              <div
                className="flex-1"
                style={{
                  background:
                    'linear-gradient(180deg, #0d1020 0%, #0a0e1a 100%)',
                }}
              >
                <MicSeatGrid
                  seats={vr.seats}
                  currentUserId={vr.currentUserId}
                  onSeatClick={vr.handleSeatClick}
                />
              </div>
            </div>

            {/* ── Left column (RTL second child) — Chat Panel ── */}
            <div className="flex-1 flex flex-col min-h-0 min-w-0">
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

          {/* ══════════════════════════════════════════════════════════════
             BOTTOM BAR  —  56px, #111827, border-top
             TUILiveKit toolbar: Mic · Like · Gift · Volume
             ══════════════════════════════════════════════════════════════ */}
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
