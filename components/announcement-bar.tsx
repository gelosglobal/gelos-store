import Link from 'next/link'

const announcements = [
  {
    highlight: 'Black Friday is here',
    rest: 'up to 50% off',
    href: '/shop',
    cta: 'Shop now',
  },
] as const

/** Enough copies so the track always spans past the viewport. */
const MARQUEE_COPIES = 10

function AnnouncementMessage({
  highlight,
  rest,
  href,
  cta,
}: (typeof announcements)[number]) {
  return (
    <span className="inline-flex items-center gap-2 whitespace-nowrap text-sm tracking-wide text-white sm:text-[0.9375rem]">
      <span className="font-semibold uppercase tracking-[0.08em] text-[#D4FF59]">
        {highlight}
      </span>
      <span className="text-white/40" aria-hidden>
        —
      </span>
      <span className="text-white/90">{rest}</span>
      <Link
        href={href}
        className="ml-1 font-semibold text-white underline underline-offset-4 transition-colors hover:text-[#D4FF59]"
      >
        {cta}
      </Link>
    </span>
  )
}

function MarqueeTrack({ id }: { id: string }) {
  return (
    <div className="flex shrink-0 items-center">
      {Array.from({ length: MARQUEE_COPIES }, (_, copy) =>
        announcements.map((item) => (
          <span
            key={`${id}-${copy}-${item.href}`}
            className="inline-flex items-center px-8 sm:px-12"
          >
            <AnnouncementMessage {...item} />
            <span
              className="ml-8 size-1.5 shrink-0 rounded-full bg-[#D4FF59]/70 sm:ml-12"
              aria-hidden
            />
          </span>
        )),
      )}
    </div>
  )
}

export function AnnouncementBar() {
  const srText = announcements
    .map((item) => `${item.highlight} — ${item.rest} ${item.cta}.`)
    .join(' ')

  return (
    <div
      className="overflow-hidden border-b border-neutral-800 bg-neutral-950 py-3"
      role="region"
      aria-label="Black Friday promotion"
    >
      <p className="sr-only">{srText}</p>
      <p className="hidden justify-center px-4 font-nav motion-reduce:flex">
        {announcements.map((item) => (
          <AnnouncementMessage key={item.href} {...item} />
        ))}
      </p>
      <div
        className="announcement-marquee font-nav motion-reduce:hidden"
        aria-hidden
      >
        <MarqueeTrack id="a" />
        <MarqueeTrack id="b" />
      </div>
    </div>
  )
}
