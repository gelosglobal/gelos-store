import {
  getAllProducts,
  getProductsByIds,
} from '@/lib/db/products'
import { getAccessoriesProductContent } from '@/lib/accessories-product-content'
import { getMouthwashProductContent } from '@/lib/mouthwash-product-content'
import { getToothbrushProductContent } from '@/lib/toothbrush-product-content'
import { getToothpasteProductContent } from '@/lib/toothpaste-product-content'
import { getTongueScraperProductContent } from '@/lib/tongue-scraper-product-content'
import { getToolsProductContent } from '@/lib/tools-product-content'
import { getWellnessProductContent } from '@/lib/wellness-product-content'
import { getWhiteningProductContent } from '@/lib/whitening-product-content'
import type { ProductPdpContent } from '@/lib/product-pdp-content'
import { accessoriesCommunityFavoriteIds } from '@/lib/accessories-product-content'
import { mouthwashCommunityFavoriteIds } from '@/lib/mouthwash-product-content'
import { toothbrushCommunityFavoriteIds } from '@/lib/toothbrush-product-content'
import { toothpasteCommunityFavoriteIds } from '@/lib/toothpaste-product-content'
import { tongueScraperCommunityFavoriteIds } from '@/lib/tongue-scraper-product-content'
import { toolsCommunityFavoriteIds } from '@/lib/tools-product-content'
import { wellnessCommunityFavoriteIds } from '@/lib/wellness-product-content'
import { whiteningCommunityFavoriteIds } from '@/lib/whitening-product-content'
import type { Product } from '@/lib/types/product'
import { getWhiteningLineVariants } from '@/lib/whitening-treatment-covers'

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
  Wellness: { label: 'Wellness', shopHref: '/shop?category=Wellness' },
  Whitening: { label: 'Whitening', shopHref: '/shop?category=Whitening' },
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
  if (product.category === 'Whitening') {
    return getWhiteningLineVariants(product, categoryVariants)
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
  switch (product.category) {
    case 'Toothpaste':
      return getToothpasteProductContent(product)
    case 'Mouthwash':
      return getMouthwashProductContent(product)
    case 'Tongue Scraper':
      return getTongueScraperProductContent(product)
    case 'Wellness':
      return getWellnessProductContent(product)
    case 'Whitening':
      return getWhiteningProductContent(product)
    case 'Toothbrushes':
      return getToothbrushProductContent(product)
    case 'Accessories':
      return getAccessoriesProductContent(product)
    case 'Tools':
      return getToolsProductContent(product)
    default:
      return getToolsProductContent(product)
  }
}
