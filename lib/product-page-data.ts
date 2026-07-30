import {
  getAllProducts,
  getProductsByIds,
} from '@/lib/db/products'
import {
  accessoriesCommunityFavoriteIds,
  getAccessoriesProductContent,
} from '@/lib/accessories-product-content'
import {
  getMouthwashProductContent,
  mouthwashCommunityFavoriteIds,
} from '@/lib/mouthwash-product-content'
import {
  getToothbrushProductContent,
  toothbrushCommunityFavoriteIds,
} from '@/lib/toothbrush-product-content'
import {
  getToothpasteProductContent,
  toothpasteCommunityFavoriteIds,
} from '@/lib/toothpaste-product-content'
import {
  getTongueScraperProductContent,
  tongueScraperCommunityFavoriteIds,
} from '@/lib/tongue-scraper-product-content'
import {
  getToolsProductContent,
  toolsCommunityFavoriteIds,
} from '@/lib/tools-product-content'
import {
  getWaterFlosserProductContent,
  waterFlosserCommunityFavoriteIds,
} from '@/lib/water-flosser-product-content'
import {
  getWellnessProductContent,
  wellnessCommunityFavoriteIds,
} from '@/lib/wellness-product-content'
import {
  getWhiteningProductContent,
  whiteningCommunityFavoriteIds,
} from '@/lib/whitening-product-content'
import type { ProductPdpContent } from '@/lib/product-pdp-content'
import { mergePdpContent } from '@/lib/shopify/pdp-metafield'
import type { Product } from '@/lib/types/product'
import { getWhiteningLineVariants } from '@/lib/whitening-treatment-covers'
import { getWellnessLineVariants } from '@/lib/wellness-flavor-covers'
const DEFAULT_COMMUNITY_FAVORITE_IDS = [
  '1',
  '12',
  '3',
  '2',
] as const

const communityIdsByCategory: Record<string, readonly string[]> = {
  Toothpaste: toothpasteCommunityFavoriteIds,
  Mouthwash: mouthwashCommunityFavoriteIds,
  'Tongue Scraper': tongueScraperCommunityFavoriteIds,
  Wellness: wellnessCommunityFavoriteIds,
  Whitening: whiteningCommunityFavoriteIds,
  'Water Flossers': waterFlosserCommunityFavoriteIds,
  Toothbrushes: toothbrushCommunityFavoriteIds,
  Accessories: accessoriesCommunityFavoriteIds,
  Tools: toolsCommunityFavoriteIds,
}

const categoryNav: Record<string, { label: string; shopHref: string }> = {
  Toothpaste: { label: 'Toothpaste', shopHref: '/shop?category=Toothpaste' },
  Mouthwash: {
    label: 'Mouthwash',
    shopHref: '/shop?category=Mouthwash',
  },
  'Tongue Scraper': {
    label: 'Tongue Scraper',
    shopHref: '/shop?category=Tongue%20Scraper',
  },
  Wellness: { label: 'Wellness and Care', shopHref: '/shop?category=Wellness' },
  Whitening: { label: 'Whitening', shopHref: '/shop?category=Whitening' },
  'Water Flossers': {
    label: 'Water Flossers',
    shopHref: '/shop?category=Water%20Flossers',
  },
  Toothbrushes: {
    label: 'Toothbrushes',
    shopHref: '/shop?category=Toothbrushes',
  },
  Accessories: {
    label: 'Accessories',
    shopHref: '/shop?category=Accessories',
  },
  Tools: { label: 'Tools', shopHref: '/shop?category=Tools' },
}

export function getCategoryNav(category: string) {
  return (
    categoryNav[category] ?? {
      label: category,
      shopHref: `/shop?category=${encodeURIComponent(category)}`,
    }
  )
}

export async function getVariantsForCategory(
  category: string,
): Promise<Product[]> {
  const all = await getAllProducts()
  return all.filter((p) => p.category === category)
}

/** Same-category products that share a flavor/style/treatment picker line. */
export function getProductLineVariants(
  product: Product,
  categoryVariants: Product[],
): Product[] {
  // Synthetic parents already own flavours as admin variant tiles.
  if (product.id.startsWith('line:')) {
    return [product]
  }
  if (product.category === 'Whitening') {
    return getWhiteningLineVariants(product, categoryVariants)
  }
  if (product.category === 'Wellness') {
    return getWellnessLineVariants(product, categoryVariants)
  }
  return categoryVariants
}

export async function getCommunityFavoritesForCategory(
  category: string,
): Promise<Product[]> {
  const ids =
    communityIdsByCategory[category] ?? DEFAULT_COMMUNITY_FAVORITE_IDS
  return getProductsByIds([...ids])
}

export function getProductPdpContent(product: Product): ProductPdpContent {
  let base: ProductPdpContent
  switch (product.category) {
    case 'Toothpaste':
      base = getToothpasteProductContent(product)
      break
    case 'Mouthwash':
      base = getMouthwashProductContent(product)
      break
    case 'Tongue Scraper':
      base = getTongueScraperProductContent(product)
      break
    case 'Wellness':
      base = getWellnessProductContent(product)
      break
    case 'Whitening':
      base = getWhiteningProductContent(product)
      break
    case 'Water Flossers':
      base = getWaterFlosserProductContent(product)
      break
    case 'Toothbrushes':
      base = getToothbrushProductContent(product)
      break
    case 'Accessories':
      base = getAccessoriesProductContent(product)
      break
    case 'Tools':
      base = getToolsProductContent(product)
      break
    default:
      base = getToolsProductContent(product)
  }

  return mergePdpContent(base, product.shopifyPdpContent)
}
