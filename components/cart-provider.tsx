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
  CartEntry,
} from '@/lib/cart-types'
import { mergeCartAddRequests } from '@/lib/cart-merge-requests'
import { getCartLineKey } from '@/lib/cart-line-key'
import { normalizeImageUrl } from '@/lib/image-url'
import {
  getCartDisplayName,
  getProductLineVariantLabel,
} from '@/lib/variant-display'
import { useProducts } from '@/components/products-provider'
import type { Product } from '@/lib/types/product'
import { trackAddToCart } from '@/lib/meta-pixel'

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
}

type AddItemsOptions = {
  silent?: boolean
}

type CartContextValue = {
  items: CartLineItem[]
  itemCount: number
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
  removeItem: (lineKey: string) => void
  setQuantity: (lineKey: string, quantity: number) => void
  clearCart: () => void
}

const CartContext = createContext<CartContextValue | null>(null)

function loadStoredCart(): CartEntry[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed.filter(
      (entry): entry is CartEntry =>
        typeof entry === 'object' &&
        entry !== null &&
        typeof (entry as CartEntry).productId === 'string' &&
        typeof (entry as CartEntry).quantity === 'number' &&
        (entry as CartEntry).quantity > 0,
    )
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
  return entries
    .map((entry) => {
      const product = products.find((p) => p.id === entry.productId)
      if (!product) return null

      const variantLabel =
        entry.variantLabel?.trim() || getProductLineVariantLabel(product)
      const image = entry.variantImage
        ? normalizeImageUrl(entry.variantImage)
        : normalizeImageUrl(product.image)

      return {
        lineKey: getCartLineKey(entry),
        id: product.id,
        productName: product.name,
        name: getCartDisplayName(product.name, variantLabel),
        variantLabel,
        variantImage: entry.variantImage,
        price: entry.unitPrice ?? product.price,
        image,
        quantity: entry.quantity,
      }
    })
    .filter((item): item is CartLineItem => item !== null)
}

export function CartProvider({ children }: { children: ReactNode }) {
  const router = useRouter()
  const { getProductById, products } = useProducts()
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
        trackAddToCart(event)
      }

      if (result.added === 0) {
        if (!options?.silent) {
          toast.error('Could not add items to your cart.')
        }
        return { added: result.added, skipped: result.skipped }
      }

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
    [getProductById, router],
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

  const removeItem = useCallback((lineKey: string) => {
    setEntries((prev) => {
      const next = prev.filter((e) => getCartLineKey(e) !== lineKey)
      entriesRef.current = next
      return next
    })
  }, [])

  const setQuantity = useCallback((lineKey: string, quantity: number) => {
    if (quantity < 1) return
    setEntries((prev) => {
      const next = prev.map((e) =>
        getCartLineKey(e) === lineKey ? { ...e, quantity } : e,
      )
      entriesRef.current = next
      return next
    })
  }, [])

  const clearCart = useCallback(() => {
    entriesRef.current = []
    setEntries([])
  }, [])

  const value = useMemo(
    () => ({
      items,
      itemCount,
      isHydrated,
      addItem,
      addItems,
      removeItem,
      setQuantity,
      clearCart,
    }),
    [
      items,
      itemCount,
      isHydrated,
      addItem,
      addItems,
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
