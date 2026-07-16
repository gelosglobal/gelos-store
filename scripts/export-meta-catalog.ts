import { mkdir, writeFile } from 'fs/promises'
import path from 'path'
import { getAllProducts } from '@/lib/db/products'
import {
  buildMetaCatalogItems,
  parseMetaCatalogCurrency,
  parseMetaCatalogFormat,
  serializeMetaCatalogFeed,
  type MetaCatalogFormat,
} from '@/lib/meta-catalog-feed'

async function main() {
  const formatArg = process.argv.find((arg) => arg.startsWith('--format='))
  const currencyArg = process.argv.find((arg) => arg.startsWith('--currency='))
  const format = parseMetaCatalogFormat(formatArg?.split('=')[1] ?? 'csv')
  const currency = parseMetaCatalogCurrency(currencyArg?.split('=')[1] ?? 'GHS')

  const products = await getAllProducts()
  const items = buildMetaCatalogItems(products, { currency })
  const body = serializeMetaCatalogFeed(items, format)

  const outDir = path.join(process.cwd(), 'exports')
  await mkdir(outDir, { recursive: true })

  const filename = `gelos-meta-catalog.${format as MetaCatalogFormat}`
  const outPath = path.join(outDir, filename)
  await writeFile(outPath, body, 'utf8')

  console.log(`Wrote ${items.length} products → ${outPath}`)
  console.log(`Currency: ${currency}`)
  console.log('Upload this file in Meta Commerce Manager → Catalog → Data sources.')
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
