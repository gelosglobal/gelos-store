export type PromoCode = {
  id: string
  code: string
  discountPercent: number
  enabled: boolean
  label: string
}

export type StorePromotions = {
  freeShippingEnabled: boolean
  freeShippingThreshold: number
  shippingFee: number
  freeShippingRewardLabel: string
  freeShippingProgressLabel: string
  freeShippingUnlockedLabel: string
  promos: PromoCode[]
}

export const DEFAULT_STORE_PROMOTIONS: StorePromotions = {
  freeShippingEnabled: true,
  freeShippingThreshold: 200,
  shippingFee: 15,
  freeShippingRewardLabel: 'free shipping',
  freeShippingProgressLabel: '{{amount}} away from free shipping',
  freeShippingUnlockedLabel: "You've unlocked free shipping on this order.",
  promos: [
    {
      id: 'welcome',
      code: 'WELCOME',
      discountPercent: 15,
      enabled: true,
      label: '15% off',
    },
    {
      id: 'gelos15',
      code: 'GELOS15',
      discountPercent: 15,
      enabled: true,
      label: '15% off',
    },
    {
      id: 'smile20',
      code: 'SMILE20',
      discountPercent: 20,
      enabled: true,
      label: '20% off — smile scan',
    },
  ],
}

/** @deprecated Use store promotions from API */
export const FREE_SHIPPING_THRESHOLD = DEFAULT_STORE_PROMOTIONS.freeShippingThreshold

/** @deprecated Use store promotions from API */
export const SHIPPING_FEE = DEFAULT_STORE_PROMOTIONS.shippingFee

export function normalizePromoCode(code: string): string {
  return code.trim().toUpperCase()
}

export function findActivePromo(
  code: string | undefined,
  promos: PromoCode[],
): PromoCode | undefined {
  if (!code?.trim()) return undefined
  const normalized = normalizePromoCode(code)
  return promos.find(
    (promo) => promo.enabled && normalizePromoCode(promo.code) === normalized,
  )
}

export function calculatePromoDiscount(
  subtotal: number,
  promoCode: string | undefined,
  promos: PromoCode[],
): number {
  const promo = findActivePromo(promoCode, promos)
  if (!promo || promo.discountPercent <= 0) return 0
  return subtotal * (promo.discountPercent / 100)
}

export function interpolatePromoLabel(
  template: string,
  vars: { amount?: string; threshold?: string },
): string {
  return template
    .replace(/\{\{amount\}\}/g, vars.amount ?? '')
    .replace(/\{\{threshold\}\}/g, vars.threshold ?? '')
}

export function sanitizeStorePromotions(
  input: Partial<StorePromotions>,
): StorePromotions {
  const defaults = DEFAULT_STORE_PROMOTIONS

  const promos = Array.isArray(input.promos)
    ? input.promos
        .map((promo) => ({
          id: promo.id?.trim() || crypto.randomUUID(),
          code: normalizePromoCode(promo.code ?? ''),
          discountPercent: Math.min(
            100,
            Math.max(0, Number(promo.discountPercent) || 0),
          ),
          enabled: Boolean(promo.enabled),
          label: promo.label?.trim() || 'Discount',
        }))
        .filter((promo) => promo.code.length > 0)
    : defaults.promos

  return {
    freeShippingEnabled:
      input.freeShippingEnabled ?? defaults.freeShippingEnabled,
    freeShippingThreshold: Math.max(
      0,
      Number(input.freeShippingThreshold) ?? defaults.freeShippingThreshold,
    ),
    shippingFee: Math.max(0, Number(input.shippingFee) ?? defaults.shippingFee),
    freeShippingRewardLabel:
      input.freeShippingRewardLabel?.trim() || defaults.freeShippingRewardLabel,
    freeShippingProgressLabel:
      input.freeShippingProgressLabel?.trim() ||
      defaults.freeShippingProgressLabel,
    freeShippingUnlockedLabel:
      input.freeShippingUnlockedLabel?.trim() ||
      defaults.freeShippingUnlockedLabel,
    promos,
  }
}
