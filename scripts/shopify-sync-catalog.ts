/**
 * Sync Gelos product copy/tags/PDP (+ optional gallery files) → Shopify.
 *
 * Prerequisites:
 * 1. SHOPIFY_STORE_DOMAIN + SHOPIFY_CLIENT_ID + SHOPIFY_CLIENT_SECRET in .env.local
 * 2. Metafields:
 *    - custom.pdp (JSON) + Storefront API access
 *    - custom.gallery (List of files) + Storefront API access
 * 3. Admin scopes: read_products, write_products
 *    For --gallery also: read_files, write_files
 * 4. Gallery sources (first match wins):
 *    - data/shopify-gallery-sources.json  { "handle": ["https://...", "video:https://..."] }
 *    - product.galleryImages
 *    - PDP content galleryImages
 *    Relative /gelos/... paths need NEXT_PUBLIC_APP_URL (publicly reachable)
 *
 * Usage:
 *   pnpm shopify:sync-catalog -- --dry-run
 *   pnpm shopify:sync-catalog
 *   pnpm shopify:sync-catalog -- --gallery
 *   pnpm shopify:sync-catalog -- --gallery --dry-run
 */

import { getAllProducts } from '@/lib/db/products'
import { isShopifyAdminConfigured } from '@/lib/shopify/admin-client'
import { syncGelosProductsToShopify } from '@/lib/shopify/sync-catalog'

async function main() {
  const dryRun = process.argv.includes('--dry-run')
  const syncGallery = process.argv.includes('--gallery')

  if (!isShopifyAdminConfigured()) {
    console.error(
      'Missing Shopify Admin credentials.\n' +
        'Add to .env.local:\n' +
        '  SHOPIFY_STORE_DOMAIN=your-store.myshopify.com\n' +
        '  SHOPIFY_CLIENT_ID=...\n' +
        '  SHOPIFY_CLIENT_SECRET=...\n' +
        'Scopes: read_products, write_products' +
        (syncGallery ? ', read_files, write_files' : ''),
    )
    process.exit(1)
  }

  console.log(
    dryRun
      ? 'Dry run — no Shopify writes will be made.\n'
      : syncGallery
        ? 'Syncing Gelos → Shopify (PDP + custom.gallery files)…\n'
        : 'Syncing Gelos → Shopify (tags, type, description, custom.pdp)…\n',
  )

  const products = await getAllProducts()
  console.log(`Loaded ${products.length} Gelos-mapped products`)

  const results = await syncGelosProductsToShopify(products, {
    dryRun,
    syncGallery,
  })

  const updated = results.filter((row) => row.status === 'updated').length
  const skipped = results.filter((row) => row.status === 'skipped').length
  const errored = results.filter((row) => row.status === 'error').length

  for (const row of results) {
    const icon =
      row.status === 'updated' ? '✓' : row.status === 'skipped' ? '·' : '✗'
    console.log(
      `${icon} ${row.handle}${row.message ? ` — ${row.message}` : ''}`,
    )
  }

  console.log(
    `\nDone. updated=${updated} skipped=${skipped} errors=${errored}`,
  )

  if (errored > 0) process.exit(1)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
