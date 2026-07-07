export const AFFILIATE_PAYOUT_METHODS = ['mobile_money', 'bank_transfer'] as const

export type AffiliatePayoutMethod = (typeof AFFILIATE_PAYOUT_METHODS)[number]

export const MOBILE_MONEY_PROVIDERS = [
  'MTN Mobile Money',
  'Vodafone Cash',
  'AirtelTigo Money',
] as const

export const BANK_PROVIDERS = [
  'GCB Bank',
  'Ecobank',
  'Stanbic Bank',
  'Fidelity Bank',
  'Absa Bank',
  'Zenith Bank',
  'CalBank',
  'Access Bank',
  'Other',
] as const

export type AffiliatePayoutSettings = {
  payoutMethod: AffiliatePayoutMethod | ''
  payoutAccountName: string
  payoutAccountNumber: string
  payoutProvider: string
}

export function isAffiliatePayoutMethod(
  value: string,
): value is AffiliatePayoutMethod {
  return (AFFILIATE_PAYOUT_METHODS as readonly string[]).includes(value)
}

export function isAffiliatePayoutConfigured(
  settings: AffiliatePayoutSettings,
): boolean {
  return Boolean(
    settings.payoutMethod &&
      settings.payoutAccountName.trim() &&
      settings.payoutAccountNumber.trim() &&
      settings.payoutProvider.trim(),
  )
}

export function getAffiliatePayoutMethodLabel(method: string): string {
  if (method === 'mobile_money') return 'Mobile money'
  if (method === 'bank_transfer') return 'Bank transfer'
  return 'Not set'
}

export function validateAffiliatePayoutInput(
  input: AffiliatePayoutSettings,
): string | null {
  if (!input.payoutMethod) {
    return 'Choose a payout method.'
  }
  if (!isAffiliatePayoutMethod(input.payoutMethod)) {
    return 'Invalid payout method.'
  }
  if (!input.payoutAccountName.trim()) {
    return 'Enter the account holder name.'
  }
  if (!input.payoutProvider.trim()) {
    return 'Choose a provider.'
  }
  if (!input.payoutAccountNumber.trim()) {
    return input.payoutMethod === 'mobile_money'
      ? 'Enter your mobile money number.'
      : 'Enter your bank account number.'
  }
  if (
    input.payoutMethod === 'mobile_money' &&
    !/^\d{9,15}$/.test(input.payoutAccountNumber.replace(/\s+/g, ''))
  ) {
    return 'Enter a valid mobile money number.'
  }
  return null
}

export function normalizeAffiliatePayoutInput(
  input: AffiliatePayoutSettings,
): AffiliatePayoutSettings {
  return {
    payoutMethod: isAffiliatePayoutMethod(input.payoutMethod)
      ? input.payoutMethod
      : '',
    payoutAccountName: input.payoutAccountName.trim(),
    payoutAccountNumber: input.payoutAccountNumber.replace(/\s+/g, '').trim(),
    payoutProvider: input.payoutProvider.trim(),
  }
}
