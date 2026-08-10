/**
 * Sync Shopify "New Arrivals" collection manual order → Gelos Admin
 * tag collection `new-arrival` (homepage + /shop?new-arrivals=true).
 *
 * Default collection:
 *   https://admin.shopify.com/store/304deb-d0/collections/304713334983
 *
 * Usage:
 *   pnpm shopify:sync-new-arrivals
 *   pnpm shopify:sync-new-arrivals -- --collection=304713334983
 *   pnpm shopify:sync-new-arrivals -- --dry-run
 */

import { isDatabaseConfigured } from '@/lib/env'
import {
  fetchShopifyCollectionProductIds,
  syncNewArrivalsFromShopifyCollection,
} from '@/lib/shopify/sync-new-arrivals-collection'

async function main() {
  const dryRun = process.argv.includes('--dry-run')
  const collectionArg = process.argv.find((arg) =>
    arg.startsWith('--collection='),
  )
  const collectionId =
    collectionArg?.slice('--collection='.length)?.trim() || '304713334983'

  if (!dryRun && !isDatabaseConfigured()) {
    console.error('Missing DATABASE_URL — cannot save the Gelos collection order.')
    process.exit(1)
  }

  console.log(`Fetching Shopify collection ${collectionId}…`)

  if (dryRun) {
    const fetched = await fetchShopifyCollectionProductIds(collectionId)
    console.log(
      `\n[dry-run via ${fetched.source}] "${fetched.collectionTitle}" (${fetched.collectionHandle}) — ${fetched.productIds.length} products:\n`,
    )
    fetched.handles.forEach((handle, index) => {
      console.log(`  ${index + 1}. ${handle}  (${fetched.productIds[index]})`)
    })
    return
  }

  const result = await syncNewArrivalsFromShopifyCollection(collectionId)
  console.log(
    `\nSynced via ${result.source} — "${result.collectionTitle}" → Gelos new-arrival (${result.productIds.length} products):\n`,
  )
  result.handles.forEach((handle, index) => {
    console.log(`  ${index + 1}. ${handle}  (${result.productIds[index]})`)
  })
  console.log('\nHomepage + /shop?new-arrivals=true will use this order.')
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
