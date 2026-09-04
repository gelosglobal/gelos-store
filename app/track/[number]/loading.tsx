import { TrackResultsSkeleton } from '@/components/track-results-skeleton'

export default function TrackNumberLoading() {
  return (
    <div className="min-h-screen bg-neutral-50">
      <section className="overflow-hidden border-b border-neutral-200 bg-[radial-gradient(ellipse_at_top,#f7fbfe_0%,#ffffff_100%)] pb-16">
        <div className="mx-auto max-w-5xl px-4 pt-8 sm:px-6 sm:pt-10 lg:px-8">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-neutral-500">
            Shipping
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-neutral-950 sm:text-4xl">
            Track your order
          </h1>
          <p className="mt-3 text-sm text-neutral-600 sm:text-base">
            Looking up this shipment…
          </p>
        </div>
      </section>
      <div className="relative z-10 mx-auto max-w-5xl px-4 pb-12 sm:px-6 lg:px-8">
        <div className="-mt-12 h-[92px] rounded-2xl border border-neutral-200 bg-white shadow-lg shadow-neutral-900/5" />
        <div className="mt-8">
          <TrackResultsSkeleton />
        </div>
      </div>
    </div>
  )
}
