import type { Order as PrismaOrder } from '@prisma/client'
import {
  customerMatchKey,
  subscriptionFromEmail,
} from '@/lib/admin/customer-input'
import { listStoredCustomers, type StoredCustomer } from '@/lib/db/customers'
import { isDatabaseConfigured } from '@/lib/env'
import { prisma } from '@/lib/prisma'
import type { EmailSubscription, StoreCustomer } from '@/lib/types/customer'

type CustomerBucket = {
  id: string
  name: string
  email: string
  phone: string
  location: string
  orders: number
  totalSpent: number
  currency: string
  joinDate: Date
  latestOrderAt: Date
}

function customerKey(order: PrismaOrder): string {
  const email = order.customerEmail.trim().toLowerCase()
  if (email) return `email:${email}`
  const phone = order.customerPhone?.trim()
  if (phone) return `phone:${phone}`
  return `name:${order.customerName.trim().toLowerCase()}`
}

function customerIdFromKey(key: string): string {
  return `cust-${Buffer.from(key).toString('base64url').slice(0, 16)}`
}

function locationFromOrder(order: PrismaOrder): string {
  const address = order.shippingAddress?.trim()
  if (address) {
    const firstLine = address.split(',')[0]?.trim() || address
    return firstLine.length > 48 ? `${firstLine.slice(0, 45)}…` : firstLine
  }

  switch (order.currency?.toUpperCase()) {
    case 'NGN':
      return 'Nigeria'
    case 'USD':
      return 'International'
    case 'GHS':
    default:
      return 'Ghana'
  }
}

function upsertCustomerBucket(
  buckets: Map<string, CustomerBucket>,
  order: PrismaOrder,
) {
  const key = customerKey(order)
  const existing = buckets.get(key)
  const location = locationFromOrder(order)
  const email = order.customerEmail.trim()
  const phone = order.customerPhone?.trim() ?? ''

  if (!existing) {
    buckets.set(key, {
      id: customerIdFromKey(key),
      name: order.customerName.trim() || 'Customer',
      email,
      phone,
      location,
      orders: 1,
      totalSpent: order.total,
      currency: order.currency,
      joinDate: order.createdAt,
      latestOrderAt: order.createdAt,
    })
    return
  }

  existing.orders += 1
  existing.totalSpent += order.total

  if (order.createdAt < existing.joinDate) {
    existing.joinDate = order.createdAt
  }

  if (order.createdAt >= existing.latestOrderAt) {
    existing.latestOrderAt = order.createdAt
    existing.name = order.customerName.trim() || existing.name
    if (email) existing.email = email
    if (phone) existing.phone = phone
    if (location) existing.location = location
    existing.currency = order.currency
  }
}

function customerOrderStats(
  stored: StoredCustomer,
  bucket?: CustomerBucket,
): Pick<StoreCustomer, 'orders' | 'totalSpent' | 'currency'> {
  const lifetimeOrders = stored.lifetimeOrders ?? 0
  const lifetimeSpent = stored.lifetimeSpent ?? 0
  const lifetimeCurrency = stored.lifetimeCurrency ?? 'GHS'

  if (stored.source === 'import' && (lifetimeOrders > 0 || lifetimeSpent > 0)) {
    return {
      orders: lifetimeOrders,
      totalSpent: lifetimeSpent,
      currency: lifetimeCurrency,
    }
  }

  if (bucket) {
    return {
      orders: Math.max(bucket.orders, lifetimeOrders),
      totalSpent: Math.max(bucket.totalSpent, lifetimeSpent),
      currency: bucket.currency || lifetimeCurrency,
    }
  }

  return {
    orders: lifetimeOrders,
    totalSpent: lifetimeSpent,
    currency: lifetimeCurrency,
  }
}

function bucketToStoreCustomer(
  bucket: CustomerBucket,
  overrides?: Partial<
    Pick<
      StoreCustomer,
      | 'id'
      | 'name'
      | 'email'
      | 'phone'
      | 'location'
      | 'emailSubscription'
      | 'lifetimeOrders'
      | 'lifetimeSpent'
      | 'lifetimeCurrency'
      | 'source'
    >
  >,
  stored?: StoredCustomer,
): StoreCustomer {
  const email = overrides?.email ?? bucket.email
  const stats = stored
    ? customerOrderStats(stored, bucket)
    : {
        orders: bucket.orders,
        totalSpent: bucket.totalSpent,
        currency: bucket.currency,
      }

  return {
    id: overrides?.id ?? bucket.id,
    name: overrides?.name ?? bucket.name,
    email,
    phone: overrides?.phone ?? bucket.phone,
    location: overrides?.location ?? bucket.location,
    emailSubscription:
      overrides?.emailSubscription ?? subscriptionFromEmail(email),
    orders: stats.orders,
    totalSpent: stats.totalSpent,
    currency: stats.currency,
    lifetimeOrders: overrides?.lifetimeOrders ?? stored?.lifetimeOrders,
    lifetimeSpent: overrides?.lifetimeSpent ?? stored?.lifetimeSpent,
    lifetimeCurrency: overrides?.lifetimeCurrency ?? stored?.lifetimeCurrency,
    joinDate: bucket.joinDate.toISOString().slice(0, 10),
    source: overrides?.source ?? 'checkout',
  }
}

function storedToStoreCustomer(
  stored: StoredCustomer,
  bucket?: CustomerBucket,
): StoreCustomer {
  const stats = customerOrderStats(stored, bucket)

  if (bucket) {
    return bucketToStoreCustomer(
      bucket,
      {
        id: stored.customerId,
        name: stored.name,
        email: stored.email,
        phone: stored.phone,
        location: stored.location || bucket.location,
        emailSubscription: stored.emailSubscription,
        lifetimeOrders: stored.lifetimeOrders,
        lifetimeSpent: stored.lifetimeSpent,
        lifetimeCurrency: stored.lifetimeCurrency,
        source: stored.source,
      },
      stored,
    )
  }

  return {
    id: stored.customerId,
    name: stored.name,
    email: stored.email,
    phone: stored.phone,
    location: stored.location,
    emailSubscription: stored.emailSubscription,
    orders: stats.orders,
    totalSpent: stats.totalSpent,
    currency: stats.currency,
    lifetimeOrders: stored.lifetimeOrders,
    lifetimeSpent: stored.lifetimeSpent,
    lifetimeCurrency: stored.lifetimeCurrency,
    joinDate: stored.createdAt.toISOString().slice(0, 10),
    source: stored.source,
  }
}

function buildOrderBuckets(orders: PrismaOrder[]): Map<string, CustomerBucket> {
  const buckets = new Map<string, CustomerBucket>()
  for (const order of orders) {
    upsertCustomerBucket(buckets, order)
  }
  return buckets
}

function findMatchingBucket(
  stored: StoredCustomer,
  buckets: Map<string, CustomerBucket>,
): { key: string; bucket: CustomerBucket } | null {
  const emailKey = stored.email
    ? customerMatchKey(stored.email, '')
    : null
  if (emailKey && buckets.has(emailKey)) {
    return { key: emailKey, bucket: buckets.get(emailKey)! }
  }

  const phoneKey = stored.phone
    ? customerMatchKey('', stored.phone)
    : null
  if (phoneKey && buckets.has(phoneKey)) {
    return { key: phoneKey, bucket: buckets.get(phoneKey)! }
  }

  return null
}

export async function listAdminCustomers(): Promise<StoreCustomer[]> {
  if (!isDatabaseConfigured()) return []

  const [orders, storedCustomers] = await Promise.all([
    prisma.order.findMany({ orderBy: { createdAt: 'desc' } }),
    listStoredCustomers(),
  ])

  const buckets = buildOrderBuckets(orders)
  const matchedBucketKeys = new Set<string>()
  const merged: StoreCustomer[] = []

  for (const stored of storedCustomers) {
    const match = findMatchingBucket(stored, buckets)
    if (match) {
      matchedBucketKeys.add(match.key)
      merged.push(storedToStoreCustomer(stored, match.bucket))
    } else {
      merged.push(storedToStoreCustomer(stored))
    }
  }

  for (const [key, bucket] of buckets) {
    if (matchedBucketKeys.has(key)) continue
    merged.push(bucketToStoreCustomer(bucket))
  }

  return merged.sort(
    (a, b) => b.orders - a.orders || b.totalSpent - a.totalSpent,
  )
}

export async function countAdminCustomers(): Promise<number> {
  const customers = await listAdminCustomers()
  return customers.length
}
