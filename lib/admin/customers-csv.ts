import type { StoreCustomer } from '@/lib/types/customer'

const CUSTOMER_CSV_HEADERS = [
  'Name',
  'Email',
  'Phone',
  'Location',
  'Email subscription',
  'Total orders',
  'Total spent',
  'Currency',
  'Source',
  'Join date',
] as const

function escapeCsvValue(value: string | number): string {
  const text = String(value ?? '')
  if (/[",\n\r]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`
  }
  return text
}

function customerToCsvRow(customer: StoreCustomer): string {
  return [
    customer.name,
    customer.email,
    customer.phone,
    customer.location,
    customer.emailSubscription,
    customer.lifetimeOrders ?? customer.orders,
    customer.lifetimeSpent ?? customer.totalSpent,
    customer.lifetimeCurrency ?? customer.currency,
    customer.source ?? '',
    customer.joinDate,
  ]
    .map(escapeCsvValue)
    .join(',')
}

/** Build a CSV string compatible with the admin customer import parser. */
export function buildCustomersCsv(customers: StoreCustomer[]): string {
  const lines = [
    CUSTOMER_CSV_HEADERS.join(','),
    ...customers.map(customerToCsvRow),
  ]
  // BOM helps Excel open UTF-8 correctly (names with accents, etc.)
  return `\uFEFF${lines.join('\n')}\n`
}

export function downloadCustomersCsv(
  customers: StoreCustomer[],
  filename = `gelos-customers-${new Date().toISOString().slice(0, 10)}.csv`,
): void {
  if (typeof window === 'undefined') return

  const csv = buildCustomersCsv(customers)
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.rel = 'noopener'
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}
