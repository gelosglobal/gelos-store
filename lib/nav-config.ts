import type { LucideIcon } from 'lucide-react'
import {
  Droplets,
  Flame,
  Waves,
  LayoutGrid,
  Package,
  Percent,
  Sparkles,
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
]

/** Shared classes for top-level nav items */
export const navItemClassName =
  'font-nav inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold tracking-wide transition-colors'

export type NavCategoryId =
  | 'toothpaste'
  | 'mouthwash'
  | 'whitening'
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
    label: 'Toothpaste',
    icon: Droplets,
    href: '/shop?category=Toothpaste',
    productCategory: 'Toothpaste',
  },
  {
    id: 'mouthwash',
    label: 'Mouthwash',
    icon: Waves,
    href: '/collections/mouth-washes',
    productCategory: 'Mouthwash',
  },
  {
    id: 'whitening',
    label: 'Teeth whitening',
    icon: Sparkles,
    href: '/shop?category=Whitening',
    productCategory: 'Whitening',
  },
  {
    id: 'packages',
    label: 'Discounted packages',
    icon: Percent,
    href: '/shop',
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
