import { Star } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { customerReviews } from '@/lib/customer-reviews'
import { cn } from '@/lib/utils'

function getReviewInitials(name: string): string {
  return name
    .split(/\s+/)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

function ReviewStars({ rating }: { rating: number }) {
  const normalized = Math.min(5, Math.max(0, Math.round(rating)))

  return (
    <div
      className="mt-3 flex items-center gap-0.5"
      aria-label={`Rated ${normalized} out of 5 stars`}
    >
      {Array.from({ length: 5 }, (_, index) => (
        <Star
          key={index}
          className={cn(
            'size-3.5',
            index < normalized
              ? 'fill-amber-400 text-amber-400'
              : 'text-neutral-200',
          )}
          aria-hidden
        />
      ))}
    </div>
  )
}

function CustomerReviewCard({
  name,
  role,
  handle,
  quote,
  avatar,
  rating,
}: (typeof customerReviews)[number]) {
  const avatarSrc = avatar?.trim() || undefined

  return (
    <article className="w-[17.5rem] shrink-0 rounded-2xl border border-neutral-200/80 bg-white p-5 shadow-sm sm:w-[19rem]">
      <div className="flex items-center gap-3">
        <Avatar className="size-10 shrink-0">
          {avatarSrc ? <AvatarImage src={avatarSrc} alt={name} /> : null}
          <AvatarFallback className="bg-lime-100 text-xs font-semibold text-lime-800">
            {getReviewInitials(name)}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-neutral-950">{name}</p>
          <p className="truncate text-xs text-neutral-500">
            {role}{' '}
            <span className="font-medium text-lime-600">@{handle}</span>
          </p>
        </div>
      </div>
      <ReviewStars rating={rating} />
      <p className="mt-3 text-sm leading-relaxed text-neutral-600">
        &ldquo;{quote}&rdquo;
      </p>
    </article>
  )
}

function CustomerReviewsTrack() {
  return (
    <div className="flex shrink-0 items-stretch gap-4 pr-4 sm:gap-5 sm:pr-5">
      {customerReviews.map((review) => (
        <CustomerReviewCard key={review.id} {...review} />
      ))}
    </div>
  )
}

export function CustomerReviewsSection() {
  return (
    <section
      aria-label="Customer reviews"
      className="border-b border-border bg-white py-10 md:py-14"
    >
      <div className="px-4 text-center sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl md:text-[2.75rem] md:leading-[1.1]">
          Loved by smiles across Ghana
        </h2>
        <p className="mt-3 flex flex-wrap items-center justify-center gap-2 text-sm text-neutral-600 sm:mt-4 sm:text-base">
          <span className="flex items-center gap-0.5" aria-hidden>
            {Array.from({ length: 5 }).map((_, index) => (
              <Star
                key={index}
                className="size-4 fill-amber-400 text-amber-400 sm:size-[18px]"
              />
            ))}
          </span>
          <span className="font-medium text-neutral-700">
            Over 50,000 satisfied customers
          </span>
        </p>
      </div>

      <div className="relative mt-8">
        <p className="sr-only">
          {customerReviews.map((review) => `${review.name}, ${review.rating} stars: ${review.quote}`).join(' ')}
        </p>

        <div
          className="pointer-events-none absolute inset-y-0 left-0 z-10 w-10 bg-gradient-to-r from-white to-transparent sm:w-16"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-y-0 right-0 z-10 w-10 bg-gradient-to-l from-white to-transparent sm:w-16"
          aria-hidden
        />

        <div className="overflow-hidden motion-reduce:hidden">
          <div className="reviews-marquee" aria-hidden>
            <CustomerReviewsTrack />
            <CustomerReviewsTrack />
          </div>
        </div>

        <div className="mt-4 hidden flex-wrap items-stretch justify-center gap-4 px-4 motion-reduce:flex sm:gap-5">
          {customerReviews.map((review) => (
            <CustomerReviewCard key={`static-${review.id}`} {...review} />
          ))}
        </div>
      </div>
    </section>
  )
}
