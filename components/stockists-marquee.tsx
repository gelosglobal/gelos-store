import { Star } from 'lucide-react'
import type { ReactNode } from 'react'
import { FindUsEverywhereIcon } from '@/components/find-us-everywhere-icon'
import { TrustStatsBar } from '@/components/trust-stats-bar'
import { stockists } from '@/lib/stockists'

/** Marquee animation uses translateX(-50%), so we always need exactly two identical tracks. */
const MARQUEE_TRACK_COUNT = 2

function StockistLogo({ name, logo }: { name: string; logo: string }) {
  return (
    <div className="flex shrink-0 items-center justify-center px-3 sm:px-4">
      <img
        src={logo}
        alt={name}
        className="h-16 w-auto max-w-[7.5rem] object-contain object-center sm:h-[4.5rem] sm:max-w-[8.5rem] md:h-20 md:max-w-[9.5rem]"
        draggable={false}
        loading="lazy"
        decoding="async"
      />
    </div>
  )
}

function StockistTrack() {
  return (
    <div className="flex shrink-0 items-center">
      {stockists.map((stockist) => (
        <StockistLogo
          key={stockist.id}
          name={stockist.name}
          logo={stockist.logo}
        />
      ))}
    </div>
  )
}

function SatisfiedUsersProof() {
  return (
    <p className="mt-2.5 flex flex-wrap items-center gap-2 text-sm text-neutral-600">
      <span className="flex items-center gap-0.5" aria-hidden>
        {Array.from({ length: 5 }).map((_, index) => (
          <Star
            key={index}
            className="size-3.5 fill-amber-400 text-amber-400 sm:size-4"
          />
        ))}
      </span>
      <span className="font-medium text-neutral-700">Over 50,000 satisfied users</span>
    </p>
  )
}

function SectionColumnHeader({
  id,
  title,
  description,
  leading,
  trailing,
}: {
  id?: string
  title: string
  description?: string
  leading?: ReactNode
  trailing?: ReactNode
}) {
  return (
    <header className="mb-4 sm:mb-5">
      <h2
        id={id}
        className="flex items-center gap-2 text-base font-bold leading-tight tracking-tight text-neutral-950 sm:text-lg"
      >
        {leading}
        <span>{title}</span>
      </h2>
      {description ? (
        <p className="mt-1.5 max-w-xs text-xs leading-relaxed text-neutral-500 sm:text-sm">
          {description}
        </p>
      ) : null}
      {trailing}
    </header>
  )
}

export function StockistsMarquee() {
  if (stockists.length === 0) return null

  return (
    <section
      aria-labelledby="stockists-heading"
      className="border-b border-border bg-white"
    >
      <div className="mx-auto max-w-7xl py-6 sm:py-7 lg:py-8">
        <div className="grid grid-cols-1 gap-6 overflow-visible md:grid-cols-[minmax(0,1fr)_1px_minmax(0,1fr)] md:items-start md:gap-8 lg:gap-10">
          <div className="min-w-0">
            <SectionColumnHeader title="Why customers choose Gelos" />
            <TrustStatsBar className="w-full max-w-full" />
          </div>

          <div className="hidden bg-neutral-200 md:block md:w-px md:self-stretch" aria-hidden />

          <div className="min-w-0 overflow-visible border-t border-neutral-200 px-4 pt-6 sm:px-6 md:border-0 md:px-0 md:pt-0">
            <SectionColumnHeader
              id="stockists-heading"
              title="Find us everywhere"
              leading={<FindUsEverywhereIcon />}
            />

            <div className="stockists-marquee-bleed relative">
              <p className="sr-only">
                Available at {stockists.map((s) => s.name).join(', ')}
              </p>

              <div
                className="pointer-events-none absolute inset-y-0 left-0 z-10 w-8 bg-gradient-to-r from-white to-transparent sm:w-12"
                aria-hidden
              />
              <div
                className="pointer-events-none absolute inset-y-0 right-0 z-10 w-8 bg-gradient-to-l from-white to-transparent sm:w-12"
                aria-hidden
              />

              <div className="overflow-hidden motion-reduce:hidden">
                <div className="stockists-marquee" aria-hidden>
                  {Array.from({ length: MARQUEE_TRACK_COUNT }, (_, index) => (
                    <StockistTrack key={`track-${index}`} />
                  ))}
                </div>
              </div>

              <div className="hidden flex-wrap items-center gap-x-3 gap-y-3 motion-reduce:flex">
                {stockists.map((stockist) => (
                  <StockistLogo
                    key={`static-${stockist.id}`}
                    name={stockist.name}
                    logo={stockist.logo}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
