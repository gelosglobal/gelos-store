import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

for (const line of readFileSync(resolve('.env.local'), 'utf8').split('\n')) {
  const trimmed = line.trim()
  if (!trimmed || trimmed.startsWith('#')) continue
  const eq = trimmed.indexOf('=')
  if (eq <= 0) continue
  const key = trimmed.slice(0, eq).trim()
  let value = trimmed.slice(eq + 1).trim()
  if (
    (value.startsWith("'") && value.endsWith("'")) ||
    (value.startsWith('"') && value.endsWith('"'))
  ) {
    value = value.slice(1, -1)
  }
  if (process.env[key] === undefined) process.env[key] = value
}

function looksShopifyId(id: string) {
  return /^\d{10,}$/.test(id)
}

async function fetchShopifyProducts(
  shopifyIds: string[],
): Promise<Map<string, { handle: string; title: string }>> {
  const result = new Map<string, { handle: string; title: string }>()
  if (shopifyIds.length === 0) return result

  const { shopifyAdminFetch } = await import('../lib/shopify/admin-client')

  // Batch in chunks of 20
  for (let i = 0; i < shopifyIds.length; i += 20) {
    const chunk = shopifyIds.slice(i, i + 20)
    const ids = chunk.map((id) => `gid://shopify/Product/${id}`)
    const data = await shopifyAdminFetch<{
      nodes: Array<{
        id?: string
        handle?: string
        title?: string
        status?: string
      } | null>
    }>(
      `#graphql
      query GelosResolveProducts($ids: [ID!]!) {
        nodes(ids: $ids) {
          ... on Product {
            id
            handle
            title
            status
          }
        }
      }`,
      { ids },
    )

    for (const node of data.nodes) {
      if (!node?.id || !node.handle) continue
      const numeric = node.id.split('/').pop()
      if (numeric) {
        result.set(numeric, {
          handle: node.handle.toLowerCase(),
          title: (node.title || '').trim(),
        })
      }
    }
  }

  return result
}

async function main() {
  const apply = process.argv.includes('--apply')

  const { isShopifyCatalogEnabled } = await import('../lib/shopify/config')
  const { getAllProducts } = await import('../lib/db/products')
  const {
    getAllTagCollectionOrders,
    saveTagCollectionOrder,
  } = await import('../lib/db/tag-collections')
  const { getDefaultTagCollectionOrder } = await import(
    '../lib/tag-collection-defaults'
  )
  const {
    listProductBundles,
    updateProductBundle,
  } = await import('../lib/db/product-bundles')
  const { orderProductsForTagCollection } = await import('../lib/product-tags')
  const { newArrivalProductIds } = await import('../lib/new-arrivals')
  const { bestSellerIds } = await import('../lib/best-seller-meta')
  const { LEGACY_BUNDLE_PRODUCT_TO_HANDLE } = await import(
    '../lib/product-bundle-id-map'
  )
  const { getProductSlug } = await import('../lib/product-utils')
  const { prisma } = await import('../lib/prisma')

  console.log('=== Catalog mode ===')
  console.log('SHOPIFY_CATALOG_ENABLED:', process.env.SHOPIFY_CATALOG_ENABLED)
  console.log('isShopifyCatalogEnabled():', isShopifyCatalogEnabled())

  const products = await getAllProducts()
  console.log('products:', products.length)

  const byId = new Map(products.map((p) => [p.id, p]))
  const byHandle = new Map(
    products.map((p) => [
      (p.handle || getProductSlug(p)).toLowerCase(),
      p,
    ]),
  )
  const byName = new Map(
    products.map((p) => [p.name.trim().toLowerCase(), p]),
  )

  // handle → preferred Prisma id (numeric legacy keys win)
  const handleToPrismaId = new Map<string, string>()
  for (const [legacyId, handle] of Object.entries(
    LEGACY_BUNDLE_PRODUCT_TO_HANDLE,
  )) {
    const h = handle.toLowerCase()
    if (/^\d+$/.test(legacyId) && byId.has(legacyId)) {
      handleToPrismaId.set(h, legacyId)
    } else if (!handleToPrismaId.has(h) && byHandle.has(h)) {
      handleToPrismaId.set(h, byHandle.get(h)!.id)
    }
  }
  for (const product of products) {
    const h = (product.handle || getProductSlug(product)).toLowerCase()
    if (!handleToPrismaId.has(h)) handleToPrismaId.set(h, product.id)
  }

  // ---- Tag collections ----
  console.log('\n=== Tag collections ===')
  const tags = await getAllTagCollectionOrders()
  for (const tagId of [
    'new-arrival',
    'best-seller',
    'featured',
    'bundle',
  ] as const) {
    const order = tags[tagId] ?? []
    const matched = order.filter((id) => byId.has(id)).length
    const shopifyish = order.filter(looksShopifyId).length
    console.log(
      `${tagId}: ${order.length} ids, ${matched} match Prisma, ${shopifyish} look like Shopify`,
    )
    if (order.length && matched === 0 && shopifyish > 0) {
      const defaults = getDefaultTagCollectionOrder(tagId)
      console.log(`  → would reset to defaults (${defaults.length}):`, defaults)
      if (apply && defaults.length) {
        await saveTagCollectionOrder(tagId, defaults)
        console.log('  ✓ reset')
      }
    }
  }

  // Resolve shop page sections after potential reset
  const tagsAfter = apply ? await getAllTagCollectionOrders() : tags
  for (const [tag, legacy] of [
    ['new-arrival', newArrivalProductIds],
    ['best-seller', bestSellerIds],
    ['bundle', undefined],
    ['featured', undefined],
  ] as const) {
    const ordered = orderProductsForTagCollection(
      products,
      tag,
      tagsAfter[tag],
      legacy,
    )
    console.log(
      `  resolved ${tag}: ${ordered.length}`,
      ordered.map((p) => p.name).slice(0, 6),
    )
  }

  // Products with bundle tag
  const taggedBundles = products.filter((p) => p.tags?.includes('bundle'))
  console.log(
    `\nProducts tagged bundle: ${taggedBundles.length}`,
    taggedBundles.map((p) => `${p.id}:${p.name}`),
  )

  // ---- Named product bundles ----
  console.log('\n=== Product bundles ===')
  const bundles = await listProductBundles({ activeOnly: false })
  console.log('bundle count:', bundles.length)

  const allShopifyIds = [
    ...new Set(
      bundles.flatMap((b) => b.productIds).filter((id) => looksShopifyId(id) && !byId.has(id)),
    ),
  ]

  let shopifyMeta = new Map<string, { handle: string; title: string }>()
  if (allShopifyIds.length > 0) {
    console.log('Looking up', allShopifyIds.length, 'Shopify IDs via Admin API…')
    try {
      shopifyMeta = await fetchShopifyProducts(allShopifyIds)
      console.log('Resolved from Shopify:', shopifyMeta.size)
      for (const [id, meta] of shopifyMeta) {
        console.log(`  ${id} → ${meta.handle} (${meta.title})`)
      }
    } catch (error) {
      console.error('Shopify Admin lookup failed:', error)
    }
  }

  function normalizeName(value: string) {
    return value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, ' ')
      .trim()
  }

  function resolveToPrismaId(id: string): string | undefined {
    if (byId.has(id)) return id

    const meta = shopifyMeta.get(id)
    if (meta) {
      if (handleToPrismaId.has(meta.handle)) return handleToPrismaId.get(meta.handle)
      if (byHandle.has(meta.handle)) return byHandle.get(meta.handle)!.id
      const byExactName = byName.get(meta.title.toLowerCase())
      if (byExactName) return byExactName.id
      const norm = normalizeName(meta.title)
      for (const product of products) {
        if (normalizeName(product.name) === norm) return product.id
      }
    }

    // Legacy alias already points at handle; if id is a handle/slug
    const asHandle = LEGACY_BUNDLE_PRODUCT_TO_HANDLE[id.toLowerCase()]
    if (asHandle && byHandle.has(asHandle)) return byHandle.get(asHandle)!.id
    if (byHandle.has(id.toLowerCase())) return byHandle.get(id.toLowerCase())!.id

    return undefined
  }

  let brokenBundles = 0
  for (const bundle of bundles) {
    const resolved = bundle.productIds
      .map((id) => ({ from: id, to: resolveToPrismaId(id) }))
    const ok = resolved.filter((r) => r.to)
    const missing = resolved.filter((r) => !r.to)
    const needsWrite = resolved.some((r) => r.to && r.to !== r.from)

    if (missing.length || ok.length === 0 || needsWrite) {
      brokenBundles += 1
      console.log(`\n${bundle.active ? '●' : '○'} ${bundle.id} — ${bundle.name}`)
      console.log(
        `  stored: ${bundle.productIds.join(', ') || '(none)'}`,
      )
      console.log(
        `  resolve: ${resolved.map((r) => `${r.from}→${r.to ?? 'MISS'}`).join(' | ')}`,
      )
      if (missing.length) {
        for (const m of missing) {
          const h = shopifyMeta.get(m.from)
          console.log(
            `  missing ${m.from}${h ? ` (handle: ${h.handle}, title: ${h.title})` : ''}`,
          )
        }
      }

      if (apply && ok.length > 0) {
        const nextIds = [...new Set(ok.map((r) => r.to!).filter(Boolean))]
        await updateProductBundle(bundle.id, { productIds: nextIds })
        console.log(`  ✓ wrote Prisma ids: ${nextIds.join(', ')}`)
      }
    } else {
      console.log(`✓ ${bundle.id} — ${bundle.name} (${ok.length} products ok)`)
    }
  }

  // Products that still have only Shopify-looking tags? skip

  console.log('\n=== Summary ===')
  console.log('broken/needs-remap bundles:', brokenBundles)
  console.log(apply ? 'Applied writes.' : 'Dry run only. Re-run with --apply to fix.')

  await prisma.$disconnect()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
