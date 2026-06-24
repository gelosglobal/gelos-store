'use client'

import Link from 'next/link'
import { ChevronDown } from 'lucide-react'
import { Suspense, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { ShopCollectionCard } from '@/components/shop-collection-card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { bestSellerIds } from '@/lib/best-seller-meta'
import { newArrivalProductIds } from '@/lib/new-arrivals'
import {
  getProductDisplayBadge,
  orderProductsForTagCollection,
} from '@/lib/product-tags'
import { useProducts } from '@/components/products-provider'
import { cn } from '@/lib/utils'

const categories = [
  'Toothpaste',
  'Mouthwash',
  'Tongue Scraper',
  'Whitening',
  'Water Flossers',
  'Tools',
  'Accessories',
  'Wellness',
  'Toothbrushes',
] as const

type CollectionFilter =
  | 'all'
  | 'best-sellers'
  | (typeof categories)[number]

type SortOption = 'recommended' | 'price-low' | 'price-high' | 'rating'

function ShopPageContent() {
  const { products, getTagCollectionOrder } = useProducts()
  const searchParams = useSearchParams()
  const [collectionFilter, setCollectionFilter] = useState<CollectionFilter>('all')
  const [sortBy, setSortBy] = useState<SortOption>('recommended')

  const bundlesMode = searchParams.get('bundles') === 'true'
  const newArrivalsMode = searchParams.get('new-arrivals') === 'true'
  const categoryParam = searchParams.get('category')

  useEffect(() => {
    if (categoryParam && categories.includes(categoryParam as (typeof categories)[number])) {
      setCollectionFilter(categoryParam as CollectionFilter)
    } else if (!bundlesMode && !newArrivalsMode) {
      setCollectionFilter('all')
    }
  }, [categoryParam, bundlesMode, newArrivalsMode])

  const pageMeta = useMemo(() => {
    if (bundlesMode) {
      return {
        title: 'Bundles',
        description:
          'Curated Gelos sets and value packs — coming soon.',
      }
    }
    if (newArrivalsMode) {
      return {
        title: 'New arrivals',
        description:
          'Explore the latest additions to Gelos — fresh flavors, new formulas, and just-dropped favorites.',
      }
    }
    if (categoryParam === 'Toothpaste') {
      return {
        title: 'Toothpastes',
        description:
          'Fluoride+ formulas in bold fruit and dessert flavours — fresh cleans you will actually look forward to.',
      }
    }
    if (categoryParam === 'Mouthwash') {
      return {
        title: 'Mouth Washes',
        description:
          'Foaming, alcohol-free rinses in bold fruit flavours — fresh breath without the burn.',
      }
    }
    if (categoryParam === 'Tongue Scraper') {
      return {
        title: 'Tongue Scrapers',
        description:
          'Professional-grade scrapers for a cleaner tongue and fresher breath — an easy add to your daily routine.',
      }
    }
    if (categoryParam === 'Wellness') {
      return {
        title: 'Wellness and Care',
        description:
          'Portable fruit energy, aromatherapy inhalers, and on-the-go refresh — bold flavours and wellness picks from Gelos.',
      }
    }
    if (categoryParam === 'Whitening') {
      return {
        title: 'Teeth whitening',
        description:
          'V34 shade correction, LED devices, strips, and charcoal — professional-inspired brightening for every routine.',
      }
    }
    if (categoryParam === 'Water Flossers') {
      return {
        title: 'Water flossers',
        description:
          'Cordless and countertop water flossers — gentle pressurised cleaning between teeth and along the gum line.',
      }
    }
    if (categoryParam === 'Toothbrushes') {
      return {
        title: 'Toothbrushes',
        description:
          'Eco bamboo sets and sonic electric brushes — soft bristles and comfortable handles for your Gelos routine.',
      }
    }
    if (categoryParam === 'Accessories') {
      return {
        title: 'Accessories',
        description:
          'Fun extras and seasonal picks — playful add-ons that complete your Gelos smile-care kit.',
      }
    }
    if (categoryParam === 'Tools') {
      return {
        title: 'Tools',
        description:
          'Practical smile-care tools — everything you need to support brushing, rinsing, and brightening.',
      }
    }
    return {
      title: 'Shop all products',
      description:
        'Explore our complete collection of premium dental care — find something for every smile care routine.',
    }
  }, [bundlesMode, newArrivalsMode, categoryParam])

  const filteredProducts = useMemo(() => {
    let list = [...products]

    if (bundlesMode) {
      list = orderProductsForTagCollection(
        list,
        'bundle',
        getTagCollectionOrder('bundle'),
      )
    } else if (newArrivalsMode) {
      list = orderProductsForTagCollection(
        list,
        'new-arrival',
        getTagCollectionOrder('new-arrival'),
        newArrivalProductIds,
      )
    } else if (collectionFilter === 'best-sellers') {
      list = orderProductsForTagCollection(
        list,
        'best-seller',
        getTagCollectionOrder('best-seller'),
        bestSellerIds,
      )
    } else if (collectionFilter !== 'all') {
      list = list.filter((p) => p.category === collectionFilter)
    }

    if (!newArrivalsMode) {
      list.sort((a, b) => {
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
    }

    return list
  }, [
    products,
    bundlesMode,
    newArrivalsMode,
    collectionFilter,
    sortBy,
    getTagCollectionOrder,
  ])

  const showCollectionFilter = !bundlesMode && !newArrivalsMode

  return (
    <div className="min-h-screen bg-white text-foreground">
      {/* Banner */}
      <section className="bg-neutral-950">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-14 lg:px-8 lg:py-16">
          <h1 className="max-w-2xl text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-[2.75rem] lg:leading-tight">
            {pageMeta.title}
          </h1>
          <p className="mt-4 max-w-xl text-base leading-relaxed text-white/90 sm:text-lg">
            {pageMeta.description}
          </p>
        </div>
      </section>

      {/* Filter bar */}
      <section className="border-b border-neutral-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3 px-4 py-4 sm:gap-4 sm:px-6 lg:px-8">
          {showCollectionFilter ? (
            <Select
              value={collectionFilter}
              onValueChange={(v) => setCollectionFilter(v as CollectionFilter)}
            >
              <SelectTrigger
                className={cn(
                  'h-10 min-w-[10rem] border-0 bg-transparent px-0 shadow-none',
                  'text-sm font-medium text-neutral-700 focus:ring-0',
                )}
              >
                <SelectValue placeholder="Collection" />
              </SelectTrigger>
              <SelectContent align="start">
                <SelectItem value="all">All products</SelectItem>
                <SelectItem value="best-sellers">Best sellers</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <div className="flex items-center gap-1.5 text-sm font-medium text-neutral-700">
              <span>{pageMeta.title}</span>
              <ChevronDown className="h-4 w-4 text-neutral-400" aria-hidden />
            </div>
          )}

          <Select
            value={sortBy}
            onValueChange={(v) => setSortBy(v as SortOption)}
          >
            <SelectTrigger
              className={cn(
                'h-10 min-w-[10rem] border-0 bg-transparent px-0 shadow-none',
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

      {/* Product grid */}
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8 lg:py-14">
        {filteredProducts.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-neutral-700">
              {bundlesMode
                ? 'No bundles available yet. Check back soon for curated sets.'
                : 'No products match this collection.'}
            </p>
            {bundlesMode ? (
              <Link
                href="/shop"
                className="mt-4 inline-flex text-sm font-semibold text-neutral-950 underline-offset-2 hover:underline"
              >
                Browse all products
              </Link>
            ) : null}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 lg:grid-cols-4 lg:gap-x-8 lg:gap-y-12">
            {filteredProducts.map((product) => (
              <ShopCollectionCard
                key={product.id}
                product={product}
                badge={getProductDisplayBadge(product)}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

export default function ShopPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-white text-neutral-500">
          Loading shop…
        </div>
      }
    >
      <ShopPageContent />
    </Suspense>
  )
}
