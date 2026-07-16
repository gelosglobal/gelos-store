'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { ShopCollectionCard } from '@/components/shop-collection-card'
import { useProducts } from '@/components/products-provider'
import { expandProductsForShopCatalog } from '@/lib/shop-catalog-items'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'

type SortOption = 'recommended' | 'price-low' | 'price-high' | 'rating'

export default function MouthWashesCollectionPage() {
  const { products } = useProducts()
  const [sortBy, setSortBy] = useState<SortOption>('recommended')

  const mouthwashProducts = useMemo(() => {
    const list = products.filter((p) => p.category === 'Mouthwash')
    return list.sort((a, b) => {
      switch (sortBy) {
        case 'price-low':
          return a.price - b.price
        case 'price-high':
          return b.price - a.price
        case 'rating':
          return b.rating - a.rating
        default:
          return 0
      }
    })
  }, [products, sortBy])

  const catalogItems = useMemo(
    () => expandProductsForShopCatalog(mouthwashProducts),
    [mouthwashProducts],
  )

  return (
    <div className="min-h-screen bg-white text-foreground">
      <section className="bg-neutral-950">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-14 lg:px-8 lg:py-16">
          <nav
            className="mb-6 flex flex-wrap items-center gap-2 text-sm text-white/60"
            aria-label="Breadcrumb"
          >
            <Link href="/" className="hover:text-white">
              Home
            </Link>
            <span aria-hidden>/</span>
            <Link href="/collections" className="hover:text-white">
              Collections
            </Link>
            <span aria-hidden>/</span>
            <span className="text-white">Mouth Washes</span>
          </nav>
          <h1 className="max-w-2xl text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-[2.75rem] lg:leading-tight">
            Mouth Washes
          </h1>
          <p className="mt-4 max-w-xl text-base leading-relaxed text-white/90 sm:text-lg">
            Foaming, alcohol-free rinses in bold fruit flavours — fresh breath
            without the burn.
          </p>
        </div>
      </section>

      <section className="border-b border-neutral-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3 px-4 py-4 sm:gap-4 sm:px-6 lg:px-8">
          <p className="text-sm font-medium text-neutral-700">
            {catalogItems.length}{' '}
            {catalogItems.length === 1 ? 'product' : 'products'}
          </p>
          <Select
            value={sortBy}
            onValueChange={(v) => setSortBy(v as SortOption)}
          >
            <SelectTrigger
              className={cn(
                'ml-auto h-10 min-w-[10rem] border-0 bg-transparent px-0 shadow-none',
                'text-sm font-medium text-neutral-700 focus:ring-0',
              )}
            >
              <SelectValue placeholder="Sort" />
            </SelectTrigger>
            <SelectContent align="start">
              <SelectItem value="recommended">Recommended</SelectItem>
              <SelectItem value="price-low">Price: low to high</SelectItem>
              <SelectItem value="price-high">Price: high to low</SelectItem>
              <SelectItem value="rating">Highest rated</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8 lg:py-14">
        {catalogItems.length === 0 ? (
          <p className="py-16 text-center text-neutral-500">
            No mouthwash products available yet.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 lg:grid-cols-4 lg:gap-x-8 lg:gap-y-12">
            {catalogItems.map((item) => (
              <ShopCollectionCard
                key={item.key}
                product={item.product}
                displayName={item.displayName}
                displayImage={item.image}
                href={item.href}
                lockedVariantImage={
                  item.flavourLocked ? item.variantImage : undefined
                }
                lockedVariantLabel={
                  item.flavourLocked ? item.variantLabel : undefined
                }
              />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
