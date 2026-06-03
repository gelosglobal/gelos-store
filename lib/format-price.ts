import type { Location } from '@/lib/locations'

export function formatPrice(
  amount: number,
  location?: Pick<Location, 'currency'>,
) {
  const symbol = location?.currency ?? 'GH₵'
  return `${symbol}${amount.toFixed(2)}`
}
