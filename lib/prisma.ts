import { Prisma, PrismaClient } from '@prisma/client'
import { getDatabaseUrl } from '@/lib/env'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

/** Prisma schema uses DATABASE_URL; copy MONGODB_URI when only that is set */
function ensureDatabaseUrl() {
  const url = getDatabaseUrl()
  if (url && !process.env.DATABASE_URL) {
    process.env.DATABASE_URL = url
  }
}

function createPrismaClient() {
  ensureDatabaseUrl()
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  })
}

/** Hot reload can keep an old PrismaClient missing newly generated models/fields. */
function isPrismaClientStale(_client: PrismaClient) {
  const productFields = Prisma.ProductScalarFieldEnum
  return (
    !('tagCollection' in _client) ||
    !('galleryImages' in productFields)
  )
}

function getPrismaClient() {
  const existing = globalForPrisma.prisma
  if (existing && !isPrismaClientStale(existing)) {
    return existing
  }
  if (existing) {
    void existing.$disconnect()
  }
  const client = createPrismaClient()
  if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = client
  }
  return client
}

export const prisma = getPrismaClient()
