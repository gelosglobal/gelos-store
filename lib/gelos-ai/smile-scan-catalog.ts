import { getAllProducts } from '@/lib/db/products'
import { getProductHref, getProductSlug } from '@/lib/product-utils'
import {
  isElectricToothbrushName,
  isKidsCatalogProduct,
  isToothbrushCategory,
} from '@/lib/gelos-ai/kids-product'
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
        .map((p) => {
          const audience = isKidsCatalogProduct(p)
            ? ' [KIDS ONLY]'
            : isToothbrushCategory(p.category) && isElectricToothbrushName(p.name)
              ? ' [ADULT / TEEN — prefer this brush]'
              : isToothbrushCategory(p.category)
                ? ' [manual / eco brush]'
                : ''
          return `  ${p.name} | ${p.href}${audience}`
        })
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

function findElectricToothbrush(
  catalog: SmileScanCatalogProduct[],
): SmileScanCatalogProduct | undefined {
  return (
    catalog.find(
      (p) =>
        isToothbrushCategory(p.category) &&
        isElectricToothbrushName(p.name) &&
        !isKidsCatalogProduct(p),
    ) ??
    catalog.find(
      (p) => isToothbrushCategory(p.category) && isElectricToothbrushName(p.name),
    )
  )
}

function shouldReplaceWithElectric(
  product: SmileScanCatalogProduct,
  subjectIsChild: boolean,
): boolean {
  if (subjectIsChild) return false
  if (!isToothbrushCategory(product.category)) return false
  if (isKidsCatalogProduct(product)) return true
  // Prefer electric over bamboo / other manual brushes for adult smile scans
  return !isElectricToothbrushName(product.name)
}

function defaultPicksForScores(
  report: Pick<SmileScanReport, 'scores' | 'subjectIsChild'>,
  catalog: SmileScanCatalogProduct[],
): SmileScanReport['products'] {
  const picks: SmileScanCatalogProduct[] = []
  const used = new Set<string>()
  const subjectIsChild = report.subjectIsChild === true

  const addProduct = (product: SmileScanCatalogProduct | undefined) => {
    if (!product || used.has(product.id)) return
    used.add(product.id)
    picks.push(product)
  }

  const addFromCategory = (category: string, preferKids?: boolean) => {
    const product = catalog.find((p) => {
      if (p.category !== category || used.has(p.id)) return false
      if (preferKids) return isKidsCatalogProduct(p)
      return !isKidsCatalogProduct(p)
    })
    addProduct(product)
  }

  if (report.scores.brightness > 0 && report.scores.brightness < 7) {
    addFromCategory('Whitening')
  }
  if (report.scores.freshness > 0 && report.scores.freshness < 7) {
    addFromCategory('Mouthwash', subjectIsChild)
  }
  addFromCategory('Toothpaste', subjectIsChild)
  addProduct(
    subjectIsChild
      ? catalog.find(
          (p) =>
            isToothbrushCategory(p.category) &&
            isKidsCatalogProduct(p) &&
            !used.has(p.id),
        )
      : findElectricToothbrush(catalog),
  )

  return picks.slice(0, 3).map((product) => ({
    name: product.name,
    href: product.href,
    reason: subjectIsChild
      ? 'A gentle fit for a younger smile routine'
      : 'A great fit for your smile care routine',
  }))
}

export function resolveSmileScanProducts(
  picks: SmileScanReport['products'],
  catalog: SmileScanCatalogProduct[],
  report?: Pick<SmileScanReport, 'scores' | 'subjectIsChild'>,
): SmileScanReport['products'] {
  const subjectIsChild = report?.subjectIsChild === true
  const resolved: SmileScanReport['products'] = []
  const used = new Set<string>()
  const electric = findElectricToothbrush(catalog)

  for (const pick of picks) {
    const match = findCatalogMatch(pick, catalog)
    if (!match || used.has(match.id)) continue

    if (shouldReplaceWithElectric(match, subjectIsChild) && electric) {
      if (used.has(electric.id)) continue
      used.add(electric.id)
      resolved.push({
        name: electric.name,
        href: electric.href,
        reason:
          pick.reason ||
          'Sonic electric cleaning upgrades daily brushing for adult smiles.',
      })
      continue
    }

    if (!subjectIsChild && isKidsCatalogProduct(match)) continue

    used.add(match.id)
    resolved.push({
      name: match.name,
      href: match.href,
      reason: pick.reason || 'Recommended for your smile goals',
    })
  }

  // Adult scans should always include the electric brush when we recommend products.
  if (
    !subjectIsChild &&
    electric &&
    !used.has(electric.id) &&
    resolved.length > 0
  ) {
    resolved.unshift({
      name: electric.name,
      href: electric.href,
      reason: 'Sonic electric cleaning upgrades daily brushing for adult smiles.',
    })
  }

  if (resolved.length > 0) return resolved.slice(0, 3)

  if (
    report &&
    report.scores.brightness + report.scores.freshness + report.scores.confidence >
      0
  ) {
    return defaultPicksForScores(report, catalog)
  }

  return []
}
