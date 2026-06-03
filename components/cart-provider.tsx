'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import type { CartEntry } from '@/lib/cart-types'
import { useProducts } from '@/components/products-provider'
import type { Product } from '@/lib/types/product'

const CART_STORAGE_KEY = 'gelos-cart'

export type CartLineItem = {
  id: string
  name: string
  price: number
  image: string
  quantity: number
}

type CartContextValue = {
  items: CartLineItem[]
  itemCount: number
  isHydrated: boolean
  addItem: (productId: string, quantity?: number) => void
  removeItem: (productId: string) => void
  setQuantity: (productId: string, quantity: number) => void
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
      return {
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
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

  useEffect(() => {
    setEntries(loadStoredCart())
    setIsHydrated(true)
  }, [])

  useEffect(() => {
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

  const addItem = useCallback((productId: string, quantity = 1) => {
    const product = getProductById(productId)
    if (!product) return

    setEntries((prev) => {
      const existing = prev.find((e) => e.productId === productId)
      if (existing) {
        return prev.map((e) =>
          e.productId === productId
            ? { ...e, quantity: e.quantity + quantity }
            : e,
        )
      }
      return [...prev, { productId, quantity }]
    })

    toast.success('Added to cart', {
      description: product.name,
      action: {
        label: 'View cart',
        onClick: () => router.push('/cart'),
      },
    })
  }, [getProductById, router])

  const removeItem = useCallback((productId: string) => {
    setEntries((prev) => prev.filter((e) => e.productId !== productId))
  }, [])

  const setQuantity = useCallback((productId: string, quantity: number) => {
    if (quantity < 1) return
    setEntries((prev) =>
      prev.map((e) => (e.productId === productId ? { ...e, quantity } : e)),
    )
  }, [])

  const clearCart = useCallback(() => setEntries([]), [])

  const value = useMemo(
    () => ({
      items,
      itemCount,
      isHydrated,
      addItem,
      removeItem,
      setQuantity,
      clearCart,
    }),
    [
      items,
      itemCount,
      isHydrated,
      addItem,
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
