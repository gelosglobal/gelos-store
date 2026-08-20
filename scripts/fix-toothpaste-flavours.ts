/**
 * Fix Flavored Toothpaste variants after Shopify import.
 *
 * Product "1" already has the correct 15 flavour tiles. The import activated a
 * duplicate Passion Fruit (id 52), so the storefront rebuilt a broken 2-option
 * parent and variant switching looked mixed up.
 */
import { prisma } from '../lib/prisma'
import { getAllProducts } from '../lib/db/products'
import {
  buildProductLineParent,
  TOOTHPASTE_LINE_PARENT,
  presentProductsForStorefrontSections,
} from '../lib/product-line-parents'
import { getEffectiveVariantImages } from '../lib/product-variant-images'
import { normalizeImageUrl } from '../lib/image-url'

const DUPLICATE_PASSION_FRUIT_ID = '52'

/** Map flavour labels on product 1 → Gelos flavour SKU ids (for stock sync). */
const LABEL_TO_SKU: Record<string, string> = {
  watermelon: '1', // default image on aggregator; stock stays on variant tile
  strawberry: '15',
  'coconut whip': '13',
  'grape bubblegum': '17',
  banana: '14',
  'smooth mint': '37',
  'mango sorbet': '34',
  'peach iced tea': '33',
  'passion fruit': '16',
  'red velvet': '19',
  vanilla: '18',
  'energy drink': '11',
  'candy cane': '6',
  chocolate: '32',
  cola: '23',
}

async function main() {
  const apply = process.argv.includes('--apply')
  console.log(apply ? '=== APPLY ===' : '=== DRY RUN ===')

  const duplicate = await prisma.product.findUnique({
    where: { productId: DUPLICATE_PASSION_FRUIT_ID },
  })
  if (duplicate) {
    console.log(
      `Duplicate Passion Fruit ${duplicate.productId}: active=${duplicate.active !== false} → draft`,
    )
  }

  const aggregator = await prisma.product.findUnique({
    where: { productId: '1' },
  })
  if (!aggregator) throw new Error('Product 1 (Flavored Toothpaste) missing')

  const existingOpts = Array.isArray(aggregator.variantImageOptions)
    ? (aggregator.variantImageOptions as Array<{
        url: string
        label: string
        stock?: number
        sourceProductId?: string
        price?: number
      }>)
    : []

  const flavourDocs = await prisma.product.findMany({
    where: {
      productId: {
        in: Object.values(LABEL_TO_SKU).filter((id) => id !== '1'),
      },
    },
  })
  const byId = new Map(flavourDocs.map((doc) => [doc.productId, doc]))

  const synced = existingOpts.map((option) => {
    const key = option.label.trim().toLowerCase()
    const skuId = LABEL_TO_SKU[key]
    const sku = skuId && skuId !== '1' ? byId.get(skuId) : undefined
    return {
      url: normalizeImageUrl(option.url),
      label: option.label,
      stock: sku ? sku.stock : option.stock,
      sourceProductId: skuId && skuId !== '1' ? skuId : option.sourceProductId,
      price: sku?.price ?? option.price,
    }
  })

  console.log(`\nAggregator variants: ${synced.length}`)
  for (const option of synced) {
    console.log(
      `  ${option.label.padEnd(16)} stock=${option.stock ?? '—'} src=${option.sourceProductId ?? '—'}`,
    )
  }

  if (!apply) {
    console.log('\nDry run only. Re-run with --apply')
    await prisma.$disconnect()
    return
  }

  if (duplicate && duplicate.active !== false) {
    await prisma.product.update({
      where: { productId: DUPLICATE_PASSION_FRUIT_ID },
      data: { active: false },
    })
  }

  await prisma.product.update({
    where: { productId: '1' },
    data: {
      active: true,
      name: 'Flavored Toothpaste',
      slug: 'flavored-toothpaste',
      category: 'Toothpaste',
      variantImageOptions: synced,
      variantImages: synced.map((option) => option.url),
      carouselImages: synced.map((option) => option.url),
      image: synced[0]?.url || aggregator.image,
      stock: synced.reduce((sum, option) => sum + (option.stock ?? 0), 0),
    },
  })

  // Keep flavour SKUs draft so they don't spawn a second broken line parent.
  // Stock is mirrored onto product 1 tiles above.
  const flavourIds = Object.values(LABEL_TO_SKU).filter((id) => id !== '1')
  await prisma.product.updateMany({
    where: { productId: { in: flavourIds } },
    data: { active: false },
  })

  const products = await getAllProducts()
  const presented = presentProductsForStorefrontSections(
    products.filter((p) => p.id === '1'),
    products,
  )
  const card = presented[0]
  console.log('\nStorefront card check:')
  console.log('  id=', card?.id, 'name=', card?.name)
  console.log(
    '  variants=',
    card?.variantImageOptions?.length,
    'thumbs=',
    card ? getEffectiveVariantImages(card).length : 0,
  )

  const parent = buildProductLineParent(products, TOOTHPASTE_LINE_PARENT)
  console.log(
    '  line parent=',
    parent
      ? `built with ${parent.variantImageOptions?.length} opts (should prefer admin tiles)`
      : 'null (good — card uses product 1 tiles)',
  )

  console.log('\nDone. Refresh the homepage and click toothpaste flavour thumbs.')
  await prisma.$disconnect()
}

main().catch(async (error) => {
  console.error(error)
  await prisma.$disconnect().catch(() => undefined)
  process.exit(1)
})
