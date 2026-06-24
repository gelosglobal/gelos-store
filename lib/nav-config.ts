import type { LucideIcon } from 'lucide-react'
import {
  Brush,
  Droplets,
  Flame,
  Heart,
  Waves,
  LayoutGrid,
  Package,
  Percent,
  ShowerHead,
  Sparkles,
  ScanFace,
} from 'lucide-react'
import { bestSellerIds } from '@/lib/best-seller-meta'

export type MainNavLink = {
  id: string
  label: string
  href: string
  icon: LucideIcon
  /** Opens the all-products mega menu instead of navigating */
  opensMegaMenu?: boolean
}

export const mainNavLinks: MainNavLink[] = [
  {
    id: 'all-products',
    label: 'All products',
    href: '/shop',
    icon: LayoutGrid,
    opensMegaMenu: true,
  },
  {
    id: 'bundles',
    label: 'Bundles',
    href: '/shop?bundles=true',
    icon: Package,
  },
  {
    id: 'new-arrivals',
    label: 'New arrivals',
    href: '/shop?new-arrivals=true',
    icon: Sparkles,
  },
  {
    id: 'gelos-ai',
    label: 'Gelos AI',
    href: '/ai',
    icon: ScanFace,
  },
]

/** Shared classes for top-level nav items */
export const navItemClassName =
  'font-nav inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold tracking-wide transition-colors'

export type NavCategoryId =
  | 'toothpaste'
  | 'toothbrushes'
  | 'tongue-scraper'
  | 'mouthwash'
  | 'whitening'
  | 'wellness'
  | 'water-flossers'
  | 'packages'
  | 'bestsellers'
  | 'all'

export type NavCategory = {
  id: NavCategoryId
  label: string
  icon: LucideIcon
  href: string
  /** Filter products by category name from mock-data */
  productCategory?: string
  /** Filter products by id list */
  productIds?: readonly string[]
}

export const navCategories: NavCategory[] = [
  {
    id: 'toothpaste',
    label: 'Flavored toothpastes',
    icon: Droplets,
    href: '/shop?category=Toothpaste',
    productCategory: 'Toothpaste',
  },
  {
    id: 'toothbrushes',
    label: 'Toothbrushes',
    icon: Brush,
    href: '/shop?category=Toothbrushes',
    productCategory: 'Toothbrushes',
  },
  {
    id: 'tongue-scraper',
    label: 'Tongue scrapers',
    icon: ScanFace,
    href: '/shop?category=Tongue%20Scraper',
    productCategory: 'Tongue Scraper',
  },
  {
    id: 'whitening',
    label: 'Teeth whitening',
    icon: Sparkles,
    href: '/shop?category=Whitening',
    productCategory: 'Whitening',
  },
  {
    id: 'wellness',
    label: 'Wellness and care',
    icon: Heart,
    href: '/shop?category=Wellness',
    productCategory: 'Wellness',
  },
  {
    id: 'mouthwash',
    label: 'Mouth washes / sprays',
    icon: Waves,
    href: '/collections/mouth-washes',
    productCategory: 'Mouthwash',
  },
  {
    id: 'water-flossers',
    label: 'Water flossers',
    icon: ShowerHead,
    href: '/shop?category=Water%20Flossers',
    productCategory: 'Water Flossers',
  },
  {
    id: 'packages',
    label: 'Discounted packages',
    icon: Percent,
    href: '/shop?bundles=true',
  },
  {
    id: 'bestsellers',
    label: 'Best-selling products',
    icon: Flame,
    href: '/#best-sellers',
    productIds: bestSellerIds,
  },
]

export const productTileColors = [
  '#4F6CF7',
  '#F97316',
  '#84CC16',
  '#EC4899',
  '#14B8A6',
  '#8B5CF6',
  '#F43F5E',
  '#0EA5E9',
  '#6366F1',
  '#F59E0B',
  '#10B981',
  '#D946EF',
] as const

export function getProductTileColor(index: number) {
  return productTileColors[index % productTileColors.length]
}
