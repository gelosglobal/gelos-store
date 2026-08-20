import { randomBytes } from 'crypto'
import type { WhatsappCatalog } from '@/lib/whatsapp-agent/catalog'
import type { WaShopConfig } from '@/lib/whatsapp-agent/types'
import * as store from '@/lib/whatsapp-agent/store'

function money(value: number) {
  return Math.round((Number(value) + Number.EPSILON) * 100) / 100
}

function normalized(value: unknown) {
  return String(value ?? '')
    .trim()
    .toLowerCase()
}

function createOrderId(date = new Date()) {
  const ymd = date.toISOString().slice(0, 10).replaceAll('-', '')
  return `GELOS-${ymd}-${randomBytes(2).toString('hex').toUpperCase()}`
}

export class WhatsappOrderService {
  constructor(
    private catalog: WhatsappCatalog,
    private shop: WaShopConfig,
  ) {}

  searchProducts(query: string, category: string | null = null) {
    return this.catalog.search(query, category)
  }

  async setCustomerDetails(
    whatsappId: string,
    details: {
      name?: string | null
      alternate_phone?: string | null
      notes?: string | null
    },
  ) {
    if (!String(details.name ?? '').trim()) {
      throw new Error('Customer name is required.')
    }
    return store.updateCustomer(whatsappId, details)
  }

  async setCartItems(
    whatsappId: string,
    requestedItems: Array<{
      product_id: string
      quantity: number | string
      variant?: string | null
    }>,
  ) {
    if (!Array.isArray(requestedItems) || requestedItems.length === 0) {
      throw new Error('At least one cart item is required.')
    }
    const consolidated = new Map<
      string,
      {
        product_id: string
        product_name: string
        variant: string | null
        quantity: number
        unit_price_ghs: number | null
      }
    >()
    for (const requested of requestedItems) {
      const product = this.catalog.get(requested.product_id)
      if (!product) {
        throw new Error(`Unknown or inactive product: ${requested.product_id}`)
      }
      const quantity = Number.parseInt(String(requested.quantity), 10)
      if (!Number.isInteger(quantity) || quantity < 1 || quantity > 100) {
        throw new Error(`Quantity must be between 1 and 100 for ${product.name}.`)
      }
      let variant = requested.variant ? String(requested.variant).trim() : null
      if (product.variants.length) {
        const canonical = product.variants.find(
          (candidate) => normalized(candidate) === normalized(variant),
        )
        if (!canonical) {
          throw new Error(
            `${product.name} requires one of these variants: ${product.variants.join(', ')}.`,
          )
        }
        variant = canonical
      }
      const key = `${product.id}::${variant ?? ''}`
      const previous = consolidated.get(key)
      consolidated.set(key, {
        product_id: product.id,
        product_name: product.name,
        variant,
        quantity: (previous?.quantity ?? 0) + quantity,
        unit_price_ghs: product.price_ghs,
      })
    }
    return store.setCartItems(whatsappId, [...consolidated.values()])
  }

  async setDeliveryDetails(
    whatsappId: string,
    details: {
      area?: string | null
      landmark?: string | null
      latitude?: number | null
      longitude?: number | null
      location_url?: string | null
    },
  ) {
    if (!String(details.area ?? '').trim()) {
      throw new Error('Delivery area is required.')
    }
    const hasCoordinates =
      Number.isFinite(details.latitude) && Number.isFinite(details.longitude)
    const hasLandmark = Boolean(String(details.landmark ?? '').trim())
    if (!hasCoordinates && !hasLandmark) {
      throw new Error(
        'Please provide a WhatsApp location pin or a delivery landmark.',
      )
    }
    const locationUrl = hasCoordinates
      ? details.location_url ||
        `https://www.google.com/maps?q=${details.latitude},${details.longitude}`
      : details.location_url || null
    return store.setDelivery(whatsappId, {
      area: String(details.area),
      landmark: details.landmark ?? null,
      latitude: details.latitude ?? null,
      longitude: details.longitude ?? null,
      location_url: locationUrl,
    })
  }

  async setPaymentMethod(
    whatsappId: string,
    method: string,
    notes: string | null = null,
  ) {
    const allowed = this.shop.payment_methods.map((item) => item.id)
    if (allowed.length && !allowed.includes(method)) {
      throw new Error(`Payment method must be one of: ${allowed.join(', ')}.`)
    }
    return store.setPayment(whatsappId, method, notes)
  }

  deliveryFeeFor(area: string) {
    const areaText = normalized(area)
    const zone = this.shop.delivery_zones.find((candidate) =>
      [candidate.name, ...(candidate.aliases || [])].some((label) =>
        areaText.includes(normalized(label)),
      ),
    )
    const fee = zone?.fee_ghs ?? this.shop.default_delivery_fee_ghs
    return Number.isFinite(fee) ? money(fee) : null
  }

  async getDraft(whatsappId: string) {
    const customer = await store.getCustomer(whatsappId)
    const cart = await store.getCart(whatsappId)
    const missing: string[] = []
    if (!customer?.display_name) missing.push('customer name')
    if (!cart.items.length) missing.push('products and quantities')
    if (!cart.delivery_area) missing.push('delivery area')
    if (
      !cart.landmark &&
      !(Number.isFinite(cart.latitude) && Number.isFinite(cart.longitude))
    ) {
      missing.push('location pin or landmark')
    }
    if (!cart.payment_method) missing.push('payment method')
    const missingPriceProducts = cart.items.filter(
      (item) => !Number.isFinite(item.unit_price_ghs),
    )
    if (missingPriceProducts.length) {
      missing.push(
        `approved prices for ${missingPriceProducts.map((item) => item.product_name).join(', ')}`,
      )
    }
    const subtotal = missingPriceProducts.length
      ? null
      : money(
          cart.items.reduce(
            (sum, item) => sum + item.quantity * (item.unit_price_ghs || 0),
            0,
          ),
        )
    const deliveryFee = cart.delivery_area
      ? this.deliveryFeeFor(cart.delivery_area)
      : null
    if (cart.delivery_area && deliveryFee === null) {
      missing.push('delivery fee confirmation')
    }
    const total =
      subtotal === null || deliveryFee === null
        ? null
        : money(subtotal + deliveryFee)
    const items = cart.items.map((item) => ({
      ...item,
      line_total_ghs: Number.isFinite(item.unit_price_ghs)
        ? money((item.unit_price_ghs || 0) * item.quantity)
        : null,
    }))
    return {
      customer: customer
        ? {
            name: customer.display_name,
            whatsapp_number: customer.whatsapp_id,
            alternate_phone: customer.alternate_phone,
          }
        : null,
      delivery: {
        area: cart.delivery_area,
        landmark: cart.landmark,
        latitude: cart.latitude,
        longitude: cart.longitude,
        location_url: cart.location_url,
      },
      payment_method: cart.payment_method,
      payment_notes: cart.payment_notes,
      notes: cart.order_notes,
      items,
      subtotal_ghs: subtotal,
      delivery_fee_ghs: deliveryFee,
      total_ghs: total,
      missing,
      ready_for_confirmation: missing.length === 0,
      confirmation_instruction: 'Reply exactly: CONFIRM ORDER',
    }
  }

  async createOrder(whatsappId: string, rawCustomerMessage: string) {
    if (normalized(rawCustomerMessage) !== 'confirm order') {
      throw new Error(
        'Order not created. The customer must reply exactly "CONFIRM ORDER".',
      )
    }
    const draft = await this.getDraft(whatsappId)
    if (!draft.ready_for_confirmation) {
      throw new Error(`Order is incomplete: ${draft.missing.join('; ')}.`)
    }
    const createdAt = new Date().toISOString()
    return store.saveOrder({
      order_id: createOrderId(),
      whatsapp_id: whatsappId,
      customer_name: draft.customer!.name!,
      alternate_phone: draft.customer!.alternate_phone,
      delivery_area: draft.delivery.area!,
      landmark: draft.delivery.landmark,
      latitude: draft.delivery.latitude,
      longitude: draft.delivery.longitude,
      location_url: draft.delivery.location_url,
      payment_method: draft.payment_method!,
      payment_status: 'Pending',
      subtotal_ghs: draft.subtotal_ghs!,
      delivery_fee_ghs: draft.delivery_fee_ghs!,
      total_ghs: draft.total_ghs!,
      order_status: 'New',
      notes: draft.notes,
      created_at: createdAt,
      items: draft.items.map((item) => ({
        product_id: item.product_id,
        product_name: item.product_name,
        variant: item.variant,
        quantity: item.quantity,
        unit_price_ghs: item.unit_price_ghs as number,
        line_total_ghs: item.line_total_ghs as number,
      })),
    })
  }

  async requestHandoff(
    whatsappId: string,
    details: {
      reason: string
      summary?: string | null
      urgency?: string
    },
  ) {
    return store.createHandoff({ whatsappId, ...details })
  }
}
