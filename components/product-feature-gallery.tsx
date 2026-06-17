import Image from 'next/image'
import { isExternalImageUrl } from '@/lib/image-url'
import { cn } from '@/lib/utils'

type ProductFeatureGalleryProps = {
  images: string[]
  alt: string
  className?: string
}

export function ProductFeatureGallery({
  images,
  alt,
  className,
}: ProductFeatureGalleryProps) {
  if (images.length === 0) return null

  const gridCols =
    images.length === 1
      ? 'grid-cols-1'
      : images.length === 2
        ? 'grid-cols-1 sm:grid-cols-2'
        : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'

  return (
    <section
      aria-label="Product feature images"
      className={cn('mt-10 lg:mt-12', className)}
    >
      <div className={cn('grid gap-4 sm:gap-5', gridCols)}>
        {images.map((src, index) => (
          <div
            key={`${src}-${index}`}
            className={cn(
              'relative overflow-hidden rounded-3xl bg-neutral-50 ring-1 ring-neutral-200',
              images.length === 1
                ? 'aspect-[4/3] sm:aspect-[16/9]'
                : 'aspect-[4/3]',
            )}
          >
            <Image
              src={src}
              alt={`${alt} — feature image ${index + 1}`}
              fill
              className="object-cover object-center"
              sizes={
                images.length === 1
                  ? '(max-width: 768px) 100vw, 1280px'
                  : '(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw'
              }
              unoptimized={isExternalImageUrl(src)}
            />
          </div>
        ))}
      </div>
    </section>
  )
}
