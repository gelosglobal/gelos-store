import type { WaCatalogProduct } from '@/lib/whatsapp-agent/types'
import catalogJson from '@/lib/whatsapp-agent/data/catalog.json'
import { loadWhatsappCatalogFromStore } from '@/lib/whatsapp-agent/catalog-from-store'

function normalize(value: unknown): string {
  return String(value ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

type CatalogFile = {
  currency?: string
  products: WaCatalogProduct[]
}

const staticData = catalogJson as CatalogFile

const CACHE_TTL_MS = 5 * 60 * 1000

export class WhatsappCatalog {
  currency: string
  products: WaCatalogProduct[]
  source: 'store' | 'static'

  constructor(
    file: CatalogFile = staticData,
    source: 'store' | 'static' = 'static',
  ) {
    if (!Array.isArray(file.products)) {
      throw new Error('Catalog must contain a products array.')
    }
    const ids = new Set<string>()
    for (const product of file.products) {
      if (!product.id || !product.name) {
        throw new Error('Every product needs id and name.')
      }
      if (ids.has(product.id)) {
        throw new Error(`Duplicate product id: ${product.id}`)
      }
      ids.add(product.id)
      if (product.price_ghs !== null && !Number.isFinite(product.price_ghs)) {
        throw new Error(`price_ghs must be a number or null for ${product.id}`)
      }
      if (!Array.isArray(product.variants)) product.variants = []
    }
    this.currency = file.currency || 'GHS'
    this.products = file.products
    this.source = source
  }

  listActive() {
    return this.products.filter((product) => product.active !== false)
  }

  get(productId: string) {
    return (
      this.products.find(
        (product) => product.id === productId && product.active !== false,
      ) ?? null
    )
  }

  /** Resolve exact id, or a close name/id slug the model might invent. */
  resolve(productIdOrName: string) {
    const exact = this.get(productIdOrName)
    if (exact) return exact
    const needle = normalize(productIdOrName)
    if (!needle) return null
    const active = this.listActive()
    const byIdSlug = active.find((product) => normalize(product.id) === needle)
    if (byIdSlug) return byIdSlug
    const byName = active.find((product) => normalize(product.name) === needle)
    if (byName) return byName
    const contains = active.filter((product) => {
      const haystack = normalize(
        `${product.id} ${product.name} ${product.category} ${(product.variants || []).join(' ')}`,
      )
      return haystack.includes(needle) || needle.includes(normalize(product.id))
    })
    if (contains.length === 1) return contains[0]
    // Prefer toothpaste parent when needle is just "toothpaste"
    if (needle === 'toothpaste' || needle.includes('flavored toothpaste')) {
      return (
        this.get('flavored-toothpaste') ||
        contains.find((p) => p.id.includes('toothpaste')) ||
        null
      )
    }
    return null
  }

  search(query = '', category: string | null = null, limit = 8) {
    const terms = normalize(query).split(' ').filter(Boolean)
    const categoryTerm = normalize(category)
    return this.listActive()
      .map((product) => {
        const haystack = normalize(
          [
            product.id,
            product.name,
            product.category,
            product.description,
            ...(product.variants || []),
          ].join(' '),
        )
        const score = terms.reduce(
          (total, term) => total + (haystack.includes(term) ? 1 : 0),
          0,
        )
        return { product, score, haystack }
      })
      .filter(
        ({ score, haystack }) =>
          (!terms.length || score > 0) &&
          (!categoryTerm || haystack.includes(categoryTerm)),
      )
      .sort(
        (a, b) =>
          b.score - a.score || a.product.name.localeCompare(b.product.name),
      )
      .slice(0, limit)
      .map(({ product }) => this.publicProduct(product))
  }

  publicProduct(product: WaCatalogProduct) {
    return {
      id: product.id,
      name: product.name,
      category: product.category,
      description: product.description,
      price_ghs: product.price_ghs,
      stock_status: product.stock_status || 'confirm',
      variants: product.variants || [],
      image: product.image || null,
      has_image: Boolean(product.image),
    }
  }

  completeness() {
    const active = this.listActive()
    const missingPrices = active
      .filter((product) => product.price_ghs === null)
      .map((product) => product.id)
    const stockToConfirm = active
      .filter(
        (product) =>
          !['in_stock', 'out_of_stock'].includes(product.stock_status || ''),
      )
      .map((product) => product.id)
    return {
      activeProducts: active.length,
      missingPrices,
      stockToConfirm,
      readyForAutomaticCheckout: !missingPrices.length,
      source: this.source,
    }
  }
}

let cached: { catalog: WhatsappCatalog; expiresAt: number } | null = null

export function getWhatsappCatalog() {
  if (cached && cached.expiresAt > Date.now()) return cached.catalog
  return new WhatsappCatalog(staticData, 'static')
}

/** Prefer live storefront catalog; cache briefly; fall back to static JSON. */
export async function getWhatsappCatalogAsync() {
  if (cached && cached.expiresAt > Date.now()) return cached.catalog
  try {
    const products = await loadWhatsappCatalogFromStore()
    if (products.length > 0) {
      const catalog = new WhatsappCatalog(
        { currency: 'GHS', products },
        'store',
      )
      cached = { catalog, expiresAt: Date.now() + CACHE_TTL_MS }
      return catalog
    }
  } catch (error) {
    console.warn('[whatsapp-agent] live catalog load failed; using static', error)
  }
  const catalog = new WhatsappCatalog(staticData, 'static')
  cached = { catalog, expiresAt: Date.now() + CACHE_TTL_MS }
  return catalog
}
