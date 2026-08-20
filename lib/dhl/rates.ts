import {
  convertDhlAmountToBase,
  dhlAuthHeader,
  estimateShipmentWeightKg,
  getDhlConfig,
  isDhlConfigured,
  nextShippingDateIso,
} from '@/lib/dhl/config'

export type DhlRateQuoteInput = {
  destinationCountryCode: string
  destinationCityName: string
  destinationPostalCode?: string
  itemCount: number
  /** Prefer this DHL product code when re-validating (e.g. "P", "N") */
  productCode?: string
}

export type DhlRateOption = {
  productCode: string
  productName: string
  totalPrice: number
  currency: string
  /** Amount in catalog base currency (GHS) for checkout totals */
  totalPriceBase: number
  deliveryDate?: string
}

export type DhlRatesResult = {
  options: DhlRateOption[]
  selected: DhlRateOption
  weightKg: number
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
  detail?: string
  message?: string
  title?: string
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
  const destinationCityName = input.destinationCityName.trim()
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

  const isCustomsDeclarable =
    destinationCountryCode !== config.shipperCountryCode

  const params = new URLSearchParams({
    accountNumber: config.accountNumber,
    originCountryCode: config.shipperCountryCode,
    originCityName: config.shipperCity,
    destinationCountryCode,
    destinationCityName,
    weight: String(weightKg),
    length: String(config.lengthCm),
    width: String(config.widthCm),
    height: String(config.heightCm),
    plannedShippingDate: nextShippingDateIso(),
    isCustomsDeclarable: String(isCustomsDeclarable),
    unitOfMeasurement: 'metric',
    nextBusinessDay: 'true',
  })

  if (config.shipperPostalCode) {
    params.set('originPostalCode', config.shipperPostalCode)
  }
  if (destinationPostalCode) {
    params.set('destinationPostalCode', destinationPostalCode)
  }

  const response = await fetch(`${config.baseUrl}/rates?${params.toString()}`, {
    method: 'GET',
    headers: {
      Authorization: dhlAuthHeader(config.apiKey, config.apiSecret),
      Accept: 'application/json',
    },
    cache: 'no-store',
  })

  const json = (await response.json().catch(() => ({}))) as DhlProductsResponse & {
    reasons?: Array<{ msg?: string }>
    details?: { msgId?: string } | string
  }

  if (!response.ok) {
    const reason = json.reasons?.[0]?.msg
    const detail =
      reason ||
      json.detail ||
      json.message ||
      json.title ||
      `DHL rates request failed (${response.status})`

    if (response.status === 401) {
      throw new Error(
        `${detail}. Check DHL_API_KEY / DHL_API_SECRET from the MyDHL API portal, and set DHL_ENV=test or production to match those credentials.`,
      )
    }

    throw new Error(detail)
  }

  const options: DhlRateOption[] = (json.products ?? [])
    .map((product) => {
      const priceEntry = product.totalPrice?.[0]
      const totalPrice = Number(priceEntry?.price ?? NaN)
      const currency = String(priceEntry?.priceCurrency ?? '').toUpperCase()
      const productCode = String(product.productCode ?? '').trim()
      if (!productCode || !Number.isFinite(totalPrice) || totalPrice < 0 || !currency) {
        return null
      }
      return {
        productCode,
        productName: String(product.productName ?? productCode),
        totalPrice,
        currency,
        totalPriceBase: convertDhlAmountToBase(totalPrice, currency),
        deliveryDate: product.deliveryCapabilities?.estimatedDeliveryDateAndTime,
      } satisfies DhlRateOption
    })
    .filter((option): option is DhlRateOption => option !== null)
    .sort((a, b) => a.totalPriceBase - b.totalPriceBase)

  if (options.length === 0) {
    throw new Error('No DHL Express rates available for this destination')
  }

  const preferred = input.productCode
    ? options.find((option) => option.productCode === input.productCode)
    : undefined

  return {
    options,
    selected: preferred ?? options[0]!,
    weightKg,
  }
}
