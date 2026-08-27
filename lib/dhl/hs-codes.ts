import { clip } from '@/lib/dhl/text'

export type DhlLineItemDraft = {
  name: string
  category?: string
  quantity: number
  unitPrice: number
}

/**
 * Default 8-digit HS codes for Gelos oral-care SKUs.
 * Confirm against https://tariffnumber.com before live international shipping.
 */
export function hsCodeForCategory(category?: string, name = ''): string {
  const haystack = `${category ?? ''} ${name}`.toLowerCase()
  if (haystack.includes('water floss')) return '85098000'
  if (haystack.includes('electric') && haystack.includes('toothbrush')) {
    return '85098000'
  }
  if (haystack.includes('toothbrush')) return '96032100'
  if (haystack.includes('tongue')) return '96032100'
  if (haystack.includes('toothpaste')) return '33061000'
  if (haystack.includes('mouthwash')) return '33069000'
  if (haystack.includes('whiten')) return '33069000'
  if (haystack.includes('wellness')) return '33069000'
  if (haystack.includes('accessor') || haystack.includes('tool')) return '96032100'
  return '33069000'
}

export function customsDescription(item: DhlLineItemDraft): string {
  const name = item.name.trim() || 'Oral care product'
  const category = item.category?.trim()
  const detail = category
    ? `${name} — ${category} for personal daily oral hygiene, packed for retail sale`
    : `${name} for personal daily oral hygiene, packed for retail sale`
  return clip(detail, 512)
}

export function contentDescription(items: DhlLineItemDraft[]): string {
  const names = items
    .map((item) => item.name.trim())
    .filter(Boolean)
    .slice(0, 3)
  const summary =
    names.length > 0
      ? `Gelos oral care: ${names.join(', ')}`
      : 'Gelos oral care products for personal hygiene'
  return clip(summary, 70)
}
