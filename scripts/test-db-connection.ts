/**
 * Test MongoDB connection from .env.local
 * Run: pnpm db:test
 */
import { PrismaClient } from '@prisma/client'
import { getDatabaseUrl } from '../lib/env'

async function main() {
  const url = getDatabaseUrl()
  if (!url) {
    console.error('No DATABASE_URL or MONGODB_URI in .env.local')
    process.exit(1)
  }

  // Show safe preview (hide password)
  const preview = url.replace(/:([^:@]+)@/, ':****@')
  console.log('Connecting to:', preview)

  const prisma = new PrismaClient()
  try {
    await prisma.$connect()
    const count = await prisma.product.count()
    console.log('OK — connected. Products in DB:', count)
  } catch (err) {
    console.error('\nConnection failed.\n')
    if (err instanceof Error) {
      console.error(err.message)
    }
    console.error(`
Atlas "bad auth" usually means:
  1. Wrong username or password in DATABASE_URL
  2. User not created under Database Access in Atlas
  3. Password has special characters — URL-encode them (@ → %40, # → %23, etc.)
  4. IP not allowed under Network Access (add 0.0.0.0/0 for dev)

Fix: Atlas → your cluster → Connect → Drivers → copy the full string
     and replace DATABASE_URL in .env.local (keep /gelos before the ?).
`)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
