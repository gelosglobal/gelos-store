'use client'

import Image from 'next/image'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { ProductGalleryVideo } from '@/components/product-gallery-video'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from '@/components/ui/carousel'
import { isExternalImageUrl } from '@/lib/image-url'
import type { GalleryMediaItem } from '@/lib/product-gallery-images'
import { cn } from '@/lib/utils'

type ProductFeatureGalleryProps = {
  items: GalleryMediaItem[]
  alt: string
  className?: string
}

/** Fixed card size — never shrinks when more slides are added. */
const GALLERY_CARD_CLASS =
  'h-[min(62vh,560px)] w-[min(92vw,calc(min(62vh,560px)*9/16))] shrink-0 sm:w-[calc(min(62vh,560px)*9/16)]'

function GallerySlideCard({ children }: { children: React.ReactNode }) {
  return (
    <article className={cn('mx-auto', GALLERY_CARD_CLASS)}>
      <div className="flex h-full w-full flex-col rounded-[1.25rem] border border-neutral-950 bg-white p-2 sm:rounded-[1.35rem] sm:p-3">
        <div className="relative min-h-0 flex-1 overflow-hidden rounded-xl bg-neutral-100">
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
          className="object-cover object-center"
          sizes="315px"
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
  const [api, setApi] = useState<CarouselApi>()
  const [canScrollPrev, setCanScrollPrev] = useState(false)
  const [canScrollNext, setCanScrollNext] = useState(false)

  const onSelect = useCallback((carouselApi: CarouselApi) => {
    setCanScrollPrev(carouselApi.canScrollPrev())
    setCanScrollNext(carouselApi.canScrollNext())
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

  if (items.length === 0) return null

  const showNav = items.length > 1

  return (
    <section
      aria-label="Product feature gallery"
      className={cn(
        'mt-10 rounded-[1.75rem] bg-[#f0eaf6] px-4 py-10 sm:px-6 sm:py-12 lg:mt-12',
        className,
      )}
    >
      <div className="flex items-center gap-3 sm:gap-4">
        {showNav && (
          <button
            type="button"
            onClick={() => api?.scrollPrev()}
            disabled={!canScrollPrev}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-neutral-950/15 bg-white text-neutral-700 shadow-sm transition-colors hover:bg-neutral-50 disabled:pointer-events-none disabled:opacity-40 sm:h-11 sm:w-11"
            aria-label="Previous gallery item"
          >
            <ChevronLeft className="h-5 w-5 stroke-[1.5]" />
          </button>
        )}

        <Carousel
          opts={{ align: 'start', containScroll: 'trimSnaps' }}
          setApi={setApi}
          className="min-w-0 flex-1"
        >
          <CarouselContent className="-ml-3 sm:-ml-4">
            {items.map((item, index) => (
              <CarouselItem
                key={`${item.type}-${item.url}-${index}`}
                className="basis-auto shrink-0 grow-0 pl-3 sm:pl-4"
              >
                <GallerySlide item={item} alt={alt} index={index} />
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>

        {showNav && (
          <button
            type="button"
            onClick={() => api?.scrollNext()}
            disabled={!canScrollNext}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-neutral-950/15 bg-white text-neutral-700 shadow-sm transition-colors hover:bg-neutral-50 disabled:pointer-events-none disabled:opacity-40 sm:h-11 sm:w-11"
            aria-label="Next gallery item"
          >
            <ChevronRight className="h-5 w-5 stroke-[1.5]" />
          </button>
        )}
      </div>
    </section>
  )
}
