import type { MysteryRewardType } from '@/lib/gelos-ai/mystery-reward'
import { isDatabaseConfigured } from '@/lib/env'
import { prisma } from '@/lib/prisma'

export type StoredSmileRewardClaim = {
  claimId: string
  email: string
  customerName: string
  scanId: string | null
  rewardType: MysteryRewardType
  rewardTitle: string
  promoCode: string
  productHref: string
  redeemedAt: Date | null
  createdAt: Date
}

function generateClaimId(): string {
  const suffix = Date.now().toString(36).toUpperCase()
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase()
  return `SRC-${suffix}-${rand}`
}

export function normalizeRewardEmail(email: string): string {
  return email.trim().toLowerCase()
}

export async function hasSmileRewardClaim(email: string): Promise<boolean> {
  if (!isDatabaseConfigured()) return false

  const normalized = normalizeRewardEmail(email)
  if (!normalized) return false

  const existing = await prisma.smileRewardClaim.findUnique({
    where: { email: normalized },
  })
  return Boolean(existing)
}

export async function createSmileRewardClaim(input: {
  email: string
  customerName?: string
  scanId?: string
  rewardType: MysteryRewardType
  rewardTitle: string
  promoCode?: string
  productHref?: string
}): Promise<StoredSmileRewardClaim> {
  if (!isDatabaseConfigured()) {
    throw new Error('DATABASE_NOT_CONFIGURED')
  }

  const email = normalizeRewardEmail(input.email)
  if (!email) throw new Error('INVALID_EMAIL')

  const existing = await prisma.smileRewardClaim.findUnique({ where: { email } })
  if (existing) throw new Error('REWARD_ALREADY_CLAIMED')

  const record = await prisma.smileRewardClaim.create({
    data: {
      claimId: generateClaimId(),
      email,
      customerName: input.customerName?.trim() ?? '',
      scanId: input.scanId?.trim() || null,
      rewardType: input.rewardType,
      rewardTitle: input.rewardTitle.trim(),
      promoCode: input.promoCode?.trim() ?? '',
      productHref: input.productHref?.trim() ?? '',
    },
  })

  return {
    claimId: record.claimId,
    email: record.email,
    customerName: record.customerName,
    scanId: record.scanId,
    rewardType: record.rewardType as MysteryRewardType,
    rewardTitle: record.rewardTitle,
    promoCode: record.promoCode,
    productHref: record.productHref,
    redeemedAt: record.redeemedAt,
    createdAt: record.createdAt,
  }
}

export async function markSmileRewardRedeemed(email: string): Promise<void> {
  if (!isDatabaseConfigured()) return

  const normalized = normalizeRewardEmail(email)
  if (!normalized) return

  await prisma.smileRewardClaim.updateMany({
    where: { email: normalized, redeemedAt: null },
    data: { redeemedAt: new Date() },
  })
}
