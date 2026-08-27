import { convertFromBase, BASE_CURRENCY } from '@/lib/exchange-rates'

export function isDhlConfigured(): boolean {
  return Boolean(
    process.env.DHL_API_KEY?.trim() &&
      process.env.DHL_API_SECRET?.trim() &&
      (process.env.DHL_EXPORT_ACCOUNT?.trim() ||
        process.env.DHL_ACCOUNT_NUMBER?.trim()) &&
      process.env.DHL_SHIPPER_COUNTRY_CODE?.trim() &&
      process.env.DHL_SHIPPER_CITY?.trim(),
  )
}

export function isDhlShippingConfigured(): boolean {
  if (!isDhlConfigured()) return false
  return Boolean(
    process.env.DHL_SHIPPER_ADDRESS_LINE1?.trim() &&
      process.env.DHL_SHIPPER_NAME?.trim() &&
      process.env.DHL_SHIPPER_PHONE?.trim(),
  )
}

export function getDhlConfig() {
  const apiKey = process.env.DHL_API_KEY?.trim()
  const apiSecret = process.env.DHL_API_SECRET?.trim()
  const exportAccount =
    process.env.DHL_EXPORT_ACCOUNT?.trim() ||
    process.env.DHL_ACCOUNT_NUMBER?.trim()
  const importAccount =
    process.env.DHL_IMPORT_ACCOUNT?.trim() || exportAccount
  const shipperCountryCode = process.env.DHL_SHIPPER_COUNTRY_CODE?.trim()
  const shipperCity = process.env.DHL_SHIPPER_CITY?.trim()
  const shipperPostalCode = process.env.DHL_SHIPPER_POSTAL_CODE?.trim() || ''
  const env =
    process.env.DHL_ENV?.trim().toLowerCase() === 'production'
      ? 'production'
      : 'test'

  if (
    !apiKey ||
    !apiSecret ||
    !exportAccount ||
    !importAccount ||
    !shipperCountryCode ||
    !shipperCity
  ) {
    throw new Error('DHL Express is not fully configured')
  }

  const baseUrl =
    env === 'production'
      ? 'https://express.api.dhl.com/mydhlapi'
      : 'https://express.api.dhl.com/mydhlapi/test'

  const shipperName = process.env.DHL_SHIPPER_NAME?.trim() || 'Gelos'
  const shipperCompany =
    process.env.DHL_SHIPPER_COMPANY?.trim() || shipperName
  const shipperEmail =
    process.env.DHL_SHIPPER_EMAIL?.trim() || 'hello@gelosglobal.com'
  const shipperPhone = process.env.DHL_SHIPPER_PHONE?.trim() || ''
  const shipperAddressLine1 =
    process.env.DHL_SHIPPER_ADDRESS_LINE1?.trim() || ''
  const shipperCounty =
    process.env.DHL_SHIPPER_COUNTY?.trim() ||
    (shipperCountryCode.toUpperCase() === 'GH' ? 'Greater Accra' : '')

  return {
    apiKey,
    apiSecret,
    accountNumber: exportAccount,
    exportAccount,
    importAccount,
    shipperCountryCode: shipperCountryCode.toUpperCase(),
    shipperCity,
    shipperPostalCode,
    shipperCounty,
    shipperName,
    shipperCompany,
    shipperEmail,
    shipperPhone,
    shipperAddressLine1,
    accountCurrency: (
      process.env.DHL_ACCOUNT_CURRENCY?.trim() || BASE_CURRENCY
    ).toUpperCase(),
    env,
    baseUrl,
    defaultWeightKg: Math.max(
      0.1,
      Number(process.env.DHL_DEFAULT_WEIGHT_KG ?? 0.5) || 0.5,
    ),
    weightPerItemKg: Math.max(
      0.05,
      Number(process.env.DHL_WEIGHT_PER_ITEM_KG ?? 0.35) || 0.35,
    ),
    lengthCm: Math.max(1, Number(process.env.DHL_DEFAULT_LENGTH_CM ?? 25) || 25),
    widthCm: Math.max(1, Number(process.env.DHL_DEFAULT_WIDTH_CM ?? 20) || 20),
    heightCm: Math.max(1, Number(process.env.DHL_DEFAULT_HEIGHT_CM ?? 10) || 10),
  }
}

export type DhlConfig = ReturnType<typeof getDhlConfig>

export function dhlAuthHeader(apiKey: string, apiSecret: string): string {
  const token = Buffer.from(`${apiKey}:${apiSecret}`).toString('base64')
  return `Basic ${token}`
}

/** Convert a DHL quoted amount into catalog base currency (GHS). */
export function convertDhlAmountToBase(
  amount: number,
  currencyCode: string,
): number {
  const currency = currencyCode.toUpperCase()
  if (currency === BASE_CURRENCY) return Math.round(amount * 100) / 100

  const oneGhsInTarget = convertFromBase(1, currency)
  if (!oneGhsInTarget || oneGhsInTarget <= 0) {
    return Math.round(amount * 100) / 100
  }
  return Math.round((amount / oneGhsInTarget) * 100) / 100
}

export function estimateShipmentWeightKg(
  itemCount: number,
  weightPerItemKg: number,
  defaultWeightKg: number,
): number {
  const estimated = itemCount * weightPerItemKg
  return Math.max(defaultWeightKg, Math.round(estimated * 100) / 100)
}

export function nextShippingDateIso(): string {
  const date = new Date()
  const day = date.getDay()
  if (day === 6) date.setDate(date.getDate() + 2)
  if (day === 0) date.setDate(date.getDate() + 1)
  return date.toISOString().slice(0, 10)
}
