---
Task ID: 1
Agent: Main
Task: Fix 3 critical voice room bugs + improve room persistence

Work Log:
- Read full voice-rooms/page.tsx (2122 lines) to understand component structure
- Read all API endpoints (route.ts, manage.ts, settings.ts) to understand backend
- Identified root causes for all reported bugs
- Applied targeted fixes:

1. **Audience avatars row**: Added a horizontal scrollable row of 32px avatars between mic grid and chat. Shows all participants with seatIndex < 0 (non-mic sitters). Clicking an avatar opens the profile bottom sheet.

2. **Empty mic click behavior**: Changed `handleSeatClick` so that clicking an empty/open mic directly calls `handleRequestSeat` (join mic) for ALL users, not just members. Only locked empty seats show admin menu. Also added "صعود للمايك" (sit on mic) button in MicMenuBottomSheet for empty seats.

3. **Settings button visibility**: Wrapped Settings button in `{canDo(myRole, 'admin') && (...)}` so only admin+ roles can see/access it. Also hid the room mute button from non-admins.

4. **Room persistence**: Changed from sessionStorage to localStorage so room persists across refresh. On mount, verifies user is still a participant in the room before restoring. On exit, properly calls leave API.

5. **Role assignment**: Already implemented in ProfileBottomSheet - owner can change roles when clicking any participant's profile (including audience members).

Stage Summary:
- All 3 user-reported bugs fixed
- Room persistence improved with localStorage + participant verification
- Build passes with no errors
- Key files modified: src/app/voice-rooms/page.tsx
