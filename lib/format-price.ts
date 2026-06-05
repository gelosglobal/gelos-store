import { convertFromBase } from '@/lib/exchange-rates'
import type { Location } from '@/lib/locations'

export function formatPrice(
  amount: number,
  location?: Pick<Location, 'currency' | 'currencyCode'>,
) {
  const symbol = location?.currency ?? 'GH₵'
  const localized = location?.currencyCode
    ? convertFromBase(amount, location.currencyCode)
    : amount
  return `${symbol}${localized.toFixed(2)}`
}
