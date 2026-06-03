'use client'

import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { useMemo } from 'react'
import { BestSellerCard } from '@/components/best-seller-card'
import { useProducts } from '@/components/products-provider'
import { bestSellerIds } from '@/lib/best-seller-meta'
import { orderProductsForTagCollection } from '@/lib/product-tags'

export function BestSellers() {
  const { products, getTagCollectionOrder } = useProducts()

  const bestSellers = useMemo(
    () =>
      orderProductsForTagCollection(
        products,
        'best-seller',
        getTagCollectionOrder('best-seller'),
        bestSellerIds,
      ),
    [products, getTagCollectionOrder],
  )

  return (
    <section
      id="best-sellers"
      className="scroll-mt-20 border-b border-border py-12 md:py-16 lg:py-20"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-8 lg:flex-row lg:gap-10 xl:gap-14">
          <div className="shrink-0 lg:w-[min(100%,280px)] lg:pt-2 xl:w-[300px]">
            <h2 className="text-3xl font-bold tracking-tight text-foreground md:text-[2rem] md:leading-tight">
              Shop our best sellers
            </h2>
            <p className="mt-3 text-base text-neutral-500">
              Explore our range of fan-favourites
            </p>
            <Link
              href="/shop"
              className="mt-6 inline-flex items-center gap-1.5 rounded-full border border-neutral-300 px-5 py-2.5 text-sm font-medium text-foreground transition-colors hover:border-neutral-900 hover:bg-neutral-50"
            >
              Shop all
              <ChevronRight className="h-4 w-4" strokeWidth={2} />
            </Link>
          </div>

          <div className="-mx-4 flex-1 overflow-hidden sm:-mx-6 lg:mx-0">
            <div className="flex gap-4 overflow-x-auto px-4 pb-2 scroll-smooth snap-x snap-mandatory sm:gap-5 sm:px-6 lg:px-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {bestSellers.map((product) => (
                <BestSellerCard
                  key={`${product.id}-${product.image}`}
                  product={product}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
