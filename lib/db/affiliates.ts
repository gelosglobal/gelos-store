import type { Affiliate as PrismaAffiliate } from '@prisma/client'
import { normalizeAffiliateCode } from '@/lib/affiliates'
import type { AdminAffiliateInput } from '@/lib/admin/affiliate-input'
import {
  DEFAULT_AFFILIATE_COMMISSION_PERCENT,
  type AffiliateRegistrationInput,
} from '@/lib/affiliate-registration'
import { isDatabaseConfigured } from '@/lib/env'
import { prisma } from '@/lib/prisma'

export function generateAffiliateId(): string {
  const suffix = Date.now().toString(36).toUpperCase()
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase()
  return `AFF-${suffix}-${rand}`
}

export type StoredAffiliate = {
  affiliateId: string
  userId: string
  code: string
  name: string
  email: string
  phone: string
  commissionPercent: number
  enabled: boolean
  totalOrders: number
  totalRevenue: number
  totalCommission: number
  pendingCommission: number
  paidCommission: number
  notes: string
  createdAt: Date
  updatedAt: Date
}

function prismaToStoredAffiliate(record: PrismaAffiliate): StoredAffiliate {
  return {
    affiliateId: record.affiliateId,
    userId: record.userId,
    code: record.code,
    name: record.name,
    email: record.email,
    phone: record.phone,
    commissionPercent: record.commissionPercent,
    enabled: record.enabled,
    totalOrders: record.totalOrders,
    totalRevenue: record.totalRevenue,
    totalCommission: record.totalCommission,
    pendingCommission: record.pendingCommission,
    paidCommission: record.paidCommission,
    notes: record.notes,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  }
}

export async function listStoredAffiliates(): Promise<StoredAffiliate[]> {
  if (!isDatabaseConfigured()) return []

  const records = await prisma.affiliate.findMany({
    orderBy: { createdAt: 'desc' },
  })

  return records.map(prismaToStoredAffiliate)
}

export async function findStoredAffiliateById(
  affiliateId: string,
): Promise<StoredAffiliate | null> {
  if (!isDatabaseConfigured()) return null

  const record = await prisma.affiliate.findUnique({
    where: { affiliateId },
  })

  return record ? prismaToStoredAffiliate(record) : null
}

export async function findAffiliateByUserId(
  userId: string,
): Promise<StoredAffiliate | null> {
  if (!isDatabaseConfigured() || !userId.trim()) return null

  const record = await prisma.affiliate.findFirst({
    where: { userId: userId.trim(), enabled: true },
  })

  return record ? prismaToStoredAffiliate(record) : null
}

export async function findInvitedAffiliateByEmail(
  email: string,
): Promise<StoredAffiliate | null> {
  if (!isDatabaseConfigured()) return null

  const normalized = email.trim().toLowerCase()
  if (!normalized) return null

  const record = await prisma.affiliate.findFirst({
    where: { email: normalized, enabled: true },
  })

  return record ? prismaToStoredAffiliate(record) : null
}

export async function linkAffiliateToUser(
  affiliateId: string,
  userId: string,
): Promise<StoredAffiliate> {
  if (!isDatabaseConfigured()) {
    throw new Error('DATABASE_NOT_CONFIGURED')
  }

  const record = await prisma.affiliate.update({
    where: { affiliateId },
    data: { userId },
  })

  return prismaToStoredAffiliate(record)
}

export async function findAffiliateByCode(
  code: string,
): Promise<StoredAffiliate | null> {
  if (!isDatabaseConfigured()) return null

  const normalized = normalizeAffiliateCode(code)
  if (!normalized) return null

  const record = await prisma.affiliate.findFirst({
    where: { code: normalized, enabled: true },
  })

  return record ? prismaToStoredAffiliate(record) : null
}

export async function submitAffiliateRegistration(
  input: AffiliateRegistrationInput,
): Promise<StoredAffiliate> {
  if (!isDatabaseConfigured()) {
    throw new Error('DATABASE_NOT_CONFIGURED')
  }

  const email = input.email.trim().toLowerCase()

  const [existingCode, existingEmail] = await Promise.all([
    prisma.affiliate.findUnique({ where: { code: input.code } }),
    prisma.affiliate.findFirst({ where: { email } }),
  ])

  if (existingCode) throw new Error('AFFILIATE_CODE_EXISTS')
  if (existingEmail) throw new Error('AFFILIATE_EMAIL_EXISTS')

  const applicationNote = input.message?.trim()
    ? `Application: ${input.message.trim()}`
    : 'Application submitted via storefront registration.'

  const record = await prisma.affiliate.create({
    data: {
      affiliateId: generateAffiliateId(),
      code: input.code,
      name: input.name.trim(),
      email,
      phone: input.phone?.trim() ?? '',
      commissionPercent: DEFAULT_AFFILIATE_COMMISSION_PERCENT,
      enabled: false,
      notes: applicationNote,
    },
  })

  return prismaToStoredAffiliate(record)
}

export async function createStoredAffiliate(
  input: AdminAffiliateInput,
): Promise<StoredAffiliate> {
  if (!isDatabaseConfigured()) {
    throw new Error('DATABASE_NOT_CONFIGURED')
  }

  const existing = await prisma.affiliate.findUnique({
    where: { code: input.code },
  })
  if (existing) {
    throw new Error('AFFILIATE_CODE_EXISTS')
  }

  const record = await prisma.affiliate.create({
    data: {
      affiliateId: generateAffiliateId(),
      code: input.code,
      name: input.name.trim(),
      email: input.email?.trim().toLowerCase() ?? '',
      phone: input.phone?.trim() ?? '',
      commissionPercent: input.commissionPercent,
      enabled: input.enabled ?? true,
      notes: input.notes?.trim() ?? '',
    },
  })

  return prismaToStoredAffiliate(record)
}

export async function updateStoredAffiliate(
  affiliateId: string,
  input: Partial<AdminAffiliateInput>,
): Promise<StoredAffiliate> {
  if (!isDatabaseConfigured()) {
    throw new Error('DATABASE_NOT_CONFIGURED')
  }

  if (input.code) {
    const duplicate = await prisma.affiliate.findFirst({
      where: {
        code: input.code,
        NOT: { affiliateId },
      },
    })
    if (duplicate) throw new Error('AFFILIATE_CODE_EXISTS')
  }

  const record = await prisma.affiliate.update({
    where: { affiliateId },
    data: {
      ...(input.name !== undefined ? { name: input.name.trim() } : {}),
      ...(input.code !== undefined ? { code: input.code } : {}),
      ...(input.email !== undefined
        ? { email: input.email.trim().toLowerCase() }
        : {}),
      ...(input.phone !== undefined ? { phone: input.phone.trim() } : {}),
      ...(input.commissionPercent !== undefined
        ? { commissionPercent: input.commissionPercent }
        : {}),
      ...(input.enabled !== undefined ? { enabled: input.enabled } : {}),
      ...(input.notes !== undefined ? { notes: input.notes.trim() } : {}),
    },
  })

  return prismaToStoredAffiliate(record)
}

export async function deleteStoredAffiliate(affiliateId: string): Promise<void> {
  if (!isDatabaseConfigured()) {
    throw new Error('DATABASE_NOT_CONFIGURED')
  }

  await prisma.affiliate.delete({ where: { affiliateId } })
}

export async function recordAffiliateConversion(input: {
  affiliateId: string
  orderTotal: number
  commissionAmount: number
}) {
  if (!isDatabaseConfigured()) return

  const commissionAmount = Math.max(0, input.commissionAmount)

  await prisma.affiliate.update({
    where: { affiliateId: input.affiliateId },
    data: {
      totalOrders: { increment: 1 },
      totalRevenue: { increment: input.orderTotal },
      totalCommission: { increment: commissionAmount },
      pendingCommission: { increment: commissionAmount },
    },
  })
}

export async function markAffiliateCommissionPaid(
  affiliateId: string,
): Promise<StoredAffiliate> {
  if (!isDatabaseConfigured()) {
    throw new Error('DATABASE_NOT_CONFIGURED')
  }

  const affiliate = await prisma.affiliate.findUnique({
    where: { affiliateId },
  })
  if (!affiliate) throw new Error('AFFILIATE_NOT_FOUND')

  const payoutAmount = affiliate.pendingCommission
  if (payoutAmount <= 0) throw new Error('NO_PENDING_COMMISSION')

  const [updated] = await prisma.$transaction([
    prisma.affiliate.update({
      where: { affiliateId },
      data: {
        pendingCommission: 0,
        paidCommission: { increment: payoutAmount },
      },
    }),
    prisma.order.updateMany({
      where: {
        affiliateId,
        commissionStatus: 'pending',
      },
      data: { commissionStatus: 'paid' },
    }),
  ])

  return prismaToStoredAffiliate(updated)
}
