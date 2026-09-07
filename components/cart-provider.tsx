'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import type {
  AddItemsResult,
  AddToCartOptions,
  CartAddRequest,
  CartBundleAddRequest,
  CartEntry,
} from '@/lib/cart-types'
import {
  mergeCartAddRequests,
  mergeCartBundleAddRequest,
} from '@/lib/cart-merge-requests'
import {
  isCartBundleEntry,
  isCartBundleProductId,
} from '@/lib/cart-bundle'
import { getCartLineKey } from '@/lib/cart-line-key'
import { normalizeImageUrl } from '@/lib/image-url'
import {
  getCartDisplayName,
  getProductLineVariantLabel,
  isJunkVariantLabel,
} from '@/lib/variant-display'
import { useProducts } from '@/components/products-provider'
import { useLocation } from '@/components/location-provider'
import type { Product } from '@/lib/types/product'
import { convertForLocation } from '@/lib/exchange-rates'
import { trackAddToCart } from '@/lib/meta-pixel'
import { trackVisitorFunnelEvent } from '@/lib/visitor-funnel'

const CART_STORAGE_KEY = 'gelos-cart'

export type CartLineItem = {
  lineKey: string
  id: string
  productName: string
  name: string
  variantLabel?: string
  variantImage?: string
  price: number
  image: string
  quantity: number
  bundleId?: string
  bundleComponentCount?: number
  bundleComponents?: CartEntry['bundleComponents']
}

type AddItemsOptions = {
  silent?: boolean
}

type CartContextValue = {
  items: CartLineItem[]
  itemCount: number
  /** Quantities in localStorage, even before the catalog maps them to line items. */
  storedItemCount: number
  isHydrated: boolean
  addItem: (
    productId: string,
    quantity?: number,
    options?: AddToCartOptions,
  ) => AddItemsResult
  addItems: (
    requests: CartAddRequest[],
    options?: AddItemsOptions,
  ) => AddItemsResult
  addBundle: (
    request: CartBundleAddRequest,
    options?: AddItemsOptions,
  ) => AddItemsResult
  removeItem: (lineKey: string) => void
  setQuantity: (
    lineKey: string,
    quantity: number,
    options?: { unitPrice?: number },
  ) => void
  clearCart: () => void
}

const CartContext = createContext<CartContextValue | null>(null)

function isStoredCartEntry(entry: unknown): entry is CartEntry {
  if (typeof entry !== 'object' || entry === null) return false
  const value = entry as CartEntry
  if (typeof value.productId !== 'string' || typeof value.quantity !== 'number') {
    return false
  }
  if (value.quantity <= 0) return false
  if (value.bundleId) {
    return (
      typeof value.bundleId === 'string' &&
      Array.isArray(value.bundleComponents) &&
      value.bundleComponents.length > 0
    )
  }
  return !isCartBundleProductId(value.productId)
}

function loadStoredCart(): CartEntry[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed.filter(isStoredCartEntry)
  } catch {
    return []
  }
}

function saveCart(entries: CartEntry[]) {
  if (typeof window === 'undefined') return
  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(entries))
}

function entriesToLineItems(
  entries: CartEntry[],
  products: Product[],
): CartLineItem[] {
  const lines: CartLineItem[] = []

  for (const entry of entries) {
    if (isCartBundleEntry(entry)) {
      const name = entry.bundleName?.trim() || 'Bundle'
      const image = normalizeImageUrl(
        entry.bundleImage ||
          products.find((p) => p.id === entry.bundleComponents?.[0]?.productId)
            ?.image ||
          '/gelos/watermelon2.jpeg',
      )
      const componentCount = entry.bundleComponents?.length ?? 0
      lines.push({
        lineKey: getCartLineKey(entry),
        id: entry.productId,
        productName: name,
        name,
        variantLabel:
          componentCount > 0
            ? `Bundle · ${componentCount} item${componentCount === 1 ? '' : 's'}`
            : 'Bundle',
        price: entry.unitPrice ?? 0,
        image,
        quantity: entry.quantity,
        bundleId: entry.bundleId,
        bundleComponentCount: componentCount,
        bundleComponents: entry.bundleComponents,
      })
      continue
    }

    const product = products.find((p) => p.id === entry.productId)
    if (!product) continue

    const rawVariantLabel =
      entry.variantLabel?.trim() || getProductLineVariantLabel(product)
    const variantLabel =
      rawVariantLabel && !isJunkVariantLabel(rawVariantLabel)
        ? rawVariantLabel
        : undefined
    const image = entry.variantImage
      ? normalizeImageUrl(entry.variantImage)
      : normalizeImageUrl(product.image)

    lines.push({
      lineKey: getCartLineKey(entry),
      id: product.id,
      productName: product.name,
      name: getCartDisplayName(product.name, variantLabel),
      variantLabel,
      variantImage: entry.variantImage,
      price: entry.unitPrice ?? product.price,
      image,
      quantity: entry.quantity,
    })
  }

  return lines
}

export function CartProvider({ children }: { children: ReactNode }) {
  const router = useRouter()
  const { getProductById, products } = useProducts()
  const { location, locationId } = useLocation()
  const [entries, setEntries] = useState<CartEntry[]>([])
  const [isHydrated, setIsHydrated] = useState(false)
  const entriesRef = useRef<CartEntry[]>([])

  useEffect(() => {
    const stored = loadStoredCart()
    setEntries(stored)
    entriesRef.current = stored
    setIsHydrated(true)
  }, [])

  useEffect(() => {
    entriesRef.current = entries
    if (isHydrated) saveCart(entries)
  }, [entries, isHydrated])

  const items = useMemo(
    () => entriesToLineItems(entries, products),
    [entries, products],
  )

  const itemCount = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity, 0),
    [items],
  )
  const storedItemCount = useMemo(
    () => entries.reduce((sum, entry) => sum + entry.quantity, 0),
    [entries],
  )

  const addItems = useCallback(
    (
      requests: CartAddRequest[],
      options?: AddItemsOptions,
    ): AddItemsResult => {
      if (requests.length === 0) {
        return { added: 0, skipped: 0 }
      }

      const result = mergeCartAddRequests(
        entriesRef.current,
        requests,
        getProductById,
      )

      entriesRef.current = result.entries
      setEntries(result.entries)

      for (const event of result.trackEvents) {
        trackAddToCart({
          ...event,
          price: convertForLocation(event.price, locationId, location.currencyCode),
          currency: location.currencyCode,
        })
      }

      if (result.added === 0) {
        if (!options?.silent) {
          toast.error('Could not add items to your cart.')
        }
        return { added: result.added, skipped: result.skipped }
      }

      trackVisitorFunnelEvent('add_to_cart')

      if (!options?.silent) {
        if (result.added === 1) {
          toast.success('Added to cart', {
            description: result.addedNames[0],
          })
        } else {
          toast.success(`Added ${result.added} items to your cart`)
        }
        router.push('/cart')
      }

      if (result.skipped > 0 && !options?.silent) {
        toast.error(
          `${result.skipped} item${result.skipped === 1 ? '' : 's'} could not be added (out of stock or unavailable).`,
        )
      }

      return { added: result.added, skipped: result.skipped }
    },
    [getProductById, location.currencyCode, locationId, router],
  )

  const addItem = useCallback(
    (
      productId: string,
      quantity = 1,
      options?: AddToCartOptions,
    ): AddItemsResult =>
      addItems([{ productId, quantity, options }]),
    [addItems],
  )

  const addBundle = useCallback(
    (
      request: CartBundleAddRequest,
      options?: AddItemsOptions,
    ): AddItemsResult => {
      const result = mergeCartBundleAddRequest(
        entriesRef.current,
        request,
        getProductById,
      )

      entriesRef.current = result.entries
      setEntries(result.entries)

      for (const event of result.trackEvents) {
        trackAddToCart({
          ...event,
          price: convertForLocation(
            event.price,
            locationId,
            location.currencyCode,
          ),
          currency: location.currencyCode,
        })
      }

      if (result.added === 0) {
        if (!options?.silent) {
          toast.error('Could not add this bundle to your cart.')
        }
        return { added: result.added, skipped: result.skipped }
      }

      trackVisitorFunnelEvent('add_to_cart')

      if (!options?.silent) {
        toast.success('Added to cart', {
          description: result.addedNames[0],
        })
        router.push('/cart')
      }

      return { added: result.added, skipped: result.skipped }
    },
    [getProductById, location.currencyCode, locationId, router],
  )

  const removeItem = useCallback((lineKey: string) => {
    setEntries((prev) => {
      const next = prev.filter((e) => getCartLineKey(e) !== lineKey)
      entriesRef.current = next
      return next
    })
  }, [])

  const setQuantity = useCallback(
    (
      lineKey: string,
      quantity: number,
      options?: { unitPrice?: number },
    ) => {
      if (quantity < 1) return
      setEntries((prev) => {
        const next = prev.map((e) => {
          if (getCartLineKey(e) !== lineKey) return e
          const updated: CartEntry = { ...e, quantity }
          if (options?.unitPrice !== undefined && options.unitPrice >= 0) {
            updated.unitPrice = options.unitPrice
          }
          return updated
        })
        entriesRef.current = next
        return next
      })
    },
    [],
  )

  const clearCart = useCallback(() => {
    entriesRef.current = []
    setEntries([])
  }, [])

  const value = useMemo(
    () => ({
      items,
      itemCount,
      storedItemCount,
      isHydrated,
      addItem,
      addItems,
      addBundle,
      removeItem,
      setQuantity,
      clearCart,
    }),
    [
      items,
      itemCount,
      storedItemCount,
      isHydrated,
      addItem,
      addItems,
      addBundle,
      removeItem,
      setQuantity,
      clearCart,
    ],
  )

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}
