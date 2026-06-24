import type { ProductPdpContent } from '@/lib/product-pdp-content'
import type { Product } from '@/lib/types/product'
import { normalizeImageUrl } from '@/lib/image-url'
import { getCodeDefaultGalleryImages } from '@/lib/product-gallery-images'
import { getProductSlug } from '@/lib/product-utils'

export type { ProductHighlight, ProductAccordionItem, ProductPdpContent } from '@/lib/product-pdp-content'

const toothpasteHighlights: ProductPdpContent['highlights'] = [
  { label: 'Flavour & freshness', emoji: '👄' },
  { label: 'Fluoride+ formula', emoji: '🧪' },
  { label: 'Everyday clean', emoji: '🦷' },
]

const sharedUsageSteps: ProductPdpContent['usageSteps'] = [
  {
    title: 'Apply',
    body: 'Wet your brush and use a pea-sized amount of Gelos toothpaste.',
  },
  {
    title: 'Brush',
    body: 'Brush for two minutes, covering all surfaces — don’t forget your tongue!',
  },
  {
    title: 'Rinse',
    body: 'Rinse thoroughly and enjoy a fresh, flavour-forward finish.',
  },
]

const sharedFaq: ProductPdpContent['faq'] = [
  {
    id: 'faq-different',
    title: 'What makes Gelos toothpaste different?',
    content:
      'Our Fluoride+ formula pairs effective cleaning with bold, fruit-inspired flavours — so your routine feels fresh, not clinical.',
  },
  {
    id: 'faq-everyday',
    title: 'Can I use this as my everyday toothpaste?',
    content:
      'Yes. Gelos toothpastes are formulated for daily use. Brush twice a day as part of your regular oral care routine.',
  },
  {
    id: 'faq-children',
    title: 'Can I purchase this for my children?',
    content:
      'We recommend this product for adults and supervised children over 6. Consult your dentist for younger children.',
  },
]

const standardIngredients =
  'Sorbitol, Aqua, Hydrated Silica, Sodium Lauryl Sulfate, Aroma, Cellulose Gum, Sodium Fluoride, Sodium Saccharin. Contains sodium fluoride (1450 ppm F⁻).'

function toothpasteAccordion(
  flavorName: string,
  tubeSize = '60g',
): ProductPdpContent['detailsAccordion'] {
  return [
    {
      id: 'different',
      title: 'What makes this toothpaste different?',
      content: `Gelos ${flavorName} Toothpaste uses our Fluoride+ formula — effective cleaning with a flavour-first experience you'll actually enjoy every day.`,
    },
    {
      id: 'included',
      title: "*What's included?",
      content: `One ${tubeSize} tube of ${flavorName} Toothpaste. Sealed for freshness.`,
    },
    {
      id: 'ingredients',
      title: 'List of ingredients',
      content: standardIngredients,
    },
  ]
}

const flavoredToothpasteBenefits = [
  'Helps prevent cavities with fluoride protection',
  'Strengthens enamel for healthier, stronger teeth',
  'Sugar-free formulation for better oral care habits',
  'Vegan-friendly ingredients',
  'Deep cleaning action for a fresher, cleaner mouth',
  'Long-lasting fresh breath',
  'High-quality formulation for a superior clean',
  'Makes brushing more enjoyable across all age groups',
]

const watermelonUsageSteps: ProductPdpContent['usageSteps'] = [
  {
    title: 'Apply',
    body: 'Apply a pea-sized amount of Gelos Toothpaste onto your toothbrush.',
  },
  {
    title: 'Brush',
    body: 'Brush thoroughly for at least 2 minutes, ensuring all tooth surfaces are cleaned.',
  },
  {
    title: 'Rinse',
    body: 'Rinse thoroughly with water after brushing.',
  },
  {
    title: 'Routine',
    body: 'Use twice daily — morning and night — for best results.',
  },
]

const watermelonRangeFaq: ProductPdpContent['faq'] = [
  {
    id: 'faq-different',
    title: 'What makes Gelos Flavored Toothpaste different?',
    content:
      'Gelos pairs a sugar-free, vegan-friendly Fluoride+ formula with 15 bold flavours — so effective cavity protection and enamel support feel enjoyable, not clinical.',
  },
  {
    id: 'faq-flavors',
    title: 'How many flavours are available?',
    content:
      'Choose from 15 exciting flavours including Mint, Peach, Watermelon, Red Velvet, Coconut, Mango, Strawberry, Banana, Candy Cane, Vanilla, Energy Drink, Cola, Passion Fruit, and Grape Bubblegum. Use the flavour picker on this page to explore the full range.',
  },
  {
    id: 'faq-everyday',
    title: 'Can I use this as my everyday toothpaste?',
    content:
      'Yes. Gelos toothpastes are formulated for daily use. Brush twice a day as part of your regular oral care routine.',
  },
  {
    id: 'faq-children',
    title: 'Can I purchase this for my children?',
    content:
      'We recommend this product for adults and supervised children over 6. Consult your dentist for younger children.',
  },
]

function watermelonRangeAccordion(flavorName: string): ProductPdpContent['detailsAccordion'] {
  return [
    {
      id: 'flavors',
      title: '15 exciting flavours',
      content:
        'Mint · Peach · Watermelon · Red Velvet · Coconut · Mango · Strawberry · Banana · Candy Cane · Vanilla · Energy Drink · Cola · Passion Fruit · Grape Bubblegum. Pick your favourite or rotate through the range using the flavour picker above.',
    },
    {
      id: 'different',
      title: 'What makes Gelos Flavored Toothpaste different?',
      content:
        'A premium oral care range designed to make brushing more enjoyable while delivering a powerful, effective clean — sugar-free, vegan-friendly, and formulated with fluoride to help strengthen enamel and protect against cavities.',
    },
    {
      id: 'included',
      title: "*What's included?",
      content: `One 60g tube of ${flavorName} Toothpaste. Sealed for freshness.`,
    },
    {
      id: 'ingredients',
      title: 'List of ingredients',
      content: standardIngredients,
    },
  ]
}

const watermelonContent: ProductPdpContent = {
  galleryImages: [],
  imageBadge: '15 FLAVOURS',
  headline: 'Gelos Flavored Toothpaste',
  intro:
    'Gelos Flavored Toothpaste is a premium oral care range designed to make brushing more enjoyable while delivering a powerful, effective clean. Formulated with high-quality ingredients, it supports long-term oral health with a sugar-free, vegan-friendly formula that contains fluoride to help strengthen enamel and protect against cavities. With 15 exciting flavours, Gelos turns everyday brushing into a refreshing experience — use the picker above to explore Watermelon and the full lineup.',
  bullets: flavoredToothpasteBenefits,
  highlights: [
    { label: 'Fluoride protection', emoji: '🦷' },
    { label: 'Sugar-free & vegan', emoji: '🌿' },
    { label: '15 bold flavours', emoji: '✨' },
  ],
  usageSteps: watermelonUsageSteps,
  usageStepsTitle: 'How to use your Gelos toothpaste',
  usageStepsIntro:
    'A simple four-step routine for a fresher, cleaner mouth — morning and night.',
  detailsAccordion: watermelonRangeAccordion('Watermelon'),
  faq: watermelonRangeFaq,
}

const strawberryContent: ProductPdpContent = {
  galleryImages: [],
  imageBadge: 'FAN FAVOURITE',
  headline: 'Sweet on strawberry?',
  intro:
    'Ripe strawberry flavour meets our Fluoride+ formula — a sweet, refreshing clean that makes morning and night feel like a treat.',
  bullets: [
    'Sweet strawberry flavour kids and adults love',
    'Fluoride+ for cavity protection',
    'Pairs with Gelos foaming mouthwash',
  ],
  highlights: toothpasteHighlights,
  usageSteps: sharedUsageSteps,
  detailsAccordion: toothpasteAccordion('Strawberry'),
  faq: sharedFaq,
}

const coconutContent: ProductPdpContent = {
  galleryImages: [],
  imageBadge: 'TROPICAL',
  headline: 'Creamy coconut whip vibes',
  intro:
    'Coconut Whip Toothpaste blends creamy tropical notes with Fluoride+ cleaning — smooth, fresh, and far from ordinary mint.',
  bullets: [
    'Creamy coconut-inspired flavour',
    'Fluoride+ everyday protection',
    'No harsh aftertaste',
  ],
  highlights: toothpasteHighlights,
  usageSteps: sharedUsageSteps,
  detailsAccordion: toothpasteAccordion('Coconut Whip'),
  faq: sharedFaq,
}

const grapeBubblegumContent: ProductPdpContent = {
  galleryImages: [],
  imageBadge: 'FUN FLAVOUR',
  headline: 'Pop of grape bubblegum',
  intro:
    'Grape Bubblegum Toothpaste brings candy-shop energy to your sink — Fluoride+ cleaning with a playful grape twist.',
  bullets: [
    'Bold grape bubblegum taste',
    'Fluoride+ formula you can trust',
    'Perfect for flavour-fatigued brushers',
  ],
  highlights: toothpasteHighlights,
  usageSteps: sharedUsageSteps,
  detailsAccordion: toothpasteAccordion('Grape Bubblegum'),
  faq: sharedFaq,
}

const energyDrinkContent: ProductPdpContent = {
  galleryImages: [],
  imageBadge: 'NEW ENERGY',
  headline: 'Wake up your brush routine',
  intro:
    'Energy Drink Toothpaste channels your favourite bold, fizzy flavour into a Fluoride+ clean — for mornings that need an extra kick.',
  bullets: [
    'Energy-drink inspired flavour profile',
    'Fluoride+ for effective daily cleaning',
    'Stand out from plain mint',
  ],
  highlights: toothpasteHighlights,
  usageSteps: sharedUsageSteps,
  detailsAccordion: toothpasteAccordion('Energy Drink'),
  faq: sharedFaq,
}

const bananaContent: ProductPdpContent = {
  galleryImages: [],
  headline: 'Go bananas for this clean',
  intro:
    'Banana Toothpaste offers a smooth, tropical twist on daily brushing — Fluoride+ protection with a surprisingly addictive flavour.',
  bullets: [
    'Smooth banana-inspired flavour',
    'Fluoride+ everyday formula',
    'Gentle on sensitive routines',
  ],
  highlights: toothpasteHighlights,
  usageSteps: sharedUsageSteps,
  detailsAccordion: toothpasteAccordion('Banana'),
  faq: sharedFaq,
}

const passionFruitContent: ProductPdpContent = {
  galleryImages: [],
  headline: 'Passion fruit power',
  intro:
    'Passion Fruit Toothpaste packs a bold tropical punch — Fluoride+ cleaning with an exotic flavour that brightens your routine.',
  bullets: [
    'Exotic passion fruit notes',
    'Fluoride+ effective clean',
    'A tropical escape twice a day',
  ],
  highlights: toothpasteHighlights,
  usageSteps: sharedUsageSteps,
  detailsAccordion: toothpasteAccordion('Passion Fruit'),
  faq: sharedFaq,
}

const vanillaContent: ProductPdpContent = {
  galleryImages: [],
  headline: 'Smooth like vanilla',
  intro:
    'Vanilla Toothpaste delivers dessert-inspired smoothness with serious Fluoride+ cleaning — indulgent flavour, responsible care.',
  bullets: [
    'Dessert-smooth vanilla flavour',
    'Fluoride+ daily protection',
    'Mild, approachable taste profile',
  ],
  highlights: toothpasteHighlights,
  usageSteps: sharedUsageSteps,
  detailsAccordion: toothpasteAccordion('Vanilla'),
  faq: sharedFaq,
}

const candyCaneContent: ProductPdpContent = {
  galleryImages: [],
  imageBadge: 'SEASONAL',
  headline: 'Sweet candy cane clean',
  intro:
    'Candy Cane Toothpaste brings festive peppermint-sweet flavour to your routine — Fluoride+ cleaning that feels like the holidays, every brush.',
  bullets: [
    'Festive candy cane flavour',
    'Fluoride+ everyday protection',
    'Limited-edition smile care',
  ],
  highlights: toothpasteHighlights,
  usageSteps: sharedUsageSteps,
  detailsAccordion: toothpasteAccordion('Candy Cane'),
  faq: sharedFaq,
}

const redVelvetContent: ProductPdpContent = {
  galleryImages: [],
  imageBadge: 'INDULGENT',
  headline: 'Red velvet, reimagined',
  intro:
    'Red Velvet Toothpaste brings rich, bakery-inspired flavour to your brush — Fluoride+ cleaning that feels like a small daily luxury.',
  bullets: [
    'Rich red velvet-inspired taste',
    'Fluoride+ for everyday use',
    'A gift-worthy flavour in your lineup',
  ],
  highlights: toothpasteHighlights,
  usageSteps: sharedUsageSteps,
  detailsAccordion: toothpasteAccordion('Red Velvet'),
  faq: sharedFaq,
}

const defaultToothpasteContent = (product: Product): ProductPdpContent => {
  const flavor = product.name.replace(/ Toothpaste$/i, '').trim()
  return {
    galleryImages: [],
    headline: `Love the ${flavor.toLowerCase()} flavour?`,
    intro: product.description,
    bullets: [
      'Flavour with a burst of freshness',
      'Fluoride+ formula for an effective clean',
      'Designed for everyday smile-care',
    ],
    highlights: toothpasteHighlights,
    usageSteps: sharedUsageSteps,
    detailsAccordion: toothpasteAccordion(flavor),
    faq: sharedFaq,
  }
}

const contentBySlug: Record<string, ProductPdpContent> = {
  'watermelon-toothpaste': watermelonContent,
  'strawberry-toothpaste': strawberryContent,
  'coconut-whip-toothpaste': coconutContent,
  'grape-bubblegum-toothpaste': grapeBubblegumContent,
  'energy-drink-toothpaste': energyDrinkContent,
  'banana-toothpaste': bananaContent,
  'passion-fruit-toothpaste': passionFruitContent,
  'vanilla-toothpaste': vanillaContent,
  'red-velvet-toothpaste': redVelvetContent,
  'candy-cane-toothpaste': candyCaneContent,
}

function mergeGallery(base: ProductPdpContent): ProductPdpContent {
  return {
    ...base,
    galleryImages: getCodeDefaultGalleryImages(base.galleryImages),
  }
}

export function getToothpasteProductContent(product: Product): ProductPdpContent {
  const slug = getProductSlug(product)
  const base = contentBySlug[slug] ?? defaultToothpasteContent(product)
  return mergeGallery(base)
}

/** Cross-category picks for "People also love" on toothpaste PDPs */
export const toothpasteCommunityFavoriteIds = ['12', '2', '9', '3'] as const
