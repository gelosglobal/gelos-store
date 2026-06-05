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
  getFeaturedHeroImageFit,
} from '@/lib/featured-hero-meta'
import { normalizeImageUrl } from '@/lib/image-url'
import { getProductHref } from '@/lib/product-utils'
import type { Product } from '@/lib/types/product'
import { cn } from '@/lib/utils'

const AUTOPLAY_MS = 5000

const heroHeights =
  'min-h-[min(85vh,640px)] md:min-h-[560px] lg:min-h-[min(78vh,820px)] xl:min-h-[min(82vh,900px)]'

const imagePanelHeights =
  'h-[min(42svh,380px)] sm:h-[min(44svh,420px)] lg:h-full lg:min-h-[480px]'

function getHeroImageSrc(product: Product) {
  const src = featuredHeroSlides[product.id]?.image ?? product.image
  return normalizeImageUrl(src)
}

function FeaturedHeroCopy({
  product,
  isActive,
}: {
  product: Product
  isActive: boolean
}) {
  const slide = featuredHeroSlides[product.id]

  return (
    <div
      className={cn(
        'transition-all duration-500 ease-out',
        isActive
          ? 'relative opacity-100 translate-y-0'
          : 'pointer-events-none absolute inset-0 opacity-0 translate-y-2',
      )}
      aria-hidden={!isActive}
    >
      <h1 className="max-w-xl text-4xl font-bold leading-[1.06] tracking-tight text-white text-balance sm:text-5xl lg:text-[3.25rem] xl:text-6xl">
        {slide?.headline ?? product.name}
      </h1>
      <p className="mt-5 max-w-md text-base leading-relaxed text-neutral-300 sm:mt-6 sm:text-lg lg:max-w-lg">
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
      <Link
        href={getProductHref(product)}
        tabIndex={isActive ? 0 : -1}
        className="mt-8 inline-flex w-[17.5rem] max-w-full items-center justify-center rounded-full bg-[#D4FF59] py-4 text-base font-bold text-[#1a2e05] transition-all hover:bg-[#c8f24d] hover:shadow-lg hover:shadow-black/30 sm:mt-10"
      >
        {slide?.ctaLabel ?? 'Shop now'}
      </Link>
    </div>
  )
}

function FeaturedHeroImage({
  product,
  isFirst,
}: {
  product: Product
  isFirst?: boolean
}) {
  const slide = featuredHeroSlides[product.id]
  const imageSrc = getHeroImageSrc(product)
  const imageFit = getFeaturedHeroImageFit(
    product.id,
    imageSrc,
    slide?.imageFit,
  )
  const isContain = imageFit === 'contain'

  return (
    <div
      className={cn(
        'relative w-full',
        imagePanelHeights,
        'bg-neutral-950',
      )}
    >
      <Image
        src={imageSrc}
        alt={product.name}
        fill
        className={cn(
          isContain
            ? 'object-contain p-6 sm:p-8 lg:p-10'
            : 'object-cover object-center',
        )}
        sizes="(max-width: 1024px) 100vw, 50vw"
        priority={isFirst}
      />
    </div>
  )
}

export function FeaturedProductsHero() {
  const { products } = useProducts()
  const [api, setApi] = useState<CarouselApi>()
  const [activeIndex, setActiveIndex] = useState(0)

  const featuredProducts = useMemo(() => {
    const byId = new Map(products.map((p) => [p.id, p]))
    return featuredHeroProductIds
      .map((id) => byId.get(id))
      .filter((p): p is Product => Boolean(p))
  }, [products])

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
          'relative mx-auto grid w-full max-w-7xl grid-cols-1 items-stretch overflow-hidden rounded-[2rem] bg-neutral-950 shadow-xl lg:max-w-[90rem] lg:h-[min(78vh,820px)] lg:grid-cols-2 lg:rounded-[2.5rem] xl:max-w-[100rem] xl:h-[min(82vh,900px)]',
          heroHeights,
        )}
      >
        {/* Left — CTA copy fades with active slide */}
        <div className="order-2 flex flex-col justify-center px-6 py-10 sm:px-10 sm:py-12 lg:order-1 lg:px-14 lg:py-14 xl:px-20 xl:py-16">
          <div className="relative min-h-[260px] sm:min-h-[280px] lg:min-h-[300px]">
            {featuredProducts.map((product, index) => (
              <FeaturedHeroCopy
                key={product.id}
                product={product}
                isActive={index === activeIndex}
              />
            ))}
          </div>

          {slideCount > 1 && (
            <div className="mt-6 flex items-center gap-3 lg:mt-8">
              <div className="flex gap-2">
                {featuredProducts.map((product, index) => (
                  <button
                    key={product.id}
                    type="button"
                    aria-label={`Show ${product.name}`}
                    aria-current={index === activeIndex ? 'true' : undefined}
                    onClick={() => scrollTo(index)}
                    className={cn(
                      'h-2 rounded-full transition-all',
                      index === activeIndex
                        ? 'w-8 bg-white'
                        : 'w-2 bg-white/40 hover:bg-white/60',
                    )}
                  />
                ))}
              </div>
              <p className="text-sm text-neutral-400">
                {activeIndex + 1} / {slideCount}
              </p>
            </div>
          )}
        </div>

        {/* Right — images slide */}
        <div className={cn('relative order-1 w-full lg:order-2 lg:h-full', imagePanelHeights)}>
          <Carousel
            opts={{ loop: slideCount > 1, align: 'start' }}
            setApi={setApi}
            className={cn(
              'size-full [&_[data-slot=carousel-content]]:h-full',
              imagePanelHeights,
              'lg:h-full lg:min-h-0',
            )}
          >
            <CarouselContent className="-ml-0 h-full">
              {featuredProducts.map((product, index) => (
                <CarouselItem
                  key={product.id}
                  className={cn('h-full basis-full pl-0', imagePanelHeights, 'lg:min-h-0')}
                >
                  <FeaturedHeroImage
                    product={product}
                    isFirst={index === 0}
                  />
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>

          {slideCount > 1 && (
            <>
              <button
                type="button"
                aria-label="Previous slide"
                onClick={scrollPrev}
                className="absolute left-4 top-1/2 z-10 flex size-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-black/40 text-white backdrop-blur-sm transition-colors hover:bg-black/60 sm:left-5"
              >
                <ChevronLeft className="size-5" strokeWidth={2} />
              </button>
              <button
                type="button"
                aria-label="Next slide"
                onClick={scrollNext}
                className="absolute right-4 top-1/2 z-10 flex size-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-black/40 text-white backdrop-blur-sm transition-colors hover:bg-black/60 sm:right-5"
              >
                <ChevronRight className="size-5" strokeWidth={2} />
              </button>
            </>
          )}
        </div>
      </div>
    </section>
  )
}
