import { z } from 'zod'
import { calculateCheckoutTotals } from '@/lib/checkout'
import { convertForLocation, getPaystackCurrencyForLocation } from '@/lib/exchange-rates'
import { getAllProducts } from '@/lib/db/products'
import { getStorePromotions } from '@/lib/db/store-settings'
import { findAffiliateByCode } from '@/lib/db/affiliates'
import { calculateAffiliateCommission } from '@/lib/affiliates'
import { findActivePromo } from '@/lib/store-promotions'
import type { LocationId } from '@/lib/locations'
import { getCartDisplayName } from '@/lib/variant-display'

export const checkoutLineItemSchema = z.object({
  id: z.string().min(1),
  quantity: z.number().int().min(1).max(99),
  variantImage: z.string().optional(),
  variantLabel: z.string().optional(),
})

export const checkoutRequestSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2).max(120),
  phone: z.string().max(30).optional(),
  shippingAddress: z.string().max(300).optional(),
  locationId: z.enum(['international', 'nigeria', 'ghana', 'usa']),
  items: z.array(checkoutLineItemSchema).min(1),
  promoCode: z.string().max(40).optional(),
  affiliateCode: z.string().max(40).optional(),
  smileRewardFreeShipping: z.boolean().optional(),
  /** @deprecated Use promoCode */
  promoApplied: z.boolean().optional(),
})

export type CheckoutRequestBody = z.infer<typeof checkoutRequestSchema>

export async function buildLocalizedCheckoutOrder(body: CheckoutRequestBody) {
  const locationId = body.locationId as LocationId
  const products = await getAllProducts()
  const productMap = new Map(products.map((product) => [product.id, product]))

  const checkoutItems = body.items.map((item) => {
    const product = productMap.get(item.id)
    if (!product) {
      throw new Error(`Product not found: ${item.id}`)
    }
    const variantLabel = item.variantLabel?.trim()
    return {
      id: product.id,
      name: getCartDisplayName(product.name, variantLabel),
      productName: product.name,
      price: product.price,
      quantity: item.quantity,
      variantLabel,
      variantImage: item.variantImage?.trim(),
    }
  })

  const localizedItems = checkoutItems.map((item) => ({
    ...item,
    price: convertForLocation(item.price, locationId),
  }))
  const promotions = await getStorePromotions()
  const promoCode =
    body.promoCode?.trim() ||
    (body.promoApplied ? promotions.promos.find((p) => p.enabled)?.code : undefined)

  if (promoCode && !findActivePromo(promoCode, promotions.promos)) {
    throw new Error('Invalid or expired promo code')
  }

  const affiliateCode = body.affiliateCode?.trim()
  const affiliate = affiliateCode
    ? await findAffiliateByCode(affiliateCode)
    : null

  if (affiliateCode && !affiliate) {
    throw new Error('Invalid or inactive affiliate code')
  }

  const totals = calculateCheckoutTotals(localizedItems, {
    promoCode,
    promotions,
    smileRewardFreeShipping: body.smileRewardFreeShipping === true,
  })

  if (totals.total <= 0) {
    throw new Error('Invalid order total')
  }

  return {
    locationId,
    localizedItems,
    totals,
    currency: getPaystackCurrencyForLocation(locationId),
    promoCode: promoCode || undefined,
    affiliate: affiliate
      ? {
          affiliateId: affiliate.affiliateId,
          code: affiliate.code,
          name: affiliate.name,
          commissionPercent: affiliate.commissionPercent,
          commissionAmount: calculateAffiliateCommission(
            totals.total,
            affiliate.commissionPercent,
          ),
        }
      : null,
  }
}
