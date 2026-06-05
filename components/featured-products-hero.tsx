'use client'

import Image from 'next/image'
import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useProducts } from '@/components/products-provider'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from '@/components/ui/carousel'
import {
  featuredHeroProductIds,
  featuredHeroSlides,
} from '@/lib/featured-hero-meta'
import { orderProductsForTagCollection } from '@/lib/product-tags'
import { getProductHref } from '@/lib/product-utils'
import type { Product } from '@/lib/types/product'
import { cn } from '@/lib/utils'

const AUTOPLAY_MS = 5000

const heroHeights =
  'min-h-[min(85vh,640px)] md:min-h-[560px] lg:min-h-[min(78vh,820px)] xl:min-h-[min(82vh,900px)]'

function getHeroImageSrc(product: Product) {
  return featuredHeroSlides[product.id]?.image ?? product.image
}

export function FeaturedProductsHero() {
  const { products, getTagCollectionOrder } = useProducts()
  const [api, setApi] = useState<CarouselApi>()
  const [activeIndex, setActiveIndex] = useState(0)

  const featuredProducts = useMemo(
    () =>
      orderProductsForTagCollection(
        products,
        'featured',
        getTagCollectionOrder('featured'),
        featuredHeroProductIds,
      ),
    [products, getTagCollectionOrder],
  )

  const slideCount = featuredProducts.length

  const scrollTo = useCallback(
    (index: number) => {
      api?.scrollTo(index)
    },
    [api],
  )

  const scrollPrev = useCallback(() => {
    api?.scrollPrev()
  }, [api])

  const scrollNext = useCallback(() => {
    api?.scrollNext()
  }, [api])

  useEffect(() => {
    if (!api) return

    const onSelect = () => setActiveIndex(api.selectedScrollSnap())
    onSelect()
    api.on('select', onSelect)
    api.on('reInit', onSelect)

    return () => {
      api.off('select', onSelect)
      api.off('reInit', onSelect)
    }
  }, [api])

  useEffect(() => {
    if (!api || slideCount <= 1) return

    const timer = window.setInterval(() => {
      if (api.canScrollNext()) {
        api.scrollNext()
      } else {
        api.scrollTo(0)
      }
    }, AUTOPLAY_MS)

    return () => window.clearInterval(timer)
  }, [api, slideCount])

  if (slideCount === 0) return null

  return (
    <section
      aria-label="Featured products"
      className="px-4 py-6 sm:px-6 sm:py-8 lg:px-10 lg:py-12 xl:px-12 xl:py-14"
    >
      <div
        className={cn(
          'relative mx-auto w-full max-w-7xl overflow-hidden rounded-[2rem] shadow-xl lg:max-w-[90rem] lg:rounded-[2.5rem] xl:max-w-[100rem]',
          heroHeights,
        )}
      >
        <Carousel
          opts={{ loop: slideCount > 1, align: 'start' }}
          setApi={setApi}
          className={cn('h-full w-full', heroHeights)}
        >
          <CarouselContent className="-ml-0 h-full">
            {featuredProducts.map((product, index) => (
              <CarouselItem
                key={product.id}
                className="h-full basis-full pl-0"
              >
                <div className={cn('relative h-full w-full', heroHeights)}>
                  <Image
                    src={getHeroImageSrc(product)}
                    alt={product.name}
                    fill
                    className="object-cover object-center"
                    sizes="(max-width: 1280px) 100vw, 1440px"
                    priority={index === 0}
                  />
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>

        {/* CTA overlay — matches original video hero style */}
        <div className="pointer-events-none absolute inset-0 z-20 bg-black/35" />
        <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center px-6 py-16 text-center sm:py-20 lg:px-12 lg:py-24 xl:py-28">
          {featuredProducts.map((product, index) => {
            const slide = featuredHeroSlides[product.id]
            const isActive = index === activeIndex

            return (
              <div
                key={product.id}
                className={cn(
                  'absolute inset-0 flex flex-col items-center justify-center px-6 transition-opacity duration-500 ease-out sm:px-10',
                  isActive ? 'opacity-100' : 'opacity-0',
                )}
                aria-hidden={!isActive}
              >
                <h1 className="max-w-4xl text-4xl font-bold tracking-tight text-white text-balance sm:text-5xl lg:text-6xl xl:text-7xl">
                  {slide?.headline ?? product.name}
                </h1>
                {(slide?.bodyHighlight || product.description) && (
                  <p className="mt-4 max-w-2xl text-base text-white/90 sm:mt-5 sm:text-lg">
                    {slide ? (
                      <>
                        {slide.bodyLead}
                        <span className="font-semibold text-white">
                          {slide.bodyHighlight}
                        </span>
                        {slide.bodyTail}
                      </>
                    ) : (
                      product.description
                    )}
                  </p>
                )}
                <Link
                  href={getProductHref(product)}
                  tabIndex={isActive ? 0 : -1}
                  className="pointer-events-auto mt-8 inline-flex items-center gap-2 rounded-full bg-[#D4FF59] px-8 py-4 text-base font-bold text-[#1a2e05] transition-all hover:bg-[#c8f24d] hover:shadow-lg hover:shadow-black/20 sm:mt-10"
                >
                  {slide?.ctaLabel ?? 'Shop now'}
                  <span aria-hidden>→</span>
                </Link>
              </div>
            )
          })}
        </div>

        {slideCount > 1 && (
          <>
            <button
              type="button"
              aria-label="Previous slide"
              onClick={scrollPrev}
              className="absolute left-4 top-1/2 z-30 flex size-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/30 text-white backdrop-blur-sm transition-colors hover:bg-black/50 sm:left-6"
            >
              <ChevronLeft className="size-5" strokeWidth={2} />
            </button>
            <button
              type="button"
              aria-label="Next slide"
              onClick={scrollNext}
              className="absolute right-4 top-1/2 z-30 flex size-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/30 text-white backdrop-blur-sm transition-colors hover:bg-black/50 sm:right-6"
            >
              <ChevronRight className="size-5" strokeWidth={2} />
            </button>

            <div className="absolute bottom-5 left-1/2 z-30 flex -translate-x-1/2 gap-2 sm:bottom-6">
              {featuredProducts.map((product, index) => (
                <button
                  key={product.id}
                  type="button"
                  aria-label={`Go to slide ${index + 1}: ${product.name}`}
                  aria-current={index === activeIndex ? 'true' : undefined}
                  onClick={() => scrollTo(index)}
                  className={cn(
                    'h-2 rounded-full transition-all',
                    index === activeIndex
                      ? 'w-8 bg-white'
                      : 'w-2 bg-white/50 hover:bg-white/70',
                  )}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  )
}
