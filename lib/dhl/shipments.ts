import { estimateShipmentWeightKg, getDhlConfig } from '@/lib/dhl/config'
import { dhlFetch } from '@/lib/dhl/client'
import {
  contentDescription,
  customsDescription,
  hsCodeForCategory,
  type DhlLineItemDraft,
} from '@/lib/dhl/hs-codes'
import { resolveDhlShipmentProfile } from '@/lib/dhl/product-codes'
import { addressLine, dhlTrackingUrl } from '@/lib/dhl/shipping-details'
import { clip, dhlPhone, isoDate, plannedShippingDateAndTime } from '@/lib/dhl/text'
import type {
  DhlDocument,
  DhlShipmentProfile,
  ShippingDetails,
} from '@/lib/dhl/types'

export type DhlShipmentParty = {
  fullName: string
  companyName?: string
  email?: string
  phone?: string
  address: ShippingDetails
}

export type CreateDhlShipmentInput = {
  orderNumber: string
  shipper: DhlShipmentParty
  receiver: DhlShipmentParty
  items: DhlLineItemDraft[]
  orderCurrency: string
  freightCharge?: number
  freightCurrency?: string
  productCode?: string
}

export type DhlShipmentResult = {
  trackingNumber: string
  trackingUrl: string
  documents: DhlDocument[]
  profile: DhlShipmentProfile
  productName?: string
  plannedShippingDateAndTime: string
}

type ShipmentApiResponse = {
  shipmentTrackingNumber?: string
  trackingUrl?: string
  packages?: Array<{ trackingNumber?: string }>
  documents?: Array<{
    typeCode?: string
    imageFormat?: string
    content?: string
    imageFormatType?: string
  }>
}

function imageOptions(isCustomsDeclarable: boolean) {
  const options: Array<Record<string, unknown>> = [
    {
      templateName: 'ECOM26_84_A4_001',
      typeCode: 'label',
    },
    {
      templateName: 'ARCH_8X4_A4_002',
      isRequested: true,
      typeCode: 'waybillDoc',
      hideAccountNumber: true,
    },
  ]

  if (isCustomsDeclarable) {
    options.push({
      templateName: 'COMMERCIAL_INVOICE_P_10',
      invoiceType: 'commercial',
      languageCode: 'eng',
      isRequested: true,
      typeCode: 'invoice',
    })
  }

  return options
}

function postalAddress(party: DhlShipmentParty, fallbackLine: string) {
  const address: Record<string, string> = {
    addressLine1: addressLine(party.address.addressLine1, fallbackLine),
    postalCode: party.address.postalCode || '',
    cityName: party.address.city,
    countryCode: party.address.countryCode,
  }
  if (party.address.countyName) address.countyName = party.address.countyName
  return address
}

function lineItems(
  items: DhlLineItemDraft[],
  manufacturerCountry: string,
  weightKg: number,
) {
  const quantity = Math.max(
    1,
    items.reduce((sum, item) => sum + item.quantity, 0),
  )
  const unitWeight = Math.max(
    0.01,
    Math.round((weightKg / quantity) * 1000) / 1000,
  )

  return items.map((item, index) => {
    const hs = hsCodeForCategory(item.category, item.name)
    const lineWeight = Math.max(
      0.01,
      Math.round(unitWeight * item.quantity * 1000) / 1000,
    )
    return {
      number: index + 1,
      quantity: {
        unitOfMeasurement: 'PCS',
        value: item.quantity,
      },
      price: Math.round(item.unitPrice * item.quantity * 100) / 100,
      description: customsDescription(item),
      weight: {
        netValue: lineWeight,
        grossValue: lineWeight,
      },
      commodityCodes: [
        { typeCode: 'outbound', value: hs },
        { typeCode: 'inbound', value: hs },
      ],
      exportReasonType: 'permanent',
      manufacturerCountry,
    }
  })
}

export async function createDhlShipment(
  input: CreateDhlShipmentInput,
): Promise<DhlShipmentResult> {
  const config = getDhlConfig()
  const destination = input.receiver.address.countryCode.toUpperCase()
  const origin = input.shipper.address.countryCode.toUpperCase()
  const profile = resolveDhlShipmentProfile(
    origin,
    destination,
    {
      exportAccount: config.exportAccount,
      importAccount: config.importAccount,
      accountCountryCode: config.shipperCountryCode,
    },
    input.productCode,
  )

  const itemCount = Math.max(
    1,
    input.items.reduce((sum, item) => sum + item.quantity, 0),
  )
  const weightKg = estimateShipmentWeightKg(
    itemCount,
    config.weightPerItemKg,
    config.defaultWeightKg,
  )

  const invoiceCurrency = (
    input.orderCurrency.trim() ||
    input.freightCurrency ||
    config.accountCurrency
  ).toUpperCase()

  const declaredValue = Math.max(
    1,
    Math.round(
      input.items.reduce(
        (sum, item) => sum + item.unitPrice * item.quantity,
        0,
      ) * 100,
    ) / 100,
  )

  // Freight must already be in invoiceCurrency (see fulfill-order).
  const freight =
    input.freightCharge != null
      ? Math.round(input.freightCharge * 100) / 100
      : undefined

  const planned = plannedShippingDateAndTime()
  const content: Record<string, unknown> = {
    packages: [
      {
        weight: weightKg,
        dimensions: {
          length: config.lengthCm,
          width: config.widthCm,
          height: config.heightCm,
        },
      },
    ],
    isCustomsDeclarable: profile.isCustomsDeclarable,
    description: contentDescription(input.items),
    incoterm: 'DAP',
    unitOfMeasurement: 'metric',
  }

  if (profile.isCustomsDeclarable) {
    content.declaredValueCurrency = invoiceCurrency
    content.declaredValue = declaredValue
    content.exportDeclaration = {
      lineItems: lineItems(input.items, origin, weightKg),
      exportReason: 'Permanent',
      additionalCharges:
        freight && freight > 0
          ? [{ value: freight, typeCode: 'freight' }]
          : undefined,
      invoice: {
        number: clip(input.orderNumber, 35),
        date: isoDate(),
      },
      placeOfIncoterm: input.receiver.address.city,
      exportReasonType: 'permanent',
      shipmentType: 'commercial',
    }
  }

  const body: Record<string, unknown> = {
    plannedShippingDateAndTime: planned,
    productCode: profile.productCode,
    pickup: { isRequested: false },
    outputImageProperties: {
      allDocumentsInOneImage: true,
      encodingFormat: 'pdf',
      imageOptions: imageOptions(profile.isCustomsDeclarable),
    },
    accounts: [
      {
        number: profile.accountNumber,
        typeCode: 'shipper',
      },
    ],
    customerDetails: {
      shipperDetails: {
        postalAddress: postalAddress(input.shipper, 'Gelos warehouse'),
        contactInformation: {
          fullName: clip(input.shipper.fullName, 60),
          companyName: clip(
            input.shipper.companyName || input.shipper.fullName,
            60,
          ),
          email: input.shipper.email || config.shipperEmail,
          phone: dhlPhone(input.shipper.phone, config.shipperPhone),
        },
        typeCode: 'business',
      },
      receiverDetails: {
        postalAddress: postalAddress(input.receiver, 'Delivery address'),
        contactInformation: {
          fullName: clip(input.receiver.fullName, 60),
          companyName: clip(
            input.receiver.companyName || input.receiver.fullName,
            60,
          ),
          email: input.receiver.email || config.shipperEmail,
          phone: dhlPhone(input.receiver.phone, config.shipperPhone),
        },
        typeCode: 'private',
      },
    },
    content,
    customerReferences: [
      {
        value: clip(input.orderNumber, 35),
        typeCode: 'CU',
      },
    ],
  }

  const json = await dhlFetch<ShipmentApiResponse>('/shipments', {
    method: 'POST',
    body: JSON.stringify(body),
  })

  const trackingNumber =
    json.shipmentTrackingNumber?.trim() ||
    json.packages?.[0]?.trackingNumber?.trim() ||
    ''
  if (!trackingNumber) {
    throw new Error('DHL created a shipment but returned no tracking number')
  }

  const documents: DhlDocument[] = (json.documents ?? [])
    .map((document) => {
      const content = document.content?.trim()
      if (!content) return null
      return {
        typeCode: document.typeCode || 'label',
        imageFormat: (
          document.imageFormat ||
          document.imageFormatType ||
          'PDF'
        ).toUpperCase(),
        content,
      } satisfies DhlDocument
    })
    .filter((document): document is DhlDocument => document !== null)

  return {
    trackingNumber,
    trackingUrl: json.trackingUrl?.trim() || dhlTrackingUrl(trackingNumber),
    documents,
    profile,
    plannedShippingDateAndTime: planned,
  }
}
