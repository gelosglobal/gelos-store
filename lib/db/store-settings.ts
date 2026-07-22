import type { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { isDatabaseConfigured } from '@/lib/env'
import {
  DEFAULT_STORE_PROMOTIONS,
  sanitizeStorePromotions,
  type PromoCode,
  type StorePromotions,
} from '@/lib/store-promotions'
import {
  DEFAULT_CART_UPSELL_SETTINGS,
  sanitizeCartUpsellSettings,
  type CartUpsellSettings,
} from '@/lib/cart-upsell-settings'
import {
  sanitizeAllMarketSettings,
  sanitizeMarketSettings,
  type AllMarketSettings,
} from '@/lib/market-settings'

const SETTINGS_KEY = 'default'

function parsePromos(value: unknown): PromoCode[] {
  if (!Array.isArray(value)) return DEFAULT_STORE_PROMOTIONS.promos
  return sanitizeStorePromotions({ promos: value as PromoCode[] }).promos
}

function docToStorePromotions(doc: {
  freeShippingEnabled: boolean
  freeShippingThreshold: number
  shippingFee: number
  freeShippingRewardLabel: string
  freeShippingProgressLabel: string
  freeShippingUnlockedLabel: string
  promos: unknown
}): StorePromotions {
  return sanitizeStorePromotions({
    freeShippingEnabled: doc.freeShippingEnabled,
    freeShippingThreshold: doc.freeShippingThreshold,
    shippingFee: doc.shippingFee,
    freeShippingRewardLabel: doc.freeShippingRewardLabel,
    freeShippingProgressLabel: doc.freeShippingProgressLabel,
    freeShippingUnlockedLabel: doc.freeShippingUnlockedLabel,
    promos: parsePromos(doc.promos),
  })
}

/**
 * Checkout reads shipping from Markets (per country). Keep Ghana — the home
 * market — aligned with Checkouts shipping settings so the fee admins set
 * there is what Ghana customers actually pay.
 */
function syncGhanaShippingFromPromotions(
  markets: unknown,
  promotions: StorePromotions,
): AllMarketSettings {
  const all = sanitizeAllMarketSettings(markets)
  return {
    ...all,
    ghana: sanitizeMarketSettings('ghana', {
      ...all.ghana,
      shippingFee: promotions.shippingFee,
      freeShippingEnabled: promotions.freeShippingEnabled,
      freeShippingThreshold: promotions.freeShippingThreshold,
    }),
  }
}

export async function getStorePromotions(): Promise<StorePromotions> {
  if (!isDatabaseConfigured()) return DEFAULT_STORE_PROMOTIONS

  const doc = await prisma.storeSettings.findUnique({
    where: { key: SETTINGS_KEY },
  })

  if (!doc) return DEFAULT_STORE_PROMOTIONS
  return docToStorePromotions(doc)
}

export async function updateStorePromotions(
  input: Partial<StorePromotions>,
): Promise<StorePromotions> {
  const data = sanitizeStorePromotions(input)
  if (!isDatabaseConfigured()) return data

  const existing = await prisma.storeSettings.findUnique({
    where: { key: SETTINGS_KEY },
    select: { markets: true },
  })
  const markets = syncGhanaShippingFromPromotions(existing?.markets, data)

  const doc = await prisma.storeSettings.upsert({
    where: { key: SETTINGS_KEY },
    create: {
      key: SETTINGS_KEY,
      freeShippingEnabled: data.freeShippingEnabled,
      freeShippingThreshold: data.freeShippingThreshold,
      shippingFee: data.shippingFee,
      freeShippingRewardLabel: data.freeShippingRewardLabel,
      freeShippingProgressLabel: data.freeShippingProgressLabel,
      freeShippingUnlockedLabel: data.freeShippingUnlockedLabel,
      promos: data.promos as Prisma.InputJsonValue,
      markets: markets as unknown as Prisma.InputJsonValue,
    },
    update: {
      freeShippingEnabled: data.freeShippingEnabled,
      freeShippingThreshold: data.freeShippingThreshold,
      shippingFee: data.shippingFee,
      freeShippingRewardLabel: data.freeShippingRewardLabel,
      freeShippingProgressLabel: data.freeShippingProgressLabel,
      freeShippingUnlockedLabel: data.freeShippingUnlockedLabel,
      promos: data.promos as Prisma.InputJsonValue,
      markets: markets as unknown as Prisma.InputJsonValue,
    },
  })

  return docToStorePromotions(doc)
}

function parseCartUpsells(value: unknown): CartUpsellSettings {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return DEFAULT_CART_UPSELL_SETTINGS
  }
  return sanitizeCartUpsellSettings(value as Partial<CartUpsellSettings>)
}

export async function getCartUpsellSettings(): Promise<CartUpsellSettings> {
  if (!isDatabaseConfigured()) return DEFAULT_CART_UPSELL_SETTINGS

  const doc = await prisma.storeSettings.findUnique({
    where: { key: SETTINGS_KEY },
    select: { cartUpsells: true },
  })

  if (!doc) return DEFAULT_CART_UPSELL_SETTINGS
  return parseCartUpsells(doc.cartUpsells)
}

export async function updateCartUpsellSettings(
  input: Partial<CartUpsellSettings>,
): Promise<CartUpsellSettings> {
  const data = sanitizeCartUpsellSettings(input)
  if (!isDatabaseConfigured()) return data

  const doc = await prisma.storeSettings.upsert({
    where: { key: SETTINGS_KEY },
    create: {
      key: SETTINGS_KEY,
      cartUpsells: data as Prisma.InputJsonValue,
    },
    update: {
      cartUpsells: data as Prisma.InputJsonValue,
    },
    select: { cartUpsells: true },
  })

  return parseCartUpsells(doc.cartUpsells)
}
