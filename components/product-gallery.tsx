'use client'

import Image from 'next/image'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { isExternalImageUrl } from '@/lib/image-url'
import { cn } from '@/lib/utils'

type ProductGalleryProps = {
  images: string[]
  alt: string
  badge?: string
  /** Controlled active image (syncs with admin variant picker) */
  activeSrc?: string
  onActiveSrcChange?: (src: string) => void
}

const THUMB_GRID_COLS: Record<number, string> = {
  1: 'grid-cols-1',
  2: 'grid-cols-2',
  3: 'grid-cols-3',
  4: 'grid-cols-4',
}

export function ProductGallery({
  images,
  alt,
  badge,
  activeSrc: controlledSrc,
  onActiveSrcChange,
}: ProductGalleryProps) {
  const gallery = images.length > 0 ? images : ['/placeholder.svg']
  const [activeIndex, setActiveIndex] = useState(0)
  const isControlled = controlledSrc !== undefined && onActiveSrcChange !== undefined

  useEffect(() => {
    if (!isControlled || !controlledSrc) return
    const idx = gallery.indexOf(controlledSrc)
    if (idx >= 0) setActiveIndex(idx)
  }, [controlledSrc, gallery, isControlled])

  const setIndex = useCallback(
    (index: number) => {
      const next = gallery[index]
      if (!next) return
      if (isControlled) {
        onActiveSrcChange?.(next)
      } else {
        setActiveIndex(index)
      }
    },
    [gallery, isControlled, onActiveSrcChange],
  )

  const goPrev = useCallback(() => {
    const current = isControlled
      ? gallery.indexOf(controlledSrc ?? gallery[0])
      : activeIndex
    const idx = (current - 1 + gallery.length) % gallery.length
    setIndex(idx)
  }, [activeIndex, controlledSrc, gallery, isControlled, setIndex])

  const goNext = useCallback(() => {
    const current = isControlled
      ? gallery.indexOf(controlledSrc ?? gallery[0])
      : activeIndex
    const idx = (current + 1) % gallery.length
    setIndex(idx)
  }, [activeIndex, controlledSrc, gallery, isControlled, setIndex])

  const resolvedIndex = isControlled
    ? Math.max(0, gallery.indexOf(controlledSrc ?? gallery[0]))
    : activeIndex
  const activeSrc = gallery[resolvedIndex] ?? gallery[0]
  const thumbGridCols =
    THUMB_GRID_COLS[Math.min(gallery.length, 4)] ?? 'grid-cols-4'
  const useScrollStrip = gallery.length > 4

  return (
    <div className="space-y-5">
      <div className="relative aspect-square overflow-hidden rounded-3xl bg-white ring-1 ring-neutral-200">
        <Image
          key={activeSrc}
          src={activeSrc}
          alt={alt}
          fill
          className="object-contain p-6 sm:p-10"
          sizes="(max-width: 768px) 100vw, 50vw"
          priority
          unoptimized={isExternalImageUrl(activeSrc)}
        />
        {badge && (
          <span className="absolute bottom-6 left-6 rounded-full bg-[#D4FF59] px-4 py-2 text-sm font-bold tracking-tight text-neutral-950 shadow-sm">
            {badge}
          </span>
        )}
      </div>

      {gallery.length > 1 && (
        <div className="flex items-center gap-3 sm:gap-4">
          <button
            type="button"
            onClick={goPrev}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-600 shadow-sm transition-colors hover:border-neutral-300 hover:bg-neutral-50 sm:h-11 sm:w-11"
            aria-label="Previous image"
          >
            <ChevronLeft className="h-5 w-5 stroke-[1.5]" />
          </button>

          {useScrollStrip ? (
            <div className="flex min-w-0 flex-1 gap-2.5 overflow-x-auto scroll-smooth pb-0.5 sm:gap-3">
              {gallery.map((src, index) => (
                <GalleryThumb
                  key={`${src}-${index}`}
                  src={src}
                  index={index}
                  isActive={resolvedIndex === index}
                  onSelect={() => setIndex(index)}
                  className="h-[72px] w-[72px] shrink-0 sm:h-20 sm:w-20"
                />
              ))}
            </div>
          ) : (
            <div
              className={cn(
                'grid min-w-0 flex-1 gap-2.5 sm:gap-3',
                thumbGridCols,
              )}
            >
              {gallery.map((src, index) => (
                <GalleryThumb
                  key={`${src}-${index}`}
                  src={src}
                  index={index}
                  isActive={resolvedIndex === index}
                  onSelect={() => setIndex(index)}
                  className="w-full"
                />
              ))}
            </div>
          )}

          <button
            type="button"
            onClick={goNext}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-600 shadow-sm transition-colors hover:border-neutral-300 hover:bg-neutral-50 sm:h-11 sm:w-11"
            aria-label="Next image"
          >
            <ChevronRight className="h-5 w-5 stroke-[1.5]" />
          </button>
        </div>
      )}
    </div>
  )
}

function GalleryThumb({
  src,
  index,
  isActive,
  onSelect,
  className,
}: {
  src: string
  index: number
  isActive: boolean
  onSelect: () => void
  className?: string
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'relative aspect-square overflow-hidden rounded-2xl bg-white transition-colors',
        isActive
          ? 'border-2 border-neutral-950'
          : 'border border-neutral-200 hover:border-neutral-400',
        className,
      )}
      aria-label={`View image ${index + 1}`}
      aria-current={isActive}
    >
      <Image
        src={src}
        alt=""
        fill
        className="object-contain p-2 sm:p-2.5"
        sizes="96px"
        unoptimized={isExternalImageUrl(src)}
      />
    </button>
  )
}
