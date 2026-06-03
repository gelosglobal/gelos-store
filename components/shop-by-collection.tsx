import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { collections } from '@/lib/collections'
import { CollectionCard } from '@/components/collection-card'

type ShopByCollectionProps = {
  title?: string
  className?: string
}

export function ShopByCollection({
  title = 'Shop by Collection',
  className = '',
}: ShopByCollectionProps) {
  const featuredMobile = collections.filter((c) => c.featured)
  const carouselItems =
    featuredMobile.length > 0
      ? [
          ...featuredMobile,
          ...collections.filter((c) => !c.featured),
        ]
      : collections

  return (
    <section className={`border-b border-border py-14 md:py-20 ${className}`}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 md:mb-10 md:flex-row md:items-end md:justify-between">
          <div className="max-w-xl">
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-neutral-500">
              Curated for you
            </p>
            <h2 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
              {title}
            </h2>
            <p className="mt-3 text-base text-muted-foreground">
              Browse by category — from flavored toothpastes to whitening kits and
              everyday essentials.
            </p>
          </div>
          <Link
            href="/collections"
            className="inline-flex w-fit items-center gap-2 rounded-full border border-neutral-300 px-5 py-2.5 text-sm font-semibold text-foreground transition-colors hover:border-neutral-900 hover:bg-neutral-50"
          >
            View all collections
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {/* Mobile — horizontal snap carousel */}
        <div className="relative md:hidden">
          <div className="flex gap-3 overflow-x-auto pb-3 scroll-smooth snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {carouselItems.map((collection) => (
              <CollectionCard
                key={collection.id}
                collection={collection}
                variant="carousel"
              />
            ))}
          </div>
          <p className="mt-2 text-center text-xs text-muted-foreground">
            Swipe to explore collections
          </p>
        </div>

        {/* Desktop — bento grid */}
        <div className="hidden gap-3 md:grid md:grid-cols-12 md:grid-rows-2 md:gap-4 md:h-[min(560px,52vw)] lg:h-[580px]">
          {collections.map((collection) => (
            <CollectionCard
              key={collection.id}
              collection={collection}
              variant="bento"
            />
          ))}
        </div>
      </div>
    </section>
  )
}
