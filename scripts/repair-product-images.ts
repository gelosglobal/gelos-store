import { prisma } from '../lib/prisma'
import { normalizeImageUrl } from '../lib/image-url'
import { getDatabaseUrl } from '../lib/env'

async function repair() {
  const url = getDatabaseUrl()
  if (!url) {
    console.error('Set DATABASE_URL in .env.local')
    process.exit(1)
  }

  const products = await prisma.product.findMany()
  let fixed = 0

  for (const doc of products) {
    const next = normalizeImageUrl(doc.image)
    if (next !== doc.image) {
      await prisma.product.update({
        where: { productId: doc.productId },
        data: { image: next },
      })
      console.log(`Fixed ${doc.productId}: ${doc.image} -> ${next}`)
      fixed++
    }
  }

  console.log(`Repaired ${fixed} of ${products.length} product images`)
}

repair()
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
