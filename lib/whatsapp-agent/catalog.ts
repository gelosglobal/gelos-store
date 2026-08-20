import type { WaCatalogProduct } from '@/lib/whatsapp-agent/types'
import catalogJson from '@/lib/whatsapp-agent/data/catalog.json'

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

const data = catalogJson as CatalogFile

export class WhatsappCatalog {
  currency: string
  products: WaCatalogProduct[]

  constructor(file: CatalogFile = data) {
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
    }
  }
}

let catalogSingleton: WhatsappCatalog | null = null

export function getWhatsappCatalog() {
  if (!catalogSingleton) catalogSingleton = new WhatsappCatalog()
  return catalogSingleton
}
