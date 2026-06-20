import type { ProductPdpContent } from '@/lib/product-pdp-content'
import type { Product } from '@/lib/types/product'
import { getCodeDefaultGalleryImages } from '@/lib/product-gallery-images'
import { getProductSlug } from '@/lib/product-utils'

const waterFlosserHighlights: ProductPdpContent['highlights'] = [
  { label: 'Deep clean', emoji: '💧' },
  { label: 'Gum care', emoji: '🦷' },
  { label: 'Easy daily use', emoji: '✨' },
]

const sharedFaq: ProductPdpContent['faq'] = [
  {
    id: 'faq-different',
    title: 'Why use a water flosser?',
    content:
      'Water flossers help clean between teeth and along the gum line with a gentle pressurised stream — a useful add-on to brushing for fresher, cleaner-feeling smiles.',
  },
  {
    id: 'faq-sensitive',
    title: 'Is it suitable for sensitive gums?',
    content:
      'Start on a lower pressure setting and increase gradually. If irritation persists, pause use and speak with your dentist.',
  },
]

const cs1Benefits = [
  'Helps remove trapped food particles and plaque',
  'Supports healthier gums and stronger oral hygiene',
  'Reaches deep between teeth and gum line',
  'Helps reduce bad breath',
  'Safe waterproof design for use in wet environments',
  'Easy and convenient for daily home use',
]

const cs1UsageSteps: ProductPdpContent['usageSteps'] = [
  {
    title: 'Fill',
    body: 'Fill the tank with clean water.',
  },
  {
    title: 'Attach',
    body: 'Attach your desired nozzle.',
  },
  {
    title: 'Select mode',
    body: 'Select your preferred cleaning mode.',
  },
  {
    title: 'Aim',
    body: 'Aim at the gum line and between teeth.',
  },
  {
    title: 'Clean',
    body: 'Move slowly around the mouth until complete.',
  },
  {
    title: 'Empty',
    body: 'Empty and clean the unit after use.',
  },
]

const cs1Faq: ProductPdpContent['faq'] = [
  {
    id: 'faq-different',
    title: 'What makes the Gelos CS1 different?',
    content:
      'The CS1 delivers the same powerful performance as our portable flosser with an upgraded fully waterproof design — safer and more convenient for everyday use in wet environments.',
  },
  {
    id: 'faq-modes',
    title: 'What are the 3 cleaning modes?',
    content:
      'Three adjustable modes let you match pressure to your comfort — start lower if you are new to water flossing, then increase as needed.',
  },
  {
    id: 'faq-nozzles',
    title: 'How many nozzles are included?',
    content:
      'Four interchangeable nozzles are included, with a 360° rotating design for full-mouth reach.',
  },
  {
    id: 'faq-sensitive',
    title: 'Is it suitable for sensitive gums?',
    content:
      'Yes. Begin on a gentler mode and guide the stream along the gum line. Stop use if irritation persists and consult your dentist.',
  },
]

const cs1Content: ProductPdpContent = {
  galleryImages: [],
  imageBadge: 'CS1',
  headline: 'Gelos CS1 Water Flosser',
  intro:
    'The Gelos CS1 Water Flosser is a powerful advanced oral irrigator designed for a deeper, more effective clean between teeth and along the gum line. It helps remove food particles and plaque that brushing alone cannot reach, supporting healthier gums and fresher breath. It carries the same performance as the portable flosser, with an upgraded waterproof design for safer and more convenient use.',
  bullets: cs1Benefits,
  highlights: [
    { label: '4 nozzles', emoji: '💧' },
    { label: 'Fully waterproof', emoji: '🛡️' },
    { label: 'USB rechargeable', emoji: '🔋' },
  ],
  usageSteps: cs1UsageSteps,
  usageStepsTitle: 'How to use your Gelos CS1',
  usageStepsIntro:
    'Use once or twice daily, ideally after brushing, for best results.',
  detailsAccordion: [
    {
      id: 'features',
      title: 'Key features',
      content:
        '4 interchangeable nozzles included · 360° rotating nozzle for full-mouth reach · 3 adjustable cleaning modes · 200ml water tank capacity · USB rechargeable · Fully waterproof design',
    },
    {
      id: 'different',
      title: 'What makes the Gelos CS1 different?',
      content:
        'An advanced oral irrigator that pairs deep-clean performance with a fully waterproof body — ideal for confident daily use at home.',
    },
    {
      id: 'included',
      title: "*What's included?",
      content:
        'One Gelos CS1 Water Flosser, four interchangeable nozzles, USB charging cable, and user manual. See packaging for full contents.',
    },
    {
      id: 'care',
      title: 'Care & storage',
      content:
        'Empty the tank after each use, rinse nozzles, and wipe the unit dry. Store upright in a clean, dry place.',
    },
  ],
  faq: cs1Faq,
}

const defaultWaterFlosserContent = (product: Product): ProductPdpContent => ({
  galleryImages: [],
  headline: 'A cleaner feel between every tooth',
  intro:
    product.description ||
    `${product.name} delivers targeted water pressure to help rinse away debris between teeth and along the gum line — an easy upgrade to your daily Gelos routine.`,
  bullets: [
    'Helps clean hard-to-reach spaces',
    'Pairs with brushing and mouthwash',
    'Designed for regular at-home use',
  ],
  highlights: waterFlosserHighlights,
  detailsAccordion: [
    {
      id: 'different',
      title: `About ${product.name}`,
      content:
        'Use after brushing to help flush away leftover particles and support gum-line freshness.',
    },
    {
      id: 'included',
      title: "*What's included?",
      content: `One ${product.name}. See packaging for full contents and setup guide.`,
    },
  ],
  faq: sharedFaq,
})

const contentBySlug: Record<string, ProductPdpContent> = {
  'portable-water-flosser-cs1': cs1Content,
}

function mergeGallery(base: ProductPdpContent): ProductPdpContent {
  return {
    ...base,
    galleryImages: getCodeDefaultGalleryImages(base.galleryImages),
  }
}

export function getWaterFlosserProductContent(product: Product): ProductPdpContent {
  const slug = getProductSlug(product)
  const base = contentBySlug[slug] ?? defaultWaterFlosserContent(product)
  return mergeGallery(base)
}

export const waterFlosserCommunityFavoriteIds = ['1', '12', '8', '3'] as const
