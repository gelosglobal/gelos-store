import type { ProductPdpContent } from '@/lib/product-pdp-content'
import type { Product } from '@/lib/types/product'
import { normalizeImageUrl } from '@/lib/image-url'
import { getCodeDefaultGalleryImages } from '@/lib/product-gallery-images'
import { getProductSlug } from '@/lib/product-utils'

const mouthwashHighlights: ProductPdpContent['highlights'] = [
  { label: 'Flavour & freshness', emoji: '👄' },
  { label: 'Alcohol-free formula', emoji: '🧪' },
  { label: 'Fresh breath care', emoji: '🦷' },
]

const sharedFaq: ProductPdpContent['faq'] = [
  {
    id: 'faq-different',
    title: 'What makes this mouthwash different?',
    content:
      'Our foaming, alcohol-free formula delivers fresh breath with bold fruit-inspired flavours — no burn, just a fun rinse you will look forward to.',
  },
  {
    id: 'faq-everyday',
    title: 'Can I use this as my everyday mouthwash?',
    content:
      'Yes. Use after brushing as part of your daily routine for an extra burst of freshness.',
  },
  {
    id: 'faq-children',
    title: 'Can I purchase this for my children?',
    content:
      'We recommend this product for adults and supervised children over 6. Consult your dentist for younger children.',
  },
]

const watermelonMouthwash: ProductPdpContent = {
  galleryImages: [],
  imageBadge: '60 USES',
  headline: 'Wild about watermelon?',
  intro:
    'Our foaming, alcohol-free mouthwash delivers a fresh, fruity rinse with a burst of watermelon flavour — made for everyday breath care without the burn.',
  bullets: [
    'Flavour with a burst of freshness',
    'Alcohol-free foaming formula',
    'Up to 60 uses per bottle',
  ],
  highlights: mouthwashHighlights,
  detailsAccordion: [
    {
      id: 'different',
      title: 'What makes this mouthwash different?',
      content:
        'Gelos Foaming Watermelon Mouthwash uses a gentle, alcohol-free foam that freshens breath while delivering a flavour-first experience you will actually enjoy.',
    },
    {
      id: 'included',
      title: "*What's included?",
      content: 'One 55ml foaming mouthwash bottle with pump dispenser. Sealed for freshness.',
    },
    {
      id: 'ingredients',
      title: 'List of ingredients',
      content:
        'Aqua, Glycerin, Poloxamer 407, Aroma, Cetylpyridinium Chloride, Sodium Saccharin, CI 45410. Alcohol free.',
    },
  ],
  faq: sharedFaq,
}

const strawberryMouthwash: ProductPdpContent = {
  galleryImages: [],
  imageBadge: '50 USES',
  headline: 'Sweet on strawberry?',
  intro:
    'A foaming, alcohol-free rinse with ripe strawberry flavour — fresh breath that feels as good as it tastes.',
  bullets: [
    'Flavour with a burst of freshness',
    'Alcohol-free foaming formula',
    'Up to 50 uses per bottle',
  ],
  highlights: mouthwashHighlights,
  detailsAccordion: [
    {
      id: 'different',
      title: 'What makes this mouthwash different?',
      content:
        'Bold strawberry flavour in a gentle foam — effective fresh breath without harsh alcohol.',
    },
    {
      id: 'included',
      title: "*What's included?",
      content: 'One 55ml foaming mouthwash bottle with pump dispenser.',
    },
    {
      id: 'ingredients',
      title: 'List of ingredients',
      content:
        'Aqua, Glycerin, Poloxamer 407, Aroma, Cetylpyridinium Chloride, Sodium Saccharin, CI 14720. Alcohol free.',
    },
  ],
  faq: sharedFaq,
}

const blueRaspberryMouthwash: ProductPdpContent = {
  galleryImages: [],
  imageBadge: '60 USES',
  headline: 'Bold blue raspberry?',
  intro:
    'Cool, candy-shop blue raspberry in an alcohol-free foaming rinse — fresh breath with a playful twist.',
  bullets: [
    'Flavour with a burst of freshness',
    'Alcohol-free foaming formula',
    'Fresh breath on the go',
  ],
  highlights: mouthwashHighlights,
  detailsAccordion: [
    {
      id: 'different',
      title: 'What makes this mouthwash different?',
      content:
        'Our foaming formula pairs vivid blue raspberry flavour with alcohol-free fresh breath care.',
    },
    {
      id: 'included',
      title: "*What's included?",
      content: 'One 85ml foaming mouthwash bottle with pump dispenser.',
    },
    {
      id: 'ingredients',
      title: 'List of ingredients',
      content:
        'Aqua, Glycerin, Poloxamer 407, Aroma, Cetylpyridinium Chloride, Sodium Saccharin, CI 42090. Alcohol free.',
    },
  ],
  faq: sharedFaq,
}

const grapeBubblegumMouthwash: ProductPdpContent = {
  galleryImages: [],
  imageBadge: '50 USES',
  headline: 'Grape bubblegum bliss?',
  intro:
    'A fun fusion of grape and bubblegum in a foaming, alcohol-free rinse — fresh breath that feels like a treat.',
  bullets: [
    'Flavour with a burst of freshness',
    'Alcohol-free foaming formula',
    'Up to 50 uses per bottle',
  ],
  highlights: mouthwashHighlights,
  detailsAccordion: [
    {
      id: 'different',
      title: 'What makes this mouthwash different?',
      content:
        'Playful grape bubblegum flavour meets gentle, alcohol-free foaming fresh breath care.',
    },
    {
      id: 'included',
      title: "*What's included?",
      content: 'One 50ml foaming mouthwash bottle with pump dispenser.',
    },
    {
      id: 'ingredients',
      title: 'List of ingredients',
      content:
        'Aqua, Glycerin, Poloxamer 407, Aroma, Cetylpyridinium Chloride, Sodium Saccharin, CI 17200. Alcohol free.',
    },
  ],
  faq: sharedFaq,
}

const defaultMouthwashContent = (product: Product): ProductPdpContent => {
  const flavor = product.name
    .replace(/ Foaming Mouthwash$/i, '')
    .toLowerCase()
  return {
    galleryImages: [],
    headline: `Fresh ${flavor}?`,
    intro: product.description,
    bullets: watermelonMouthwash.bullets,
    highlights: mouthwashHighlights,
    detailsAccordion: [
      {
        id: 'different',
        title: 'What makes this mouthwash different?',
        content: `${product.name} uses our alcohol-free foaming formula for fresh breath with a flavour-first experience.`,
      },
      {
        id: 'included',
        title: "*What's included?",
        content: `One bottle of ${product.name}.`,
      },
      {
        id: 'ingredients',
        title: 'List of ingredients',
        content:
          'Aqua, Glycerin, Poloxamer 407, Aroma, Cetylpyridinium Chloride, Sodium Saccharin. Alcohol free.',
      },
    ],
    faq: sharedFaq,
  }
}

const contentBySlug: Record<string, ProductPdpContent> = {
  'watermelon-foaming-mouthwash': watermelonMouthwash,
  'strawberry-foaming-mouthwash': strawberryMouthwash,
  'blue-raspberry-foaming-mouthwash': blueRaspberryMouthwash,
  'grape-bubblegum-foaming-mouthwash': grapeBubblegumMouthwash,
}

function mergeGallery(base: ProductPdpContent): ProductPdpContent {
  return {
    ...base,
    galleryImages: getCodeDefaultGalleryImages(base.galleryImages),
  }
}

export function getMouthwashProductContent(product: Product): ProductPdpContent {
  const slug = getProductSlug(product)
  const base = contentBySlug[slug] ?? defaultMouthwashContent(product)
  return mergeGallery(base)
}

/** Cross-category picks for mouthwash PDPs */
export const mouthwashCommunityFavoriteIds = ['1', '11', '7', '9'] as const
