---
Task ID: 1
Agent: Main
Task: Fix mic transfer bug for owner, redesign header, fix invitation acceptance, fix gift recipient name

Work Log:
- Fixed mic transfer bug: In `requestSeat()`, when admin/owner moves between seats, the `isMuted` state is now preserved (read before update instead of forcing muted)
- Fixed `assignSeat()` and `approveWaitlist()` to set `seatStatus = 'open'` instead of `'locked'` (consistent with requestSeat)
- Fixed `SeatCircle` in RoomInteriorView: `isLocked` now only applies when `!seat.participant && seat.status === 'locked'` (prevents visual glitch where occupied seat appears locked)
- Redesigned room header to match reference image layout:
  - Top row: Room name + Room ID (clickable) + Share button + Exit dropdown (with minimize/close options)
  - Info row: Trophy icon with weekly gems count + overlapping online avatars (no names, with owner crown badge) + online count badge
- Fixed invitation acceptance infinite loop: `acceptRoleInvite()` now does SELECT first to check pendingRole, then UPDATE with explicit value. On failure (rowsAffected=0 or DB error), pendingRole is cleared to prevent infinite dialog re-appear
- Improved client-side `handleAcceptInvite`: clears `pendingInvite` immediately before API call to prevent re-trigger during async operation
- Fixed gift recipient name: `handleSendGift` now accepts optional `specificDisplayName` parameter. `handleGiftSend` adapter passes the preselected recipient's displayName. Gift notification text now always shows "لـ {name}" format

Stage Summary:
- Mic transfer: requestSeat, assignSeat, approveWaitlist all use seatStatus='open'; mute state preserved on move
- Header: Complete redesign with room info row + info bar (trophy + avatars + count)
- Invitation: acceptRoleInvite rewritten with fallback clearing of pendingRole
- Gift: recipient name explicitly passed from profile through to notification text

---
Task ID: 2
Agent: Main
Task: Fix 3 reported issues: (1) Owner settings button missing, (2) Owner mic transfer not moving visually, (3) Room minimize not working

Work Log:
- Investigated all three issues by reading RoomInteriorView.tsx, useVoiceRoom.ts, admin-db.ts, page.tsx, MicMenuSheet.tsx
- **Fix 1 - Settings button**: Found that the three-dots menu (`ThreeDotsMenu`) component and `showDotsMenu` state existed but had NO trigger button in the UI (removed during previous header redesign). Added a `Settings2` icon button in the header for admin/owner users that opens the three-dots menu via `setShowDotsMenu(true)`
- **Fix 2 - Owner mic transfer**: Found that the `broadcast5` layout in `MicSeatGrid` special-cased the owner with `seats.find(s => s.participant?.role === 'owner')` which always placed the owner at the top position regardless of seatIndex. Removed this special handling — now broadcast5 renders `seats[0]` at top and `seats.slice(1)` at bottom, so the owner moves naturally between seat positions like all other users
- **Fix 3 - Room minimize**: Three sub-fixes:
  1. In RoomInteriorView: changed minimize button to NOT call `handleLeaveRoom()` — just calls `onExit(false)` directly
  2. In page.tsx: added `isMinimized` state. When `onExit(false)` is called, sets `isMinimized=true` (keeps `activeRoom` set). When `onExit(true)` is called, actually leaves the room and clears `activeRoom`
  3. RoomInteriorView stays mounted (but hidden with CSS `display:none`) during minimize to keep heartbeat/polling running
  4. Added floating minimized room widget: teal-green rounded button at bottom-right with room name, headphones icon, "اضغط للعودة" text, and green pulse indicator
  5. Join API already handles re-join gracefully: returns `{ success: true }` if user is already a participant (line 3139 of admin-db.ts)

Stage Summary:
- Settings button: Added Settings2 trigger in header for admin users, opens existing ThreeDotsMenu
- Owner mic movement: Removed broadcast5 owner-always-top behavior, all layouts now sequential
- Minimize: Complete implementation with floating widget, room stays alive during minimize
- No lint errors in changed files

---
Task ID: 3
Agent: Main
Task: Fix mic seat race condition + chat slowness optimization

Work Log:
- Fixed race condition in `requestSeat()` in admin-db.ts: Added verify-after-write pattern — after the atomic UPDATE with NOT EXISTS, do a SELECT to confirm WE actually own the seat. If verification fails, undo the assignment and return error.
- Applied same fix to `assignSeat()`, `approveWaitlist()`, and `acceptMicInvite()` functions — all seat assignment operations now verify ownership after write.
- Replaced fixed 2000ms chat polling interval with adaptive polling:
  - Fast mode (600ms): triggered when new messages are detected or user sends a message
  - Active mode (900ms): when there was recent conversation activity
  - Idle mode (2000ms): when no new messages for a while
  - Uses setTimeout chain instead of setInterval for flexible scheduling
  - Tracks `prevTimestampRef` to detect if new messages arrived between polls
- Committed and pushed to main: fa1f3f5

Stage Summary:
- Race condition: All 4 seat assignment functions now have verify-after-write
- Chat polling: Adaptive (600ms fast / 900ms active / 2000ms idle)
- No new lint errors introduced in changed files

---
Task ID: 4
Agent: Main
Task: Add WebRTC P2P real voice audio to voice rooms

Work Log:
- Created WebSocket signaling mini-service (`mini-services/voice-signal/index.ts`) on port 3010
  - Socket.io server with rooms mapped by room_id
  - Events: join-room, leave-room, offer, answer, ice-candidate, mic-toggle, seat-change, request-offers, peer-joined, peer-leave, peer-mic-toggle, peer-seat-change, heartbeat
  - Auto-cleanup of stale clients every 60s
  - Broadcasts to room participants
- Created `useVoiceRTC` hook (`src/app/voice-rooms/hooks/useVoiceRTC.ts`)
  - One RTCPeerConnection per on-mic participant (mesh topology)
  - getUserMedia() for local mic (audio only, 48kHz, echo cancellation, noise suppression)
  - ICE servers: 3 Google STUN + 3 Open Relay TURN (free tier)
  - Independent mic mute (stops audio track) and speaker mute (local playback toggle)
  - Real speaking detection via AudioContext + AnalyserNode (RMS volume with hysteresis)
  - Remote speaking detection for each peer
  - Auto-cleanup on unmount, leave, or seat change
  - Auto-reconnect on disconnect
  - Socket.IO client with dynamic import
- Integrated voice into `RoomInteriorView.tsx`:
  - Bottom bar mic button now calls both `voiceRTC.toggleMic()` (real audio) + `vr.handleToggleMic()` (DB state)
  - Bottom bar speaker button now calls `voiceRTC.toggleSpeaker()` (local audio mute)
  - Non-seat users can also toggle speaker (mute/unmute all remote audio)
  - Admin room mute button still controls chat (separate from audio)
  - Added `VoiceAudioRenderer` component: creates hidden `<audio>` elements for each remote stream with autoplay
  - Added `isRtcSpeaking` prop to `SeatCircle` — overrides database-based speaking detection with real audio analysis
  - `MicSeatGrid` passes `speakingPeers` ref and `localSpeaking` to all layouts
  - Mic icon turns teal-green (#00C896) when local user is actually speaking

Stage Summary:
- Real P2P voice enabled via WebRTC mesh topology
- WebSocket signaling on port 3010 (free, no Turso dependency)
- STUN + TURN (openrelay.metered.ca free tier) for NAT traversal
- No limit on mic seat count
- Independent mic/speaker mute controls
- Real-time speaking indicators on seat circles
- Audio elements auto-created and auto-cleaned
