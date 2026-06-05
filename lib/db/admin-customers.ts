import type { Order as PrismaOrder } from '@prisma/client'
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

function emailSubscriptionFor(email: string): EmailSubscription {
  return email.trim() ? 'Subscribed' : 'Not subscribed'
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

function bucketToStoreCustomer(bucket: CustomerBucket): StoreCustomer {
  return {
    id: bucket.id,
    name: bucket.name,
    email: bucket.email,
    phone: bucket.phone,
    location: bucket.location,
    emailSubscription: emailSubscriptionFor(bucket.email),
    orders: bucket.orders,
    totalSpent: bucket.totalSpent,
    currency: bucket.currency,
    joinDate: bucket.joinDate.toISOString().slice(0, 10),
  }
}

export async function listAdminCustomers(): Promise<StoreCustomer[]> {
  if (!isDatabaseConfigured()) return []

  const orders = await prisma.order.findMany({
    orderBy: { createdAt: 'desc' },
  })

  const buckets = new Map<string, CustomerBucket>()
  for (const order of orders) {
    upsertCustomerBucket(buckets, order)
  }

  return Array.from(buckets.values())
    .map(bucketToStoreCustomer)
    .sort((a, b) => b.orders - a.orders || b.totalSpent - a.totalSpent)
}

export async function countAdminCustomers(): Promise<number> {
  const customers = await listAdminCustomers()
  return customers.length
}
