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
---
Task ID: 1
Agent: Main Agent
Task: Fix voice room UX bugs reported by user (empty mic click, mute button, polling, profiles, roles, unregistered users)

Work Log:
- Read and analyzed full voice-rooms/page.tsx (2182 lines) and admin-db.ts
- Fixed empty mic click behavior: regular users sit directly on open mic, admins see menu with sit/close options
- Verified room mute button already has correct permission check (canDo admin)
- Stabilized polling by using useRef pattern to prevent re-render loops caused by fetchChatMessages depending on lastChatTimestamp
- Made chat avatars and names clickable to open profile sheet (finds participant or creates temp profile)
- Added "View Profile" button to admin mic menu for occupied seats
- Enhanced ProfileBottomSheet: "Grant Membership" one-click for visitors, role change UI for members
- Added guest detection (isGuest) based on empty username or guest- prefix
- Added "Guest" indicator badge in profile header, guest notice for admins
- Disabled chat input for unregistered users with "login to participate" placeholder
- Hidden gift button from bottom bar for unregistered users
- Hidden gift button from profile sheet for unregistered current users
- Added distinctive "?" badge on audience avatars for unregistered users
- Built successfully, committed and pushed to main

Stage Summary:
- Commit: 73d6702
- File changed: src/app/voice-rooms/page.tsx (+208, -61 lines)
- All builds passing
- Key fixes: mic click behavior, polling stability, clickable profiles, role management, unregistered user handling

---
Task ID: 1
Agent: Main
Task: Answer user questions about voice permissions on small screens and profile picture upload

Work Log:
- Analyzed voice room page.tsx for responsive design - confirmed grid-cols-5 mic layout, bottom sheets, flex bottom bar all work on small screens
- Checked profile/page.tsx - found avatar field in DB but NO upload UI existed
- Checked update-profile API - already supports avatar field with PUT method
- Added Camera icon import from lucide-react
- Added useRef for hidden file input
- Added handleAvatarUpload function: validates file type/size (max 5MB), resizes to 256x256 using Canvas API, converts to JPEG base64, sends to update-profile API
- Added hidden file input + camera button overlay on avatar in profile page
- Fixed existing handleSaveProfile to use PUT instead of POST (API uses PUT)
- Verified build compiles successfully

Stage Summary:
- Voice permissions work fine on small screens (responsive design confirmed)
- Profile picture upload feature implemented: users can tap camera icon on avatar to upload image
- Image is resized client-side to 256x256 max, compressed to JPEG quality 0.8
- Base64 data URL stored in avatar field via existing update-profile API
