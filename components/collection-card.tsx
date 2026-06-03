import Image from 'next/image'
import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import type { Collection } from '@/lib/collections'
import { cn } from '@/lib/utils'

type CollectionCardProps = {
  collection: Collection
  variant?: 'bento' | 'carousel'
  className?: string
}

export function CollectionCard({
  collection,
  variant = 'bento',
  className,
}: CollectionCardProps) {
  const isCarousel = variant === 'carousel'

  return (
    <Link
      href={
        collection.href ??
        `/shop?category=${encodeURIComponent(collection.category)}`
      }
      className={cn(
        'group relative block overflow-hidden rounded-3xl bg-neutral-100 ring-1 ring-black/5 transition-all duration-300',
        'hover:ring-black/15 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:ring-offset-2',
        isCarousel
          ? 'aspect-[4/5] w-[min(78vw,300px)] shrink-0 snap-center'
          : cn('min-h-[200px] md:min-h-0 md:h-full', collection.className, className),
      )}
    >
      <Image
        src={collection.image}
        alt={collection.title}
        fill
        className={cn(
          'transition-transform duration-500 group-hover:scale-[1.04]',
          collection.image.toLowerCase().endsWith('.png')
            ? 'object-contain p-4 md:p-6'
            : 'object-cover',
        )}
        sizes={isCarousel ? '300px' : '(max-width: 768px) 85vw, 33vw'}
      />

      <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/15 to-transparent transition-opacity duration-300 group-hover:from-black/75" />

      <div className="absolute inset-x-0 bottom-0 z-10 flex flex-col gap-1 p-5 md:p-6">
        {collection.description && (
          <p className="text-[11px] font-medium uppercase tracking-widest text-white/75 md:text-xs">
            {collection.description}
          </p>
        )}
        <div className="flex items-end justify-between gap-3">
          <h3 className="text-lg font-bold leading-tight text-white md:text-xl">
            {collection.title}
          </h3>
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/95 text-neutral-900 opacity-0 transition-all duration-300 group-hover:opacity-100 group-focus-visible:opacity-100 md:translate-y-1 md:group-hover:translate-y-0">
            <ArrowUpRight className="h-4 w-4" strokeWidth={2.25} />
          </span>
        </div>
        <span className="mt-1 inline-flex w-fit items-center gap-1 text-xs font-semibold text-white/90 opacity-0 transition-opacity duration-300 group-hover:opacity-100 md:hidden">
          Shop collection
          <ArrowUpRight className="h-3 w-3" />
        </span>
      </div>
    </Link>
  )
}
