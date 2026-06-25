import type { Product } from '@/lib/types/product'

/**
 * Flavour collections
 * ───────────────────
 * Homepage cards = fruit / lifestyle art (`coverImage`).
 * Clicking a card opens `/collections/flavors/[slug]` with every product in `productIds`.
 *
 * To change a homepage card image:
 *   1. Add a file to `public/gelos/`
 *   2. Set `coverImage: '/gelos/your-fruit-photo.jpg'`
 *   3. Pick a matching `backgroundColor` (shows while loading)
 *
 * To add/remove products in a flavour collection, edit `productIds`
 * (must match catalog ids — see admin or `lib/mock-data.ts`).
 */

export type Flavor = {
  /** URL segment, e.g. strawberry → /collections/flavors/strawberry */
  slug: string
  label: string
  /** Fruit or lifestyle photography — always full-bleed on homepage cards */
  coverImage: string
  backgroundColor: string
  imagePosition?: string
  /** Shown on the flavour collection page */
  description: string
  /** All storefront products for this flavour */
  productIds: string[]
}

export const flavors: Flavor[] = [
  {
    slug: 'strawberry',
    label: 'Strawberry',
    coverImage: '/gelos/strawberry.jpeg',
    backgroundColor: '#E8486F',
    description:
      'Sweet strawberry across toothpaste, mouthwash, and more — fresh care with a fan-favourite taste.',
    productIds: ['15', '20'],
  },
  {
    slug: 'banana',
    label: 'Banana',
    coverImage: '/gelos/banana-toothpaste.png',
    backgroundColor: '#F4C430',
    imagePosition: 'center bottom',
    description: 'Smooth banana toothpaste for a creamy, fruity daily clean.',
    productIds: ['14'],
  },
  {
    slug: 'grape-bubblegum',
    label: 'Grape Bubblegum',
    coverImage: '/gelos/grape.jpeg',
    backgroundColor: '#7E3FF2',
    description:
      'Fun grape bubblegum in toothpaste and foaming mouthwash — bold flavour, fresh results.',
    productIds: ['17', '22'],
  },
  {
    slug: 'mango',
    label: 'Mango',
    coverImage: '/gelos/mango.webp',
    backgroundColor: '#FF9F1C',
    description: 'Tropical mango wellness — portable refresh on the go.',
    productIds: ['5'],
  },
  // {
  //   slug: 'grape-mint',
  //   label: 'Grape Mint',
  //   coverImage: '/gelos/grape-mint-fruit-energy.png',
  //   backgroundColor: '#56C4E8',
  //   imagePosition: 'center bottom',
  //   description: 'Grape mint fruit energy for a cooling, revitalising boost.',
  //   productIds: ['9'],
  // },
  {
    slug: 'vanilla',
    label: 'Vanilla',
    coverImage: '/gelos/vanilla2.jpeg',
    backgroundColor: '#EDD9B8',
    description: 'Smooth vanilla toothpaste — dessert-inspired daily care.',
    productIds: ['18'],
  },
  {
    slug: 'peach-ice',
    label: 'Peach Ice Tea',
    coverImage: '/gelos/peachice.webp',
    backgroundColor: '#FF8C5A',
    imagePosition: 'center bottom',
    description: 'Bold passion fruit toothpaste with a tropical twist.',
    productIds: ['16'],
  },
  {
    slug: 'watermelon',
    label: 'Watermelon',
    coverImage: '/gelos/watermelon.jpeg',
    backgroundColor: '#F4A0B8',
    description:
      'Juicy watermelon in toothpaste and mouthwash — one of our most-loved flavours.',
    productIds: ['1', '12'],
  },
  {
    slug: 'coconut-whip',
    label: 'Coconut Whip',
    coverImage: '/gelos/coconut-whip-toothpaste.png',
    backgroundColor: '#F5EBD8',
    imagePosition: 'center bottom',
    description: 'Creamy coconut whip toothpaste — tropical freshness every brush.',
    productIds: ['13'],
  },
  // {
  //   slug: 'red-velvet',
  //   label: 'Red Velvet',
  //   coverImage: '/gelos/red-velvet-toothpaste.png',
  //   backgroundColor: '#B8344A',
  //   imagePosition: 'center bottom',
  //   description: 'Rich red velvet toothpaste — indulgent flavour, serious clean.',
  //   productIds: ['19'],
  // },
  // {
  //   slug: 'energy-drink',
  //   label: 'Energy Drink',
  //   coverImage: '/gelos/energy-drink-toothpaste.png',
  //   backgroundColor: '#00C853',
  //   imagePosition: 'center bottom',
  //   description: 'Bold energy drink toothpaste for a refreshing wake-up brush.',
  //   productIds: ['11'],
  // },
  // {
  //   slug: 'blue-raspberry',
  //   label: 'Blue Raspberry',
  //   coverImage: '/gelos/mouthwash-cover-blue-raspberry.png',
  //   backgroundColor: '#3D9EEB',
  //   description: 'Blue raspberry foaming mouthwash — alcohol-free, bold, and fresh.',
  //   productIds: ['21'],
  // },
]

const flavorBySlug = new Map(flavors.map((flavor) => [flavor.slug, flavor]))

export function getFlavorBySlug(slug: string): Flavor | undefined {
  return flavorBySlug.get(slug)
}

export function getFlavorCollectionHref(slug: string): string {
  return `/collections/flavors/${slug}`
}

/** Products for a flavour collection, in the order listed in `productIds`. */
export function getProductsForFlavor(
  flavor: Flavor,
  catalog: Product[],
): Product[] {
  const byId = new Map(catalog.map((product) => [product.id, product]))

  return flavor.productIds
    .map((id) => byId.get(id))
    .filter((product): product is Product => product !== undefined)
}
