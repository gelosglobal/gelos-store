/** ISO 3166-1 alpha-2 → display name + ISO 4217 currency. */

export type CountryCurrency = {
  code: string
  name: string
  currencyCode: string
  currencySymbol: string
  flag: string
}

const EUR = 'EUR'

/** EU + other euro-using countries we ship to. */
const EURO_COUNTRIES = [
  'AT',
  'BE',
  'CY',
  'DE',
  'EE',
  'ES',
  'FI',
  'FR',
  'GR',
  'HR',
  'IE',
  'IT',
  'LT',
  'LU',
  'LV',
  'MT',
  'NL',
  'PT',
  'SI',
  'SK',
  'AD',
  'MC',
  'SM',
  'VA',
  'ME',
] as const

const COUNTRY_NAMES: Record<string, string> = {
  AD: 'Andorra',
  AE: 'United Arab Emirates',
  AT: 'Austria',
  AU: 'Australia',
  BE: 'Belgium',
  BF: 'Burkina Faso',
  BJ: 'Benin',
  BR: 'Brazil',
  BW: 'Botswana',
  CA: 'Canada',
  CH: 'Switzerland',
  CI: "Côte d'Ivoire",
  CL: 'Chile',
  CM: 'Cameroon',
  CN: 'China',
  CY: 'Cyprus',
  CZ: 'Czechia',
  DE: 'Germany',
  DK: 'Denmark',
  EG: 'Egypt',
  ES: 'Spain',
  ET: 'Ethiopia',
  FI: 'Finland',
  FR: 'France',
  GB: 'United Kingdom',
  GH: 'Ghana',
  GM: 'Gambia',
  GR: 'Greece',
  HK: 'Hong Kong',
  HR: 'Croatia',
  HU: 'Hungary',
  IE: 'Ireland',
  IL: 'Israel',
  IN: 'India',
  IT: 'Italy',
  JM: 'Jamaica',
  JP: 'Japan',
  KE: 'Kenya',
  KR: 'South Korea',
  KW: 'Kuwait',
  LR: 'Liberia',
  LT: 'Lithuania',
  LU: 'Luxembourg',
  LV: 'Latvia',
  MA: 'Morocco',
  MC: 'Monaco',
  ME: 'Montenegro',
  MT: 'Malta',
  MU: 'Mauritius',
  MW: 'Malawi',
  MX: 'Mexico',
  MY: 'Malaysia',
  NA: 'Namibia',
  NG: 'Nigeria',
  NL: 'Netherlands',
  NO: 'Norway',
  NZ: 'New Zealand',
  OM: 'Oman',
  PH: 'Philippines',
  PK: 'Pakistan',
  PL: 'Poland',
  PT: 'Portugal',
  QA: 'Qatar',
  RO: 'Romania',
  RW: 'Rwanda',
  SA: 'Saudi Arabia',
  SE: 'Sweden',
  SG: 'Singapore',
  SI: 'Slovenia',
  SK: 'Slovakia',
  SL: 'Sierra Leone',
  SM: 'San Marino',
  SN: 'Senegal',
  TG: 'Togo',
  TH: 'Thailand',
  TN: 'Tunisia',
  TR: 'Türkiye',
  TZ: 'Tanzania',
  UG: 'Uganda',
  US: 'United States',
  VA: 'Vatican City',
  ZA: 'South Africa',
  ZM: 'Zambia',
  ZW: 'Zimbabwe',
}

const COUNTRY_CURRENCY: Record<string, string> = {
  AE: 'AED',
  AU: 'AUD',
  BF: 'XOF',
  BJ: 'XOF',
  BR: 'BRL',
  BW: 'BWP',
  CA: 'CAD',
  CH: 'CHF',
  CI: 'XOF',
  CL: 'CLP',
  CM: 'XAF',
  CN: 'CNY',
  CZ: 'CZK',
  DK: 'DKK',
  EG: 'EGP',
  ET: 'ETB',
  GB: 'GBP',
  GH: 'GHS',
  GM: 'GMD',
  HK: 'HKD',
  HU: 'HUF',
  IL: 'ILS',
  IN: 'INR',
  JM: 'JMD',
  JP: 'JPY',
  KE: 'KES',
  KR: 'KRW',
  KW: 'KWD',
  LR: 'LRD',
  MA: 'MAD',
  MU: 'MUR',
  MW: 'MWK',
  MX: 'MXN',
  MY: 'MYR',
  NA: 'NAD',
  NG: 'NGN',
  NO: 'NOK',
  NZ: 'NZD',
  OM: 'OMR',
  PH: 'PHP',
  PK: 'PKR',
  PL: 'PLN',
  QA: 'QAR',
  RO: 'RON',
  RW: 'RWF',
  SA: 'SAR',
  SE: 'SEK',
  SG: 'SGD',
  SL: 'SLE',
  SN: 'XOF',
  TG: 'XOF',
  TH: 'THB',
  TN: 'TND',
  TR: 'TRY',
  TZ: 'TZS',
  UG: 'UGX',
  US: 'USD',
  ZA: 'ZAR',
  ZM: 'ZMW',
  ZW: 'USD',
}

const CURRENCY_SYMBOLS: Record<string, string> = {
  AED: 'AED',
  AUD: 'A$',
  BRL: 'R$',
  BWP: 'P',
  CAD: 'CA$',
  CHF: 'CHF',
  CLP: 'CLP',
  CNY: '¥',
  CZK: 'Kč',
  DKK: 'kr',
  EGP: 'E£',
  ETB: 'Br',
  EUR: '€',
  GBP: '£',
  GHS: 'GH₵',
  GMD: 'D',
  HKD: 'HK$',
  HUF: 'Ft',
  ILS: '₪',
  INR: '₹',
  JMD: 'J$',
  JPY: '¥',
  KES: 'KSh',
  KRW: '₩',
  KWD: 'KD',
  LRD: 'L$',
  MAD: 'MAD',
  MUR: '₨',
  MWK: 'MK',
  MXN: 'MX$',
  MYR: 'RM',
  NAD: 'N$',
  NGN: '₦',
  NOK: 'kr',
  NZD: 'NZ$',
  OMR: 'OMR',
  PHP: '₱',
  PKR: '₨',
  PLN: 'zł',
  QAR: 'QR',
  RON: 'lei',
  RWF: 'FRw',
  SAR: 'SAR',
  SEK: 'kr',
  SGD: 'S$',
  SLE: 'Le',
  THB: '฿',
  TND: 'DT',
  TRY: '₺',
  TZS: 'TSh',
  UGX: 'USh',
  USD: '$',
  XAF: 'FCFA',
  XOF: 'CFA',
  ZAR: 'R',
  ZMW: 'ZK',
}

for (const code of EURO_COUNTRIES) {
  COUNTRY_CURRENCY[code] = EUR
}

export function countryFlagEmoji(countryCode: string): string {
  const code = countryCode.trim().toUpperCase()
  if (!/^[A-Z]{2}$/.test(code)) return '🌍'
  return String.fromCodePoint(
    ...[...code].map((char) => 0x1f1e6 + char.charCodeAt(0) - 65),
  )
}

export function currencySymbol(currencyCode: string): string {
  const code = currencyCode.trim().toUpperCase()
  return CURRENCY_SYMBOLS[code] ?? `${code} `
}

export function normalizeCountryCode(
  value: string | null | undefined,
): string | undefined {
  const code = value?.trim().toUpperCase()
  if (!code) return undefined
  if (code === 'UK') return 'GB'
  if (/^[A-Z]{2}$/.test(code)) return code
  return undefined
}

export function currencyForCountry(
  countryCode: string | null | undefined,
): string {
  const code = normalizeCountryCode(countryCode)
  if (!code) return 'USD'
  return COUNTRY_CURRENCY[code] ?? 'USD'
}

export function countryName(
  countryCode: string | null | undefined,
): string | undefined {
  const code = normalizeCountryCode(countryCode)
  if (!code) return undefined
  return COUNTRY_NAMES[code]
}

export function getCountryCurrency(
  countryCode: string | null | undefined,
): CountryCurrency | undefined {
  const code = normalizeCountryCode(countryCode)
  if (!code) return undefined
  const currencyCode = COUNTRY_CURRENCY[code] ?? 'USD'
  return {
    code,
    name: COUNTRY_NAMES[code] ?? code,
    currencyCode,
    currencySymbol: currencySymbol(currencyCode),
    flag: countryFlagEmoji(code),
  }
}

export function listShipToCountries(): CountryCurrency[] {
  return Object.keys(COUNTRY_NAMES)
    .map((code) => getCountryCurrency(code)!)
    .sort((a, b) => a.name.localeCompare(b.name))
}
