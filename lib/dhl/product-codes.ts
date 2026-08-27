import type { DhlShipmentProfile } from '@/lib/dhl/types'

type AccountLookup = {
  exportAccount: string
  importAccount: string
  accountCountryCode: string
}

/**
 * DHL NG product / account table:
 * N = same-country, D = international documents, P = international packages.
 * Gelos ships retail products, so international moves use P unless a document
 * product code is explicitly requested.
 */
export function resolveDhlShipmentProfile(
  originCountryCode: string,
  destinationCountryCode: string,
  accounts: AccountLookup,
  preferredProductCode?: string,
): DhlShipmentProfile {
  const origin = originCountryCode.trim().toUpperCase()
  const destination = destinationCountryCode.trim().toUpperCase()
  const accountCountry = accounts.accountCountryCode.trim().toUpperCase()
  const isDomestic = origin === destination
  const billedAsExport = origin === accountCountry

  let productCode: DhlShipmentProfile['productCode'] = isDomestic ? 'N' : 'P'
  const preferred = preferredProductCode?.trim().toUpperCase()
  if (!isDomestic && (preferred === 'P' || preferred === 'D')) {
    productCode = preferred
  }

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
