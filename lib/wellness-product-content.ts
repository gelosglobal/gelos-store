import type { ProductPdpContent } from '@/lib/product-pdp-content'
import type { Product } from '@/lib/types/product'
import { normalizeImageUrl } from '@/lib/image-url'
import { getProductSlug } from '@/lib/product-utils'
import { getCodeDefaultGalleryImages } from '@/lib/product-gallery-images'

const wellnessHighlights: ProductPdpContent['highlights'] = [
  { label: 'On-the-go energy', emoji: '⚡' },
  { label: 'Bold fruit flavour', emoji: '🍇' },
  { label: 'Portable case', emoji: '👜' },
]

const sharedFaq: ProductPdpContent['faq'] = [
  {
    id: 'faq-different',
    title: 'What is Fruit Energy?',
    content:
      'Gelos Fruit Energy is a portable, flavour-packed pick-me-up designed for busy days — a fun way to feel refreshed when you need a quick boost.',
  },
  {
    id: 'faq-how',
    title: 'How do I use it?',
    content:
      'Follow the instructions on your case. Use as directed and keep the case closed when not in use to maintain freshness.',
  },
  {
    id: 'faq-daily',
    title: 'Can I use this every day?',
    content:
      'Use as needed throughout the day. If you have sensitivities or health conditions, check with your healthcare provider.',
  },
]

const grapeMintContent: ProductPdpContent = {
  galleryImages: [],
  imageBadge: 'BEST SELLER',
  headline: 'Grape mint energy, on demand',
  intro:
    'Grape Mint Fruit Energy delivers a bold grape-and-mint burst in a pocket-friendly case — made for moments when you want a quick, flavour-forward refresh on the go.',
  bullets: [
    'Grape mint flavour with an energising feel',
    'Compact case — fits your bag or pocket',
    'Pairs with your full Gelos smile-care routine',
  ],
  highlights: wellnessHighlights,
  detailsAccordion: [
    {
      id: 'different',
      title: 'What makes Grape Mint Fruit Energy different?',
      content:
        'A fan-favourite in the Gelos lineup — bold fruit flavour in a portable format that is easy to take anywhere your day takes you.',
    },
    {
      id: 'included',
      title: "*What's included?",
      content: 'One Grape Mint Fruit Energy case. Sealed for freshness.',
    },
    {
      id: 'use',
      title: 'How to enjoy',
      content:
        'Open your case and use as directed. Store in a cool, dry place and keep away from direct sunlight.',
    },
  ],
  faq: sharedFaq,
}

const inhalerContent: ProductPdpContent = {
  galleryImages: [],
  imageBadge: 'AROMA BOOST',
  headline: 'Breathe in the good vibes',
  intro:
    'Our Aromatherapy Nasal Inhaler blends therapeutic essential oils with a ripe mango note — a portable refresh for travel, work, or winding down.',
  bullets: [
    'Therapeutic essential oil blend',
    'Mango-inspired aroma',
    'Compact and travel-friendly',
  ],
  highlights: [
    { label: 'Aromatherapy', emoji: '🌿' },
    { label: 'Mango scent', emoji: '🥭' },
    { label: 'Travel ready', emoji: '✈️' },
  ],
  detailsAccordion: [
    {
      id: 'different',
      title: 'What makes this inhaler different?',
      content:
        'Designed for quick aromatherapy on the go — uplifting mango notes in a slim, pocketable format.',
    },
    {
      id: 'included',
      title: "*What's included?",
      content: 'One aromatherapy nasal inhaler.',
    },
    {
      id: 'care',
      title: 'Care & storage',
      content: 'Keep the cap secured when not in use. Store upright in a cool, dry place.',
    },
  ],
  faq: sharedFaq,
}

const defaultWellnessContent = (product: Product): ProductPdpContent => ({
    galleryImages: [],
  headline: 'Refresh your routine',
  intro: product.description,
  bullets: [
    'Portable wellness pick-me-up',
    'Designed for everyday use',
    'From the makers of Gelos smile care',
  ],
  highlights: wellnessHighlights,
  detailsAccordion: [
    {
      id: 'different',
      title: 'Why Gelos wellness?',
      content:
        'Gelos wellness products are designed to complement your oral care routine with portable, flavour-forward formats.',
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
  'grape-mint-fruit-energy': grapeMintContent,
  'aromatherapy-nasal-inhaler': inhalerContent,
}

function mergeGallery(base: ProductPdpContent): ProductPdpContent {
  return {
    ...base,
    galleryImages: getCodeDefaultGalleryImages(base.galleryImages),
  }
}

export function getWellnessProductContent(product: Product): ProductPdpContent {
  const slug = getProductSlug(product)
  const base = contentBySlug[slug] ?? defaultWellnessContent(product)
  return mergeGallery(base)
}

/** Cross-category picks for "People also love" on wellness PDPs */
export const wellnessCommunityFavoriteIds = ['1', '12', '11', '7'] as const
