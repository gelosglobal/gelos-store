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
import { usePathname } from 'next/navigation'
import { products as mockProducts } from '@/lib/mock-data'
import { normalizeImageUrl } from '@/lib/image-url'
import { PRODUCTS_UPDATED_EVENT } from '@/lib/products-events'
import type { ProductTagId } from '@/lib/product-tags'
import { getDefaultTagCollectionOrder } from '@/lib/tag-collection-defaults'
import type { Product } from '@/lib/types/product'

type TagCollectionsMap = Partial<Record<ProductTagId, string[]>>

type ProductsContextValue = {
  products: Product[]
  tagCollections: TagCollectionsMap
  isLoading: boolean
  databaseConnected: boolean
  refreshProducts: () => Promise<void>
  getProductById: (id: string) => Product | undefined
  getTagCollectionOrder: (tag: ProductTagId) => string[]
}

const ProductsContext = createContext<ProductsContextValue | null>(null)

function toProduct(p: (typeof mockProducts)[number]): Product {
  return {
    ...p,
    image: normalizeImageUrl(p.image),
    tags: [],
    variantImages: [],
    variantImageOptions: [],
    galleryImages: [],
    carouselImages: [],
  }
}

export function ProductsProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [databaseConnected, setDatabaseConnected] = useState(false)
  const [tagCollections, setTagCollections] = useState<TagCollectionsMap>({})

  const refreshProducts = useCallback(async () => {
    try {
      const res = await fetch('/api/products', { cache: 'no-store' })
      const data = (await res.json()) as {
        products?: Product[]
        tagCollections?: TagCollectionsMap
        databaseConnected?: boolean
      }
      if (res.ok && Array.isArray(data.products)) {
        setProducts(data.products)
        setTagCollections(data.tagCollections ?? {})
        setDatabaseConnected(Boolean(data.databaseConnected))
      } else {
        setProducts((current) =>
          current.length === 0 ? mockProducts.map(toProduct) : current,
        )
      }
    } catch {
      setProducts((current) =>
        current.length === 0 ? mockProducts.map(toProduct) : current,
      )
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void refreshProducts()
  }, [refreshProducts])

  useEffect(() => {
    void refreshProducts()
  }, [pathname, refreshProducts])

  useEffect(() => {
    const onUpdate = () => void refreshProducts()
    window.addEventListener(PRODUCTS_UPDATED_EVENT, onUpdate)
    return () => window.removeEventListener(PRODUCTS_UPDATED_EVENT, onUpdate)
  }, [refreshProducts])

  const productById = useMemo(
    () => new Map(products.map((p) => [p.id, p])),
    [products],
  )

  const getTagCollectionOrder = useCallback(
    (tag: ProductTagId) =>
      tagCollections[tag]?.length
        ? tagCollections[tag]!
        : getDefaultTagCollectionOrder(tag),
    [tagCollections],
  )

  return (
    <ProductsContext.Provider
      value={{
        products,
        tagCollections,
        isLoading,
        databaseConnected,
        refreshProducts,
        getProductById: (id) => productById.get(id),
        getTagCollectionOrder,
      }}
    >
      {children}
    </ProductsContext.Provider>
  )
}

export function useProducts() {
  const ctx = useContext(ProductsContext)
  if (!ctx) throw new Error('useProducts must be used within ProductsProvider')
  return ctx
}
