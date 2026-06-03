import type { ProductPdpContent } from '@/lib/product-pdp-content'
import type { Product } from '@/lib/types/product'
import { normalizeImageUrl, repairImageUrl } from '@/lib/image-url'
import { getProductSlug } from '@/lib/product-utils'
import { getTongueScraperStyleLabel } from '@/lib/tongue-scraper-style-covers'

const scraperHighlights: ProductPdpContent['highlights'] = [
  { label: 'Fresher breath', emoji: '✨' },
  { label: 'Stainless steel', emoji: '🪥' },
  { label: 'Daily hygiene', emoji: '👅' },
]

const sharedUsageSteps: ProductPdpContent['usageSteps'] = [
  {
    title: 'Rinse',
    body: 'Rinse your mouth with water, then stick out your tongue comfortably.',
  },
  {
    title: 'Scrape',
    body: 'Place the scraper at the back of your tongue and pull forward with light pressure. Rinse between passes.',
  },
  {
    title: 'Finish',
    body: 'Rinse your mouth, clean the scraper, and continue with brushing or mouthwash.',
  },
]

const sharedFaq: ProductPdpContent['faq'] = [
  {
    id: 'faq-different',
    title: 'What makes Gelos tongue scrapers different?',
    content:
      'Our scrapers are designed for comfortable daily use — curved for control, easy to rinse, and built to pair with your full Gelos smile-care routine.',
  },
  {
    id: 'faq-everyday',
    title: 'Can I use this every day?',
    content:
      'Yes. Once or twice daily is ideal for most people. If you notice irritation, use lighter pressure and consult your dentist.',
  },
  {
    id: 'faq-children',
    title: 'Can I purchase this for my children?',
    content:
      'We recommend adult supervision for children. Consult your dentist for guidance on tongue cleaning for younger kids.',
  },
]

const stainlessSteelContent: ProductPdpContent = {
  galleryImages: [],
  imageBadge: 'HYGIENE ESSENTIAL',
  headline: 'Serious about fresh breath?',
  intro:
    'Meet your new daily essential — a professional-grade stainless steel tongue scraper that helps lift coating and bacteria so your mouth feels cleaner before you even brush.',
  bullets: [
    'Curved edge for comfortable control',
    'Durable stainless steel — rinse and reuse',
    'Pairs perfectly with Gelos toothpaste & mouthwash',
  ],
  highlights: scraperHighlights,
  usageSteps: sharedUsageSteps,
  detailsAccordion: [
    {
      id: 'different',
      title: 'What makes this tongue scraper different?',
      content:
        'Gelos Stainless Steel Tongue Scraper uses a smooth, rounded edge and ergonomic curve — effective cleaning without the harsh feel of plastic alternatives.',
    },
    {
      id: 'included',
      title: "*What's included?",
      content:
        'One stainless steel tongue scraper in protective packaging. Rinse before first use.',
    },
    {
      id: 'materials',
      title: 'Materials & care',
      content:
        'Made from stainless steel. Hand wash with mild soap after use, dry thoroughly, and store in a dry place. Not dishwasher safe.',
    },
  ],
  faq: sharedFaq,
}

const copperContent: ProductPdpContent = {
  galleryImages: [],
  imageBadge: 'PREMIUM FINISH',
  headline: 'Upgrade your tongue-care ritual',
  intro:
    'Our copper tongue scraper brings a premium feel to your routine — designed to help reduce coating and leave your breath feeling fresher when used daily with your Gelos products.',
  bullets: [
    'Smooth copper finish with curved profile',
    'Lightweight and easy to grip',
    'Ideal alongside your Gelos fresh-breath routine',
  ],
  highlights: [
    { label: 'Premium finish', emoji: '✨' },
    { label: 'Copper build', emoji: '🥉' },
    { label: 'Daily fresh breath', emoji: '👅' },
  ],
  usageSteps: sharedUsageSteps,
  detailsAccordion: [
    {
      id: 'different',
      title: 'Why choose copper?',
      content:
        'Copper tongue scrapers are a popular choice for a premium daily ritual — comfortable, easy to clean, and designed for consistent fresh-breath care.',
    },
    {
      id: 'included',
      title: "*What's included?",
      content: 'One copper tongue scraper. Rinse before first use.',
    },
    {
      id: 'care',
      title: 'Care instructions',
      content:
        'Rinse after each use. Wash with mild soap, dry completely, and store away from moisture to maintain the finish.',
    },
  ],
  faq: sharedFaq,
}

const defaultTongueScraperContent = (product: Product): ProductPdpContent => {
  const style = getTongueScraperStyleLabel(product.name)
  return {
    galleryImages: [],
    headline: `Love the ${style.toLowerCase()} finish?`,
    intro: product.description,
    bullets: [
      'Designed for comfortable daily use',
      'Durable, easy-to-clean construction',
      'Pairs with your Gelos smile-care routine',
    ],
    highlights: scraperHighlights,
    usageSteps: sharedUsageSteps,
    detailsAccordion: [
      {
        id: 'different',
        title: 'Why tongue scraping?',
        content:
          'Tongue scraping helps remove coating that can contribute to bad breath — a quick step that complements brushing and rinsing.',
      },
      {
        id: 'included',
        title: "*What's included?",
        content: `One ${product.name}.`,
      },
      {
        id: 'care',
        title: 'Care instructions',
        content: 'Rinse after each use. Wash with mild soap and dry thoroughly.',
      },
    ],
    faq: sharedFaq,
  }
}

const contentBySlug: Record<string, ProductPdpContent> = {
  'stainless-steel-tongue-scraper': stainlessSteelContent,
  'copper-tongue-scraper': copperContent,
}

function mergeGallery(
  base: ProductPdpContent,
  product: Product,
): ProductPdpContent {
  const fromProduct = [
    repairImageUrl(product.image),
    ...(product.variantImages ?? []).map((url) => normalizeImageUrl(url)),
  ].filter(Boolean)

  const seen = new Set<string>()
  const merged: string[] = []
  for (const src of [...fromProduct, ...base.galleryImages]) {
    const url = normalizeImageUrl(src)
    if (seen.has(url)) continue
    seen.add(url)
    merged.push(url)
  }

  return {
    ...base,
    galleryImages: merged.length > 0 ? merged : base.galleryImages,
  }
}

export function getTongueScraperProductContent(
  product: Product,
): ProductPdpContent {
  const slug = getProductSlug(product)
  const base = contentBySlug[slug] ?? defaultTongueScraperContent(product)
  return mergeGallery(base, product)
}

/** Cross-category picks for "People also love" on tongue scraper PDPs */
export const tongueScraperCommunityFavoriteIds = ['1', '12', '9', '7'] as const
