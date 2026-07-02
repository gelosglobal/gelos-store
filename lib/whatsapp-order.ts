import { getWhatsAppChatUrl } from '@/lib/whatsapp'

export type WhatsAppOrderCustomer = {
  name?: string
  phone?: string
  address?: string
  note?: string
}

export type WhatsAppOrderLine = {
  name: string
  quantity: number
  unitPriceLabel: string
  lineTotalLabel: string
  imageUrl?: string
  productUrl?: string
}

export type WhatsAppOrderInput = {
  lines: WhatsAppOrderLine[]
  subtotalLabel: string
  discountLabel?: string
  shippingLabel?: string
  totalLabel: string
  promoCode?: string
  locationLabel?: string
  customer?: WhatsAppOrderCustomer
  shareUrl?: string
}

export function buildWhatsAppOrderMessage(input: WhatsAppOrderInput): string {
  if (input.shareUrl) {
    return buildCatalogShareMessage(input)
  }

  return buildTextOrderMessage(input)
}

function buildCatalogShareMessage(input: WhatsAppOrderInput): string {
  const lines = [
    'Hi Gelos! I would like to place this order.',
    '',
    'View my order catalog:',
    input.shareUrl!,
  ]

  const customer = input.customer
  const hasCustomerDetails =
    customer?.name?.trim() ||
    customer?.phone?.trim() ||
    customer?.address?.trim() ||
    customer?.note?.trim()

  if (hasCustomerDetails) {
    lines.push('')
    lines.push('Delivery details are on the order page.')
  } else {
    lines.push('')
    lines.push(
      'Please confirm availability and share delivery details. Thank you!',
    )
  }

  return lines.join('\n')
}

function buildTextOrderMessage(input: WhatsAppOrderInput): string {
  const lines: string[] = ['Hi Gelos! I would like to place an order:', '']

  input.lines.forEach((line, index) => {
    lines.push(
      `${index + 1}. ${line.name} x${line.quantity} — ${line.lineTotalLabel}`,
    )
    if (line.productUrl) {
      lines.push(`   ${line.productUrl}`)
    }
  })

  lines.push('')
  lines.push(`Subtotal: ${input.subtotalLabel}`)

  if (input.discountLabel) {
    const promoSuffix = input.promoCode ? ` (${input.promoCode})` : ''
    lines.push(`Promo savings${promoSuffix}: -${input.discountLabel}`)
  }

  if (input.shippingLabel) {
    lines.push(`Shipping: ${input.shippingLabel}`)
  } else {
    lines.push('Shipping: Free')
  }

  lines.push(`Total: ${input.totalLabel}`)

  if (input.locationLabel) {
    lines.push(`Region: ${input.locationLabel}`)
  }

  const customer = input.customer
  if (customer?.name || customer?.phone || customer?.address || customer?.note) {
    lines.push('')
    lines.push('Delivery details:')
    if (customer.name?.trim()) lines.push(`Name: ${customer.name.trim()}`)
    if (customer.phone?.trim()) lines.push(`Phone: ${customer.phone.trim()}`)
    if (customer.address?.trim()) lines.push(`Address: ${customer.address.trim()}`)
    if (customer.note?.trim()) lines.push(`Note: ${customer.note.trim()}`)
  } else {
    lines.push('')
    lines.push(
      'Please share my name, phone number, and delivery address to confirm this order. Thank you!',
    )
  }

  return lines.join('\n')
}

export function getWhatsAppOrderUrl(message: string): string | null {
  return getWhatsAppChatUrl(message)
}

export function openWhatsAppOrderUrl(message: string): void {
  const href = getWhatsAppOrderUrl(message)
  if (!href) return
  window.open(href, '_blank', 'noopener,noreferrer')
}
