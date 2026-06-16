import type { LucideIcon } from 'lucide-react'
import {
  Percent,
  Package,
  ShoppingBag,
  Sparkles,
  Truck,
} from 'lucide-react'
import type { Product } from '@/lib/types/product'
import { getProductHref } from '@/lib/product-utils'
import type { SmileScanProductPick, SmileScanReport } from '@/lib/gelos-ai/smile-scan-types'

export type MysteryRewardType =
  | 'discount_15'
  | 'discount_20'
  | 'free_shipping'
  | 'product_gift'
  | 'bundle_bonus'
  | 'whitening_boost'

export type MysteryRewardCard = {
  id: string
  type: MysteryRewardType
  title: string
  subtitle: string
  description: string
  promoCode?: string
  icon: MysteryRewardType
  productPick?: SmileScanProductPick
  product?: Product
}

export type MysteryRewardBoard = {
  cards: MysteryRewardCard[]
  winnerCardId: string
}

const ICON_BY_TYPE: Record<MysteryRewardType, LucideIcon> = {
  discount_15: Percent,
  discount_20: Percent,
  free_shipping: Truck,
  product_gift: ShoppingBag,
  bundle_bonus: Package,
  whitening_boost: Sparkles,
}

export function getMysteryRewardIcon(type: MysteryRewardType): LucideIcon {
  return ICON_BY_TYPE[type]
}

function normalizeProductPath(href: string): string {
  const trimmed = href.trim()
  if (trimmed.startsWith('/product/')) return trimmed
  if (trimmed.startsWith('product/')) return `/${trimmed}`
  return `/product/${trimmed.replace(/^\/+/, '')}`
}

export function matchProductToRewardPick(
  pick: SmileScanProductPick,
  products: Product[],
): Product | undefined {
  const href = normalizeProductPath(pick.href)
  const slug = href.replace('/product/', '')

  const byHref = products.find((product) => getProductHref(product) === href)
  if (byHref) return byHref

  const bySlug = products.find(
    (product) =>
      product.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '') === slug,
  )
  if (bySlug) return bySlug

  const pickName = pick.name.toLowerCase().trim()
  return products.find(
    (product) =>
      product.name.toLowerCase() === pickName ||
      product.name.toLowerCase().includes(pickName) ||
      pickName.includes(product.name.toLowerCase()),
  )
}

function pickProductFromReport(report: SmileScanReport): SmileScanProductPick | undefined {
  if (!report.products.length) return undefined
  const index = Math.floor(Math.random() * report.products.length)
  return report.products[index] ?? report.products[0]
}

function createCard(
  type: MysteryRewardType,
  report: SmileScanReport,
  products: Product[],
): MysteryRewardCard {
  const id = `${type}-${Math.random().toString(36).slice(2, 8)}`

  switch (type) {
    case 'discount_15':
      return {
        id,
        type,
        icon: type,
        title: '15% off',
        subtitle: 'Entire order',
        description: 'Save 15% on your next Gelos order. Code applied at checkout.',
        promoCode: 'GELOS15',
      }
    case 'discount_20':
      return {
        id,
        type,
        icon: type,
        title: '20% off',
        subtitle: 'Smile scan exclusive',
        description: 'An extra-special 20% off your next order — just for scanning.',
        promoCode: 'SMILE20',
      }
    case 'free_shipping':
      return {
        id,
        type,
        icon: type,
        title: 'Free shipping',
        subtitle: 'Next order',
        description: 'Delivery is on us for your next checkout. No minimum required.',
      }
    case 'product_gift': {
      const pick = pickProductFromReport(report)
      const product = pick ? matchProductToRewardPick(pick, products) : undefined
      return {
        id,
        type,
        icon: type,
        title: product?.name ?? pick?.name ?? 'Gelos product pick',
        subtitle: 'Recommended for you',
        description:
          pick?.reason ??
          'A personalized product match from your smile scan — shop your pick today.',
        productPick: pick,
        product,
      }
    }
    case 'bundle_bonus':
      return {
        id,
        type,
        icon: type,
        title: 'Bundle bonus',
        subtitle: '10% off bundles',
        description: 'Stack extra savings when you shop curated Gelos bundles.',
        promoCode: 'GELOS15',
      }
    case 'whitening_boost':
      return {
        id,
        type,
        icon: type,
        title: 'Whitening boost',
        subtitle: 'Brighten & save',
        description: 'Extra savings on whitening essentials picked for your smile goals.',
        promoCode: 'GELOS15',
      }
    default:
      return {
        id,
        type: 'discount_15',
        icon: 'discount_15',
        title: '15% off',
        subtitle: 'Entire order',
        description: 'Save on your next Gelos order.',
        promoCode: 'GELOS15',
      }
  }
}

const REWARD_TYPES: MysteryRewardType[] = [
  'discount_15',
  'discount_20',
  'free_shipping',
  'product_gift',
  'bundle_bonus',
  'whitening_boost',
]

function pickWinnerType(report: SmileScanReport): MysteryRewardType {
  const pool = report.products.length
    ? REWARD_TYPES
    : REWARD_TYPES.filter((type) => type !== 'product_gift')
  const index = Math.floor(Math.random() * pool.length)
  return pool[index] ?? 'discount_15'
}

function shuffle<T>(items: T[]): T[] {
  const copy = [...items]
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

export function buildMysteryRewardBoard(
  report: SmileScanReport,
  products: Product[],
): MysteryRewardBoard | null {
  const winnerType = pickWinnerType(report)
  const winnerCard = createCard(winnerType, report, products)

  const decoyTypes = REWARD_TYPES.filter((type) => type !== winnerType)
  const decoyCards = decoyTypes.map((type) => createCard(type, report, products))

  const cards = shuffle([winnerCard, ...decoyCards])

  return {
    cards,
    winnerCardId: winnerCard.id,
  }
}

export function getWinnerCard(board: MysteryRewardBoard): MysteryRewardCard {
  return (
    board.cards.find((card) => card.id === board.winnerCardId) ?? board.cards[0]
  )
}

/** @deprecated Use buildMysteryRewardBoard */
export function pickMysteryReward(report: SmileScanReport): SmileScanProductPick | null {
  if (!report.products.length) return null
  const index = Math.floor(Math.random() * report.products.length)
  return report.products[index] ?? report.products[0] ?? null
}
