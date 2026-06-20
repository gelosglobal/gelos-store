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

const doubleInhalerUsageSteps: ProductPdpContent['usageSteps'] = [
  {
    title: 'Uncap',
    body: 'Take off the lid before each use.',
  },
  {
    title: 'Position',
    body: 'Place the inhaler close to your nostrils.',
  },
  {
    title: 'Inhale',
    body: 'Inhale deeply for 1–2 seconds through each nostril.',
  },
  {
    title: 'Repeat',
    body: 'Use again as needed throughout the day.',
  },
]

const grapeMintFaq: ProductPdpContent['faq'] = [
  {
    id: 'faq-different',
    title: 'What is the Gelos Double Nasal Inhaler?',
    content:
      'A compact, double-action nasal inhaler with aromatic vapors designed to help clear nasal passages, deliver a cooling invigorating sensation, and keep you feeling fresh at home, work, school, or on the go.',
  },
  {
    id: 'faq-how-often',
    title: 'How often can I use it?',
    content:
      'Inhale deeply for 1–2 seconds through each nostril and repeat as needed. Discontinue use if irritation occurs and consult a healthcare professional if symptoms persist.',
  },
  {
    id: 'faq-storage',
    title: 'How should I store it?',
    content:
      'Best used within 30 days of first opening for maximum strength of aromatic vapors. Store in a cool, dry place and keep the lid tightly closed when not in use.',
  },
]

const grapeMintContent: ProductPdpContent = {
  galleryImages: [],
  imageBadge: 'BEST SELLER',
  headline: 'Breathe easier. Feel energized.',
  intro:
    'Stay refreshed and breathe easier with the Gelos Double Nasal Inhaler. Formulated with aromatic vapors that provide a cooling and invigorating sensation, this compact inhaler is designed to help clear nasal passages and leave you feeling refreshed throughout the day. Perfect for use at home, work, school, or while traveling.',
  bullets: [
    'Nasal decongestant',
    'Helps clear nasal passages',
    'Natural energy booster',
    'Helps reduce feelings of stress and anxiety',
    'Mood uplifter',
    'Helps provide relief during common cold and flu symptoms',
    'Leaves you feeling fresh and revitalized',
    'Portable and easy to use on the go',
  ],
  highlights: [
    { label: 'Clear breathing', emoji: '🌬️' },
    { label: 'Natural energy', emoji: '⚡' },
    { label: 'Mood boost', emoji: '✨' },
  ],
  usageSteps: doubleInhalerUsageSteps,
  usageStepsTitle: 'How to use your Double Nasal Inhaler',
  usageStepsIntro:
    'A quick four-step ritual whenever you need clearer breathing and an invigorating refresh.',
  detailsAccordion: [
    {
      id: 'different',
      title: 'What makes the Double Nasal Inhaler different?',
      content:
        'Gelos combines aromatic vapors in a slim, portable double inhaler — cooling, invigorating, and easy to slip into a pocket or bag for relief wherever your day takes you.',
    },
    {
      id: 'included',
      title: "*What's included?",
      content: 'One Gelos Double Nasal Inhaler. Sealed for freshness.',
    },
    {
      id: 'storage',
      title: 'Storage instructions',
      content:
        'Best used within 30 days of first opening for maximum strength of aromatic vapors. Store in a cool, dry place and keep the lid tightly closed when not in use.',
    },
    {
      id: 'caution',
      title: 'Caution',
      content:
        'For external use only. Avoid direct contact with eyes. Keep out of reach of children. Discontinue use if irritation occurs. If symptoms persist, consult a healthcare professional.',
    },
  ],
  faq: grapeMintFaq,
}

const inhalerUsageSteps: ProductPdpContent['usageSteps'] = [
  {
    title: 'Uncap',
    body: 'Remove the cap and hold the inhaler just below one nostril, keeping the other nostril gently closed.',
  },
  {
    title: 'Inhale',
    body: 'Breathe in slowly and deeply through your nose. Repeat on the other side for balanced relief.',
  },
  {
    title: 'Reseal',
    body: 'Replace the cap after each use to preserve the essential-oil blend and fruit-energy freshness.',
  },
]

const inhalerFaq: ProductPdpContent['faq'] = [
  {
    id: 'faq-relief',
    title: 'Can this help with cold and flu symptoms?',
    content:
      'The aromatherapy blend is designed to support easier breathing and a fresher feeling when you are dealing with common cold and flu congestion. It is a comfort aid — not a substitute for medical treatment. See a healthcare provider if symptoms persist.',
  },
  {
    id: 'faq-how-often',
    title: 'How often can I use it?',
    content:
      'Use as needed throughout the day whenever you want clearer nasal passages or a cooling refresh. Follow the directions on pack and discontinue use if irritation occurs.',
  },
  {
    id: 'faq-daily',
    title: 'Is it safe for everyday use?',
    content:
      'Many customers keep one in a bag, desk, or travel kit for on-the-go use. If you are pregnant, nursing, or managing a respiratory condition, consult your healthcare provider before regular use.',
  },
]

const inhalerContent: ProductPdpContent = {
  galleryImages: [],
  imageBadge: 'FRUIT ENERGY',
  headline: 'Breathe clear. Feel revitalized.',
  intro:
    'Meet the Gelos Fruit Energy Nasal Inhaler — a pocket-sized aromatherapy boost that helps ease stuffy moments, opens nasal passages, and delivers a cooling fruit-energy freshness you can reach for all day long.',
  bullets: [
    'Helps provide relief from common cold and flu symptoms',
    'Helps clear nasal passages for easier breathing',
    'Delivers a refreshing cooling sensation',
    'Helps you feel fresh and revitalized throughout the day',
  ],
  highlights: [
    { label: 'Cold & flu relief', emoji: '🤧' },
    { label: 'Clearer breathing', emoji: '🌬️' },
    { label: 'Cooling sensation', emoji: '❄️' },
    { label: 'All-day refresh', emoji: '✨' },
  ],
  usageSteps: inhalerUsageSteps,
  usageStepsTitle: 'How to use your Fruit Energy inhaler',
  usageStepsIntro:
    'A quick two-nostril ritual whenever you need clearer breathing and a cooling pick-me-up.',
  detailsAccordion: [
    {
      id: 'different',
      title: 'What makes the Fruit Energy inhaler different?',
      content:
        'Unlike ordinary rubs or sprays, Gelos packs therapeutic essential oils into a slim, travel-ready inhaler with a bright fruit-energy aroma — so relief is instant, mess-free, and easy to use anywhere.',
    },
    {
      id: 'benefits',
      title: 'Key benefits',
      content:
        'Formulated to help with common cold and flu discomfort, support clearer nasal breathing, deliver a cooling fresh sensation, and keep you feeling revitalized from morning meetings to late-night travel.',
    },
    {
      id: 'included',
      title: "*What's included?",
      content: 'One Gelos Fruit Energy Nasal Inhaler. Sealed for freshness.',
    },
    {
      id: 'care',
      title: 'Care & storage',
      content:
        'Keep the cap secured when not in use. Store upright in a cool, dry place away from direct sunlight and heat.',
    },
  ],
  faq: inhalerFaq,
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
