import type { Customer as PrismaCustomer } from '@prisma/client'
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
    source: record.source as 'manual' | 'import',
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
  input: AdminCustomerInput,
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
      source,
    },
  })

  return prismaToStoredCustomer(record)
}

export type CustomerImportResult = {
  created: number
  skipped: number
  errors: Array<{ rowNumber: number; message: string }>
}

export async function importStoredCustomers(
  rows: AdminCustomerInput[],
): Promise<CustomerImportResult> {
  if (!isDatabaseConfigured()) {
    throw new Error('DATABASE_NOT_CONFIGURED')
  }

  let created = 0
  let skipped = 0
  const errors: CustomerImportResult['errors'] = []
  const seenKeys = new Set<string>()

  for (let index = 0; index < rows.length; index += 1) {
    const row = rows[index]
    const rowNumber = index + 2

    try {
      const parsed = adminCustomerInputSchema.parse(row)
      const email = normalizeCustomerEmail(parsed.email)
      const phone = normalizeCustomerPhone(parsed.phone)
      const key = customerMatchKey(email, phone)

      if (!key || seenKeys.has(key)) {
        skipped += 1
        continue
      }

      const existing = await findStoredCustomerByContact(email, phone)
      if (existing) {
        seenKeys.add(key)
        skipped += 1
        continue
      }

      await createStoredCustomer(parsed, 'import')
      seenKeys.add(key)
      created += 1
    } catch (error) {
      if (error instanceof Error && error.message === 'CUSTOMER_ALREADY_EXISTS') {
        skipped += 1
        continue
      }

      errors.push({
        rowNumber,
        message:
          error instanceof Error ? error.message : 'Could not import customer',
      })
    }
  }

  return { created, skipped, errors }
}
