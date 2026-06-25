'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useMemo, useState } from 'react'
import { ShopCollectionCard } from '@/components/shop-collection-card'
import { useProducts } from '@/components/products-provider'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  getFlavorBySlug,
  getProductsForFlavor,
} from '@/lib/flavors'
import { cn } from '@/lib/utils'

type SortOption = 'recommended' | 'price-low' | 'price-high' | 'rating'

export function FlavorCollectionPage({ slug }: { slug: string }) {
  const { products } = useProducts()
  const [sortBy, setSortBy] = useState<SortOption>('recommended')
  const flavor = getFlavorBySlug(slug)

  const flavorProducts = useMemo(() => {
    if (!flavor) return []

    const list = getProductsForFlavor(flavor, products)

    return [...list].sort((a, b) => {
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
  }, [flavor, products, sortBy])

  if (!flavor) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center px-4 text-center">
        <h1 className="text-2xl font-bold text-neutral-950">Flavour not found</h1>
        <Link href="/" className="mt-4 text-sm font-medium text-neutral-600 underline">
          Back to home
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white text-foreground">
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src={flavor.coverImage}
            alt=""
            fill
            className="object-cover"
            style={{ objectPosition: flavor.imagePosition ?? 'center' }}
            priority
            sizes="100vw"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-black/45 via-black/25 to-black/10" />

        <div className="relative mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-14 lg:px-8 lg:py-16">
          <nav
            className="mb-6 flex flex-wrap items-center gap-2 text-sm text-white/70"
            aria-label="Breadcrumb"
          >
            <Link href="/" className="hover:text-white">
              Home
            </Link>
            <span aria-hidden>/</span>
            <Link href="/#our-flavors-heading" className="hover:text-white">
              Our Flavours
            </Link>
            <span aria-hidden>/</span>
            <span className="text-white">{flavor.label}</span>
          </nav>

          <h1 className="max-w-2xl text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-[2.75rem] lg:leading-tight">
            {flavor.label}
          </h1>
          <p className="mt-4 max-w-xl text-base leading-relaxed text-white/90 sm:text-lg">
            {flavor.description}
          </p>
        </div>
      </section>

      <section className="border-b border-neutral-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3 px-4 py-4 sm:gap-4 sm:px-6 lg:px-8">
          <p className="text-sm font-medium text-neutral-700">
            {flavorProducts.length}{' '}
            {flavorProducts.length === 1 ? 'product' : 'products'}
          </p>
          <Select
            value={sortBy}
            onValueChange={(value) => setSortBy(value as SortOption)}
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
        {flavorProducts.length === 0 ? (
          <p className="py-16 text-center text-neutral-500">
            No {flavor.label.toLowerCase()} products available yet.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 lg:grid-cols-4 lg:gap-x-8 lg:gap-y-12">
            {flavorProducts.map((product) => (
              <ShopCollectionCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
