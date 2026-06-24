export function formatOrderDateLabel(date: Date): string {
  const now = new Date()
  const startOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  )
  const startOfOrderDay = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
  )
  const diffDays = Math.round(
    (startOfToday.getTime() - startOfOrderDay.getTime()) / 86_400_000,
  )

  const time = date
    .toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })
    .toLowerCase()

  if (diffDays === 0) return `Today at ${time}`
  if (diffDays === 1) return `Yesterday at ${time}`

  const day = date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
  })
  return `${day} at ${time}`
}

export function formatOrderFullDate(date: Date): string {
  return date.toLocaleString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
}

export function formatConversionDate(date: Date): string {
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export function formatPackingSlipDate(date: Date): string {
  return formatConversionDate(date)
}

const CURRENCY_SYMBOLS: Record<string, string> = {
  GHS: 'GH₵',
  NGN: '₦',
  USD: '$',
}

export function formatOrderTotal(currency: string, total: number): string {
  const code = currency.toUpperCase()
  const symbol = CURRENCY_SYMBOLS[code] ?? `${code} `
  return `${symbol}${total.toFixed(2)}`
}

export function isOrderToday(dateIso: string): boolean {
  const date = new Date(dateIso)
  const now = new Date()
  return (
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear()
  )
}
