import {
  convertDhlAmountToBase,
  estimateShipmentWeightKg,
  getDhlConfig,
  isDhlConfigured,
} from '@/lib/dhl/config'
import { dhlFetch } from '@/lib/dhl/client'
import { dhlLocationError, normalizeDhlCity } from '@/lib/dhl/locations'
import { resolveDhlShipmentProfile } from '@/lib/dhl/product-codes'
import { addressLine } from '@/lib/dhl/shipping-details'
import { plannedShippingDateAndTime } from '@/lib/dhl/text'
import type { DhlRateOption } from '@/lib/dhl/types'

export type DhlRateQuoteInput = {
  destinationCountryCode: string
  destinationCityName: string
  destinationPostalCode?: string
  destinationAddressLine1?: string
  destinationCountyName?: string
  itemCount: number
  /** Prefer this DHL product code when re-validating (e.g. "P", "N") */
  productCode?: string
}

export type { DhlRateOption }

export type DhlRatesResult = {
  options: DhlRateOption[]
  selected: DhlRateOption
  weightKg: number
  productCode: string
}

type DhlProductsResponse = {
  products?: Array<{
    productCode?: string
    productName?: string
    totalPrice?: Array<{ price?: number; priceCurrency?: string }>
    deliveryCapabilities?: {
      estimatedDeliveryDateAndTime?: string
    }
  }>
}

function mapRateOptions(json: DhlProductsResponse): DhlRateOption[] {
  const options: DhlRateOption[] = []
  for (const product of json.products ?? []) {
    const priceEntry = product.totalPrice?.[0]
    const totalPrice = Number(priceEntry?.price ?? NaN)
    const currency = String(priceEntry?.priceCurrency ?? '').toUpperCase()
    const productCode = String(product.productCode ?? '').trim()
    if (!productCode || !Number.isFinite(totalPrice) || totalPrice < 0 || !currency) {
      continue
    }
    options.push({
      productCode,
      productName: String(product.productName ?? productCode),
      totalPrice,
      currency,
      totalPriceBase: convertDhlAmountToBase(totalPrice, currency),
      deliveryDate: product.deliveryCapabilities?.estimatedDeliveryDateAndTime,
    })
  }
  return options.sort((a, b) => a.totalPriceBase - b.totalPriceBase)
}

export async function fetchDhlRates(
  input: DhlRateQuoteInput,
): Promise<DhlRatesResult> {
  if (!isDhlConfigured()) {
    throw new Error('DHL Express is not configured')
  }

  const config = getDhlConfig()
  const destinationCountryCode = input.destinationCountryCode
    .trim()
    .toUpperCase()
  const destinationCityName = normalizeDhlCity(
    destinationCountryCode,
    input.destinationCityName,
  )
  const destinationPostalCode = input.destinationPostalCode?.trim() || ''

  if (!destinationCountryCode || destinationCountryCode.length !== 2) {
    throw new Error('A valid destination country is required for DHL rates')
  }
  if (!destinationCityName) {
    throw new Error('Destination city is required for DHL rates')
  }

  const weightKg = estimateShipmentWeightKg(
    Math.max(1, input.itemCount),
    config.weightPerItemKg,
    config.defaultWeightKg,
  )

  const profile = resolveDhlShipmentProfile(
    config.shipperCountryCode,
    destinationCountryCode,
    {
      exportAccount: config.exportAccount,
      importAccount: config.importAccount,
      accountCountryCode: config.shipperCountryCode,
    },
    input.productCode,
  )

  const shipperDetails: Record<string, string> = {
    addressLine1: addressLine(
      config.shipperAddressLine1,
      'Gelos warehouse, Accra',
    ),
    postalCode: config.shipperPostalCode || '',
    cityName: config.shipperCity,
    countryCode: config.shipperCountryCode,
  }
  if (config.shipperCounty) {
    shipperDetails.countyName = config.shipperCounty
  }

  const receiverDetails: Record<string, string> = {
    addressLine1: addressLine(
      input.destinationAddressLine1,
      'Delivery address',
    ),
    postalCode: destinationPostalCode,
    cityName: destinationCityName,
    countryCode: destinationCountryCode,
  }
  if (input.destinationCountyName?.trim()) {
    receiverDetails.countyName = input.destinationCountyName.trim()
  }

  const body: Record<string, unknown> = {
    plannedShippingDateAndTime: plannedShippingDateAndTime(),
    productCode: profile.productCode,
    unitOfMeasurement: 'metric',
    isCustomsDeclarable: profile.isCustomsDeclarable,
    nextBusinessDay: true,
    accounts: [
      {
        number: profile.accountNumber,
        typeCode: 'shipper',
      },
    ],
    customerDetails: {
      shipperDetails,
      receiverDetails,
    },
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
  }

  if (profile.payerCountryCode) {
    body.payerCountryCode = profile.payerCountryCode
  }

  const json = await dhlFetch<DhlProductsResponse>('/rates', {
    method: 'POST',
    body: JSON.stringify(body),
  }).catch((error: unknown) => {
    const message = error instanceof Error ? error.message : ''
    if (/420505|3007|destination location is invalid/i.test(message)) {
      throw new Error(
        dhlLocationError(
          input.destinationCityName.trim() || destinationCityName,
          destinationCountryCode,
        ),
      )
    }
    throw error
  })

  const options = mapRateOptions(json)
  if (options.length === 0) {
    throw new Error('No DHL Express rates available for this destination')
  }

  const preferred = options.find(
    (option) => option.productCode === profile.productCode,
  )

  return {
    options,
    selected: preferred ?? options[0]!,
    weightKg,
    productCode: profile.productCode,
  }
}
