import type { ProductPdpContent } from '@/lib/product-pdp-content'
import type { Product } from '@/lib/types/product'
import { normalizeImageUrl } from '@/lib/image-url'
import { getCodeDefaultGalleryImages } from '@/lib/product-gallery-images'
import { getProductSlug } from '@/lib/product-utils'

const accessoriesHighlights: ProductPdpContent['highlights'] = [
  { label: 'Fun extras', emoji: '✨' },
  { label: 'Easy to use', emoji: '🎁' },
  { label: 'Giftable', emoji: '💝' },
]

const sharedFaq: ProductPdpContent['faq'] = [
  {
    id: 'faq-different',
    title: 'What are Gelos accessories?',
    content:
      'Playful add-ons and extras that complement your smile-care routine — perfect for gifting or treating yourself.',
  },
  {
    id: 'faq-safe',
    title: 'Are these safe to use?',
    content:
      'Follow the directions on your product packaging. Discontinue use if irritation occurs and consult your dentist.',
  },
  {
    id: 'faq-children',
    title: 'Can children use these?',
    content:
      'Adult supervision is recommended for children. Check pack details for age guidance.',
  },
]

const toothTattoosContent: ProductPdpContent = {
  galleryImages: [],
  imageBadge: 'FUN',
  headline: 'Smile art that sticks',
  intro:
    'Metallic tooth tattoos add a playful pop to your look — temporary, easy to apply, and made for moments when you want your smile to stand out.',
  bullets: [
    'Temporary metallic tooth decoration',
    'Easy application at home',
    'A fun add-on to your Gelos routine',
  ],
  highlights: accessoriesHighlights,
  detailsAccordion: [
    {
      id: 'different',
      title: 'How do tooth tattoos work?',
      content:
        'Apply to clean, dry teeth following pack instructions. They are designed for short-term wear and remove with normal brushing over time.',
    },
    {
      id: 'included',
      title: "*What's included?",
      content: 'See product packaging for sheet count and application guide.',
    },
  ],
  faq: sharedFaq,
}

const defaultAccessoriesContent = (product: Product): ProductPdpContent => ({
  galleryImages: [],
  headline: 'Complete your smile kit',
  intro: product.description,
  bullets: [
    'Designed to complement Gelos oral care',
    'Easy to add to your routine',
    'Great for gifting',
  ],
  highlights: accessoriesHighlights,
  detailsAccordion: [
    {
      id: 'different',
      title: 'Why Gelos accessories?',
      content:
        'Small touches that make oral care more fun — from seasonal picks to playful extras.',
    },
    {
      id: 'included',
      title: "*What's included?",
      content: `One ${product.name}. See packaging for details.`,
    },
  ],
  faq: sharedFaq,
})

const contentBySlug: Record<string, ProductPdpContent> = {
  'candy-cane-toothpaste': toothTattoosContent,
}

function mergeGallery(base: ProductPdpContent): ProductPdpContent {
  return {
    ...base,
    galleryImages: getCodeDefaultGalleryImages(base.galleryImages),
  }
}

export function getAccessoriesProductContent(
  product: Product,
): ProductPdpContent {
  const slug = getProductSlug(product)
  const base = contentBySlug[slug] ?? defaultAccessoriesContent(product)
  return mergeGallery(base)
}

export const accessoriesCommunityFavoriteIds = ['1', '15', '12', '9'] as const
