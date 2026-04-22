---
Task ID: 1
Agent: main-coordinator
Task: Complete voice rooms rebuild from scratch matching TUILiveKit exact design

Work Log:
- Analyzed uploaded TUILiveKit reference image (voice chat room with cosmic bg, seat grid, bottom bar)
- Fetched TUILiveKit source from GitHub: Web (Vue 3), Flutter, and Android versions
- Extracted complete design tokens from Flutter colors.dart and screen_adapter.dart
- Deleted ALL 24 old voice-rooms component files
- Rebuilt 26 files from scratch with exact TUILiveKit conversion:
  - types.ts: Complete TUI design token system (G1-G8 grays, B1-B4 brands, exact dimensions, typography, shadows, animations)
  - MicSeat.tsx: 50px circle seats with ripple animation, locked/empty/occupied states, speaking glow
  - MicSeatGrid.tsx: Auto-layout algorithm (3/4 per row patterns from TUILiveKit SeatGridLayout)
  - TopBar.tsx: Room info, audience avatar row, close button (exact Flutter top_widget)
  - BottomBar.tsx: Owner/audience split button layouts, like/gift/mic buttons (exact Flutter bottom_menu)
  - ChatPanel.tsx: Barrage display (transparent bg, auto-scroll, fade messages, age decay)
  - LikeAnimation.tsx: Floating hearts with physics (HEART_COLORS, wobble, random size/position)
  - GiftAnimations.tsx: Gift banner + canvas particle effects (hearts/stars/fireworks/confetti)
  - GiftSheet.tsx: Gift selection panel with category tabs and quantity selector
  - SettingsSheet.tsx: Settings panel with background picker, mode selector, mic count
  - ProfileSheet.tsx: User management panel (follow, mute, kick, role management)
  - MicMenuSheet.tsx: Seat context menu with context-aware actions
  - SeatManagementSheet.tsx: Anchor seat management (seated list, applicants, auto-mode toggle)
  - RoomInfoSheet.tsx: Room info display
  - CreateRoomDialog.tsx: Room creation form (9 fields, background selector)
  - PasswordDialog.tsx: Key-mode password entry
  - KickDurationDialog.tsx: Temporary kick duration selection
  - MembershipDialog.tsx: Role invitation dialog
  - MicInviteDialog.tsx: Mic seat invitation dialog
  - RoomListView.tsx: Lobby with search, category tabs, room cards (exact TUILiveKit LiveListView)
  - AudienceRow.tsx: Audience avatar row component
  - RoomInteriorView.tsx: Main room view with 7-layer component stack (exact VoiceRoomRootWidget)
  - BottomSheetOverlay.tsx: Reusable TUILiveKit Drawer (bg #22262E, 15px radius, spring animation)
  - InjectStyles.tsx: Cairo font, keyframe animations, dark scrollbar styles
- Kept existing useVoiceRoom.ts hook (complex API integration, 766 lines)
- Zero lint errors in all voice-rooms files

Stage Summary:
- 26 files total in voice-rooms module
- Exact TUILiveKit design tokens from Flutter source (colors.dart, screen_adapter.dart)
- All components follow TUILiveKit layer stack architecture
- Clean separation: types → shared → components → sheets → dialogs → views → page
---
Task ID: 1
Agent: Main Agent
Task: Fix password room bug - owner can't enter their own password-protected room

Work Log:
- Read joinVoiceRoom() in admin-db.ts — found password checked BEFORE hostId identification
- Found getAllVoiceRooms() strips roomPassword to '' for all rooms (including owner's)
- Fixed admin-db.ts: Moved hostId check before password validation; owner bypasses password check for both 'key' and 'private' modes
- Fixed page.tsx: Simplified handleRoomClick — owner always bypasses password dialog entirely

Stage Summary:
- Server-side: Owner now bypasses password validation in joinVoiceRoom() (admin-db.ts line 3112-3126)
- Frontend: Owner skips password dialog, goes straight to handleJoinRoom() (page.tsx line 128-143)
- Zero lint errors in modified files

---
Task ID: 2
Agent: Main Agent + Subagent
Task: Fix responsive design for mic seats and buttons on small screens

Work Log:
- Analyzed MicSeatGrid: had broken maxWidth calc with hardcoded 60px and invalid CSS clamp multiplication
- Analyzed BottomBar: barrage input and mute mic used absolute positioning with overlapping values
- Removed broken maxWidth calculation from MicSeatGrid, letting flex-wrap handle layout naturally
- Rewrote BottomBar layout: full-width flex row with left side (barrage + mute) and right side (action buttons)

Stage Summary:
- MicSeatGrid: Simple flex-wrap + justify-center, no broken maxWidth
- BottomBar: Full-width flex with left/right sides, responsive gaps, 44px min touch targets
- All buttons scale with clamp() for 320px+ viewports

---
Task ID: 3
Agent: Main Agent
Task: Pull TUILiveKit gift assets from GitHub repo

Work Log:
- Explored TUILiveKit Flutter gift module at /home/z/tuikit-ref/Flutter/live_uikit_gift/
- Found TUILiveKit loads gift images from remote URL (CachedNetworkImage), not bundled assets
- Found heart animation PNGs (gift_heart0-8.png) bundled in Flutter assets
- Copied 9 heart PNGs to /public/gifts/
- Updated LikeAnimation.tsx to use actual TUILiveKit heart PNGs instead of SVG hearts
- Updated GiftSheet.tsx to match TUILiveKit layout: 4-column grid, 8 per page, pagination dots, send-on-select pattern

Stage Summary:
- /public/gifts/gift_heart0-8.png copied from TUILiveKit Flutter assets
- LikeAnimation uses real TUILiveKit heart images (pre-loaded)
- GiftSheet matches TUILiveKit: 4-col grid, pagination, blue highlight on select

---
Task ID: 4
Agent: Main Agent + Subagent
Task: Fix visual design differences against TUILiveKit reference

Work Log:
- Ran thorough design comparison between Flutter source and React components
- Found all 40+ color tokens and dimension tokens are 100% match
- Identified 9 visual differences in layout/structure
- Fixed gradient overlay: changed from asymmetric ramp to symmetric vignette (G1→G1@50%→G1)
- Fixed BottomBar: right-aligned (not full-width), 28px icons with text labels, transparent bg
- Fixed TopBar close button: transparent bg (was rgba(0,0,0,0.3))
- Fixed barrage input: pill shape (borderRadius:18), separate positioning
- Fixed ChatPanel message bubble alpha: 0.3 → 0.4 matching TUILiveKit barrageItemBackColor
- Fixed mute mic: separate positioned element (32px) on left side

Stage Summary:
- Gradient overlay now matches TUILiveKit symmetric vignette
- BottomBar now right-aligned with 28px icons + text labels (matching Flutter exactly)
- Barrage input pill-shaped, separately positioned
- Message bubble alpha corrected to 40%
- All changes pass lint with 0 errors

---
Task ID: 5
Agent: Main Agent
Task: Restore 3-tab RoomInfoSheet and full ProfileSheet matching old design

Work Log:
- Analyzed old design from commit 1061df1 — found RoomInfoSheet had 3 tabs (معلومات + الأعضاء + اللحظات)
- Found old ProfileBottomSheet had: 56px avatar, stats row, role management, admin actions, action buttons
- Rewrote RoomInfoSheet with framer-motion animated tabs, room banner, host card, stats grid, member list, top gifts
- Rewrote ProfileSheet with large avatar, stats row, role management (grant/change/remove), kick/ban, invite/gift/frame/close
- Updated RoomInteriorView to pass weeklyGems, topGifts to RoomInfoSheet and hostId, totalReceivedValue, onGiftClick, authUserId to ProfileSheet
- Fixed lint error: moved Card component outside render function

Stage Summary:
- RoomInfoSheet restored with 3 tabs matching old design (معلومات + الأعضاء + اللحظات)
- ProfileSheet restored with full old design (stats, role management, admin actions, action buttons)
- Zero new lint errors in voice-rooms files
- Pushed as commit 23814de to origin/main
---
Task ID: 1
Agent: Main Agent
Task: Redesign voice room lobby to match reference screenshots exactly

Work Log:
- Analyzed 3 lobby screenshots using VLM (before room creation, after room creation, room grid)
- Identified key design elements: teal-green gradient, 2-column room grid, white create card, pill tabs, square icon bottom nav
- Fixed page.tsx: added rooms/myRoom state, fetchLobbyRooms function, CreateRoomDialog mounting, fixed RoomListView props (rooms, myRoom, onRoomClick, onCreateRoom, loading)
- Completely rewrote RoomListView.tsx to match screenshots:
  - Teal-green gradient background (#0D8A7A → #0A6B5E → #074a42) with diamond pattern overlay
  - Header: avatar with notification badge, 3 pill-shaped main tabs (Explore/Hot/Mine), search icon
  - "My" tab: White "Create my room" card (green plus icon + text) when no room, or room banner when room exists
  - 4 sub-tabs always visible (Recently/Joined/Following/Friends) with active pill styling
  - Room cards in 2-column CSS grid with cover images, On indicator, participant count badge, mode badge
  - Empty state with house SVG illustration, message text, yellow CTA button
  - Bottom nav with rounded-square icon containers (teal/yellow/orange), badges, labels
- Updated CreateRoomDialog.tsx: added micTheme to CreateRoomData interface
- Updated AudienceRow.tsx: added darkContext prop for flexible background contexts
- Verified no TypeScript errors in modified files
- Verified no ESLint errors in voice-rooms files

Stage Summary:
- page.tsx: Fixed prop mismatch, added room fetching, mounted CreateRoomDialog
- RoomListView.tsx: Complete rewrite matching screenshot design (grid cards, create card, empty state, bottom nav)
- CreateRoomDialog.tsx: Added micTheme field
- AudienceRow.tsx: Added darkContext prop
- All files compile without errors
---
Task ID: 2
Agent: Main Agent
Task: Redesign voice room interior to match reference screenshots

Work Log:
- Analyzed 6 room interior screenshots using VLM
- Key design elements identified: teal-green gradient background, arc mic seats, floating music icons
- Rewrote RoomInteriorView.tsx (1094 lines):
  - Background: Changed from dark navy (#1a1f3a) to teal-green gradient (#0D8A7A → #0A6B5E → #074a42)
  - Header: Semi-transparent with share icon, settings gear, power button
  - Mic seats: New curved arc layout using parabolic Y-offset (getArcOffset function)
  - Added SpeakingBars component (animated 3-bar equalizer for speaking seats)
  - Bottom bar: Inlined (removed separate BottomBar/MicSeatGrid imports), adapted colors for teal bg
  - Right side menu: Replaced MessageCircle with Disc3, ListMusic, Music, Music2 (music icons)
  - All text in Arabic
  - SettingsSheet kept completely unchanged
  - All sheets/dialogs preserved exactly as-is
- No TypeScript or lint errors
- Pushed to GitHub

Stage Summary:
- RoomInteriorView.tsx completely rewritten to match screenshots
- Teal-green gradient background matching lobby
- Arc mic seat layout with speaking animations
- Music-related icons replacing message icon on right side
- SettingsSheet preserved unchanged
---
Task ID: 1
Agent: Main Agent
Task: Redesign room interior to match TUILiveKit screenshots — move icons, three-dots menu, multiple mic layouts, dark navy bg, expanded gifts

Work Log:
- Analyzed uploaded screenshot via VLM (dark navy bg, 2x4 mic grid, gift panel, three-dots menu)
- Read all voice-rooms files (26 files) to understand full architecture
- Updated types.ts: Added MIC_LAYOUTS (8 types: grid2x2, grid2x3, grid2x4, grid3x3, arc, theater, radio, podcast), expanded DEFAULT_GIFTS from 12 to 24 gifts with categories (popular/luxury/special), added getMicLayout() helper, updated MIC_OPTIONS to [4,6,8,9,10]
- Rewrote RoomInteriorView.tsx: Changed background from teal-green to dark navy (#0f1429 → #1a1f3a → #2d1b4e), moved floating menu from RIGHT to LEFT (music icons: Disc3, ListMusic, Music, Music2 + Crown + Trophy), added ThreeDotsMenu overlay with 9 icon grid (Settings, Edit Room, Seat Mgmt, Roles, Mute/Unmute, Share, Invite, Effects, Exit), implemented MicSeatGrid with 7 layout patterns (grid2x2, grid2x3, grid2x4, grid3x3, arc, theater, radio, podcast), added back arrow to header, purple accent colors, Heart like button in bottom bar
- Redesigned GiftSheet.tsx: Added top gifts banner (gold star icon), FX badge on gifts with animations, gold coin prices (🪙), purple-themed category tabs and send button with gradient, improved gift grid styling
- Updated CreateRoomDialog.tsx: Added mic theme/layout selector that dynamically shows available layouts for selected seat count, default changed to 8 seats + grid2x4 layout
- SettingsSheet.tsx: UNTOUCHED (user approved)

Stage Summary:
- 4 files modified: types.ts, RoomInteriorView.tsx, GiftSheet.tsx, CreateRoomDialog.tsx
- SettingsSheet.tsx NOT modified (locked per user request)
- All voice-rooms changes compile without new TypeScript errors
- 2 pre-existing TS errors remain (MicMenuSheet.tsx, SeatManagementSheet.tsx)
---
Task ID: 1
Agent: Main Agent
Task: Add mic layout selector accessible from room interior (owner can change mic seat style inside room)

Work Log:
- User reported they couldn't find where to change mic layout styles from inside the room
- Created MicLayoutSheet.tsx: a bottom sheet with seat count selector + layout style grid with visual previews
- Supports all 8 layout types: grid2x2, grid2x3, grid2x4, grid3x3, arc, theater, radio, podcast
- Dynamic filtering shows only layouts compatible with selected seat count
- Added "نمط المايكات" menu item to ThreeDotsMenu (LayoutGrid icon, owner only)
- Wired handleMicLayoutChange to call handleUpdateSettings({ micTheme }) on server
- Wired handleSeatCountChange to call handleUpdateSettings({ micSeatCount }) and re-fetch participants
- ESLint passes with 0 errors in voice-rooms files
- Pushed to GitHub as commit c30b9bf

Stage Summary:
- New file: src/app/voice-rooms/components/sheets/MicLayoutSheet.tsx
- Modified: src/app/voice-rooms/components/RoomInteriorView.tsx
- Room owners can now change mic seat layout from the three-dots menu (⋮ → نمط المايكات)
- Seat count and layout style changes persist on server and apply instantly
---
Task ID: 1
Agent: Main Agent
Task: Study screenshot mic layout patterns and update SettingsSheet with correct TUILiveKit patterns

Work Log:
- Read all 9 screenshot analysis JSON files from /tmp/analysis_room_*.json and /tmp/my-project/upload/pasted_image_*_detail.json
- Identified the EXACT 5 mic layout patterns from TUILiveKit Mic Mode modal:
  1. **Chat 5** (chat5): 1 row of 5 seats (horizontal line)
  2. **Broadcast 5** (broadcast5): Top 1 + bottom 4 seats (pyramid/broadcast)
  3. **Chat 10** (chat10): 2 rows of 5 seats (2×5 grid) — LOCKED in screenshots
  4. **Team 10** (team10): 2 rows of 5 seats with divider between seats 2&3 — LOCKED
  5. **Chat 15** (chat15): 3 rows of 5 seats (3×5 grid) — LOCKED
- Updated types.ts: Changed MicLayoutId from 8 old types to 5 correct types
- Updated MIC_OPTIONS from [4,6,8,9,10] to [5,10,15]
- Updated MIC_LAYOUTS array with correct patterns including visualRows, hasTeamDivider, isBroadcast
- Updated getMicLayout() auto-select for 5→chat5, 10→chat10, 15→chat15
- Updated SettingsSheet.tsx MIC_MODE_OPTIONS with 5 correct patterns matching screenshots
- Updated renderMicVisual() to handle broadcast (pyramid), team (with divider), and chat layouts
- Updated RoomInteriorView.tsx MicSeatGrid with correct layout renderers for all 5 types
- Updated CreateRoomDialog defaults to chat5/5 seats (was grid2x4/8)
- Removed arc fallback button from CreateRoomDialog
- Updated admin-db.ts migration to map legacy themes → new TUILiveKit layout IDs
- Deleted MicLayoutSheet.tsx (was wrong approach per user request)
- Ran lint — no errors in voice-rooms code

Stage Summary:
- Mic layout patterns now EXACTLY match TUILiveKit screenshots
- All 5 patterns available in SettingsSheet's existing "نمط المايك" section
- MicSeatGrid renders each pattern correctly in the room interior
- DB migration handles old rooms and legacy theme IDs
---
Task ID: 1
Agent: Main Agent
Task: Fix lobby room cards - show room avatar not background, make cards square

Work Log:
- User reported: lobby cards show background image but should show room avatar (profile image)
- User reported: room cards are too tall, need square cards so 2 fit per row
- Updated RoomCard in RoomListView.tsx:
  - Changed card to use `aspectRatio: '1/1'` for square shape
  - Changed image priority: `roomAvatar` first, then `roomImage` fallback, then gradient + mic icon
  - Moved room info (name, host, mode badge) to overlay at bottom of card instead of separate section
  - Added text-shadow for readability over images
  - Removed separate info section — all content overlaid on the image
- Dev server running with no errors

Stage Summary:
- Room cards are now square (1:1 aspect ratio) — 2 cards fit perfectly per row
- Room avatar is shown as the main image (falls back to roomImage if no avatar)
- Room info overlaid at bottom with gradient + text-shadow for readability
---
Task ID: 2
Agent: Main Agent
Task: Comprehensive UI improvements — SeatCircle, Header, Bottom Bar, Left Menu, Lobby Cards

Work Log:
- Fixed missing AlertTriangle import in RoomInteriorView.tsx (used in End Live dialog)
- Added getSeatBorderColor() and getSeatGlow() helper functions for role-based seat styling
- Improved SeatCircle: role-based border colors (owner=gold, coowner=purple, admin=blue), gradient number badges, admin shield badge, enhanced speaking glow with stronger ripple, hover scale animation, better muted badge with border, name turns teal when speaking
- Improved Header: increased height to 52px, larger room avatar (32px) with online indicator dot, larger audience avatars (24px) showing 5 instead of 4, clickable audience row with teal +N badge, total participant count displayed, improved close/dots button sizes (18px icons)
- Improved Bottom Bar: larger heart button (22px) with drop-shadow glow on press, gift button with shimmer animation (background-size cycling), overflow hidden for shimmer effect
- Cleaned up Left Side Menu: replaced Music/ListMusic/Music2 icons with MessageSquare (chat focus), UserCog (seat mgmt, admin only, with pending badge), Share2 (share link)
- Added giftShimmer keyframe animation
- Improved RoomListView lobby cards: rounded-2xl corners, hover glow border effect (teal), host mini-avatar (16px circle), seat count badge (top-right), improved On indicator with shadow, bolder room name (700 weight), better text shadows

Stage Summary:
- 2 files modified: RoomInteriorView.tsx, RoomListView.tsx
- All changes compile without TypeScript errors (Next.js Turbopack confirmed)
- Pre-existing ESLint parser false positive confirmed (line 172/203, existed before changes)
- Zero new compilation errors
- No new lint errors
---
Task ID: 3
Agent: Main Agent
Task: Fix backend gift system to support proper gem deduction and user gems balance

Work Log:
- Read worklog.md, admin-db.ts (sendGiftInRoom at line ~3226), and voice-rooms API route
- Analyzed existing gems infrastructure: Subscription table has gemsBalance column, existing deductGems/addGems work by subscriptionCode
- Rewrote `sendGiftInRoom` in admin-db.ts:
  - New signature: `(roomId, giftId, fromUserId, toUserId | undefined, quantity?) → { success, newBalance, error? }`
  - Looks up gift price from Gift table
  - Calculates total cost = price × quantity (defaults to 1)
  - Checks sender has enough gems via AppUser → Subscription JOIN
  - Deducts gems from sender's Subscription.gemsBalance
  - If toUserId provided, adds gems to receiver's Subscription.gemsBalance
  - Inserts GiftHistory record with quantity
  - Returns `{ success, newBalance }` or `{ success: false, error }`
- Added `getUserGemsBalance(userId)` export function in admin-db.ts
  - JOINs AppUser → Subscription to get gemsBalance for any userId
  - Returns 0 if user not found
- Added DB migration for `quantity` column on GiftHistory table
- Updated API route (voice-rooms/[id]/route.ts):
  - Added `getUserGemsBalance` to imports
  - Updated POST `gift` action: passes toUserId + quantity, handles new return type with error propagation
  - Added GET `my-gems` action: returns authenticated user's gems balance
- Ran lint: zero new errors in modified files (all 52 lint issues are pre-existing)

Stage Summary:
- `sendGiftInRoom` now properly deducts gems from sender and credits receiver
- GiftHistory records now include quantity
- New `getUserGemsBalance()` function available for querying user gem balance
- New API endpoint: GET `?action=my-gems` returns user's current gems
- POST gift action returns `newBalance` and proper error messages
- Files modified: src/lib/admin-db.ts, src/app/api/voice-rooms/[id]/route.ts
---
Task ID: 4
Agent: Main Agent
Task: Fix frontend gift flow to support recipient selection and proper gems display

Work Log:
- Updated useVoiceRoom.ts hook:
  - Added `myGemsBalance` state alongside existing `weeklyGems`
  - Added `fetchMyGemsBalance` callback (GET `?action=my-gems`)
  - Added stable ref (`fetchMyGemsBalanceRef`) and sync effect
  - Added to init Promise.all and 10-second polling interval
  - Updated `handleSendGift` signature to accept optional `specificUserId` parameter
  - Added `fetchMyGemsBalance()` call after successful gift send (to refresh balance)
  - Exported `myGemsBalance` in return object
- Updated GiftSheet.tsx:
  - Changed `onSendGift` signature to include `recipient: { type, userId? }`
  - Added `preselectedRecipient` and `micParticipants` props
  - Added `recipientMode` state (everyone/mic/specific) initialized from preselectedRecipient
  - Added recipient selection bar between category tabs and gift grid (3 pill buttons: للجميع, على المايك, لشخص محدد)
  - Shows "إرسال إلى: {name}" badge when preselectedRecipient is set
  - Imported UsersRound, Mic, UserCheck icons from lucide-react
- Updated RoomInteriorView.tsx:
  - Added `giftRecipient` state for gift recipient preselection
  - Updated `handleGiftSend` adapter to route specific/mic/everyone to correct hook calls
  - Changed `gems={vr.weeklyGems}` to `gems={vr.myGemsBalance}` (user's actual balance)
  - Added `key={giftRecipient?.userId || 'default'}` to GiftSheet for remount on recipient change
  - Updated ProfileSheet `onGiftClick` to capture target user info and set giftRecipient before opening GiftSheet
  - Passes micParticipants (filtered participants on seats) to GiftSheet
- Ran lint: zero new errors in voice-rooms files (all errors are pre-existing)

Stage Summary:
- 3 files modified: useVoiceRoom.ts, GiftSheet.tsx, RoomInteriorView.tsx
- GiftSheet now shows user's actual gem balance (myGemsBalance) instead of room weekly total
- GiftSheet supports 3 recipient modes: everyone, on mic, specific person
- ProfileSheet → GiftSheet flow now correctly passes target user info
- Polling keeps gem balance fresh (10-second interval)
---
Task ID: 1
Agent: Main Agent
Task: Fix mic transfer bug (owner), stale participant cleanup, and missing toggle-lock handler

Work Log:
- Bug 1 — Mic transfer for owner: `requestSeat()` in admin-db.ts set `seatStatus = 'locked'` when moving to new seat, causing MicSeat.tsx to render BOTH lock icon AND avatar simultaneously
  - Fixed admin-db.ts lines 3633/3636: Changed `seatStatus` from `'locked'` to `'open'` in both branches (user already on seat, new to mic)
  - Fixed MicSeat.tsx: Changed `isLocked` to only be true when `!participant && status === 'locked'` (no participant sitting)
  - Fixed MicSeat.tsx: Changed empty/locked rendering from `{(isEmpty || isLocked) && ...}` to `{!isOccupied && ...}` to prevent double-render
  - Fixed MicSeat.tsx: Background uses `isEmpty` only (not `|| isLocked`) since locked seats with participants should be transparent
- Bug 2 — Users hung in room after closing browser: `joinVoiceRoom()` didn't set `lastSeen`, defaulting to NULL; `cleanupStaleParticipants()` only cleaned non-NULL lastSeen
  - Fixed admin-db.ts joinVoiceRoom INSERT: Added `lastSeen` column with `datetime('now')` default
  - Fixed admin-db.ts cleanupStaleParticipants: Now also deletes participants with `lastSeen IS NULL AND joinedAt < datetime('now', '-30 seconds')`
  - Added `beforeunload` event listener in useVoiceRoom.ts: Sends POST leave request with `keepalive: true` on browser/tab close, properly cleaned up on unmount
- Bonus fix: Added missing `'toggle-lock'` case in `handleMicMenuAction` switch in useVoiceRoom.ts
  - Checks `room.lockedSeats` array for current lock state, toggles between 'open' and 'locked'
  - Added `room` to dependency array to avoid stale closure

Stage Summary:
- 3 files modified: src/lib/admin-db.ts, src/app/voice-rooms/components/MicSeat.tsx, src/app/voice-rooms/hooks/useVoiceRoom.ts
- Owner mic transfer now visually updates correctly (avatar shows, no duplicate lock icon)
- Stale participants properly cleaned up even if they close browser before first heartbeat
- `beforeunload` handler provides immediate cleanup on browser close
- `toggle-lock` mic menu action now works for empty seats
---
Task ID: 1
Agent: main
Task: Fix mic transfer bug for room owner + user hang issue + unauthenticated join UX

Work Log:
- Analyzed mic transfer flow: owner clicks "نقل" → MicMenuSheet dispatches 'change-mic' → handleMicMenuAction → handleRequestSeat → requestSeat API → DB update
- Found root cause: `requestSeat()` in admin-db.ts sets `seatStatus = 'locked'` when moving seats, causing MicSeat to render BOTH Lock icon AND avatar simultaneously
- Fixed `requestSeat()`: changed `seatStatus` from `'locked'` to `'open'` in both branches (lines 3635, 3638)
- Fixed `MicSeat.tsx`: `isLocked` now only true when `!participant && status === 'locked'`, preventing visual corruption
- Fixed `MicSeat.tsx`: background color now uses `isEmpty` only (not `|| isLocked`)
- Fixed `MicSeat.tsx`: empty/locked state rendering changed from `{(isEmpty || isLocked) && ...}` to `{!isOccupied && ...}`
- Fixed `joinVoiceRoom()`: added `lastSeen` to INSERT with `datetime('now')` so participants get timestamp immediately
- Fixed `cleanupStaleParticipants()`: now also removes participants with `lastSeen IS NULL AND joinedAt < 30 seconds ago`
- Added `beforeunload` event listener in `useVoiceRoom.ts` to call leave API when user closes browser/tab (with keepalive: true)
- Added missing `'toggle-lock'` handler in `handleMicMenuAction` — toggles between 'open' and 'locked'
- Verified unauthenticated join already shows login dialog in page.tsx (line 168-170)

Stage Summary:
- Mic transfer should now work correctly for owner (seatStatus 'open' instead of 'locked')
- Users who close browser will be cleaned up within 30 seconds (lastSeen initialized on join + beforeunload + improved cleanup query)
- Login dialog already implemented for unauthenticated users clicking rooms
- Toggle-lock action now works from MicMenuSheet
