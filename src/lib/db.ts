import { PrismaClient } from '@prisma/client'
import { PrismaLibSQL } from '@prisma/adapter-libsql'
import { createClient } from '@libsql/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createPrismaClient() {
  const dbUrl = process.env.TURSO_DATABASE_URL || process.env.DATABASE_URL || ''

  if (dbUrl.includes('libsql://')) {
    // Turso / libSQL remote database
    const authToken = process.env.TURSO_AUTH_TOKEN || ''
    const libsql = createClient({
      url: dbUrl,
      authToken: authToken,
    })
    const adapter = new PrismaLibSQL(libsql)
    return new PrismaClient({
      adapter,
      datasources: { db: { url: dbUrl } },
    })
  }

  // Local SQLite fallback
  return new PrismaClient()
}

export const db =
  globalForPrisma.prisma ??
  createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
