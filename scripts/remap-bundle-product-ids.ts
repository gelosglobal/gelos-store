import { PrismaClient } from '@prisma/client'
import { listProductBundles, updateProductBundle } from '@/lib/db/product-bundles'
import { getAllProducts } from '@/lib/db/products'
import {
  LEGACY_BUNDLE_PRODUCT_TO_HANDLE,
  resolveBundleProductIdAgainstCatalog,
} from '@/lib/product-bundle-id-map'
import { getProductSlug } from '@/lib/product-utils'

async function main() {
  const dryRun = process.argv.includes('--dry-run')
  const prisma = new PrismaClient()

  try {
    const bundles = await listProductBundles({ activeOnly: false })
    const shopifyProducts = await getAllProducts()
    const neededIds = [...new Set(bundles.flatMap((bundle) => bundle.productIds))]

    console.log(`Shopify products: ${shopifyProducts.length}`)
    console.log(`Bundles: ${bundles.length}`)
    console.log(`IDs in bundles: ${neededIds.join(', ')}`)
    console.log(
      `Alias map keys: ${Object.keys(LEGACY_BUNDLE_PRODUCT_TO_HANDLE).join(', ')}`,
    )

    for (const legacyId of neededIds) {
      const matchedId = resolveBundleProductIdAgainstCatalog(
        legacyId,
        shopifyProducts,
      )
      const matched = shopifyProducts.find((product) => product.id === matchedId)
      if (!matched) {
        console.log(`✗ ${legacyId}`)
        continue
      }
      console.log(
        `✓ ${legacyId} → ${matched.id} "${matched.name}" (${matched.handle || getProductSlug(matched)})`,
      )
    }

    for (const bundle of bundles) {
      const nextIds = [
        ...new Set(
          bundle.productIds
            .map((id) =>
              resolveBundleProductIdAgainstCatalog(id, shopifyProducts),
            )
            .filter((id): id is string => Boolean(id)),
        ),
      ]

      console.log(
        `\n${bundle.id}: ${bundle.productIds.join(', ')} → ${nextIds.join(', ') || '(empty)'}`,
      )

      if (dryRun) continue

      await updateProductBundle(bundle.id, {
        productIds: nextIds,
      })
    }

    if (dryRun) {
      console.log('\nDry run only — no DB writes.')
    } else {
      console.log('\nUpdated bundle productIds to Shopify catalog ids.')
    }
  } finally {
    await prisma.$disconnect()
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
