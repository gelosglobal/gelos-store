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

const scraperBenefits = [
  'Helps remove bacteria and buildup that cause bad breath',
  'Promotes long-lasting fresh breath',
  'Improves overall oral hygiene and cleanliness',
  'Enhances taste perception by clearing tongue coating',
  'Made from surgical-grade stainless steel for durability and hygiene',
  'Rust-resistant, easy to clean, and reusable',
  'Smooth edge design for comfortable daily use',
  'Long-lasting alternative to plastic tongue scrapers',
]

const scraperUsageSteps: ProductPdpContent['usageSteps'] = [
  {
    title: 'Extend',
    body: 'Extend your tongue comfortably.',
  },
  {
    title: 'Position',
    body: 'Place the scraper gently at the back of the tongue (as far as comfortable).',
  },
  {
    title: 'Scrape',
    body: 'Pull forward slowly to the tip of the tongue.',
  },
  {
    title: 'Rinse',
    body: 'Rinse the scraper after each pass.',
  },
  {
    title: 'Repeat',
    body: 'Repeat 2–5 times until the tongue feels clean.',
  },
  {
    title: 'Store',
    body: 'Clean and dry after use, then store properly.',
  },
]

const scraperRangeFaq: ProductPdpContent['faq'] = [
  {
    id: 'faq-different',
    title: 'What makes the Gelos 3-in-1 Tongue Scraper different?',
    content:
      'Surgical-grade stainless steel, a smooth comfortable edge, and a 3-in-1 design built for daily tongue cleaning — durable, hygienic, and a long-lasting upgrade from disposable plastic scrapers.',
  },
  {
    id: 'faq-finishes',
    title: 'Which finishes are available?',
    content:
      'Choose from Silver, Rose Gold, Black, Blue-Black, Burgundy, and Turquoise. Use the style picker on this page to explore finishes in the lineup.',
  },
  {
    id: 'faq-everyday',
    title: 'Can I use this every day?',
    content:
      'Yes. Use once or twice daily, preferably morning and night, for best results. If you notice irritation, use lighter pressure and consult your dentist.',
  },
  {
    id: 'faq-children',
    title: 'Can I purchase this for my children?',
    content:
      'We recommend adult supervision for children. Consult your dentist for guidance on tongue cleaning for younger kids.',
  },
]

function tongueScraperRangeAccordion(styleName: string): ProductPdpContent['detailsAccordion'] {
  return [
    {
      id: 'finishes',
      title: 'Available finishes',
      content:
        'Silver · Rose Gold · Black · Blue-Black · Burgundy · Turquoise. Pick the finish that suits your routine using the style picker above.',
    },
    {
      id: 'different',
      title: 'What makes the Gelos 3-in-1 scraper different?',
      content:
        'A premium oral hygiene tool that effectively removes bacteria, food debris, and buildup from the tongue surface — surgical-grade stainless steel for durability, hygiene, and a smooth scraping experience.',
    },
    {
      id: 'included',
      title: "*What's included?",
      content: `One Gelos 3-in-1 Tongue Scraper (${styleName} finish). Rinse before first use.`,
    },
    {
      id: 'materials',
      title: 'Materials & care',
      content:
        'Made from surgical-grade stainless steel. Rinse after each use, wash with mild soap, dry thoroughly, and store in a dry place. Rust-resistant and reusable.',
    },
  ]
}

const stainlessSteelContent: ProductPdpContent = {
  galleryImages: [],
  imageBadge: '3-IN-1',
  headline: 'Gelos 3-in-1 Tongue Scraper',
  intro:
    'The Gelos 3-in-1 Tongue Scraper is a premium oral hygiene tool designed to effectively remove bacteria, food debris, and buildup from the tongue surface. Made from surgical-grade stainless steel, it offers durability, hygiene, and a smooth scraping experience for fresher breath and a cleaner mouth. Designed for daily use, it helps support overall oral health by improving tongue cleanliness, reducing bad breath, and enhancing taste sensitivity. Use the style picker above to explore finishes across the range.',
  bullets: scraperBenefits,
  highlights: [
    { label: 'Fresh breath', emoji: '✨' },
    { label: 'Surgical steel', emoji: '🪥' },
    { label: '6 finishes', emoji: '💎' },
  ],
  usageSteps: scraperUsageSteps,
  usageStepsTitle: 'How to use your Gelos tongue scraper',
  usageStepsIntro:
    'Use once or twice daily, preferably morning and night, for best results.',
  detailsAccordion: tongueScraperRangeAccordion('Silver'),
  faq: scraperRangeFaq,
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
