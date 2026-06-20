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

const bambooBenefits = [
  'Helps reduce plastic waste',
  'Gentle on gums and teeth',
  'Supports effective plaque removal',
  'Comfortable grip for easy brushing',
  'Sustainable alternative to plastic toothbrushes',
  'Suitable for adults and children',
]

const bambooUsageSteps: ProductPdpContent['usageSteps'] = [
  {
    title: 'Apply',
    body: 'Apply toothpaste to the bristles.',
  },
  {
    title: 'Brush',
    body: 'Brush teeth gently for 2 minutes.',
  },
  {
    title: 'Cover',
    body: 'Cover all surfaces — front, back, and chewing surfaces.',
  },
  {
    title: 'Rinse',
    body: 'Rinse thoroughly after use.',
  },
  {
    title: 'Store',
    body: 'Store in a dry place after brushing.',
  },
]

const bambooFaq: ProductPdpContent['faq'] = [
  {
    id: 'faq-different',
    title: 'What makes the Gelos Bamboo Toothbrush different?',
    content:
      'A natural bamboo handle with soft nylon bristles — effective daily cleaning with less plastic waste than conventional brushes.',
  },
  {
    id: 'faq-pack',
    title: 'How many brushes are in the set?',
    content:
      'Three bamboo toothbrushes per pack — enough for yourself or to share across the household.',
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
      'Yes. The soft bristles are suitable for adults and supervised children. Consult your dentist for very young children.',
  },
]

const bambooSetContent: ProductPdpContent = {
  galleryImages: [],
  imageBadge: '3-PACK',
  headline: 'Gelos Eco-Friendly Bamboo Toothbrush',
  intro:
    'The Gelos Bamboo Toothbrush is a sustainable oral care essential designed to provide effective cleaning while being environmentally friendly. Made with a natural bamboo handle and soft bristles, it offers a comfortable brushing experience while reducing plastic waste.',
  bullets: bambooBenefits,
  highlights: [
    { label: 'Bamboo handle', emoji: '🌿' },
    { label: 'Soft bristles', emoji: '🪥' },
    { label: '3-pack value', emoji: '✨' },
  ],
  usageSteps: bambooUsageSteps,
  usageStepsTitle: 'How to use your bamboo toothbrush',
  usageStepsIntro:
    'Use twice daily for best oral hygiene results.',
  detailsAccordion: [
    {
      id: 'features',
      title: 'Key features',
      content:
        'Eco-friendly bamboo handle · Soft nylon bristles for gentle cleaning · Lightweight and easy to hold · Biodegradable handle material · Designed for daily use',
    },
    {
      id: 'different',
      title: 'What makes the Gelos Bamboo Toothbrush different?',
      content:
        'Sustainable bamboo construction with the soft-bristle comfort you expect from a premium daily brush — three brushes per pack for lasting value.',
    },
    {
      id: 'included',
      title: "*What's included?",
      content:
        'Three Gelos Eco-Friendly Bamboo Toothbrushes with soft nylon bristles in retail packaging.',
    },
    {
      id: 'care',
      title: 'Care & storage',
      content:
        'Rinse after each use and store upright in a dry place. Replace every 3 months or when bristles show wear.',
    },
  ],
  faq: bambooFaq,
}

const sonicBrushBenefits = [
  'Removes plaque more effectively than manual brushing',
  'Helps improve gum health and oral hygiene',
  'Supports teeth whitening over time',
  'Encourages proper brushing duration with built-in timer',
  'Long battery life, perfect for travel and daily use',
  'Gentle on sensitive teeth and gums',
]

const sonicBrushUsageSteps: ProductPdpContent['usageSteps'] = [
  {
    title: 'Apply',
    body: 'Apply toothpaste to the brush head.',
  },
  {
    title: 'Position',
    body: 'Place the brush on your teeth before switching on.',
  },
  {
    title: 'Select mode',
    body: 'Choose your preferred cleaning mode — Sensitive, Clean, Whitening, Gum Care, or Deep Clean.',
  },
  {
    title: 'Brush',
    body: 'Gently guide the brush across all tooth surfaces.',
  },
  {
    title: 'Timer',
    body: 'Let the 2-minute smart timer complete the session.',
  },
  {
    title: 'Rinse',
    body: 'Rinse the brush head after use and return to its charging base.',
  },
]

const sonicBrushFaq: ProductPdpContent['faq'] = [
  {
    id: 'faq-modes',
    title: 'What are the 5 cleaning modes?',
    content:
      'Sensitive, Clean, Whitening, Gum Care, and Deep Clean — switch modes to match how your teeth and gums feel that day.',
  },
  {
    id: 'faq-battery',
    title: 'How long does the battery last?',
    content:
      'Up to 60 days on a full charge with typical daily use. Recharge quickly via Type-C when needed.',
  },
  {
    id: 'faq-replace',
    title: 'How often should I replace the brush head?',
    content:
      'Dentists typically recommend replacing your brush head every 3 months, or sooner if bristles look frayed.',
  },
  {
    id: 'faq-sensitive',
    title: 'Is it suitable for sensitive teeth?',
    content:
      'Yes. Use Sensitive mode and soft nylon bristles for a gentle clean. Stop use if discomfort persists and consult your dentist.',
  },
]

const sonicBrushContent: ProductPdpContent = {
  galleryImages: [],
  imageBadge: 'SONIC G1',
  headline: 'Gelos SonicWave G1',
  intro:
    'The Gelos SonicWave G1 is a smart electric toothbrush designed for a deeper, more effective clean using sonic technology while being gentle on the gums. Choose from five colours using the style picker above — Black, Blue, White, Pink, and Green.',
  bullets: sonicBrushBenefits,
  highlights: [
    { label: '5 smart modes', emoji: '⚡' },
    { label: '60-day battery', emoji: '🔋' },
    { label: '2-min timer', emoji: '⏱️' },
  ],
  usageSteps: sonicBrushUsageSteps,
  usageStepsTitle: 'How to use your SonicWave G1',
  usageStepsIntro:
    'Use twice daily — morning and night — for best results.',
  detailsAccordion: [
    {
      id: 'colors',
      title: 'Available colours',
      content:
        'Black · Blue · White · Pink · Green. Select your finish with the colour picker on this page.',
    },
    {
      id: 'features',
      title: 'Key features',
      content:
        '5 Smart Cleaning Modes (Sensitive, Clean, Whitening, Gum Care, Deep Clean) · Sonic cleaning technology for effective plaque removal · 60-day battery life on a full charge · Type-C fast charging · 2-minute smart timer (dentist-recommended brushing time) · Soft nylon bristles for gentle cleaning',
    },
    {
      id: 'included',
      title: "*What's included?",
      content:
        'One Gelos SonicWave G1 electric toothbrush handle, brush head, Type-C charging cable, and user manual. See pack for full contents.',
    },
    {
      id: 'care',
      title: 'Head replacement & care',
      content:
        'Rinse the brush head after each use. Replace brush heads every 3 months or when bristles fray. Wipe the handle dry and store on its charging base.',
    },
  ],
  faq: sonicBrushFaq,
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
  'sonicwave-g1-series-electric-toothbrush': sonicBrushContent,
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
