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
