import type { LocationId } from '@/lib/locations'
import {
  buildShopifyCheckoutDiscountCodes,
  createShopifyDraftOrderCheckout,
  resolveShopifyCheckoutPricing,
} from '@/lib/shopify/checkout-discounts'
import {
  mapShopifyProduct,
  resolveShopifyMerchandiseId,
  type ShopifyMappedProduct,
} from '@/lib/shopify/map-product'
import { getShopifyProducts } from '@/lib/shopify/products'
import { normalizeShopifyCheckoutUrl } from '@/lib/shopify/config'
import { shopifyStorefrontFetch } from '@/lib/shopify/storefront-client'

const CART_CREATE_MUTATION = /* GraphQL */ `
  mutation GelosCartCreate(
    $lines: [CartLineInput!]!
    $buyerIdentity: CartBuyerIdentityInput
    $attributes: [AttributeInput!]
    $discountCodes: [String!]
  ) {
    cartCreate(
      input: {
        lines: $lines
        buyerIdentity: $buyerIdentity
        attributes: $attributes
        discountCodes: $discountCodes
      }
    ) {
      cart {
        id
        checkoutUrl
        totalQuantity
        discountCodes {
          code
          applicable
        }
      }
      userErrors {
        field
        message
      }
    }
  }
`

export type ShopifyCheckoutLineInput = {
  productId: string
  quantity: number
  variantLabel?: string
  variantImage?: string
  unitPrice?: number
}

export type ShopifyCheckoutResult = {
  cartId: string
  checkoutUrl: string
  totalQuantity: number
}

type CartCreateData = {
  cartCreate: {
    cart: {
      id: string
      checkoutUrl: string
      totalQuantity: number
      discountCodes?: Array<{ code: string; applicable: boolean }> | null
    } | null
    userErrors: Array<{ field?: string[] | null; message: string }>
  }
}

function indexProducts(products: ShopifyMappedProduct[]) {
  const byId = new Map<string, ShopifyMappedProduct>()
  for (const product of products) {
    byId.set(product.id, product)
    byId.set(product.handle, product)
    byId.set(product.shopifyProductGid, product)
  }
  return byId
}

/**
 * Build a Shopify cart from Gelos cart lines and return the hosted checkout URL.
 * Meta ads Purchase fires on this Shopify Checkout when the Meta channel is connected.
 */
export async function createShopifyCheckout(input: {
  lines: ShopifyCheckoutLineInput[]
  email?: string
  phone?: string
  countryCode?: string
  locationId?: LocationId
  promoCode?: string
  smileRewardFreeShipping?: boolean
  /** Stable Gelos visitor id — carried into checkout for Meta external_id. */
  visitorId?: string
}): Promise<ShopifyCheckoutResult> {
  if (input.lines.length === 0) {
    throw new Error('Cart is empty')
  }

  const products = await getShopifyProducts()
  const byId = indexProducts(products)

  const cartLines: Array<{ merchandiseId: string; quantity: number }> = []

  for (const line of input.lines) {
    const product = byId.get(line.productId)
    if (!product) {
      throw new Error(`Product not found in Shopify catalog: ${line.productId}`)
    }

    const merchandiseId = resolveShopifyMerchandiseId(
      product,
      line.variantLabel,
      line.variantImage,
    )

    cartLines.push({
      merchandiseId,
      quantity: Math.max(1, line.quantity),
    })
  }

  const buyerIdentity: Record<string, string> = {}
  if (input.email?.trim()) buyerIdentity.email = input.email.trim().toLowerCase()
  if (input.phone?.trim()) buyerIdentity.phone = input.phone.trim()
  if (input.countryCode?.trim()) {
    buyerIdentity.countryCode = input.countryCode.trim().toUpperCase()
  }

  const attributes: Array<{ key: string; value: string }> = []
  const visitorId = input.visitorId?.trim()
  if (visitorId) {
    attributes.push({ key: 'gelos_visitor_id', value: visitorId })
  }

  const pricing = await resolveShopifyCheckoutPricing({
    lines: input.lines,
    productsById: byId,
    promoCode: input.promoCode,
    smileRewardFreeShipping: input.smileRewardFreeShipping,
    locationId: input.locationId,
  })

  const needsHiddenDiscounts = pricing.amountOff >= 0.01 || pricing.freeShipping
  if (needsHiddenDiscounts) {
    try {
      const draft = await createShopifyDraftOrderCheckout({
        pricing,
        email: input.email,
        phone: input.phone,
        countryCode: input.countryCode,
        visitorId: input.visitorId,
      })
      if (draft) {
        return {
          cartId: draft.id,
          checkoutUrl: draft.invoiceUrl,
          totalQuantity: cartLines.reduce((sum, line) => sum + line.quantity, 0),
        }
      }
    } catch (error) {
      console.warn(
        '[shopify-checkout] Draft order checkout unavailable, falling back to discount codes',
        error,
      )
    }
  }

  const discountCodes = needsHiddenDiscounts
    ? await buildShopifyCheckoutDiscountCodes(pricing)
    : []

  const data = await shopifyStorefrontFetch<CartCreateData>(CART_CREATE_MUTATION, {
    lines: cartLines,
    buyerIdentity: Object.keys(buyerIdentity).length ? buyerIdentity : undefined,
    attributes: attributes.length ? attributes : undefined,
    discountCodes: discountCodes.length ? discountCodes : undefined,
  })

  const errors = data.cartCreate.userErrors
  if (errors.length) {
    throw new Error(errors.map((error) => error.message).join('; '))
  }

  const cart = data.cartCreate.cart
  if (!cart?.checkoutUrl) {
    throw new Error('Shopify did not return a checkout URL')
  }

  const skipped = (cart.discountCodes ?? []).filter((code) => !code.applicable)
  if (skipped.length) {
    console.warn(
      '[shopify-checkout] Discount codes not applicable:',
      skipped.map((code) => code.code).join(', '),
    )
  }

  return {
    cartId: cart.id,
    checkoutUrl: normalizeShopifyCheckoutUrl(cart.checkoutUrl),
    totalQuantity: cart.totalQuantity,
  }
}

// Keep mapper export available for callers that already have a node.
export { mapShopifyProduct }
