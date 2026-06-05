import { Star } from 'lucide-react'
import { stockists } from '@/lib/stockists'

/** Enough duplicated tracks to keep the marquee full with any partner count */
function getMarqueeTrackCount(partnerCount: number) {
  if (partnerCount <= 0) return 0
  if (partnerCount >= 6) return 2
  if (partnerCount >= 4) return 3
  return 4
}

function StockistLogo({ name, logo }: { name: string; logo: string }) {
  return (
    <div className="flex shrink-0 items-center justify-center px-2 sm:px-3 md:px-4 lg:px-5">
      <img
        src={logo}
        alt={name}
        className="h-24 w-auto object-contain object-center sm:h-28 md:h-32 lg:h-40 xl:h-44"
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

export function StockistsMarquee() {
  const trackCount = getMarqueeTrackCount(stockists.length)

  if (stockists.length === 0) return null

  return (
    <section
      aria-labelledby="stockists-heading"
      className="border-b border-border bg-white py-3 md:py-4"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h2
          id="stockists-heading"
          className="text-center text-lg font-bold uppercase tracking-wide text-foreground sm:text-xl md:text-2xl"
        >
          Find us everywhere
        </h2>
        <p className="mt-2 flex items-center justify-center gap-2 text-sm text-muted-foreground sm:text-base">
          <span className="flex items-center gap-0.5" aria-hidden>
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className="size-3.5 fill-amber-400 text-amber-400 sm:size-4"
              />
            ))}
          </span>
          <span>Over 50,000 satisfied users</span>
        </p>
      </div>

      <div className="relative mt-3">
        <p className="sr-only">
          Available at {stockists.map((s) => s.name).join(', ')}
        </p>

        <div
          className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-white to-transparent sm:w-24"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-white to-transparent sm:w-24"
          aria-hidden
        />

        <div className="overflow-hidden">
          <div
            className="stockists-marquee motion-reduce:flex motion-reduce:justify-center motion-reduce:gap-4"
            aria-hidden
          >
            {Array.from({ length: trackCount }, (_, index) => (
              <StockistTrack key={`track-${index}`} />
            ))}
          </div>
        </div>

        <div className="mt-3 hidden flex-wrap items-center justify-center gap-x-4 gap-y-4 px-4 motion-reduce:flex md:gap-x-5">
          {stockists.map((stockist) => (
            <StockistLogo
              key={`static-${stockist.id}`}
              name={stockist.name}
              logo={stockist.logo}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
