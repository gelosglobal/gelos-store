import { convertDhlAmountToBase } from '@/lib/dhl/config'
import { convertFromBase } from '@/lib/exchange-rates'
import type { CheckoutTotals } from '@/lib/checkout'
import type { DhlRateOption } from '@/lib/dhl/types'

type DhlApiPrice = {
  currencyType?: string
  priceCurrency?: string
  price?: number
}

export type DhlPriceLine = {
  amount: number
  currency: string
}

function roundMoney(amount: number): number {
  return Math.round(amount * 100) / 100
}

function asPriceLine(entry: DhlApiPrice | undefined): DhlPriceLine | undefined {
  if (!entry?.priceCurrency) return undefined
  const amount = Number(entry.price)
  if (!Number.isFinite(amount) || amount < 0) return undefined
  return {
    amount,
    currency: entry.priceCurrency.trim().toUpperCase(),
  }
}

/**
 * MyDHL returns BILLC (account billed), PULCL (pickup-country currency),
 * and BASEC (DHL base, often EUR). Never use list index 0 blindly.
 */
export function pickDhlPriceLines(totalPrice?: DhlApiPrice[]): {
  billed: DhlPriceLine
  local?: DhlPriceLine
} | undefined {
  const lines = totalPrice ?? []
  const byType = (type: string) =>
    asPriceLine(
      lines.find((entry) => entry.currencyType?.toUpperCase() === type),
    )
  const billed = byType('BILLC') ?? asPriceLine(lines[0])
  if (!billed) return undefined
  return {
    billed,
    local: byType('PULCL'),
  }
}

/** Catalog GHS: DHL's own GHS (PULCL) when present, otherwise FX from billed. */
export function dhlQuoteToBaseGhs(
  billed: DhlPriceLine,
  local?: DhlPriceLine,
): number {
  if (local?.currency === 'GHS') return roundMoney(local.amount)
  if (billed.currency === 'GHS') return roundMoney(billed.amount)
  return convertDhlAmountToBase(billed.amount, billed.currency)
}

/**
 * Charge / display DHL shipping in the shopper currency.
 * USD → billed USD. GHS → DHL PULCL GHS. Other currencies convert the billed amount.
 */
export function convertDhlQuoteToCurrency(
  quote: Pick<
    DhlRateOption,
    'totalPrice' | 'currency' | 'localPrice' | 'localCurrency' | 'totalPriceBase'
  >,
  targetCurrency: string,
): number {
  const target = targetCurrency.trim().toUpperCase()
  if (!target) return quote.totalPriceBase
  if (quote.currency.toUpperCase() === target) {
    return roundMoney(quote.totalPrice)
  }
  if (
    quote.localCurrency &&
    quote.localPrice != null &&
    quote.localCurrency.toUpperCase() === target
  ) {
    return roundMoney(quote.localPrice)
  }
  if (target === 'GHS') return roundMoney(quote.totalPriceBase)
  const billedAsGhs = convertDhlAmountToBase(quote.totalPrice, quote.currency)
  return convertFromBase(billedAsGhs, target)
}

/** Product totals use catalog FX. DHL shipping uses DHL billed/local prices. */
export function localizeCheckoutTotals(
  base: CheckoutTotals,
  currency: string,
  dhlQuote?: Pick<
    DhlRateOption,
    'totalPrice' | 'currency' | 'localPrice' | 'localCurrency' | 'totalPriceBase'
  > | null,
): CheckoutTotals {
  const subtotal = convertFromBase(base.subtotal, currency)
  const discount = convertFromBase(base.discount, currency)
  const shipping =
    dhlQuote && base.shipping > 0
      ? convertDhlQuoteToCurrency(dhlQuote, currency)
      : convertFromBase(base.shipping, currency)
  return {
    subtotal,
    discount,
    shipping,
    total: roundMoney(subtotal - discount + shipping),
  }
}
