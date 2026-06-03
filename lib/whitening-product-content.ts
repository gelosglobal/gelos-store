import type { ProductPdpContent } from '@/lib/product-pdp-content'
import type { Product } from '@/lib/types/product'
import { normalizeImageUrl } from '@/lib/image-url'
import { getProductSlug } from '@/lib/product-utils'
import { getAdminGalleryImages } from '@/lib/product-gallery-images'

const whiteningHighlights: ProductPdpContent['highlights'] = [
  { label: 'Shade correction', emoji: '💜' },
  { label: 'Visible results', emoji: '✨' },
  { label: 'At-home ritual', emoji: '🏠' },
]

const sharedFaq: ProductPdpContent['faq'] = [
  {
    id: 'faq-different',
    title: 'How does Gelos whitening work?',
    content:
      'Our whitening range is designed to fit different goals — from quick shade correction to LED-assisted brightening. Pick the treatment that matches your routine and follow the directions on pack.',
  },
  {
    id: 'faq-sensitive',
    title: 'Is this suitable for sensitive teeth?',
    content:
      'If you have sensitivity, start with shorter sessions and space treatments apart. Stop use if discomfort persists and speak with your dentist.',
  },
  {
    id: 'faq-results',
    title: 'When will I see results?',
    content:
      'Many customers notice a fresher, brighter look after consistent use. Results vary by starting shade, diet, and how closely you follow the routine.',
  },
]

const v34UsageSteps: ProductPdpContent['usageSteps'] = [
  {
    title: 'Prep',
    body: 'Brush teeth and pat dry so the formula can adhere evenly to the surface you want to correct.',
  },
  {
    title: 'Apply',
    body: 'Apply the V34 shade corrector as directed on your kit — a thin, even layer is all you need.',
  },
  {
    title: 'Finish',
    body: 'Leave on for the recommended time, then rinse thoroughly. Use on a schedule that fits your smile goals.',
  },
]

const v34Content: ProductPdpContent = {
  galleryImages: [],
  imageBadge: 'BEST SELLER',
  headline: 'Colour-correct your smile in minutes',
  intro:
    'The V34 Shade Correction Kit uses purple colour theory to help neutralise yellow undertones — for a brighter, more balanced look without harsh peroxide sessions at home.',
  bullets: [
    'Purple V34 formula targets yellow tones optically',
    'Complete kit for an at-home shade-correction ritual',
    'Pairs with your daily Gelos toothpaste & mouthwash',
  ],
  highlights: whiteningHighlights,
  usageSteps: v34UsageSteps,
  detailsAccordion: [
    {
      id: 'different',
      title: 'What makes the V34 kit different?',
      content:
        'Unlike traditional bleaching alone, V34 shade correction works on colour balance — helping dial down the appearance of yellow so your smile looks fresher in photos and in the mirror.',
    },
    {
      id: 'included',
      title: "*What's included?",
      content:
        'One V34 Shade Correction Kit with everything you need to get started. See pack for full contents and directions.',
    },
    {
      id: 'how-often',
      title: 'How often should I use it?',
      content:
        'Follow the schedule on your kit. Most people space treatments to avoid overuse — consistency beats intensity.',
    },
  ],
  faq: [
    {
      id: 'faq-v34',
      title: 'What is V34 shade correction?',
      content:
        'V34 refers to a purple-toned corrector that helps offset yellow hues on the tooth surface — a popular approach for quick cosmetic brightening between deeper whitening treatments.',
    },
    ...sharedFaq.filter((item) => item.id !== 'faq-different'),
  ],
}

const ledDeviceContent: ProductPdpContent = {
  galleryImages: [],
  imageBadge: 'PRO TECH',
  headline: 'LED-powered whitening at home',
  intro:
    'Our LED Whitening Device pairs professional-style light technology with your favourite Gelos gels — designed for an elevated at-home brightening session.',
  bullets: [
    'LED tray for even light distribution',
    'Built for repeat at-home sessions',
    'Works with Gelos whitening formulas',
  ],
  highlights: [
    { label: 'LED boost', emoji: '💡' },
    { label: 'Salon-style', emoji: '✨' },
    { label: 'Reusable tray', emoji: '♻️' },
  ],
  detailsAccordion: [
    {
      id: 'different',
      title: 'Why choose the LED device?',
      content:
        'Light-assisted whitening can help accelerate gel activity during each session — ideal if you want a more intensive routine than strips or powder alone.',
    },
    {
      id: 'included',
      title: "*What's included?",
      content: 'One LED whitening device. Gels sold separately unless noted on pack.',
    },
  ],
  faq: sharedFaq,
}

const stripsContent: ProductPdpContent = {
  galleryImages: [],
  imageBadge: '14-DAY PLAN',
  headline: 'Strips that fit your schedule',
  intro:
    'Premium Whitening Strips deliver a simple 14-day plan — peel, apply, and go about your day while the formula works on surface stains.',
  bullets: [
    '30 pairs for a full two-week cycle',
    'Thin, flexible strip profile',
    'Easy to pack for travel',
  ],
  highlights: whiteningHighlights,
  detailsAccordion: [
    {
      id: 'different',
      title: 'What makes these strips different?',
      content:
        'Designed for predictable daily use — no mixing, no trays. Just consistent contact time session after session.',
    },
    {
      id: 'included',
      title: "*What's included?",
      content: '30 pairs of whitening strips (upper and lower).',
    },
  ],
  faq: sharedFaq,
}

const charcoalContent: ProductPdpContent = {
  galleryImages: [],
  imageBadge: 'NATURAL',
  headline: 'Charcoal-powered gentle brightening',
  intro:
    'Activated Charcoal Powder offers a natural approach to lifting surface stains — brush on, rinse off, and pair with your regular Gelos routine.',
  bullets: [
    'Fine activated charcoal powder',
    'Complements daily brushing',
    'For stain-conscious smile care',
  ],
  highlights: [
    { label: 'Natural', emoji: '🌿' },
    { label: 'Surface stains', emoji: '✨' },
    { label: 'Daily add-on', emoji: '🪥' },
  ],
  detailsAccordion: [
    {
      id: 'different',
      title: 'How do I use charcoal powder?',
      content:
        'Dip a damp brush into a small amount of powder, brush gently for about two minutes, then rinse well. Use as directed and avoid swallowing.',
    },
    {
      id: 'included',
      title: "*What's included?",
      content: 'One jar of activated charcoal whitening powder.',
    },
  ],
  faq: sharedFaq,
}

const defaultWhiteningContent = (product: Product): ProductPdpContent => ({
  galleryImages: [],
  headline: 'Brighten your smile with Gelos',
  intro: product.description,
  bullets: [
    'Professional-inspired formulas',
    'Designed for at-home use',
    'Part of the full Gelos smile-care line',
  ],
  highlights: whiteningHighlights,
  detailsAccordion: [
    {
      id: 'different',
      title: 'Why Gelos whitening?',
      content:
        'Gelos whitening products are formulated to slot into your existing routine — from quick correctors to LED-assisted sessions.',
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
  'v34-shade-correction-kit': v34Content,
  'led-whitening-device': ledDeviceContent,
  'premium-whitening-strips-30-pairs': stripsContent,
  'activated-charcoal-powder': charcoalContent,
}

function mergeGallery(
  base: ProductPdpContent,
  product: Product,
): ProductPdpContent {
  const adminGallery = getAdminGalleryImages(product)
  const galleryImages =
    adminGallery.length > 0
      ? adminGallery
      : base.galleryImages.map((src) => normalizeImageUrl(src))

  return {
    ...base,
    galleryImages,
  }
}

export function getWhiteningProductContent(product: Product): ProductPdpContent {
  const slug = getProductSlug(product)
  const base = contentBySlug[slug] ?? defaultWhiteningContent(product)
  return mergeGallery(base, product)
}

/** Cross-category picks for "People also love" on whitening PDPs */
export const whiteningCommunityFavoriteIds = ['1', '12', '2', '11'] as const
