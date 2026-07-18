import type { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { isDatabaseConfigured } from '@/lib/env'
import {
  DEFAULT_ALL_MARKET_SETTINGS,
  sanitizeAllMarketSettings,
  sanitizeMarketSettings,
  type AllMarketSettings,
  type MarketSettings,
} from '@/lib/market-settings'
import type { LocationId } from '@/lib/locations'

const SETTINGS_KEY = 'default'

function parseMarkets(value: unknown): AllMarketSettings {
  return sanitizeAllMarketSettings(value)
}

export async function getAllMarketSettings(): Promise<AllMarketSettings> {
  if (!isDatabaseConfigured()) return DEFAULT_ALL_MARKET_SETTINGS

  const doc = await prisma.storeSettings.findUnique({
    where: { key: SETTINGS_KEY },
    select: { markets: true },
  })

  if (!doc) return DEFAULT_ALL_MARKET_SETTINGS
  return parseMarkets(doc.markets)
}

export async function getMarketSettings(
  locationId: LocationId,
): Promise<MarketSettings> {
  const all = await getAllMarketSettings()
  return all[locationId] ?? sanitizeMarketSettings(locationId, null)
}

export async function updateAllMarketSettings(
  input: unknown,
): Promise<AllMarketSettings> {
  const data = sanitizeAllMarketSettings(input)
  if (!isDatabaseConfigured()) return data

  const doc = await prisma.storeSettings.upsert({
    where: { key: SETTINGS_KEY },
    create: {
      key: SETTINGS_KEY,
      markets: data as unknown as Prisma.InputJsonValue,
    },
    update: {
      markets: data as unknown as Prisma.InputJsonValue,
    },
    select: { markets: true },
  })

  return parseMarkets(doc.markets)
}

export async function updateMarketSettings(
  locationId: LocationId,
  input: Partial<MarketSettings>,
): Promise<AllMarketSettings> {
  const current = await getAllMarketSettings()
  const next: AllMarketSettings = {
    ...current,
    [locationId]: sanitizeMarketSettings(locationId, {
      ...current[locationId],
      ...input,
      locationId,
    }),
  }
  return updateAllMarketSettings(next)
}
