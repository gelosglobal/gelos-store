import Link from 'next/link'

function AnnouncementMessage() {
  return (
    <span className="inline-flex items-center gap-1 whitespace-nowrap text-sm text-white">
      <span className="font-semibold text-[#D4FF59]"> New Oral Care Bundles are here</span>
      <span aria-hidden>—</span>
      <span>Designed to give you everything you need.</span>
      <Link
        href="/shop"
        className="ml-1 font-semibold underline underline-offset-2 transition-colors hover:text-[#D4FF59]"
      >
        Shop now
      </Link>
    </span>
  )
}

export function AnnouncementBar() {
  return (
    <div
      className="overflow-hidden border-b border-neutral-800 bg-neutral-950 py-2.5"
      role="region"
      aria-label="Promotion"
    >
      <p className="sr-only">
        New Oral Care Bundles are here - Designed to give you everything you need. Shop now.
      </p>
      <p className="hidden justify-center px-4 font-nav motion-reduce:flex">
        <AnnouncementMessage />
      </p>
      <div className="announcement-marquee font-nav motion-reduce:hidden" aria-hidden>
        <div className="flex shrink-0 items-center">
          <span className="px-8">
            <AnnouncementMessage />
          </span>
          <span className="px-8">
            <AnnouncementMessage />
          </span>
        </div>
        <div className="flex shrink-0 items-center">
          <span className="px-8">
            <AnnouncementMessage />
          </span>
          <span className="px-8">
            <AnnouncementMessage />
          </span>
        </div>
      </div>
    </div>
  )
}
