import { z } from 'zod'
import { NextResponse } from 'next/server'
import { createWhatsappOrder } from '@/lib/db/whatsapp-orders'
import { isDatabaseConfigured } from '@/lib/env'

const customerSchema = z
  .object({
    name: z.string().trim().max(120).optional(),
    phone: z.string().trim().max(40).optional(),
    address: z.string().trim().max(500).optional(),
    note: z.string().trim().max(300).optional(),
  })
  .optional()

const itemSchema = z.object({
  productId: z.string().trim().min(1),
  name: z.string().trim().min(1),
  productName: z.string().trim().min(1),
  quantity: z.number().int().min(1).max(99),
  unitPriceLabel: z.string().trim().min(1),
  lineTotalLabel: z.string().trim().min(1),
  image: z.string().trim().min(1),
  productPath: z.string().trim().min(1),
})

const bodySchema = z.object({
  items: z.array(itemSchema).min(1).max(30),
  subtotalLabel: z.string().trim().min(1),
  discountLabel: z.string().trim().optional(),
  shippingLabel: z.string().trim().optional(),
  totalLabel: z.string().trim().min(1),
  promoCode: z.string().trim().optional(),
  locationLabel: z.string().trim().optional(),
  customer: customerSchema,
})

export async function POST(request: Request) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json(
      { error: 'Order sharing is temporarily unavailable.' },
      { status: 503 },
    )
  }

  try {
    const json = (await request.json()) as unknown
    const parsed = bodySchema.safeParse(json)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid order payload.' },
        { status: 400 },
      )
    }

    const created = await createWhatsappOrder(parsed.data)

    return NextResponse.json(created)
  } catch (error) {
    console.error('[whatsapp-order]', error)
    return NextResponse.json(
      { error: 'Failed to create WhatsApp order link.' },
      { status: 500 },
    )
  }
}
