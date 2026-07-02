import type { AddToCartOptions, CartAddRequest, CartEntry } from '@/lib/cart-types'
import { getCartLineKey } from '@/lib/cart-line-key'
import {
  getAvailableStockForVariant,
  hasAdminVariantPicker,
} from '@/lib/product-variant-images'
import { getDefaultBundleVariantImage } from '@/lib/bundle-variant-selection'
import {
  getCartDisplayName,
  getProductLineVariantLabel,
  getVariantSelectionForCart,
} from '@/lib/variant-display'
import type { Product } from '@/lib/types/product'

export type CartMergeResult = {
  entries: CartEntry[]
  added: number
  skipped: number
  addedNames: string[]
  trackEvents: Array<{
    id: string
    name: string
    price: number
    quantity: number
  }>
}

function buildCartEntry(
  product: Product,
  quantity: number,
  options?: AddToCartOptions,
): CartEntry {
  const variantImage = options?.variantImage?.trim() || undefined
  const variantLabel =
    options?.variantLabel?.trim() ||
    (variantImage ? undefined : getProductLineVariantLabel(product))
  const unitPrice =
    options?.unitPrice !== undefined && options.unitPrice >= 0
      ? options.unitPrice
      : undefined

  return {
    productId: product.id,
    quantity,
    variantImage,
    variantLabel,
    unitPrice,
  }
}

/** Build cart options for a bundle line, optionally with a chosen flavour/style. */
export function getBundleAddToCartOptions(
  product: Product,
  unitPrice?: number,
  variantImageUrl?: string,
): AddToCartOptions | undefined {
  const base: AddToCartOptions = {}

  if (unitPrice !== undefined && unitPrice >= 0) {
    base.unitPrice = unitPrice
  }

  if (!hasAdminVariantPicker(product)) {
    return Object.keys(base).length > 0 ? base : undefined
  }

  const imageUrl = variantImageUrl ?? getDefaultBundleVariantImage(product)

  return {
    ...getVariantSelectionForCart(product, imageUrl),
    ...base,
  }
}

export function mergeCartAddRequests(
  prev: CartEntry[],
  requests: CartAddRequest[],
  getProductById: (id: string) => Product | undefined,
): CartMergeResult {
  const working = [...prev]
  let added = 0
  let skipped = 0
  const addedNames: string[] = []
  const trackEvents: CartMergeResult['trackEvents'] = []

  for (const request of requests) {
    const product = getProductById(request.productId)
    if (!product) {
      skipped += 1
      continue
    }

    const quantity = request.quantity ?? 1
    const entry = buildCartEntry(product, quantity, request.options)
    const lineKey = getCartLineKey(entry)
    const existingIndex = working.findIndex(
      (item) => getCartLineKey(item) === lineKey,
    )
    const existingQty = existingIndex >= 0 ? working[existingIndex]!.quantity : 0
    const availableStock = getAvailableStockForVariant(
      product,
      entry.variantImage,
    )

    if (existingQty + quantity > availableStock) {
      skipped += 1
      continue
    }

    if (existingIndex >= 0) {
      working[existingIndex] = {
        ...working[existingIndex]!,
        quantity: working[existingIndex]!.quantity + quantity,
      }
    } else {
      working.push(entry)
    }

    added += 1
    const displayName = getCartDisplayName(product.name, entry.variantLabel)
    addedNames.push(displayName)
    trackEvents.push({
      id: product.id,
      name: displayName,
      price: entry.unitPrice ?? product.price,
      quantity,
    })
  }

  return { entries: working, added, skipped, addedNames, trackEvents }
}
