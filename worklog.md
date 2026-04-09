---
Task ID: 1
Agent: Main Agent
Task: Completely replace Prisma with direct @libsql/client usage (fix Vercel build failures)

Work Log:
- Analyzed all 9 API route files to catalog every Prisma operation used
- Created new src/lib/turso.ts with direct @libsql/client (no Prisma dependency)
  - Connection: supports TURSO_DATABASE_URL (remote) and DATABASE_URL (local SQLite)
  - Auto-creates Room and RoomPlayer tables via CREATE TABLE IF NOT EXISTS
  - Boolean<->integer conversion for SQLite (isAlive, isSilenced, hasRevealedMayor, hasJoined)
  - Date->ISO string conversion for hostLastSeen and other datetime fields
  - Helper functions: getRoomByCode, getRoomWithPlayers, createRoom, updateRoom, updateRoomWithPlayers, createPlayer, updatePlayer, updatePlayersByRoomId, updatePlayersByName, deletePlayer, generateId
  - Dynamic SET clause building for update functions
  - Parameterized queries throughout for SQL injection prevention
- Updated all 9 API route files:
  1. src/app/api/room/route.ts (POST create room)
  2. src/app/api/room/[code]/join/route.ts (POST join, PATCH approve/reject)
  3. src/app/api/room/[code]/heartbeat/route.ts (POST heartbeat)
  4. src/app/api/room/[code]/start/route.ts (POST start game)
  5. src/app/api/room/[code]/vote/route.ts (POST vote)
  6. src/app/api/room/[code]/night-action/route.ts (POST night action)
  7. src/app/api/room/[code]/mayor-reveal/route.ts (POST mayor reveal)
  8. src/app/api/room/[code]/good-son-revenge/route.ts (POST good son revenge)
  9. src/app/api/room/[code]/route.ts (GET/PUT/DELETE room)
- Minimal route changes: Date→toISOString() in heartbeat and DELETE, removed .toISOString() call on hostLastSeen in GET (already a string now), added generateId() for createRoom/createPlayer
- Updated package.json: removed @prisma/adapter-libsql, @prisma/client, prisma deps; removed db:push, db:generate, db:migrate, db:reset scripts; removed postinstall script
- Deleted src/lib/db.ts (old Prisma client)
- Ran bun install (3 packages removed)
- Verified: no import errors, dev server starts cleanly, lint shows only pre-existing UI errors (not related to migration)

Stage Summary:
- Complete Prisma→@libsql/client migration for all room API routes
- Zero Prisma dependencies remain in the project
- All game logic, validation, and business rules preserved exactly as before
- Tables auto-create on first connection (no migration tooling needed)
---
Task ID: 2
Agent: main
Task: Fix Vercel deployment - replace Prisma with direct @libsql/client for Turso

Work Log:
- Diagnosed root cause: process.env vars (TURSO_DATABASE_URL, DATABASE_URL) were undefined at runtime on Vercel despite being set in dashboard. Prisma's schema.prisma reads env("DATABASE_URL") at client initialization, and Next.js Turbopack was not providing the values correctly.
- Fixed PrismaLibSQL constructor name typo (was PrismaLibSql, correct: PrismaLibSQL)
- After build succeeded, runtime still failed with URL_INVALID: The URL 'undefined'
- Added debug logging and debug endpoint /api/debug-env
- Confirmed env vars are set correctly on Vercel but not accessible at runtime through Prisma
- Solution: Replaced ALL Prisma usage with direct @libsql/client connection in new src/lib/turso.ts
- Created typed helper functions: findRoomByCode, findRoomWithPlayers, createRoom, updateRoomByCode, createPlayer, updatePlayerById, updatePlayersByRoomId, deletePlayerById, testConnection
- Rewrote all 9 room API route files to use turso.ts instead of db.ts
- Added automatic schema initialization (CREATE TABLE IF NOT EXISTS) for Room and RoomPlayer tables

Stage Summary:
- Commit d63b497: "استبدال Prisma بـ @libsql/client مباشرة للاتصال بـ Turso"
- 11 files changed: new turso.ts + 10 route files updated
- No more Prisma adapter dependency - uses @libsql/client directly as Turso recommends for Next.js
---
Task ID: 1
Agent: Main Agent
Task: Add new game "السجن" (The Prison) with العراب + الديوانية modes

Work Log:
- Studied reference game at https://q-kio.com/the-cell-control.html?room=3801
- Extracted game mechanics: 5 item types (open/uniform/skull/key/skip), 3 grid sizes (9/16/20)
- Downloaded all game images (skull, open, uniform, key, skip, instructions) via browser automation
- Studied Tobol architecture as blueprint for implementation
- Created src/lib/prison-types.ts - Types, configs, grid generator, helper functions
- Created src/lib/prison-store.ts - Zustand store with full game logic (العراب mode)
- Created src/lib/prison-room-store.ts - In-memory room storage (الديوانية mode)
- Created 4 API routes: /api/prison-room/, /api/prison-room/[code]/, heartbeat, spectator
- Created 5 UI components: LandingPage, GameSetup, GameBoard, PrisonGameOver, PrisonSpectatorView
- Created main page: src/app/prison/page.tsx (with BrandedHeader/Footer, GameTopBar, heartbeat)
- Created join page: src/app/join/prison/[code]/page.tsx (with spectator redirect logic)
- Added prison-bg and prison-scrollbar CSS to globals.css
- Updated homepage: added prison game card, updated floating emoji
- Cleaned up old duplicate files (PrisonGameBoard.tsx, PrisonSetup.tsx)
- Verified: zero prison-related lint errors, /prison returns 200

Stage Summary:
- Complete prison game with العراب (local) and الديوانية (spectator) modes
- 5 cell item types with different game effects
- Two-team turn-based gameplay with player selection
- 3 grid size options (9/16/20 cells)
- Real-time spectator mode with 2s polling
- Room code sharing for diwaniya mode
- All images stored at /public/img/prison/
- Game features: imprison opponents, self-imprison, execution, free teammates, skip turn
---
Task ID: 2
Agent: Main Agent
Task: Fix double name prompt in prison Diwaniya spectator join flow

Work Log:
- Investigated join flow: Landing page → /join/prison/{CODE}?name={NAME} → JoinForm (asks name again)
- Root cause: JoinForm always rendered even when ?name= was in URL from landing page
- Fix: Added auto-join logic in JoinPrisonPage that auto-calls spectator API when ?name= present but no ?spectatorId=
- Shows loading state "جاري الانضمام كمشاهد..." during auto-join
- Falls back to JoinForm (with name pre-filled) on API error
- Restructured component to use useSearchParams + ref-based approach to avoid extra lint issues
- JoinForm now accepts initialName prop for pre-filling

Stage Summary:
- Fixed: spectator auto-joins without seeing redundant name form
- File changed: src/app/join/prison/[code]/page.tsx
- Flow: enter name → auto-join API → redirect with spectatorId → spectator view (no intermediate form)
---
Task ID: 3
Agent: Main Agent
Task: Fix copy code button + add copy link button in prison and tobol games

Work Log:
- Investigated all copy-to-clipboard implementations across games (prison, tobol, tabot, mafia, diwaniya)
- Found prison copy button used bare `navigator.clipboard.writeText()` without feedback or error handling
- Found same issue in tobol/page.tsx and tobol/GameBoard.tsx
- Fixed all three files:
  1. src/app/prison/page.tsx - copyCode + copyLink with .then()/.catch() fallback + visual feedback (Check/Copy icons)
  2. src/app/tobol/page.tsx - same pattern
  3. src/components/tobol/GameBoard.tsx - same pattern for RoomCodeBanner
- Added copy link button (🔗 نسخ رابط الانضمام) to both prison and tobol GameTopBar
- Link format: `${window.location.origin}/join/prison/${roomCode}` and `/join/tobol/${roomCode}`
- Used document.execCommand('copy') as fallback for non-HTTPS contexts
- Added icons: Copy, Check, Link2 from lucide-react
- Visual feedback: icon toggles Copy→Check for 2 seconds, text changes to "تم!" / "✅ تم نسخ الرابط!"

Stage Summary:
- Copy code button now works reliably with fallback for non-HTTPS
- New copy link button added for sharing full join URL
- Fixed in 3 files: prison/page.tsx, tobol/page.tsx, tobol/GameBoard.tsx
