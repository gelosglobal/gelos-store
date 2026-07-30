import { getAllProducts } from '@/lib/db/products'
import { syncGelosProductsToShopify } from '@/lib/shopify/sync-catalog'

const fails = new Set([
  'watermelon-toothpaste',
  'tongue-scraper-2',
  'electric-toothbrush',
  'v34-teeth-whitening-kit',
  'watermelon-foaming-mouthwash',
  'full-energy-inhaler-grape-mint',
  'tumeric-teeth-whitening-powder',
])

async function main() {
  const all = await getAllProducts()
  const products = all.filter((p) =>
    fails.has((p.handle || '').toLowerCase()),
  )
  console.log('Retrying gallery for:', products.map((p) => p.handle).join(', '))
  const results = await syncGelosProductsToShopify(products, {
    syncGallery: true,
  })
  for (const row of results) {
    const icon =
      row.status === 'updated' ? '✓' : row.status === 'skipped' ? '·' : '✗'
    console.log(
      `${icon} ${row.handle}${row.message ? ` — ${row.message}` : ''}`,
    )
  }
  const errors = results.filter((r) => r.status === 'error').length
  if (errors > 0) process.exit(1)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
