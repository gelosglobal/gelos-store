'use client'

import Image from 'next/image'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { ProductGalleryVideo } from '@/components/product-gallery-video'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from '@/components/ui/carousel'
import { useIsMobile } from '@/components/ui/use-mobile'
import { isExternalImageUrl } from '@/lib/image-url'
import type { GalleryMediaItem } from '@/lib/product-gallery-images'
import { cn } from '@/lib/utils'

const MOBILE_AUTOPLAY_MS = 3500
const AUTOPLAY_RESUME_MS = 6000

type ProductFeatureGalleryProps = {
  items: GalleryMediaItem[]
  alt: string
  className?: string
}

const navButtonClass =
  'flex items-center justify-center rounded-full border border-neutral-950/10 bg-white/95 text-neutral-700 shadow-md backdrop-blur-sm transition-colors hover:bg-white disabled:pointer-events-none disabled:opacity-40'

function GallerySlideCard({ children }: { children: React.ReactNode }) {
  return (
    <article
      className={cn(
        'mx-auto w-full max-w-[18.5rem] shrink-0',
        'aspect-[4/5] sm:aspect-auto sm:h-[min(58vh,520px)] sm:w-[min(17.5rem,calc(min(58vh,520px)*9/16))] sm:max-w-none',
      )}
    >
      <div className="flex h-full w-full flex-col overflow-hidden rounded-2xl bg-white p-1.5 shadow-sm ring-1 ring-neutral-900/10 sm:rounded-[1.35rem] sm:p-2.5">
        <div className="relative min-h-0 flex-1 overflow-hidden rounded-[1rem] bg-neutral-50 sm:rounded-xl">
          {children}
        </div>
      </div>
    </article>
  )
}

function GallerySlide({
  item,
  alt,
  index,
}: {
  item: GalleryMediaItem
  alt: string
  index: number
}) {
  return (
    <GallerySlideCard>
      {item.type === 'video' ? (
        <ProductGalleryVideo
          src={item.url}
          label={`${alt} — feature ${item.type} ${index + 1}`}
          variant="carousel"
          className="absolute inset-0"
        />
      ) : (
        <Image
          src={item.url}
          alt={`${alt} — feature image ${index + 1}`}
          fill
          className="object-contain object-center sm:object-cover"
          sizes="(max-width: 640px) 85vw, 280px"
          unoptimized={isExternalImageUrl(item.url)}
        />
      )}
    </GallerySlideCard>
  )
}

export function ProductFeatureGallery({
  items,
  alt,
  className,
}: ProductFeatureGalleryProps) {
  const isMobile = useIsMobile()
  const [api, setApi] = useState<CarouselApi>()
  const [canScrollPrev, setCanScrollPrev] = useState(false)
  const [canScrollNext, setCanScrollNext] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [autoplayPaused, setAutoplayPaused] = useState(false)
  const resumeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const onSelect = useCallback((carouselApi: CarouselApi) => {
    setCanScrollPrev(carouselApi.canScrollPrev())
    setCanScrollNext(carouselApi.canScrollNext())
    setSelectedIndex(carouselApi.selectedScrollSnap())
  }, [])

  const pauseAutoplay = useCallback(() => {
    setAutoplayPaused(true)
    if (resumeTimeoutRef.current) clearTimeout(resumeTimeoutRef.current)
    resumeTimeoutRef.current = setTimeout(() => {
      setAutoplayPaused(false)
      resumeTimeoutRef.current = null
    }, AUTOPLAY_RESUME_MS)
  }, [])

  useEffect(() => {
    if (!api) return

    onSelect(api)
    api.on('reInit', onSelect)
    api.on('select', onSelect)

    return () => {
      api.off('reInit', onSelect)
      api.off('select', onSelect)
    }
  }, [api, onSelect])

  useEffect(() => {
    return () => {
      if (resumeTimeoutRef.current) clearTimeout(resumeTimeoutRef.current)
    }
  }, [])

  useEffect(() => {
    if (!api || !isMobile || items.length < 2 || autoplayPaused) return

    const prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches
    if (prefersReducedMotion) return

    const id = window.setInterval(() => {
      if (document.hidden) return
      if (api.canScrollNext()) {
        api.scrollNext()
      } else {
        api.scrollTo(0)
      }
    }, MOBILE_AUTOPLAY_MS)

    return () => window.clearInterval(id)
  }, [api, isMobile, items.length, autoplayPaused])

  if (items.length === 0) return null

  const showNav = items.length > 1

  return (
    <section
      aria-label="Product feature gallery"
      className={cn(
        'mt-10 rounded-[1.75rem] bg-[#f0eaf6] px-3 py-8 sm:px-6 sm:py-12 lg:mt-12',
        className,
      )}
    >
      <div className="mx-auto max-w-4xl">
        <div className="relative sm:flex sm:items-center sm:gap-4">
          {showNav ? (
            <button
              type="button"
              onClick={() => {
                pauseAutoplay()
                api?.scrollPrev()
              }}
              disabled={!canScrollPrev}
              className={cn(
                navButtonClass,
                'absolute left-2 top-1/2 z-10 hidden size-9 -translate-y-1/2 sm:static sm:flex sm:size-11 sm:shrink-0 sm:translate-y-0',
              )}
              aria-label="Previous gallery item"
            >
              <ChevronLeft className="h-5 w-5 stroke-[1.5]" />
            </button>
          ) : null}

          <Carousel
            opts={{ align: 'center', containScroll: 'trimSnaps' }}
            setApi={setApi}
            className="min-w-0 flex-1"
            onPointerDown={showNav ? pauseAutoplay : undefined}
          >
            <CarouselContent className="-ml-0 sm:-ml-4">
              {items.map((item, index) => (
                <CarouselItem
                  key={`${item.type}-${item.url}-${index}`}
                  className="basis-full pl-0 sm:basis-auto sm:pl-4"
                >
                  <GallerySlide item={item} alt={alt} index={index} />
                </CarouselItem>
              ))}
            </CarouselContent>

            {showNav ? (
              <>
                <button
                  type="button"
                  onClick={() => {
                    pauseAutoplay()
                    api?.scrollPrev()
                  }}
                  disabled={!canScrollPrev}
                  className={cn(
                    navButtonClass,
                    'absolute left-3 top-1/2 z-10 size-9 -translate-y-1/2 sm:hidden',
                  )}
                  aria-label="Previous gallery item"
                >
                  <ChevronLeft className="h-4 w-4 stroke-[1.5]" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    pauseAutoplay()
                    api?.scrollNext()
                  }}
                  disabled={!canScrollNext}
                  className={cn(
                    navButtonClass,
                    'absolute right-3 top-1/2 z-10 size-9 -translate-y-1/2 sm:hidden',
                  )}
                  aria-label="Next gallery item"
                >
                  <ChevronRight className="h-4 w-4 stroke-[1.5]" />
                </button>
              </>
            ) : null}
          </Carousel>

          {showNav ? (
            <button
              type="button"
              onClick={() => {
                pauseAutoplay()
                api?.scrollNext()
              }}
              disabled={!canScrollNext}
              className={cn(
                navButtonClass,
                'absolute right-2 top-1/2 z-10 hidden size-9 -translate-y-1/2 sm:static sm:flex sm:size-11 sm:shrink-0 sm:translate-y-0',
              )}
              aria-label="Next gallery item"
            >
              <ChevronRight className="h-5 w-5 stroke-[1.5]" />
            </button>
          ) : null}
        </div>

        {showNav ? (
          <div
            className="mt-5 flex items-center justify-center gap-2"
            aria-label="Gallery pagination"
          >
            {items.map((item, index) => (
              <button
                key={`dot-${item.type}-${item.url}-${index}`}
                type="button"
                onClick={() => {
                  pauseAutoplay()
                  api?.scrollTo(index)
                }}
                className={cn(
                  'h-2 rounded-full transition-all',
                  selectedIndex === index
                    ? 'w-6 bg-neutral-900'
                    : 'w-2 bg-neutral-900/25 hover:bg-neutral-900/40',
                )}
                aria-label={`Go to gallery item ${index + 1}`}
                aria-current={selectedIndex === index ? 'true' : undefined}
              />
            ))}
          </div>
        ) : null}
      </div>
    </section>
  )
}
