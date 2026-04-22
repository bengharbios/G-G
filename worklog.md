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
