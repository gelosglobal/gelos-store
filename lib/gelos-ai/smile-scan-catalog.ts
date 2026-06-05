import { getAllProducts } from '@/lib/db/products'
import { getProductHref, getProductSlug } from '@/lib/product-utils'
import type { SmileScanReport } from '@/lib/gelos-ai/smile-scan-types'

export type SmileScanCatalogProduct = {
  id: string
  name: string
  href: string
  slug: string
  category: string
  description: string
}

export async function getSmileScanCatalog(): Promise<SmileScanCatalogProduct[]> {
  const products = await getAllProducts()
  return products.map((product) => ({
    id: product.id,
    name: product.name,
    href: getProductHref(product),
    slug: getProductSlug(product),
    category: product.category,
    description: product.description,
  }))
}

export function buildSmileScanCatalogContext(
  catalog: SmileScanCatalogProduct[],
): string {
  const byCategory = new Map<string, SmileScanCatalogProduct[]>()
  for (const product of catalog) {
    const list = byCategory.get(product.category) ?? []
    list.push(product)
    byCategory.set(product.category, list)
  }

  return [...byCategory.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([category, items]) => {
      const lines = items
        .map((p) => `  ${p.name} | ${p.href}`)
        .join('\n')
      return `${category}:\n${lines}`
    })
    .join('\n\n')
}

function normalizeHref(href: string): string {
  const trimmed = href.trim()
  if (trimmed.startsWith('/product/')) return trimmed
  if (trimmed.startsWith('product/')) return `/${trimmed}`
  return `/product/${trimmed.replace(/^\/+/, '')}`
}

function findCatalogMatch(
  pick: SmileScanReport['products'][number],
  catalog: SmileScanCatalogProduct[],
): SmileScanCatalogProduct | undefined {
  const href = normalizeHref(pick.href)
  const slug = href.replace('/product/', '')

  const byHref = catalog.find((p) => p.href === href)
  if (byHref) return byHref

  const bySlug = catalog.find((p) => p.slug === slug)
  if (bySlug) return bySlug

  const pickName = pick.name.toLowerCase().trim()
  const byExactName = catalog.find((p) => p.name.toLowerCase() === pickName)
  if (byExactName) return byExactName

  const byPartialName = catalog.find(
    (p) =>
      p.name.toLowerCase().includes(pickName) ||
      pickName.includes(p.name.toLowerCase()),
  )
  if (byPartialName) return byPartialName

  return undefined
}

function defaultPicksForScores(
  report: Pick<SmileScanReport, 'scores'>,
  catalog: SmileScanCatalogProduct[],
): SmileScanReport['products'] {
  const picks: SmileScanCatalogProduct[] = []
  const used = new Set<string>()

  const addFromCategory = (category: string) => {
    const product = catalog.find((p) => p.category === category && !used.has(p.id))
    if (product) {
      picks.push(product)
      used.add(product.id)
    }
  }

  if (report.scores.brightness > 0 && report.scores.brightness < 7) {
    addFromCategory('Whitening')
  }
  if (report.scores.freshness > 0 && report.scores.freshness < 7) {
    addFromCategory('Mouthwash')
  }
  addFromCategory('Toothpaste')
  addFromCategory('Tongue Scraper')

  return picks.slice(0, 3).map((product) => ({
    name: product.name,
    href: product.href,
    reason: 'A great fit for your smile care routine',
  }))
}

export function resolveSmileScanProducts(
  picks: SmileScanReport['products'],
  catalog: SmileScanCatalogProduct[],
  report?: Pick<SmileScanReport, 'scores'>,
): SmileScanReport['products'] {
  const resolved: SmileScanReport['products'] = []
  const used = new Set<string>()

  for (const pick of picks) {
    const match = findCatalogMatch(pick, catalog)
    if (!match || used.has(match.id)) continue
    used.add(match.id)
    resolved.push({
      name: match.name,
      href: match.href,
      reason: pick.reason || 'Recommended for your smile goals',
    })
  }

  if (resolved.length > 0) return resolved.slice(0, 3)

  if (report && report.scores.brightness + report.scores.freshness + report.scores.confidence > 0) {
    return defaultPicksForScores(report, catalog)
  }

  return []
}
