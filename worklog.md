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
