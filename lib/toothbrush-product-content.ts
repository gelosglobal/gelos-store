import type { ProductPdpContent } from '@/lib/product-pdp-content'
import type { Product } from '@/lib/types/product'
import { normalizeImageUrl } from '@/lib/image-url'
import { getCodeDefaultGalleryImages } from '@/lib/product-gallery-images'
import { getProductSlug } from '@/lib/product-utils'

const brushHighlights: ProductPdpContent['highlights'] = [
  { label: 'Soft bristles', emoji: '🪥' },
  { label: 'Eco-conscious', emoji: '🌿' },
  { label: 'Daily comfort', emoji: '✨' },
]

const sharedUsageSteps: ProductPdpContent['usageSteps'] = [
  {
    title: 'Rinse',
    body: 'Rinse your new brush with water before first use.',
  },
  {
    title: 'Brush',
    body: 'Brush for two minutes with your favourite Gelos toothpaste, using gentle pressure.',
  },
  {
    title: 'Care',
    body: 'Rinse the brush head, shake off excess water, and store upright to air dry.',
  },
]

const sharedFaq: ProductPdpContent['faq'] = [
  {
    id: 'faq-different',
    title: 'What makes Gelos toothbrushes different?',
    content:
      'Gelos brushes are chosen for comfortable daily use — soft bristles, thoughtful materials, and designs that pair with our flavour-forward toothpaste lineup.',
  },
  {
    id: 'faq-replace',
    title: 'How often should I replace my brush?',
    content:
      'Dentists typically recommend replacing your toothbrush every 3 months, or sooner if bristles look frayed.',
  },
  {
    id: 'faq-children',
    title: 'Can children use these brushes?',
    content:
      'Adults and supervised children can use soft-bristle brushes. Consult your dentist for very young children.',
  },
]

const bambooSetContent: ProductPdpContent = {
  galleryImages: [],
  imageBadge: '3-PACK',
  headline: 'Eco-friendly clean, three at a time',
  intro:
    'Our Bamboo Toothbrush Set gives you three sustainable handles with soft bristles — gentle on gums, tough on plaque, and ready for your full Gelos flavour routine.',
  bullets: [
    'Three bamboo-handle brushes per pack',
    'Soft bristles for comfortable daily brushing',
    'Pairs with any Gelos Fluoride+ toothpaste',
  ],
  highlights: brushHighlights,
  usageSteps: sharedUsageSteps,
  detailsAccordion: [
    {
      id: 'different',
      title: 'What makes this brush set different?',
      content:
        'Bamboo handles offer a planet-friendly alternative to plastic — with the same soft-bristle comfort you expect from a premium daily brush.',
    },
    {
      id: 'included',
      title: "*What's included?",
      content: 'Three bamboo toothbrushes with soft bristles in retail packaging.',
    },
    {
      id: 'care',
      title: 'Care & storage',
      content:
        'Rinse after each use and store upright. Replace every 3 months or when bristles show wear.',
    },
  ],
  faq: sharedFaq,
}

const sonicBrushContent: ProductPdpContent = {
  galleryImages: [],
  imageBadge: 'SONIC TECH',
  headline: 'Power up your daily brush',
  intro:
    'The 3D Sonicwave G1 Electric Toothbrush delivers sonic cleaning power with a sleek design — upgrade your routine while keeping Gelos flavours front and centre.',
  bullets: [
    'Sonic cleaning action for a deeper feel',
    'Rechargeable handle — designed for daily use',
    'Ideal with Gelos Fluoride+ toothpaste',
  ],
  highlights: [
    { label: 'Sonic clean', emoji: '⚡' },
    { label: 'Rechargeable', emoji: '🔋' },
    { label: 'Pro feel', emoji: '✨' },
  ],
  usageSteps: [
    {
      title: 'Charge',
      body: 'Fully charge before first use per instructions in the box.',
    },
    {
      title: 'Brush',
      body: 'Apply Gelos toothpaste and guide the brush along each surface for two minutes.',
    },
    {
      title: 'Rinse',
      body: 'Rinse the brush head and return to its charging base.',
    },
  ],
  detailsAccordion: [
    {
      id: 'different',
      title: 'Why go electric?',
      content:
        'Sonic motion can help disrupt plaque in hard-to-reach areas — a step up from manual brushing when you want more from your routine.',
    },
    {
      id: 'included',
      title: "*What's included?",
      content:
        'One 3D Sonicwave G1 electric toothbrush handle, charging base, and brush head. See pack for full contents.',
    },
    {
      id: 'care',
      title: 'Head replacement',
      content:
        'Replace brush heads every 3 months or when bristles fray. Compatible replacement heads as listed on packaging.',
    },
  ],
  faq: sharedFaq,
}

const defaultToothbrushContent = (product: Product): ProductPdpContent => ({
  galleryImages: [],
  headline: 'Brush better with Gelos',
  intro: product.description,
  bullets: [
    'Designed for comfortable daily brushing',
    'Soft bristles for gentle cleaning',
    'Completes your Gelos smile-care routine',
  ],
  highlights: brushHighlights,
  usageSteps: sharedUsageSteps,
  detailsAccordion: [
    {
      id: 'different',
      title: 'Why Gelos brushes?',
      content:
        'Thoughtfully selected for comfort and durability — the perfect partner to our toothpastes and mouthwashes.',
    },
    {
      id: 'included',
      title: "*What's included?",
      content: `One ${product.name}.`,
    },
  ],
  faq: sharedFaq,
})

const contentBySlug: Record<string, ProductPdpContent> = {
  'bamboo-toothbrush-set-3-pack': bambooSetContent,
  '3d-sonicwave-g1-electric-toothbrush': sonicBrushContent,
}

function mergeGallery(base: ProductPdpContent): ProductPdpContent {
  return {
    ...base,
    galleryImages: getCodeDefaultGalleryImages(base.galleryImages),
  }
}

export function getToothbrushProductContent(product: Product): ProductPdpContent {
  const slug = getProductSlug(product)
  const base = contentBySlug[slug] ?? defaultToothbrushContent(product)
  return mergeGallery(base)
}

/** Cross-category picks for "People also love" on toothbrush PDPs */
export const toothbrushCommunityFavoriteIds = ['1', '12', '2', '3'] as const
