import type { Customer as PrismaCustomer } from '@prisma/client'
import { z } from 'zod'
import {
  adminCustomerInputSchema,
  customerMatchKey,
  normalizeCustomerEmail,
  normalizeCustomerPhone,
  subscriptionFromEmail,
  type AdminCustomerInput,
} from '@/lib/admin/customer-input'
import { isDatabaseConfigured } from '@/lib/env'
import { prisma } from '@/lib/prisma'
import type { EmailSubscription } from '@/lib/types/customer'

type ImportCustomerInput = AdminCustomerInput & {
  rowNumber?: number
  lifetimeOrders?: number
  lifetimeSpent?: number
  lifetimeCurrency?: string
}

export function generateCustomerId(): string {
  const suffix = Date.now().toString(36).toUpperCase()
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase()
  return `CUST-${suffix}-${rand}`
}

function prismaToStoredCustomer(record: PrismaCustomer) {
  return {
    customerId: record.customerId,
    name: record.name,
    email: record.email,
    phone: record.phone,
    location: record.location,
    emailSubscription: record.emailSubscription as EmailSubscription,
    lifetimeOrders: record.lifetimeOrders ?? 0,
    lifetimeSpent: record.lifetimeSpent ?? 0,
    lifetimeCurrency: record.lifetimeCurrency ?? 'GHS',
    source: record.source as 'manual' | 'import' | 'newsletter',
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  }
}

export type StoredCustomer = ReturnType<typeof prismaToStoredCustomer>

export async function listStoredCustomers(): Promise<StoredCustomer[]> {
  if (!isDatabaseConfigured()) return []

  try {
    const records = await prisma.customer.findMany({
      orderBy: { createdAt: 'desc' },
    })

    return records.map(prismaToStoredCustomer)
  } catch (error) {
    console.error('[listStoredCustomers]', error)
    return []
  }
}

export async function findStoredCustomerByContact(
  email: string,
  phone: string,
): Promise<StoredCustomer | null> {
  if (!isDatabaseConfigured()) return null

  try {
    const normalizedEmail = normalizeCustomerEmail(email)
    const normalizedPhone = normalizeCustomerPhone(phone)

    if (normalizedEmail) {
      const byEmail = await prisma.customer.findFirst({
        where: { email: normalizedEmail },
      })
      if (byEmail) return prismaToStoredCustomer(byEmail)
    }

    if (normalizedPhone) {
      const byPhone = await prisma.customer.findFirst({
        where: { phone: normalizedPhone },
      })
      if (byPhone) return prismaToStoredCustomer(byPhone)
    }

    return null
  } catch (error) {
    console.error('[findStoredCustomerByContact]', error)
    return null
  }
}

export async function createStoredCustomer(
  input: ImportCustomerInput,
  source: 'manual' | 'import' = 'manual',
): Promise<StoredCustomer> {
  if (!isDatabaseConfigured()) {
    throw new Error('DATABASE_NOT_CONFIGURED')
  }

  const parsed = adminCustomerInputSchema.parse(input)
  const email = normalizeCustomerEmail(parsed.email)
  const phone = normalizeCustomerPhone(parsed.phone)

  const existing = await findStoredCustomerByContact(email, phone)
  if (existing) {
    throw new Error('CUSTOMER_ALREADY_EXISTS')
  }

  const record = await prisma.customer.create({
    data: {
      customerId: generateCustomerId(),
      name: parsed.name.trim(),
      email,
      phone,
      location: parsed.location?.trim() ?? '',
      emailSubscription: subscriptionFromEmail(
        email,
        parsed.emailSubscription,
      ),
      lifetimeOrders: Math.max(0, Number(input.lifetimeOrders ?? 0) || 0),
      lifetimeSpent: Math.max(0, Number(input.lifetimeSpent ?? 0) || 0),
      lifetimeCurrency: (input.lifetimeCurrency ?? 'GHS').trim() || 'GHS',
      source,
    },
  })

  return prismaToStoredCustomer(record)
}

export type CustomerImportResult = {
  created: number
  updated: number
  skipped: number
  errors: Array<{ rowNumber: number; message: string }>
}

function buildImportCustomerData(input: ImportCustomerInput) {
  const parsed = adminCustomerInputSchema.parse(input)
  const email = normalizeCustomerEmail(parsed.email)
  const phone = normalizeCustomerPhone(parsed.phone)

  return {
    name: parsed.name.trim(),
    email,
    phone,
    location: parsed.location?.trim() ?? '',
    emailSubscription: subscriptionFromEmail(email, parsed.emailSubscription),
    lifetimeOrders: Math.max(0, Number(input.lifetimeOrders ?? 0) || 0),
    lifetimeSpent: Math.max(0, Number(input.lifetimeSpent ?? 0) || 0),
    lifetimeCurrency: (input.lifetimeCurrency ?? 'GHS').trim() || 'GHS',
  }
}

export async function importStoredCustomers(
  rows: ImportCustomerInput[],
): Promise<CustomerImportResult> {
  if (!isDatabaseConfigured()) {
    throw new Error('DATABASE_NOT_CONFIGURED')
  }

  const errors: CustomerImportResult['errors'] = []
  const seenKeys = new Set<string>()
  const candidates: Array<{
    rowNumber: number
    input: ImportCustomerInput
    email: string
    phone: string
    key: string
    data: ReturnType<typeof buildImportCustomerData>
  }> = []

  let skipped = 0

  for (let index = 0; index < rows.length; index += 1) {
    const row = rows[index]
    const rowNumber = row.rowNumber ?? index + 2

    try {
      const data = buildImportCustomerData(row)
      const key = customerMatchKey(data.email, data.phone)

      if (!key || seenKeys.has(key)) {
        skipped += 1
        continue
      }

      seenKeys.add(key)
      candidates.push({
        rowNumber,
        input: row,
        email: data.email,
        phone: data.phone,
        key,
        data,
      })
    } catch (error) {
      errors.push({
        rowNumber,
        message:
          error instanceof Error ? error.message : 'Could not import customer',
      })
    }
  }

  const chunk = <T,>(arr: T[], size: number) => {
    const chunks: T[][] = []
    for (let i = 0; i < arr.length; i += size) chunks.push(arr.slice(i, i + size))
    return chunks
  }

  const emails = candidates.map((c) => c.email).filter(Boolean)
  const phones = candidates.map((c) => c.phone).filter(Boolean)
  const existingByKey = new Map<
    string,
    { customerId: string; email: string; phone: string }
  >()

  const emailChunks = chunk(Array.from(new Set(emails)), 1000)
  const phoneChunks = chunk(Array.from(new Set(phones)), 1000)

  for (const emailChunk of emailChunks) {
    if (emailChunk.length === 0) continue
    const found = await prisma.customer.findMany({
      where: { email: { in: emailChunk } },
      select: { customerId: true, email: true, phone: true },
    })
    for (const row of found) {
      const key = customerMatchKey(row.email, '')
      if (key) existingByKey.set(key, row)
    }
  }

  for (const phoneChunk of phoneChunks) {
    if (phoneChunk.length === 0) continue
    const found = await prisma.customer.findMany({
      where: { phone: { in: phoneChunk } },
      select: { customerId: true, email: true, phone: true },
    })
    for (const row of found) {
      const key = customerMatchKey('', row.phone)
      if (key) existingByKey.set(key, row)
    }
  }

  const toInsert = candidates.filter((c) => !existingByKey.has(c.key))
  const toUpdate = candidates.filter((c) => existingByKey.has(c.key))

  let created = 0
  let updated = 0

  const insertChunks = chunk(toInsert, 500)
  for (const batch of insertChunks) {
    if (batch.length === 0) continue
    const data = batch.map(({ data: customer }) => ({
      customerId: generateCustomerId(),
      ...customer,
      source: 'import',
    }))

    const result = await prisma.customer.createMany({ data })
    created += result.count
  }

  const updateChunks = chunk(toUpdate, 100)
  for (const batch of updateChunks) {
    await Promise.all(
      batch.map(async (candidate) => {
        const existing = existingByKey.get(candidate.key)
        if (!existing) return

        await prisma.customer.update({
          where: { customerId: existing.customerId },
          data: {
            name: candidate.data.name,
            email: candidate.data.email,
            phone: candidate.data.phone,
            location: candidate.data.location || undefined,
            emailSubscription: candidate.data.emailSubscription,
            lifetimeOrders: candidate.data.lifetimeOrders,
            lifetimeSpent: candidate.data.lifetimeSpent,
            lifetimeCurrency: candidate.data.lifetimeCurrency,
            source: 'import',
          },
        })
        updated += 1
      }),
    )
  }

  return { created, updated, skipped, errors }
}

export type NewsletterSubscribeResult =
  | { ok: true; status: 'created' | 'updated' | 'already_subscribed' }
  | { ok: false; reason: 'invalid_email' | 'database' }

/** Upsert a footer newsletter email into customers as Subscribed. */
export async function subscribeNewsletterEmail(
  rawEmail: string,
): Promise<NewsletterSubscribeResult> {
  const email = normalizeCustomerEmail(rawEmail)
  if (!email || !z.string().email().safeParse(email).success) {
    return { ok: false, reason: 'invalid_email' }
  }

  if (!isDatabaseConfigured()) {
    return { ok: false, reason: 'database' }
  }

  try {
    const existing = await prisma.customer.findFirst({
      where: { email },
    })

    if (existing) {
      if (existing.emailSubscription === 'Subscribed') {
        return { ok: true, status: 'already_subscribed' }
      }

      await prisma.customer.update({
        where: { customerId: existing.customerId },
        data: { emailSubscription: 'Subscribed' },
      })
      return { ok: true, status: 'updated' }
    }

    const localPart = email.split('@')[0]?.trim() || ''
    const name =
      localPart.length >= 2 ? localPart.slice(0, 120) : 'Newsletter subscriber'

    await prisma.customer.create({
      data: {
        customerId: generateCustomerId(),
        name,
        email,
        phone: '',
        location: '',
        emailSubscription: 'Subscribed',
        source: 'newsletter',
      },
    })

    return { ok: true, status: 'created' }
  } catch (error) {
    console.error('[subscribeNewsletterEmail]', error)
    return { ok: false, reason: 'database' }
  }
}
