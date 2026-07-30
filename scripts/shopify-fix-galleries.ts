/**
 * Dedupe data/shopify-gallery-sources.json (CDN/UFS/UUID clones),
 * then re-upload galleries for selected handles (default: LED kit + video-heavy SKUs).
 *
 * Usage:
 *   pnpm exec tsx --env-file=.env.local scripts/shopify-fix-galleries.ts
 *   pnpm exec tsx --env-file=.env.local scripts/shopify-fix-galleries.ts -- --all
 *   pnpm exec tsx --env-file=.env.local scripts/shopify-fix-galleries.ts -- teeth-whitening-kit
 */

import { writeFileSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { getAllProducts } from '@/lib/db/products'
import { dedupeGallerySourceEntriesAsync } from '@/lib/product-gallery-images'
import { syncGelosProductsToShopify } from '@/lib/shopify/sync-catalog'

const DEFAULT_HANDLES = [
  'teeth-whitening-kit',
  'v34-teeth-whitening-kit',
  'full-energy-inhaler-grape-mint',
  'tumeric-teeth-whitening-powder',
  'electric-toothbrush',
  'watermelon-toothpaste',
  'watermelon-foaming-mouthwash',
  'tongue-scraper-2',
]

async function cleanSourcesFile() {
  const path = join(process.cwd(), 'data', 'shopify-gallery-sources.json')
  const raw = JSON.parse(readFileSync(path, 'utf8')) as Record<string, string[]>
  const cleaned: Record<string, string[]> = {}
  let before = 0
  let after = 0

  for (const [handle, entries] of Object.entries(raw)) {
    before += entries.length
    const next = await dedupeGallerySourceEntriesAsync(entries)
    after += next.length
    cleaned[handle] = next
    if (next.length !== entries.length) {
      console.log(
        `  ${handle}: ${entries.length} → ${next.length}`,
      )
    }
  }

  writeFileSync(path, `${JSON.stringify(cleaned, null, 2)}\n`)
  console.log(`Sources cleaned: ${before} → ${after} entries\n`)
}

async function main() {
  const args = process.argv.slice(2).filter((arg) => arg !== '--')
  const all = args.includes('--all')
  const handles = all
    ? null
    : new Set(
        (args.length ? args : DEFAULT_HANDLES).map((h) => h.toLowerCase()),
      )

  console.log('Deduping data/shopify-gallery-sources.json…')
  await cleanSourcesFile()

  const products = await getAllProducts()
  const selected = products.filter((product) => {
    const handle = (product.handle || '').toLowerCase()
    return handles ? handles.has(handle) : true
  })

  console.log(
    `Re-syncing gallery for ${selected.length} product(s): ${selected
      .map((p) => p.handle)
      .join(', ')}\n`,
  )

  const results = await syncGelosProductsToShopify(selected, {
    syncGallery: true,
  })

  for (const row of results) {
    const icon =
      row.status === 'updated' ? '✓' : row.status === 'skipped' ? '·' : '✗'
    console.log(
      `${icon} ${row.handle}${row.message ? ` — ${row.message}` : ''}`,
    )
  }

  const errors = results.filter((row) => row.status === 'error').length
  if (errors > 0) process.exit(1)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
