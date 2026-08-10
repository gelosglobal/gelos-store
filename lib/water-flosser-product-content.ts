import type { ProductPdpContent } from '@/lib/product-pdp-content'
import type { Product } from '@/lib/types/product'
import { getCodeDefaultGalleryImages } from '@/lib/product-gallery-images'
import { getProductContentSlug } from '@/lib/product-content-slug'

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

const hydrelleProBenefits = [
  'Four adjustable cleaning modes',
  'High-frequency pulsed water flow',
  'Fine 0.66mm water stream',
  '360° rotating nozzle',
  'Large 280ml water tank',
  'Rechargeable with long-lasting battery life',
  'Suitable for cleaning between teeth and along the gumline',
  'Convenient for braces, crowns and other dental work',
]

const hydrelleProUsageSteps: ProductPdpContent['usageSteps'] = [
  {
    title: 'Fill',
    body: 'Fill the 280ml tank with clean water.',
  },
  {
    title: 'Attach',
    body: 'Attach the nozzle and ensure it is locked in place.',
  },
  {
    title: 'Select mode',
    body: 'Choose one of the four cleaning modes to match your comfort.',
  },
  {
    title: 'Aim',
    body: 'Aim the 0.66mm stream at the gumline and between teeth.',
  },
  {
    title: 'Rotate',
    body: 'Use the 360° rotating nozzle to reach around the mouth.',
  },
  {
    title: 'Empty',
    body: 'Empty the tank and wipe the unit dry after use.',
  },
]

const hydrelleProFaq: ProductPdpContent['faq'] = [
  {
    id: 'faq-different',
    title: 'What makes the Hydrelle Pro different?',
    content:
      'The Hydrelle Pro combines four cleaning modes, a precise 0.66mm pulsed stream, a 360° rotating nozzle, and a generous 280ml tank — designed for a deeper clean between teeth and along the gumline, including around braces, crowns and other dental work.',
  },
  {
    id: 'faq-modes',
    title: 'What are the four cleaning modes?',
    content:
      'Four adjustable modes let you set water pressure to your comfort and oral-care needs. Start lower if you are new to water flossing, then increase as needed.',
  },
  {
    id: 'faq-tank',
    title: 'How large is the water tank?',
    content:
      'The Hydrelle Pro has a 280ml tank so you can complete a thorough session with fewer refills.',
  },
  {
    id: 'faq-dental-work',
    title: 'Can I use it with braces or crowns?',
    content:
      'Yes. The fine 0.66mm stream helps clean around tight spaces, braces, crowns and other dental work. Start on a gentler mode and guide the stream carefully.',
  },
  {
    id: 'faq-sensitive',
    title: 'Is it suitable for sensitive gums?',
    content:
      'Start on a lower pressure setting and increase gradually. If irritation persists, pause use and speak with your dentist.',
  },
]

const hydrelleProContent: ProductPdpContent = {
  galleryImages: [],
  imageBadge: 'HYDRELLE PRO',
  headline: 'Gelos Hydrelle Pro Water Flosser',
  intro:
    'Enjoy a deeper, more refreshing clean with the Gelos Hydrelle Pro Water Flosser. Designed to clean areas that regular brushing may miss, it uses high-frequency pulsed water to help remove trapped food particles and buildup from between the teeth and along the gumline.\n\nThe Hydrelle Pro features four cleaning modes, allowing you to adjust the water pressure to suit your comfort and oral-care needs. Its 360° rotating nozzle makes it easier to reach around the mouth, while the precise 0.66mm water stream provides focused cleaning around tight spaces, braces, crowns and other dental work.\n\nWith a generous 280ml water tank, you can enjoy a thorough cleaning session with fewer refills. Its rechargeable, long-lasting battery and portable design make it convenient for everyday use at home or while travelling.',
  bullets: hydrelleProBenefits,
  highlights: [
    { label: '4 cleaning modes', emoji: '💧' },
    { label: '280ml tank', emoji: '🫙' },
    { label: '0.66mm stream', emoji: '✨' },
  ],
  usageSteps: hydrelleProUsageSteps,
  usageStepsTitle: 'How to use your Hydrelle Pro',
  usageStepsIntro:
    'For best results, use the Gelos Hydrelle Pro as part of your daily oral-care routine alongside brushing.',
  detailsAccordion: [
    {
      id: 'features',
      title: 'Key features',
      content:
        'Four adjustable cleaning modes · High-frequency pulsed water flow · Fine 0.66mm water stream · 360° rotating nozzle · Large 280ml water tank · Rechargeable with long-lasting battery life · Suitable for cleaning between teeth and around the gumline · Convenient for braces, crowns and other dental work',
    },
    {
      id: 'different',
      title: 'What makes the Hydrelle Pro different?',
      content:
        'A portable water flosser built for deeper cleaning where brushing may miss — with adjustable modes, a precise stream, full-mouth nozzle rotation, and a larger tank for fewer interruptions.',
    },
    {
      id: 'included',
      title: "*What's included?",
      content:
        'One Gelos Hydrelle Pro Water Flosser, nozzle(s), charging cable, and user manual. See packaging for full contents.',
    },
    {
      id: 'care',
      title: 'Care & storage',
      content:
        'Empty the tank after each use, rinse the nozzle, and wipe the unit dry. Store upright in a clean, dry place. Recharge as needed for everyday or travel use.',
    },
  ],
  faq: hydrelleProFaq,
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
  'hydrelle-pro-water-flosser': hydrelleProContent,
  'gelos-hydrelle-pro-water-flosser': hydrelleProContent,
  'water-flosser-hydrelle-pro': hydrelleProContent,
}

function mergeGallery(base: ProductPdpContent): ProductPdpContent {
  return {
    ...base,
    galleryImages: getCodeDefaultGalleryImages(base.galleryImages),
  }
}

export function getWaterFlosserProductContent(product: Product): ProductPdpContent {
  const slug = getProductContentSlug(product)
  const base = contentBySlug[slug] ?? defaultWaterFlosserContent(product)
  return mergeGallery(base)
}

export const waterFlosserCommunityFavoriteIds = ['1', '12', '8', '3'] as const
