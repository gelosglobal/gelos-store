import type { ProductPdpContent } from '@/lib/product-pdp-content'
import type { Product } from '@/lib/types/product'
import { normalizeImageUrl } from '@/lib/image-url'
import { getCodeDefaultGalleryImages } from '@/lib/product-gallery-images'
const toolsHighlights: ProductPdpContent['highlights'] = [
  { label: 'Pro tools', emoji: '🛠️' },
  { label: 'Daily use', emoji: '✨' },
  { label: 'Gelos quality', emoji: '🦷' },
]

const sharedFaq: ProductPdpContent['faq'] = [
  {
    id: 'faq-different',
    title: 'What are Gelos tools?',
    content:
      'Practical smile-care tools that support brushing, rinsing, and whitening — built for everyday bathrooms and travel kits.',
  },
  {
    id: 'faq-care',
    title: 'How do I care for my tools?',
    content:
      'Rinse after use, air dry upright, and replace parts as recommended on packaging.',
  },
]

/** Default enhanced PDP content for Tools and any unknown category */
export function getToolsProductContent(product: Product): ProductPdpContent {
  const base: ProductPdpContent = {
    galleryImages: [],
    headline: `Upgrade your ${product.category.toLowerCase()} routine`,
    intro:
      product.description ||
      `${product.name} is part of the Gelos lineup — designed to work alongside our toothpastes, rinses, and whitening picks.`,
    bullets: [
      'Built for everyday smile care',
      'Pairs with the full Gelos range',
      'Quality you can feel',
    ],
    highlights: toolsHighlights,
    detailsAccordion: [
      {
        id: 'different',
        title: `About ${product.name}`,
        content: `${product.name} helps you get more from your daily oral care routine.`,
      },
      {
        id: 'included',
        title: "*What's included?",
        content: `One ${product.name}. See packaging for full contents.`,
      },
    ],
    faq: sharedFaq,
  }

  return {
    ...base,
    galleryImages: getCodeDefaultGalleryImages(base.galleryImages),
  }
}

export const toolsCommunityFavoriteIds = ['1', '12', '8', '3'] as const
