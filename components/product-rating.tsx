import { Star } from 'lucide-react'
import { cn } from '@/lib/utils'

type ProductRatingProps = {
  rating: number
  reviews: number
  className?: string
}

function clampRating(rating: number): number {
  if (!Number.isFinite(rating)) return 0
  return Math.min(5, Math.max(0, rating))
}

export function ProductRating({ rating, reviews, className }: ProductRatingProps) {
  const normalizedRating = clampRating(rating)
  const reviewCount = Number.isFinite(reviews) ? Math.max(0, Math.round(reviews)) : 0

  if (normalizedRating <= 0 && reviewCount <= 0) return null

  const fullStars = Math.floor(normalizedRating)
  const hasHalfStar = normalizedRating - fullStars >= 0.25 && fullStars < 5
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0)
  const ratingLabel =
    normalizedRating > 0 ? normalizedRating.toFixed(1).replace(/\.0$/, '') : null

  return (
    <div
      className={cn('flex flex-wrap items-center gap-2', className)}
      aria-label={
        ratingLabel && reviewCount > 0
          ? `Rated ${ratingLabel} out of 5 from ${reviewCount} reviews`
          : ratingLabel
            ? `Rated ${ratingLabel} out of 5`
            : `${reviewCount} reviews`
      }
    >
      <div className="flex items-center gap-0.5" aria-hidden>
        {Array.from({ length: fullStars }, (_, index) => (
          <Star
            key={`full-${index}`}
            className="size-4 fill-amber-400 text-amber-400"
          />
        ))}
        {hasHalfStar ? (
          <span className="relative inline-flex size-4">
            <Star className="size-4 text-neutral-200" />
            <Star
              className="absolute inset-0 size-4 fill-amber-400 text-amber-400"
              style={{ clipPath: 'inset(0 50% 0 0)' }}
            />
          </span>
        ) : null}
        {Array.from({ length: emptyStars }, (_, index) => (
          <Star key={`empty-${index}`} className="size-4 text-neutral-200" />
        ))}
      </div>

      {ratingLabel ? (
        <span className="text-sm font-semibold text-neutral-900">{ratingLabel}</span>
      ) : null}

      {reviewCount > 0 ? (
        <span className="text-sm text-neutral-500">
          ({reviewCount} review{reviewCount === 1 ? '' : 's'})
        </span>
      ) : null}
    </div>
  )
}
