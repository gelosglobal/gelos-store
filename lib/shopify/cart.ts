import {
  mapShopifyProduct,
  resolveShopifyMerchandiseId,
  type ShopifyMappedProduct,
} from '@/lib/shopify/map-product'
import { getShopifyProducts } from '@/lib/shopify/products'
import { normalizeShopifyCheckoutUrl } from '@/lib/shopify/config'
import { shopifyStorefrontFetch } from '@/lib/shopify/storefront-client'

const CART_CREATE_MUTATION = /* GraphQL */ `
  mutation GelosCartCreate($lines: [CartLineInput!]!, $buyerIdentity: CartBuyerIdentityInput) {
    cartCreate(input: { lines: $lines, buyerIdentity: $buyerIdentity }) {
      cart {
        id
        checkoutUrl
        totalQuantity
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
  countryCode?: string
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
  if (input.countryCode?.trim()) {
    buyerIdentity.countryCode = input.countryCode.trim().toUpperCase()
  }

  const data = await shopifyStorefrontFetch<CartCreateData>(CART_CREATE_MUTATION, {
    lines: cartLines,
    buyerIdentity: Object.keys(buyerIdentity).length ? buyerIdentity : undefined,
  })

  const errors = data.cartCreate.userErrors
  if (errors.length) {
    throw new Error(errors.map((error) => error.message).join('; '))
  }

  const cart = data.cartCreate.cart
  if (!cart?.checkoutUrl) {
    throw new Error('Shopify did not return a checkout URL')
  }

  return {
    cartId: cart.id,
    checkoutUrl: normalizeShopifyCheckoutUrl(cart.checkoutUrl),
    totalQuantity: cart.totalQuantity,
  }
}

// Keep mapper export available for callers that already have a node.
export { mapShopifyProduct }
