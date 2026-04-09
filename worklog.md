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
