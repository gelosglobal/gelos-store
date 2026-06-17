import type { ProductPdpContent } from '@/lib/product-pdp-content'
import type { Product } from '@/lib/types/product'
import { getCodeDefaultGalleryImages } from '@/lib/product-gallery-images'

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

export function getWaterFlosserProductContent(product: Product): ProductPdpContent {
  const base: ProductPdpContent = {
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
  }

  return {
    ...base,
    galleryImages: getCodeDefaultGalleryImages(base.galleryImages),
  }
}

export const waterFlosserCommunityFavoriteIds = ['1', '12', '8', '3'] as const
