import type { LocationId } from '@/lib/locations'
import { getCurrencyForLocation } from '@/lib/checkout'
import { isCartBundleProductId } from '@/lib/cart-bundle'
import {
  buildShopifyCheckoutDiscountCodes,
  createShopifyDraftOrderCheckout,
  resolveShopifyCheckoutPricing,
  type ShopifyCheckoutLineForPricing,
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
  bundleId?: string
  bundleName?: string
  bundleImage?: string
  bundleComponents?: Array<{
    productId: string
    variantImage?: string
    variantLabel?: string
  }>
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

  const currency = getCurrencyForLocation(input.locationId ?? 'ghana')
  const hasBundleLines = input.lines.some(
    (line) =>
      Boolean(line.bundleId) || isCartBundleProductId(line.productId),
  )

  const products = await getShopifyProducts()
  const byId = indexProducts(products)

  const pricingLines: ShopifyCheckoutLineForPricing[] = input.lines.map(
    (line) => ({
      productId: line.productId,
      quantity: line.quantity,
      variantLabel: line.variantLabel,
      variantImage: line.variantImage,
      unitPrice: line.unitPrice,
      bundleId: line.bundleId,
      bundleName: line.bundleName,
      bundleImage: line.bundleImage,
      bundleComponents: line.bundleComponents,
    }),
  )

  const pricing = await resolveShopifyCheckoutPricing({
    lines: pricingLines,
    productsById: byId,
    promoCode: input.promoCode,
    smileRewardFreeShipping: input.smileRewardFreeShipping,
    locationId: input.locationId,
  })

  const needsHiddenDiscounts = pricing.amountOff >= 0.01 || pricing.freeShipping
  // Bundles must checkout as one custom draft line (not exploded variants).
  if (needsHiddenDiscounts || hasBundleLines) {
    try {
      const draft = await createShopifyDraftOrderCheckout({
        pricing,
        email: input.email,
        phone: input.phone,
        countryCode: input.countryCode,
        visitorId: input.visitorId,
        currency,
      })
      if (draft) {
        return {
          cartId: draft.id,
          checkoutUrl: draft.invoiceUrl,
          totalQuantity: pricing.lines.reduce(
            (sum, line) => sum + line.quantity,
            0,
          ),
        }
      }
      if (hasBundleLines) {
        throw new Error(
          'Could not start checkout for this bundle. Please try again.',
        )
      }
    } catch (error) {
      if (hasBundleLines) throw error
      console.warn(
        '[shopify-checkout] Draft order checkout unavailable, falling back to discount codes',
        error,
      )
    }
  }

  const cartLines: Array<{ merchandiseId: string; quantity: number }> = []

  for (const line of pricing.lines) {
    if (line.customTitle || !line.merchandiseId) {
      throw new Error(
        'Bundle checkout requires Shopify Admin draft orders. Check Admin API credentials.',
      )
    }
    cartLines.push({
      merchandiseId: line.merchandiseId,
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
