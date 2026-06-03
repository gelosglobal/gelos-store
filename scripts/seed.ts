import { prisma } from '../lib/prisma'
import { seedCatalog } from '../lib/db/seed-catalog'
import { seedTagCollectionsIfEmpty } from '../lib/db/tag-collections'
import { getDatabaseUrl } from '../lib/env'

async function seed() {
  const url = getDatabaseUrl()
  if (!url) {
    console.error('Set DATABASE_URL or MONGODB_URI in .env.local')
    process.exit(1)
  }

  console.log('Seeding with Prisma…')
  const count = await seedCatalog()
  await seedTagCollectionsIfEmpty()
  const total = await prisma.product.count()
  console.log(`Seeded ${count} products (${total} in database)`)
  console.log('Tag collection orders initialized where defaults exist')
}

seed()
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
