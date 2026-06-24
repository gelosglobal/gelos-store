import { Prisma, PrismaClient } from '@prisma/client'
import { getDatabaseUrl } from '@/lib/env'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
  prismaSchemaSignature?: string
}

/** Changes when Product scalar fields change — busts cached clients after `prisma generate`. */
const PRODUCT_SCHEMA_SIGNATURE = Object.keys(Prisma.ProductScalarFieldEnum)
  .sort()
  .join(',')

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

const REQUIRED_DELEGATES = [
  'order',
  'storeSettings',
  'tagCollection',
  'smileScan',
  'customer',
  'affiliate',
  'inboxThread',
  'inboxMessage',
] as const

/** Hot reload can keep an old PrismaClient missing newly generated models/fields. */
function isPrismaClientStale(client: PrismaClient) {
  if (globalForPrisma.prismaSchemaSignature !== PRODUCT_SCHEMA_SIGNATURE) {
    return true
  }

  const productFields = Prisma.ProductScalarFieldEnum
  return (
    REQUIRED_DELEGATES.some(
      (delegate) =>
        !(delegate in client) ||
        !(client as Record<string, unknown>)[delegate],
    ) || !('galleryImages' in productFields) || !('carouselImages' in productFields) || !('variantImageOptions' in productFields) || !('active' in productFields)
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
  globalForPrisma.prisma = client
  globalForPrisma.prismaSchemaSignature = PRODUCT_SCHEMA_SIGNATURE
  return client
}

/** Proxy ensures hot reload picks up newly generated Prisma models/delegates. */
export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop: string | symbol) {
    if (prop === 'then') return undefined

    const client = getPrismaClient()
    const value = Reflect.get(client, prop, client)
    return typeof value === 'function' ? value.bind(client) : value
  },
  has(_target, prop) {
    return Reflect.has(getPrismaClient(), prop)
  },
})
