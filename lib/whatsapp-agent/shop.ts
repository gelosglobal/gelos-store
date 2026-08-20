import type { WaShopConfig } from '@/lib/whatsapp-agent/types'
import shopJson from '@/lib/whatsapp-agent/data/shop.json'

export function loadWhatsappShop(
  shop: WaShopConfig = shopJson as WaShopConfig,
): WaShopConfig {
  if (!shop.business_name) {
    throw new Error('shop.json requires business_name.')
  }
  if (!Array.isArray(shop.delivery_zones)) shop.delivery_zones = []
  if (!Array.isArray(shop.payment_methods)) shop.payment_methods = []
  if (!Array.isArray(shop.faqs)) shop.faqs = []
  return shop
}

let shopSingleton: WaShopConfig | null = null

export function getWhatsappShop() {
  if (!shopSingleton) shopSingleton = loadWhatsappShop()
  return shopSingleton
}
