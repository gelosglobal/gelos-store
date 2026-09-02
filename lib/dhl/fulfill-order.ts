import type { Prisma } from '@prisma/client'
import { validateDhlAddress } from '@/lib/dhl/address'
import {
  convertDhlAmountToBase,
  getDhlConfig,
  isDhlShippingConfigured,
} from '@/lib/dhl/config'
import { createDhlPickup } from '@/lib/dhl/pickups'
import { fetchDhlRates } from '@/lib/dhl/rates'
import { resolveShippingDetails } from '@/lib/dhl/shipping-details'
import { createDhlShipment } from '@/lib/dhl/shipments'
import { fetchDhlTracking } from '@/lib/dhl/tracking'
import type { DhlShipmentRecord, ShippingDetails } from '@/lib/dhl/types'
import { asDhlShipmentRecord } from '@/lib/dhl/record'
import { canonicalizeLocationId } from '@/lib/locations'
import { parseCheckoutLineItems } from '@/lib/parse-checkout-line-items'
import { prisma } from '@/lib/prisma'
import { countryCodeFromLocation } from '@/lib/shipping-destination'

export { asDhlShipmentRecord, toPublicDhlShipment } from '@/lib/dhl/record'

type OrderForDhl = {
  id: string
  orderNumber: string
  customerName: string
  customerEmail: string
  customerPhone: string | null
  shippingAddress: string | null
  shippingDetails: Prisma.JsonValue | null
  locationId?: string | null
  dhl: Prisma.JsonValue | null
  items: Prisma.JsonValue
  currency: string
  shipping: number
}

function shipperDetailsFromConfig() {
  const config = getDhlConfig()
  if (!config.shipperAddressLine1 || !config.shipperPhone) {
    throw new Error(
      'Set DHL_SHIPPER_ADDRESS_LINE1, DHL_SHIPPER_NAME, and DHL_SHIPPER_PHONE to create shipments.',
    )
  }
  return {
    fullName: config.shipperName,
    companyName: config.shipperCompany,
    email: config.shipperEmail,
    phone: config.shipperPhone,
    address: {
      countryCode: config.shipperCountryCode,
      city: config.shipperCity,
      postalCode: config.shipperPostalCode || undefined,
      addressLine1: config.shipperAddressLine1,
      countyName: config.shipperCounty || undefined,
    } satisfies ShippingDetails,
  }
}

export async function fulfillOrderWithDhl(order: OrderForDhl) {
  if (!isDhlShippingConfigured()) {
    throw new Error(
      'DHL shipping is not fully configured. Add shipper contact env vars.',
    )
  }

  const existing = asDhlShipmentRecord(order.dhl)
  if (existing?.trackingNumber) {
    throw new Error(
      `This order already has DHL tracking ${existing.trackingNumber}`,
    )
  }

  const marketId = canonicalizeLocationId(order.locationId ?? undefined)
  const destination = resolveShippingDetails({
    shippingDetails: order.shippingDetails,
    shippingAddress: order.shippingAddress,
    fallbackCountry: marketId ? countryCodeFromLocation(marketId) : undefined,
  })
  if (!destination) {
    throw new Error(
      'This order needs a city and country on the shipping address before DHL can create a shipment.',
    )
  }

  const lineItems = parseCheckoutLineItems(order.items)
  if (lineItems.length === 0) {
    throw new Error('This order has no line items to ship')
  }

  const products = await prisma.product.findMany({
    where: {
      productId: { in: [...new Set(lineItems.map((item) => item.id))] },
    },
    select: { productId: true, category: true, name: true },
  })
  const productMap = new Map(
    products.map((product) => [product.productId, product]),
  )
  const customsItems = lineItems.map((item) => {
    const product = productMap.get(item.id)
    return {
      name: item.productName || product?.name || item.name,
      category: product?.category,
      quantity: item.quantity,
      unitPrice: convertDhlAmountToBase(item.price, order.currency),
    }
  })

  const itemCount = lineItems.reduce((sum, item) => sum + item.quantity, 0)
  const shipper = shipperDetailsFromConfig()

  let addressValid = true
  let addressMessage: string | undefined
  try {
    const validation = await validateDhlAddress({
      countryCode: destination.countryCode,
      cityName: destination.city,
      postalCode: destination.postalCode,
      type: 'delivery',
    })
    addressValid = validation.valid
    addressMessage = validation.message
    if (validation.cityName) destination.city = validation.cityName
    if (validation.postalCode && !destination.postalCode) {
      destination.postalCode = validation.postalCode
    }
  } catch (error) {
    addressValid = false
    addressMessage =
      error instanceof Error ? error.message : 'Address validation failed'
  }

  const rates = await fetchDhlRates({
    destinationCountryCode: destination.countryCode,
    destinationCityName: destination.city,
    destinationPostalCode: destination.postalCode,
    destinationAddressLine1: destination.addressLine1,
    destinationCountyName: destination.countyName,
    itemCount,
    productCode: destination.productCode,
  })

  const shipment = await createDhlShipment({
    orderNumber: order.orderNumber,
    shipper,
    receiver: {
      fullName: order.customerName,
      companyName: order.customerName,
      email: order.customerEmail,
      phone: order.customerPhone ?? undefined,
      address: destination,
    },
    items: customsItems,
    orderCurrency: order.currency,
    freightCharge: rates.selected.totalPrice,
    freightCurrency: rates.selected.currency,
    productCode: rates.selected.productCode,
  })

  let pickupConfirmationNumber: string | undefined
  let dispatchConfirmationNumber: string | undefined
  let pickupError: string | undefined
  try {
    const pickup = await createDhlPickup({
      shipper,
      receiver: {
        fullName: order.customerName,
        email: order.customerEmail,
        phone: order.customerPhone ?? undefined,
        address: destination,
      },
      profile: shipment.profile,
      itemCount,
      declaredValue: customsItems.reduce(
        (sum, item) => sum + item.unitPrice * item.quantity,
        0,
      ),
    })
    pickupConfirmationNumber = pickup.confirmationNumber
    dispatchConfirmationNumber = pickup.dispatchConfirmationNumber
  } catch (error) {
    pickupError =
      error instanceof Error ? error.message : 'DHL pickup request failed'
  }

  const record: DhlShipmentRecord = {
    productCode: shipment.profile.productCode,
    productName: rates.selected.productName,
    trackingNumber: shipment.trackingNumber,
    trackingUrl: shipment.trackingUrl,
    pickupConfirmationNumber,
    dispatchConfirmationNumber,
    accountType: shipment.profile.accountType,
    isCustomsDeclarable: shipment.profile.isCustomsDeclarable,
    addressValid,
    addressMessage,
    documents: shipment.documents,
    createdAt: new Date().toISOString(),
    error: pickupError,
  }

  const updated = await prisma.order.update({
    where: { id: order.id },
    data: {
      dhl: record as Prisma.InputJsonValue,
      shippingDetails: destination as Prisma.InputJsonValue,
      fulfillmentStatus: 'Shipped',
    },
  })

  return {
    order: updated,
    dhl: record,
    pickupError,
  }
}

export async function refreshOrderDhlTracking(order: OrderForDhl) {
  const existing = asDhlShipmentRecord(order.dhl)
  if (!existing?.trackingNumber) {
    throw new Error('This order has no DHL tracking number yet')
  }

  const tracking = await fetchDhlTracking(existing.trackingNumber)
  const record: DhlShipmentRecord = {
    ...existing,
    lastStatus: tracking.status,
    lastDescription: tracking.description,
    lastEvents: tracking.events.slice(0, 20),
    lastTrackedAt: new Date().toISOString(),
  }

  const delivered = tracking.events.some((event) => {
    const code = (event.typeCode ?? '').toUpperCase()
    const text = `${event.description ?? ''} ${tracking.status ?? ''}`.toLowerCase()
    return code === 'OK' || text.includes('delivered')
  })

  await prisma.order.update({
    where: { id: order.id },
    data: {
      dhl: record as Prisma.InputJsonValue,
      ...(delivered ? { fulfillmentStatus: 'Delivered' } : {}),
    },
  })

  return record
}
