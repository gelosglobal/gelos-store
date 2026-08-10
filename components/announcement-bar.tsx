import Link from 'next/link'

const announcements = [
  {
    highlight: 'New Oral Care Bundles are here',
    rest: 'Designed to give you everything you need.',
    href: '/shop?bundles=true',
    cta: 'Shop now',
  },
  {
    highlight: 'New arrival: Gelos Hydrelle Pro Water Flosser',
    rest: 'Deep clean between teeth — portable power for your routine.',
    href: '/product/water-flosser-hydrelle-pro',
    cta: 'Shop now',
  },
] as const

function AnnouncementMessage({
  highlight,
  rest,
  href,
  cta,
}: (typeof announcements)[number]) {
  return (
    <span className="inline-flex items-center gap-1 whitespace-nowrap text-sm text-white">
      <span className="font-semibold text-[#D4FF59]">{highlight}</span>
      <span aria-hidden>—</span>
      <span>{rest}</span>
      <Link
        href={href}
        className="ml-1 font-semibold underline underline-offset-2 transition-colors hover:text-[#D4FF59]"
      >
        {cta}
      </Link>
    </span>
  )
}

export function AnnouncementBar() {
  const srText = announcements
    .map((item) => `${item.highlight} — ${item.rest} ${item.cta}.`)
    .join(' ')

  return (
    <div
      className="overflow-hidden border-b border-neutral-800 bg-neutral-950 py-2.5"
      role="region"
      aria-label="Promotion"
    >
      <p className="sr-only">{srText}</p>
      <p className="hidden justify-center gap-10 overflow-x-auto px-4 font-nav motion-reduce:flex">
        {announcements.map((item) => (
          <AnnouncementMessage key={item.href} {...item} />
        ))}
      </p>
      <div className="announcement-marquee font-nav motion-reduce:hidden" aria-hidden>
        <div className="flex shrink-0 items-center">
          {announcements.map((item) => (
            <span key={`a-${item.href}`} className="px-8">
              <AnnouncementMessage {...item} />
            </span>
          ))}
        </div>
        <div className="flex shrink-0 items-center">
          {announcements.map((item) => (
            <span key={`b-${item.href}`} className="px-8">
              <AnnouncementMessage {...item} />
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
