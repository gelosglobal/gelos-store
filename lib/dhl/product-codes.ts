import type { DhlShipmentProfile } from '@/lib/dhl/types'

type AccountLookup = {
  exportAccount: string
  importAccount: string
  accountCountryCode: string
}

/**
 * DHL NG product / account table:
 * N = same-country, D = international documents, P = international packages.
 * Gelos ships retail products, so USA / International always quote and ship P.
 */
export function resolveDhlShipmentProfile(
  originCountryCode: string,
  destinationCountryCode: string,
  accounts: AccountLookup,
  _preferredProductCode?: string,
): DhlShipmentProfile {
  const origin = originCountryCode.trim().toUpperCase()
  const destination = destinationCountryCode.trim().toUpperCase()
  const accountCountry = accounts.accountCountryCode.trim().toUpperCase()
  const isDomestic = origin === destination
  const billedAsExport = origin === accountCountry

  const productCode: DhlShipmentProfile['productCode'] = isDomestic ? 'N' : 'P'

  return {
    productCode,
    isCustomsDeclarable: !isDomestic && productCode === 'P',
    accountNumber: billedAsExport
      ? accounts.exportAccount
      : accounts.importAccount,
    accountType: billedAsExport ? 'EXP' : 'IMP',
    payerCountryCode:
      billedAsExport || isDomestic ? undefined : origin || accountCountry,
  }
}
