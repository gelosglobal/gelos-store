import type { ProductPdpContent } from '@/lib/product-pdp-content'

export const SHOPIFY_PDP_METAFIELD_NAMESPACE =
  process.env.SHOPIFY_PDP_METAFIELD_NAMESPACE?.trim() || 'custom'

export const SHOPIFY_PDP_METAFIELD_KEY =
  process.env.SHOPIFY_PDP_METAFIELD_KEY?.trim() || 'pdp'

/**
 * Single JSON metafield for PDP copy: headline, intro, bullets, accordion,
 * usage steps, FAQ, badge, and optional gallery image/video URLs.
 */
export const SHOPIFY_PDP_METAFIELD_SELECTION = /* GraphQL */ `
  pdp: metafield(namespace: "${SHOPIFY_PDP_METAFIELD_NAMESPACE}", key: "${SHOPIFY_PDP_METAFIELD_KEY}") {
    type
    value
  }
`

export type ShopifyPdpMetafield = {
  type?: string | null
  value?: string | null
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value
    .map((item) => (typeof item === 'string' ? item.trim() : ''))
    .filter(Boolean)
}

function asAccordion(value: unknown): ProductPdpContent['detailsAccordion'] {
  if (!Array.isArray(value)) return []
  return value
    .map((item, index) => {
      if (!item || typeof item !== 'object') return null
      const row = item as Record<string, unknown>
      const title = typeof row.title === 'string' ? row.title.trim() : ''
      const content = typeof row.content === 'string' ? row.content.trim() : ''
      if (!title || !content) return null
      const id =
        typeof row.id === 'string' && row.id.trim()
          ? row.id.trim()
          : `item-${index + 1}`
      return { id, title, content }
    })
    .filter((item): item is ProductPdpContent['detailsAccordion'][number] =>
      Boolean(item),
    )
}

function asUsageSteps(value: unknown): ProductPdpContent['usageSteps'] {
  if (!Array.isArray(value)) return undefined
  const steps = value
    .map((item) => {
      if (!item || typeof item !== 'object') return null
      const row = item as Record<string, unknown>
      const title = typeof row.title === 'string' ? row.title.trim() : ''
      const body = typeof row.body === 'string' ? row.body.trim() : ''
      if (!title || !body) return null
      return { title, body }
    })
    .filter((item): item is NonNullable<typeof item> => Boolean(item))
  return steps.length > 0 ? steps : undefined
}

function asHighlights(value: unknown): ProductPdpContent['highlights'] {
  if (!Array.isArray(value)) return []
  return value
    .map((item) => {
      if (!item || typeof item !== 'object') return null
      const row = item as Record<string, unknown>
      const label = typeof row.label === 'string' ? row.label.trim() : ''
      if (!label) return null
      const emoji = typeof row.emoji === 'string' ? row.emoji : '✨'
      return { label, emoji }
    })
    .filter((item): item is ProductPdpContent['highlights'][number] =>
      Boolean(item),
    )
}

/** Serialize Gelos PDP content for Shopify `custom.pdp` JSON metafield. */
export function serializePdpMetafieldValue(
  content: ProductPdpContent,
  ratings?: { rating?: number; reviews?: number } | null,
): string {
  return JSON.stringify({
    imageBadge: content.imageBadge ?? null,
    headline: content.headline,
    intro: content.intro,
    bullets: content.bullets,
    highlights: content.highlights,
    detailsAccordion: content.detailsAccordion,
    faq: content.faq,
    usageSteps: content.usageSteps ?? [],
    usageStepsTitle: content.usageStepsTitle ?? null,
    usageStepsIntro: content.usageStepsIntro ?? null,
    galleryImages: content.galleryImages ?? [],
    rating:
      typeof ratings?.rating === 'number' && Number.isFinite(ratings.rating)
        ? ratings.rating
        : null,
    reviews:
      typeof ratings?.reviews === 'number' && Number.isFinite(ratings.reviews)
        ? Math.max(0, Math.round(ratings.reviews))
        : null,
  })
}

/** Parse rating / review count from Shopify `custom.pdp` JSON. */
export function ratingsFromShopifyPdpMetafield(
  metafield: ShopifyPdpMetafield | null | undefined,
): { rating: number; reviews: number } | null {
  const raw = metafield?.value?.trim()
  if (!raw) return null

  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>
    const rating =
      typeof parsed.rating === 'number'
        ? parsed.rating
        : typeof parsed.rating === 'string'
          ? Number.parseFloat(parsed.rating)
          : NaN
    const reviews =
      typeof parsed.reviews === 'number'
        ? parsed.reviews
        : typeof parsed.reviews === 'string'
          ? Number.parseInt(parsed.reviews, 10)
          : NaN

    if (!Number.isFinite(rating) && !Number.isFinite(reviews)) return null

    return {
      rating: Number.isFinite(rating)
        ? Math.min(5, Math.max(0, Math.round(rating * 10) / 10))
        : 4.8,
      reviews: Number.isFinite(reviews) ? Math.max(0, Math.round(reviews)) : 0,
    }
  } catch {
    return null
  }
}

/** Parse Shopify `custom.pdp` into Gelos ProductPdpContent (partial OK). */
export function pdpContentFromShopifyMetafield(
  metafield: ShopifyPdpMetafield | null | undefined,
): Partial<ProductPdpContent> | null {
  const raw = metafield?.value?.trim()
  if (!raw) return null

  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>
    const headline = typeof parsed.headline === 'string' ? parsed.headline : ''
    const intro = typeof parsed.intro === 'string' ? parsed.intro : ''
    if (!headline && !intro && !asStringArray(parsed.bullets).length) {
      return null
    }

    return {
      imageBadge:
        typeof parsed.imageBadge === 'string' && parsed.imageBadge.trim()
          ? parsed.imageBadge.trim()
          : undefined,
      headline,
      intro,
      bullets: asStringArray(parsed.bullets),
      highlights: asHighlights(parsed.highlights),
      detailsAccordion: asAccordion(parsed.detailsAccordion),
      faq: asAccordion(parsed.faq),
      usageSteps: asUsageSteps(parsed.usageSteps),
      usageStepsTitle:
        typeof parsed.usageStepsTitle === 'string'
          ? parsed.usageStepsTitle
          : undefined,
      usageStepsIntro:
        typeof parsed.usageStepsIntro === 'string'
          ? parsed.usageStepsIntro
          : undefined,
      galleryImages: asStringArray(parsed.galleryImages),
    }
  } catch {
    return null
  }
}

export function mergePdpContent(
  base: ProductPdpContent,
  override: Partial<ProductPdpContent> | null | undefined,
): ProductPdpContent {
  if (!override) return base

  return {
    galleryImages:
      override.galleryImages && override.galleryImages.length > 0
        ? override.galleryImages
        : base.galleryImages,
    imageBadge: override.imageBadge ?? base.imageBadge,
    headline: override.headline?.trim() || base.headline,
    intro: override.intro?.trim() || base.intro,
    bullets:
      override.bullets && override.bullets.length > 0
        ? override.bullets
        : base.bullets,
    highlights:
      override.highlights && override.highlights.length > 0
        ? override.highlights
        : base.highlights,
    detailsAccordion:
      override.detailsAccordion && override.detailsAccordion.length > 0
        ? override.detailsAccordion
        : base.detailsAccordion,
    faq: override.faq && override.faq.length > 0 ? override.faq : base.faq,
    usageSteps:
      override.usageSteps && override.usageSteps.length > 0
        ? override.usageSteps
        : base.usageSteps,
    usageStepsTitle: override.usageStepsTitle ?? base.usageStepsTitle,
    usageStepsIntro: override.usageStepsIntro ?? base.usageStepsIntro,
  }
}
