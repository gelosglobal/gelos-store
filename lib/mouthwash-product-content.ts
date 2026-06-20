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

const mouthwashRangeBenefits = [
  'Helps reduce bacteria in the mouth',
  'Keeps breath fresh for longer',
  'Enhances overall oral hygiene routine',
  'Gentle and non-burning alcohol-free formula',
  'Fun, flavorful experience for daily use',
]

const mouthwashUsageSteps: ProductPdpContent['usageSteps'] = [
  {
    title: 'Pour',
    body: 'Pour a small amount into your mouth.',
  },
  {
    title: 'Swish',
    body: 'Swish for 30–60 seconds.',
  },
  {
    title: 'Foam',
    body: 'Let the foam reach all areas of the mouth.',
  },
  {
    title: 'Spit',
    body: 'Spit out after use. Do not swallow.',
  },
]

const mouthwashRangeFaq: ProductPdpContent['faq'] = [
  {
    id: 'faq-different',
    title: 'What makes Gelos Foaming Mouthwash different?',
    content:
      'An alcohol-free, foaming formula that spreads evenly for full-mouth coverage — fresh breath and a deep clean feel in seconds, without the burn of traditional rinses.',
  },
  {
    id: 'faq-flavors',
    title: 'Which flavours are available?',
    content:
      'Blue Raspberry, Strawberry, Watermelon, and Grape Bubble Gum. Use the flavour picker on this page to explore the full lineup.',
  },
  {
    id: 'faq-everyday',
    title: 'Can I use this as my everyday mouthwash?',
    content:
      'Yes. Use once or twice daily after brushing as part of your regular oral care routine.',
  },
  {
    id: 'faq-children',
    title: 'Can I purchase this for my children?',
    content:
      'We recommend this product for adults and supervised children over 6. Consult your dentist for younger children.',
  },
]

function mouthwashRangeAccordion(flavorName: string): ProductPdpContent['detailsAccordion'] {
  return [
    {
      id: 'flavors',
      title: 'Available flavours',
      content:
        'Blue Raspberry · Strawberry · Watermelon · Grape Bubble Gum. Pick your favourite using the flavour picker above.',
    },
    {
      id: 'features',
      title: 'Key features',
      content:
        'Alcohol-free formula · Foaming action for full-mouth coverage · Helps fight bad breath · Leaves long-lasting freshness · Up to 60+ uses per bottle',
    },
    {
      id: 'different',
      title: 'What makes Gelos Foaming Mouthwash different?',
      content:
        'A refreshing, alcohol-free rinse with a unique foaming formula designed to cleanse the mouth, fight bad breath, and leave a long-lasting fresh feeling in seconds.',
    },
    {
      id: 'included',
      title: "*What's included?",
      content: `One foaming mouthwash bottle (${flavorName}) with pump dispenser. Sealed for freshness.`,
    },
    {
      id: 'ingredients',
      title: 'List of ingredients',
      content:
        'Aqua, Glycerin, Poloxamer 407, Aroma, Cetylpyridinium Chloride, Sodium Saccharin, CI 42090. Alcohol free.',
    },
  ]
}

const blueRaspberryMouthwash: ProductPdpContent = {
  galleryImages: [],
  imageBadge: '4 FLAVOURS',
  headline: 'Gelos Foaming Mouthwash',
  intro:
    'The Gelos Foaming Mouthwash is a refreshing, alcohol-free oral care rinse designed to cleanse the mouth, fight bad breath, and leave a long-lasting fresh feeling. Its unique foaming formula helps spread evenly across the mouth for a deep clean in seconds. You are viewing Blue Raspberry — use the flavour picker above to explore Watermelon, Strawberry, and Grape Bubble Gum.',
  bullets: mouthwashRangeBenefits,
  highlights: [
    { label: 'Alcohol-free', emoji: '🧪' },
    { label: 'Foaming clean', emoji: '✨' },
    { label: '60+ uses', emoji: '👄' },
  ],
  usageSteps: mouthwashUsageSteps,
  usageStepsTitle: 'How to use your Gelos mouthwash',
  usageStepsIntro:
    'Use once or twice daily for best results.',
  detailsAccordion: mouthwashRangeAccordion('Blue Raspberry'),
  faq: mouthwashRangeFaq,
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

const mouthSprayBenefits = [
  'Instantly freshens breath',
  'Helps eliminate bad breath on the go',
  'Gentle, non-drying formula',
  'Convenient for travel, meetings, and daily use',
  'Leaves a pleasant lasting taste',
]

const mouthSprayUsageSteps: ProductPdpContent['usageSteps'] = [
  {
    title: 'Spray',
    body: 'Spray 1–2 times directly into the mouth.',
  },
  {
    title: 'Anytime',
    body: 'Use anytime you need fresh breath.',
  },
  {
    title: 'No rinse',
    body: 'No need to rinse after use.',
  },
]

const mouthSprayFaq: ProductPdpContent['faq'] = [
  {
    id: 'faq-different',
    title: 'What makes Gelos Mouth Spray different?',
    content:
      'An alcohol-free oral freshener in a pocket-sized spray — instant fresh breath without dryness or irritation.',
  },
  {
    id: 'faq-flavors',
    title: 'Which flavours are available?',
    content:
      'Grape, Strawberry, Peach, and Mint. See product packaging or the flavour picker when available.',
  },
  {
    id: 'faq-daily',
    title: 'How often can I use it?',
    content:
      'Spray 1–2 times as needed throughout the day. No rinsing required.',
  },
  {
    id: 'faq-travel',
    title: 'Is it travel-friendly?',
    content:
      'Yes. The compact spray format fits easily in a pocket or bag for meetings, travel, and on-the-go freshness.',
  },
]

const mouthSprayContent: ProductPdpContent = {
  galleryImages: [],
  imageBadge: '4 FLAVOURS',
  headline: 'Mouth Spray (Gelos Oral Freshener)',
  intro:
    'The Gelos Mouth Spray is a quick and convenient oral freshener designed to instantly eliminate bad breath and leave your mouth feeling clean, fresh, and refreshed anytime, anywhere. Its alcohol-free formula ensures a gentle experience without dryness or irritation.',
  bullets: mouthSprayBenefits,
  highlights: [
    { label: 'Alcohol-free', emoji: '🧪' },
    { label: 'Pocket-sized', emoji: '👜' },
    { label: 'Instant fresh', emoji: '✨' },
  ],
  usageSteps: mouthSprayUsageSteps,
  usageStepsTitle: 'How to use your Gelos mouth spray',
  usageStepsIntro:
    'Can be used multiple times daily as needed.',
  detailsAccordion: [
    {
      id: 'flavors',
      title: 'Available flavours',
      content: 'Grape · Strawberry · Peach · Mint.',
    },
    {
      id: 'features',
      title: 'Key features',
      content:
        'Alcohol-free formula · Pocket-sized and travel-friendly · Instant fresh breath effect · Long-lasting freshness · Easy spray application',
    },
    {
      id: 'different',
      title: 'What makes Gelos Mouth Spray different?',
      content:
        'A gentle, alcohol-free spray that freshens breath instantly — no burn, no dryness, just clean freshness on the go.',
    },
    {
      id: 'included',
      title: "*What's included?",
      content:
        'One Gelos Mouth Spray bottle with spray applicator. See packaging for volume and flavour.',
    },
  ],
  faq: mouthSprayFaq,
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
  'mouth-spray': mouthSprayContent,
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
