import type { Metadata } from 'next'
import { ElfsightStoreLocator } from '@/components/elfsight-store-locator'

export const metadata: Metadata = {
  title: 'Find a Store | Gelos',
  description:
    'Find GELOS products at pharmacies and retail stores near you across Ghana.',
}

export default function FindAStorePage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <section className="border-b border-neutral-200 bg-[radial-gradient(ellipse_at_top,#f7fbfe_0%,#ffffff_100%)] py-12 md:py-16">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
          <h1 className="text-3xl font-bold tracking-tight text-neutral-950 sm:text-4xl">
            Find GELOS near you
          </h1>
          <p className="mt-3 text-base text-neutral-600 sm:text-lg">
            Search for pharmacies and stores stocking Gelos products across Ghana.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-12">
        <ElfsightStoreLocator className="min-h-[28rem]" />
      </section>

    </div>
  )
}
