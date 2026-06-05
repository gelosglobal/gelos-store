import type { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { isDatabaseConfigured } from '@/lib/env'
import {
  DEFAULT_STORE_PROMOTIONS,
  sanitizeStorePromotions,
  type PromoCode,
  type StorePromotions,
} from '@/lib/store-promotions'

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
    },
    update: {
      freeShippingEnabled: data.freeShippingEnabled,
      freeShippingThreshold: data.freeShippingThreshold,
      shippingFee: data.shippingFee,
      freeShippingRewardLabel: data.freeShippingRewardLabel,
      freeShippingProgressLabel: data.freeShippingProgressLabel,
      freeShippingUnlockedLabel: data.freeShippingUnlockedLabel,
      promos: data.promos as Prisma.InputJsonValue,
    },
  })

  return docToStorePromotions(doc)
}
