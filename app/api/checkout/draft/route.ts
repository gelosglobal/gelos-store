import { NextResponse } from 'next/server'
import { z } from 'zod'
import {
  buildLocalizedCheckoutOrder,
  checkoutLineItemSchema,
} from '@/lib/build-checkout-order'
import { upsertAbandonedCheckout } from '@/lib/db/abandoned-checkouts'

const draftSchema = z.object({
  visitorId: z.string().min(8).max(120),
  email: z.union([z.string().email(), z.literal('')]).optional(),
  name: z.string().max(120).optional(),
  phone: z.string().max(30).optional(),
  shippingAddress: z.string().max(300).optional(),
  locationId: z.enum(['international', 'nigeria', 'ghana', 'usa']),
  items: z.array(checkoutLineItemSchema).min(1),
  promoCode: z.string().max(40).optional(),
  affiliateCode: z.string().max(40).optional(),
  smileRewardFreeShipping: z.boolean().optional(),
})

export async function POST(request: Request) {
  try {
    const json = await request.json()
    const parsed = draftSchema.safeParse(json)

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid checkout draft' }, { status: 400 })
    }

    const email = parsed.data.email?.trim() ?? ''
    const name = parsed.data.name?.trim() ?? ''

    const { localizedItems, totals, currency } = await buildLocalizedCheckoutOrder({
      ...parsed.data,
      email: email || 'draft@gelos.store',
      name: name || 'Checkout visitor',
    })

    const result = await upsertAbandonedCheckout({
      visitorId: parsed.data.visitorId,
      customerName: name,
      customerEmail: email.toLowerCase(),
      customerPhone: parsed.data.phone?.trim(),
      shippingAddress: parsed.data.shippingAddress?.trim(),
      locationId: parsed.data.locationId,
      items: localizedItems,
      subtotal: totals.subtotal,
      shipping: totals.shipping,
      discount: totals.discount,
      total: totals.total,
      currency,
      promoCode: parsed.data.promoCode,
      affiliateCode: parsed.data.affiliateCode,
    })

    if (!result.ok) {
      return NextResponse.json({ ok: false })
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('[POST /api/checkout/draft]', error)
    return NextResponse.json({ error: 'Failed to save checkout draft' }, { status: 500 })
  }
}
