import { randomBytes } from 'node:crypto'
import { calculateCheckoutTotals } from '@/lib/checkout'
import { getMarketSettings } from '@/lib/db/market-settings'
import {
  getCartUpsellSettings,
  getStorePromotions,
} from '@/lib/db/store-settings'
import { applyMarketShipping } from '@/lib/market-settings'
import type { LocationId } from '@/lib/locations'
import {
  shopifyAdminFetch,
  isShopifyAdminConfigured,
} from '@/lib/shopify/admin-client'
import {
  resolveShopifyCatalogUnitPrice,
  resolveShopifyMerchandiseId,
  type ShopifyMappedProduct,
} from '@/lib/shopify/map-product'
import { findActivePromo } from '@/lib/store-promotions'

const AMOUNT_OFF_MUTATION = /* GraphQL */ `
  mutation GelosAmountOffCode($basicCodeDiscount: DiscountCodeBasicInput!) {
    discountCodeBasicCreate(basicCodeDiscount: $basicCodeDiscount) {
      codeDiscountNode {
        id
      }
      userErrors {
        field
        message
      }
    }
  }
`

const FREE_SHIPPING_MUTATION = /* GraphQL */ `
  mutation GelosFreeShippingCode(
    $freeShippingCodeDiscount: DiscountCodeFreeShippingInput!
  ) {
    discountCodeFreeShippingCreate(
      freeShippingCodeDiscount: $freeShippingCodeDiscount
    ) {
      codeDiscountNode {
        id
      }
      userErrors {
        field
        message
      }
    }
  }
`

const DRAFT_ORDER_MUTATION = /* GraphQL */ `
  mutation GelosDraftOrderCreate($input: DraftOrderInput!) {
    draftOrderCreate(input: $input) {
      draftOrder {
        id
        invoiceUrl
      }
      userErrors {
        field
        message
      }
    }
  }
`

type DiscountUserErrors = {
  userErrors: Array<{ field?: string[] | null; message: string }>
}

export type ShopifyCheckoutLineForPricing = {
  productId: string
  quantity: number
  variantLabel?: string
  variantImage?: string
  unitPrice?: number
}

export type ShopifyCheckoutPricedLine = {
  merchandiseId: string
  quantity: number
  unitPrice: number
}

export type ShopifyCheckoutPricing = {
  amountOff: number
  freeShipping: boolean
  afterDiscount: number
  lines: ShopifyCheckoutPricedLine[]
}

const COMBINES_WITH = {
  orderDiscounts: true,
  productDiscounts: true,
  shippingDiscounts: true,
}

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100
}

function moneyString(value: number): string {
  const amount = Number.isFinite(value) ? roundMoney(value) : 0
  return amount.toFixed(2)
}

function checkoutCode(prefix: string): string {
  return `${prefix}${randomBytes(5).toString('hex').toUpperCase()}`
}

function maxUpsellDiscountPercent(settings: {
  tier2DiscountPercent: number
  tier3DiscountPercent: number
  crossSellDiscountPercent: number
}): number {
  return Math.max(
    0,
    settings.tier2DiscountPercent,
    settings.tier3DiscountPercent,
    settings.crossSellDiscountPercent,
  )
}

function trustedUnitPrice(
  catalogPrice: number,
  requested: number | undefined,
  maxDiscountPercent: number,
): number {
  if (requested == null || !Number.isFinite(requested) || requested < 0) {
    return catalogPrice
  }
  const floor = roundMoney(catalogPrice * (1 - maxDiscountPercent / 100))
  if (requested + 0.009 < floor) return catalogPrice
  return roundMoney(Math.min(requested, catalogPrice))
}

function allocateUnitPrices(
  items: Array<{ quantity: number; price: number }>,
  targetTotal: number,
): number[] {
  const subtotal = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  )
  if (!Number.isFinite(subtotal) || !Number.isFinite(targetTotal) || subtotal <= 0) {
    return items.map((item) =>
      Number.isFinite(item.price) ? roundMoney(item.price) : 0,
    )
  }

  const ratio = targetTotal / subtotal
  const units = items.map((item) => roundMoney(item.price * ratio))
  let allocated = 0
  for (let index = 0; index < items.length - 1; index += 1) {
    allocated += units[index] * items[index].quantity
  }
  const last = items[items.length - 1]
  units[items.length - 1] = roundMoney((targetTotal - allocated) / last.quantity)
  return units.map((unit, index) =>
    Number.isFinite(unit) ? unit : roundMoney(items[index]?.price ?? 0),
  )
}

export async function resolveShopifyCheckoutPricing(input: {
  lines: ShopifyCheckoutLineForPricing[]
  productsById: Map<string, ShopifyMappedProduct>
  promoCode?: string
  smileRewardFreeShipping?: boolean
  locationId?: LocationId
}): Promise<ShopifyCheckoutPricing> {
  if (input.lines.length === 0) {
    return { amountOff: 0, freeShipping: false, afterDiscount: 0, lines: [] }
  }

  const locationId = input.locationId ?? 'ghana'
  const [storePromotions, market, upsellSettings] = await Promise.all([
    getStorePromotions(),
    getMarketSettings(locationId),
    getCartUpsellSettings(),
  ])
  const promotions = applyMarketShipping(storePromotions, market)
  const promoCode = findActivePromo(input.promoCode, promotions.promos)?.code
  const maxDiscountPercent = maxUpsellDiscountPercent(upsellSettings)

  let shopifySubtotal = 0
  const gelosItems = input.lines.map((line) => {
    const product = input.productsById.get(line.productId)
    if (!product) {
      throw new Error(`Product not found in Shopify catalog: ${line.productId}`)
    }

    const catalogPrice = resolveShopifyCatalogUnitPrice(
      product,
      line.variantLabel,
      line.variantImage,
    )
    const unitPrice = trustedUnitPrice(
      catalogPrice,
      line.unitPrice,
      maxDiscountPercent,
    )
    shopifySubtotal += catalogPrice * line.quantity

    return {
      merchandiseId: resolveShopifyMerchandiseId(
        product,
        line.variantLabel,
        line.variantImage,
      ),
      id: product.id,
      name: product.name,
      price: unitPrice,
      quantity: Math.max(1, line.quantity),
    }
  })

  const totals = calculateCheckoutTotals(gelosItems, {
    promoCode,
    promotions,
    smileRewardFreeShipping: input.smileRewardFreeShipping === true,
  })
  const afterDiscount = roundMoney(totals.subtotal - totals.discount)
  const amountOff = roundMoney(shopifySubtotal - afterDiscount)
  const unitPrices = allocateUnitPrices(gelosItems, afterDiscount)

  return {
    amountOff,
    freeShipping: totals.shipping === 0 && gelosItems.length > 0,
    afterDiscount,
    lines: gelosItems.map((item, index) => ({
      merchandiseId: item.merchandiseId,
      quantity: item.quantity,
      unitPrice: unitPrices[index] ?? item.price,
    })),
  }
}

async function createAmountOffCode(amount: number): Promise<string> {
  const code = checkoutCode('GELOS')
  const now = new Date()
  const endsAt = new Date(now.getTime() + 48 * 60 * 60 * 1000)

  const data = await shopifyAdminFetch<{
    discountCodeBasicCreate: DiscountUserErrors & {
      codeDiscountNode: { id: string } | null
    }
  }>(AMOUNT_OFF_MUTATION, {
    basicCodeDiscount: {
      title: 'Cart savings',
      code,
      startsAt: now.toISOString(),
      endsAt: endsAt.toISOString(),
      usageLimit: 1,
      appliesOncePerCustomer: true,
      customerSelection: { all: true },
      combinesWith: COMBINES_WITH,
      customerGets: {
        value: {
          discountAmount: {
            amount: moneyString(amount),
            appliesOnEachItem: false,
          },
        },
        items: { all: true },
      },
    },
  })

  const errors = data.discountCodeBasicCreate.userErrors
  if (errors.length || !data.discountCodeBasicCreate.codeDiscountNode) {
    throw new Error(
      errors.map((error) => error.message).join('; ') ||
        'Could not create Shopify amount-off code',
    )
  }

  return code
}

async function createFreeShippingCode(): Promise<string> {
  const code = checkoutCode('GELOSSHIP')
  const now = new Date()
  const endsAt = new Date(now.getTime() + 48 * 60 * 60 * 1000)

  const data = await shopifyAdminFetch<{
    discountCodeFreeShippingCreate: DiscountUserErrors & {
      codeDiscountNode: { id: string } | null
    }
  }>(FREE_SHIPPING_MUTATION, {
    freeShippingCodeDiscount: {
      title: 'Free shipping',
      code,
      startsAt: now.toISOString(),
      endsAt: endsAt.toISOString(),
      usageLimit: 1,
      appliesOncePerCustomer: true,
      customerSelection: { all: true },
      destination: { all: true },
      combinesWith: {
        orderDiscounts: true,
        productDiscounts: true,
        shippingDiscounts: false,
      },
    },
  })

  const errors = data.discountCodeFreeShippingCreate.userErrors
  if (errors.length || !data.discountCodeFreeShippingCreate.codeDiscountNode) {
    throw new Error(
      errors.map((error) => error.message).join('; ') ||
        'Could not create Shopify free-shipping code',
    )
  }

  return code
}

export async function createShopifyDraftOrderCheckout(input: {
  pricing: ShopifyCheckoutPricing
  email?: string
  phone?: string
  countryCode?: string
  visitorId?: string
}): Promise<{ id: string; invoiceUrl: string } | null> {
  const email = input.email?.trim().toLowerCase()
  if (!email) return null

  const draftInput: Record<string, unknown> = {
    email,
    tags: ['gelos-checkout'],
    note: 'Gelos storefront checkout',
    acceptAutomaticDiscounts: false,
    allowDiscountCodesInCheckout: false,
    presentmentCurrencyCode: 'GHS',
    lineItems: input.pricing.lines.map((line) => ({
      variantId: line.merchandiseId,
      quantity: line.quantity,
      priceOverride: {
        amount: moneyString(line.unitPrice),
        currencyCode: 'GHS',
      },
    })),
  }

  if (input.phone?.trim()) draftInput.phone = input.phone.trim()
  if (input.visitorId?.trim()) {
    draftInput.customAttributes = [
      { key: 'gelos_visitor_id', value: input.visitorId.trim() },
    ]
  }
  if (input.pricing.freeShipping) {
    draftInput.shippingLine = {
      title: 'Free shipping',
      price: '0.00',
    }
  }

  const data = await shopifyAdminFetch<{
    draftOrderCreate: DiscountUserErrors & {
      draftOrder: { id: string; invoiceUrl?: string | null } | null
    }
  }>(DRAFT_ORDER_MUTATION, { input: draftInput })

  const errors = data.draftOrderCreate.userErrors
  const draft = data.draftOrderCreate.draftOrder
  if (errors.length || !draft?.invoiceUrl) {
    throw new Error(
      errors.map((error) => error.message).join('; ') ||
        'Shopify did not return a draft order invoice URL',
    )
  }

  return { id: draft.id, invoiceUrl: draft.invoiceUrl }
}

export async function buildShopifyCheckoutDiscountCodes(
  pricing: ShopifyCheckoutPricing,
): Promise<string[]> {
  const codes: string[] = []
  const needsAmountOff = pricing.amountOff >= 0.01
  const needsFreeShipping = pricing.freeShipping

  if (!needsAmountOff && !needsFreeShipping) return codes

  if (!isShopifyAdminConfigured()) {
    throw new Error(
      'Shopify Admin API is required to apply cart discounts at checkout. Set SHOPIFY_CLIENT_ID and SHOPIFY_CLIENT_SECRET from Dev Dashboard → Settings.',
    )
  }

  try {
    if (needsAmountOff) {
      codes.push(await createAmountOffCode(pricing.amountOff))
    }
    if (needsFreeShipping) {
      codes.push(await createFreeShippingCode())
    }
  } catch (error) {
    console.error('[shopify-checkout] Failed to create Shopify discount codes', error)
    throw new Error(
      'Could not apply cart discounts to Shopify checkout. Check that the Admin API token has write_discounts access.',
    )
  }

  return codes
}
