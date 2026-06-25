import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'

const BUNDLE_IMAGE = '/gelos/bundle.PNG'

const bannerHeights =
  'lg:min-h-[min(82vh,860px)] xl:min-h-[min(86vh,940px)]'

export function BundlePromoSection() {
  return (
    <section
      aria-labelledby="bundles-heading"
      className="px-4 py-6 sm:px-6 sm:py-8 lg:px-10 lg:py-12 xl:px-12 xl:py-14"
    >
      <div
        className={cn(
          'relative mx-auto w-full max-w-7xl overflow-hidden rounded-[2rem] bg-white shadow-xl',
          'lg:max-w-[90rem] lg:rounded-[2.5rem] xl:max-w-[100rem]',
          bannerHeights,
        )}
      >
        <div className="relative h-[min(58vw,17.5rem)] w-full sm:h-[min(54vw,20rem)] lg:absolute lg:inset-0 lg:h-full">
          <Image
            src={BUNDLE_IMAGE}
            alt=""
            fill
            priority={false}
            className="object-cover object-[center_35%] lg:object-[28%_center]"
            sizes="(max-width: 1024px) 100vw, 90rem"
            aria-hidden
          />
        </div>

        <div
          className={cn(
            'relative z-10 bg-white px-4 py-7 sm:px-6 sm:py-8',
            'lg:absolute lg:left-10 lg:top-12 lg:max-w-lg lg:bg-transparent lg:px-0 lg:py-0',
            'xl:left-14 xl:top-14',
          )}
        >
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-neutral-600 sm:text-xs lg:text-neutral-800">
            Bundle &amp; save
          </p>

          <h2
            id="bundles-heading"
            className="mt-2.5 text-[1.75rem] font-bold leading-[1.08] tracking-tight text-neutral-950 sm:mt-3 sm:text-4xl lg:mt-3 lg:text-[2.85rem]"
          >
            Your everyday smile bundle,{' '}
            <span className="text-[#65A30D] lg:text-white">sorted.</span>
          </h2>

          {/* <p className="mt-3 max-w-md text-sm leading-relaxed text-neutral-600 sm:mt-4 sm:text-base lg:mt-4 lg:text-lg lg:text-neutral-800">
            Toothpaste, brushes, and whitening essentials — curated for a simple
            at-home routine.
          </p> */}

          <Link
            href="/shop?bundles=true"
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-neutral-950 px-7 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-neutral-800 sm:mt-7 sm:w-auto sm:justify-start lg:mt-8 lg:inline-flex lg:px-8 lg:text-base"
          >
            Shop bundles
            <ArrowRight className="size-4" aria-hidden />
          </Link>
        </div>
      </div>
    </section>
  )
}
