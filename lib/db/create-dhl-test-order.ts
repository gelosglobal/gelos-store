import { createPaidOrder, generateOrderNumber } from '@/lib/db/orders'
import { prisma } from '@/lib/prisma'

export async function createDhlTestOrder() {
  const product = await prisma.product.findFirst({
    where: { active: true },
    orderBy: { updatedAt: 'desc' },
    select: {
      productId: true,
      name: true,
      image: true,
    },
  })

  if (!product) {
    throw new Error('No active product found to attach to the test order')
  }

  const quantity = 1
  const unitPriceUsd = 12.8
  const shippingUsd = 28.5
  const subtotal = unitPriceUsd * quantity
  const total = subtotal + shippingUsd

  const shippingDetails = {
    countryCode: 'US' as const,
    city: 'New York',
    postalCode: '10001',
    addressLine1: '350 5th Avenue',
    productCode: 'P',
  }

  const order = await createPaidOrder({
    orderNumber: generateOrderNumber(),
    paystackReference: `dhl_test_${Date.now()}`,
    locationId: 'usa',
    customerName: 'DHL Test Customer',
    customerEmail: 'dhl-test@gelosglobal.com',
    customerPhone: '+12125550100',
    shippingAddress: '350 5th Avenue, New York, 10001, US',
    shippingDetails,
    items: [
      {
        id: product.productId,
        name: product.name,
        productName: product.name,
        price: unitPriceUsd,
        quantity,
        variantImage: product.image || undefined,
      },
    ],
    subtotal,
    shipping: shippingUsd,
    discount: 0,
    total,
    currency: 'USD',
    channel: 'Stripe',
  })

  if (!order.persisted || !order.id) {
    throw new Error('Order was not saved. Check the database connection.')
  }

  return {
    id: order.id,
    orderNumber: order.orderNumber,
    productName: product.name,
  }
}
