import type { SmileScanCatalogProduct } from '@/lib/gelos-ai/smile-scan-catalog'

function normalizeHref(href: string): string {
  const trimmed = href.trim()
  if (trimmed.startsWith('/product/')) return trimmed
  if (trimmed.startsWith('product/')) return `/${trimmed}`
  if (trimmed.includes('/product/')) {
    const match = trimmed.match(/\/product\/[a-z0-9-]+/i)
    if (match) return match[0]
  }
  return `/product/${trimmed.replace(/^\/+/, '')}`
}

function findCatalogProduct(
  label: string,
  href: string,
  catalog: SmileScanCatalogProduct[],
): SmileScanCatalogProduct | undefined {
  const normalized = normalizeHref(href)
  const slug = normalized.replace('/product/', '')

  const byHref = catalog.find((p) => p.href === normalized)
  if (byHref) return byHref

  const bySlug = catalog.find((p) => p.slug === slug)
  if (bySlug) return bySlug

  const name = label.toLowerCase().trim()
  const byExactName = catalog.find((p) => p.name.toLowerCase() === name)
  if (byExactName) return byExactName

  return catalog.find(
    (p) =>
      p.name.toLowerCase().includes(name) || name.includes(p.name.toLowerCase()),
  )
}

export function enhanceChatReply(
  content: string,
  catalog: SmileScanCatalogProduct[],
): string {
  let enhanced = content
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim()

  enhanced = enhanced.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    (match, label: string, href: string) => {
      if (!/\/product\//.test(href) && !href.startsWith('product/')) {
        return match
      }

      const product = findCatalogProduct(label, href, catalog)
      if (!product) return label

      return `[${product.name}](${product.href})`
    },
  )

  return enhanced
}

export function extractProductLinks(
  content: string,
): Array<{ name: string; href: string }> {
  const seen = new Set<string>()
  const links: Array<{ name: string; href: string }> = []

  for (const match of content.matchAll(/\[([^\]]+)\]\((\/product\/[^)]+)\)/g)) {
    const href = match[2]
    if (seen.has(href)) continue
    seen.add(href)
    links.push({ name: match[1], href })
  }

  return links.slice(0, 4)
}
