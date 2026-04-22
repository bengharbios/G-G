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
