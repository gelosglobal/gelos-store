/** Dispatched after admin saves a product so the storefront refetches catalog data. */
export const PRODUCTS_UPDATED_EVENT = 'gelos:products-updated'

export function notifyProductsUpdated() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(PRODUCTS_UPDATED_EVENT))
  }
}
