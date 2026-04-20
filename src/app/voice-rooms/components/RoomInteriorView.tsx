'use client';

import { useState } from 'react';
import { Loader2, Settings, X, Link2 } from 'lucide-react';
import InjectStyles from './shared/InjectStyles';
import MicSeatGrid from './MicSeatGrid';
import GiftAnimations from './GiftAnimations';
import ChatPanel from './ChatPanel';
import AudienceRow from './AudienceRow';
import BottomBar from './BottomBar';
import MicMenuSheet from './sheets/MicMenuSheet';
import ProfileSheet from './sheets/ProfileSheet';
import GiftSheet from './sheets/GiftSheet';
import SettingsSheet from './sheets/SettingsSheet';
import MembershipDialog from './dialogs/MembershipDialog';
import MicInviteDialog from './dialogs/MicInviteDialog';
import KickDurationDialog from './dialogs/KickDurationDialog';
import RoomInfoSheet from './RoomInfoSheet';
import { useVoiceRoom } from '../hooks/useVoiceRoom';
import { canDo } from '../types';
import type { AuthUser, VoiceRoom } from '../types';

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
  const [chatInput, setChatInput] = useState('');
  const [roomInfoOpen, setRoomInfoOpen] = useState(false);

  const vr = useVoiceRoom(initialRoom, authUser, onRoomUpdate);

  /* ── Loading ── */
  if (vr.loading) {
    return (
      <div className="min-h-screen bg-[#0d0f1a] flex items-center justify-center" dir="rtl">
        <Loader2 className="w-10 h-10 text-[#6c63ff] animate-spin" />
      </div>
    );
  }

  const handleSendChat = () => {
    vr.handleSendChat(chatInput);
    setChatInput('');
  };

  const handleLeaveRoom = async () => {
    await vr.handleLeaveRoom();
    onExit(true);
  };

  return (
    <>
      <InjectStyles />
      <div className="h-screen flex flex-col voice-room-root relative" dir="rtl" style={{ backgroundColor: '#0d0f1a' }}>
        {/* Room background image */}
        {vr.room.roomImage && (
          <div className="absolute inset-0 z-0">
            <img src={vr.room.roomImage} alt="" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-[#0d0f1a]/75" />
          </div>
        )}
        <div className="relative z-10 flex flex-col h-full">

          {/* ── TOP BAR ── */}
          <header className="h-14 bg-transparent flex items-center justify-between px-4 border-b border-[rgba(108,99,255,0.18)] flex-shrink-0">
            {/* Room info — right side in RTL */}
            <div className="flex flex-col items-start gap-0 min-w-0">
              <div className="flex items-center gap-1.5">
                <div className="w-[7px] h-[7px] rounded-full bg-[#22c55e] animate-live-pulse flex-shrink-0" />
                <button onClick={() => setRoomInfoOpen(true)} className="active:scale-[0.97] transition-transform">
                  <span className="text-[15px] font-bold text-[#f0f0f8] truncate max-w-[160px] block">{vr.room.name}</span>
                </button>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 bg-[rgba(108,99,255,0.12)] rounded-full px-1.5 py-0.5">
                  <span className="text-[9px] font-bold text-[#a78bfa]">LV</span>
                  <span className="text-[9px] font-bold text-[#f0f0f8]">{vr.room.roomLevel || 1}</span>
                </div>
                <span className="text-[9px] text-[#5a6080] font-mono">#{vr.room.hostId?.substring(0, 8) || '----'}</span>
                <span className="text-[9px] text-[#5a6080]">{vr.listenerCount} مستمع</span>
              </div>
            </div>

            {/* Settings + Exit + Share — left side in RTL */}
            <div className="flex items-center gap-2">
              {canDo(vr.myRole, 'admin') && (
                <button
                  onClick={() => vr.setSettingsOpen(true)}
                  className="w-[34px] h-[34px] rounded-[10px] bg-[#1c2035] border border-[rgba(255,255,255,0.07)] flex items-center justify-center active:bg-[#232843] transition-colors"
                >
                  <Settings className="w-4 h-4 text-[#9ca3c4]" />
                </button>
              )}
              <button
                onClick={handleLeaveRoom}
                className="w-[34px] h-[34px] rounded-[10px] bg-[rgba(239,68,68,0.12)] border border-[rgba(239,68,68,0.3)] flex items-center justify-center text-[#ef4444] active:bg-[rgba(239,68,68,0.25)] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
              <button
                onClick={vr.handleCopyLink}
                className="w-[34px] h-[34px] rounded-[10px] bg-[#1c2035] border border-[rgba(255,255,255,0.07)] flex items-center justify-center active:bg-[#232843] transition-colors"
              >
                <Link2 className="w-4 h-4 text-[#9ca3c4]" />
              </button>
            </div>
          </header>

          {/* ── AUDIENCE ROW ── */}
          <AudienceRow
            participants={vr.participants}
            weeklyGems={vr.weeklyGems}
            onProfileClick={(p) => vr.setProfileSheet(p)}
          />

          {/* ── MIC GRID ── */}
          <MicSeatGrid
            seats={vr.seats}
            currentUserId={vr.currentUserId}
            myRole={vr.myRole}
            hostId={vr.room.hostId}
            onSeatClick={vr.handleSeatClick}
          />

          {/* ── CHAT + BOTTOM BAR ── */}
          <ChatPanel
            messages={vr.chatMessages}
            chatInput={chatInput}
            setChatInput={setChatInput}
            onSendChat={handleSendChat}
            isRoomMuted={vr.isRoomMuted}
            authUser={authUser}
            participants={vr.participants}
            roomId={vr.room.id}
            onProfileClick={(p) => vr.setProfileSheet(p)}
          />
        </div>

        {/* ── BOTTOM SHEETS & DIALOGS ── */}

        <MicMenuSheet
          isOpen={vr.micMenuSheet.isOpen}
          onClose={() => vr.setMicMenuSheet(prev => ({ ...prev, isOpen: false }))}
          seatIndex={vr.micMenuSheet.seatIndex}
          participant={vr.micMenuSheet.participant}
          isSeatLocked={(vr.room.lockedSeats || []).includes(vr.micMenuSheet.seatIndex)}
          onAction={vr.handleMicMenuAction}
          currentUserId={vr.currentUserId}
          myRole={vr.myRole}
          mySeatIndex={vr.micMenuSheet.mySeatIndex}
        />

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

        <GiftSheet
          isOpen={vr.giftSheetOpen}
          onClose={() => vr.setGiftSheetOpen(false)}
          gifts={vr.gifts}
          onSendGift={vr.handleSendGift}
        />

        <SettingsSheet
          isOpen={vr.settingsOpen}
          onClose={() => vr.setSettingsOpen(false)}
          room={vr.room}
          onUpdate={vr.handleUpdateSettings}
        />

        <KickDurationDialog
          isOpen={vr.kickDialogOpen}
          onClose={() => vr.setKickDialogOpen(false)}
          onConfirm={(minutes) => {
            if (vr.micMenuSheet.participant) {
              vr.handleKickTemp(minutes, vr.micMenuSheet.participant.userId);
            }
            vr.setKickDialogOpen(false);
          }}
        />

        <MembershipDialog
          isOpen={!!vr.pendingInvite}
          onClose={() => vr.setPendingInvite('')}
          onAccept={vr.handleAcceptInvite}
          onReject={vr.handleRejectInvite}
          pendingRole={vr.pendingInvite}
        />

        <MicInviteDialog
          isOpen={vr.pendingMicInvite >= 0}
          onClose={() => vr.setPendingMicInvite(-1)}
          onAccept={vr.handleAcceptMicInvite}
          onReject={vr.handleRejectMicInvite}
          seatIndex={vr.pendingMicInvite}
        />

        {/* Room info sheet */}
        <RoomInfoSheet
          isOpen={roomInfoOpen}
          onClose={() => setRoomInfoOpen(false)}
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
            joinPrice: (vr.room as Record<string, unknown>).joinPrice as number || 0,
            isAutoMode: vr.room.isAutoMode !== false,
            roomMode: vr.room.roomMode || 'public',
          }}
          participantCount={vr.participants.length}
          weeklyGems={vr.weeklyGems}
          onJoin={() => { setRoomInfoOpen(false); }}
          onFollow={() => {}}
          isFollowing={false}
          isJoined={!!vr.myParticipant}
          members={vr.participants
            .filter(p => ['owner', 'coowner', 'admin', 'member'].includes(p.role))
            .map(p => ({
              userId: p.userId,
              displayName: p.displayName,
              avatar: p.avatar,
              role: p.role,
              joinedAt: p.joinedAt,
            }))}
          topGifts={vr.topGifts}
          userGems={0}
        />

        {/* Gift Animation Overlay */}
        <GiftAnimations activeGift={vr.activeGiftAnimation} />
      </div>
    </>
  );
}
