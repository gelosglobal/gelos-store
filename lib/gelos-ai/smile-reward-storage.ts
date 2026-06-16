import { findActivePromo } from '@/lib/store-promotions'
import type { PromoCode } from '@/lib/store-promotions'
import type { MysteryRewardCard } from '@/lib/gelos-ai/mystery-reward'

const FREE_SHIPPING_KEY = 'gelos-smile-reward-free-shipping'

export function hasSmileRewardFreeShipping(): boolean {
  if (typeof window === 'undefined') return false
  return sessionStorage.getItem(FREE_SHIPPING_KEY) === 'true'
}

export function clearSmileRewardFreeShipping(): void {
  if (typeof window === 'undefined') return
  sessionStorage.removeItem(FREE_SHIPPING_KEY)
}

export function applySmileReward(
  reward: MysteryRewardCard,
  promos: PromoCode[],
): {
  promoApplied?: string
  freeShippingApplied?: boolean
} {
  const result: {
    promoApplied?: string
    freeShippingApplied?: boolean
  } = {}

  if (reward.promoCode) {
    const promo = findActivePromo(reward.promoCode, promos)
    if (promo) {
      result.promoApplied = promo.code
    }
  }

  if (reward.type === 'free_shipping' && typeof window !== 'undefined') {
    sessionStorage.setItem(FREE_SHIPPING_KEY, 'true')
    result.freeShippingApplied = true
  }

  return result
}
