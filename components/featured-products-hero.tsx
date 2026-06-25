import Link from 'next/link'
import { HeroSmileQuizButton } from '@/components/hero-smile-quiz-button'
import {
  featuredHeroCopy,
  featuredHeroVideoSrc,
} from '@/lib/featured-hero-meta'
import { cn } from '@/lib/utils'

const heroHeights =
  'min-h-[min(85vh,640px)] md:min-h-[560px] lg:min-h-[min(78vh,820px)] xl:min-h-[min(82vh,900px)]'

export function FeaturedProductsHero() {
  return (
    <section
      aria-label="Featured products"
      className="px-4 py-6 sm:px-6 sm:py-8 lg:px-10 lg:py-12 xl:px-12 xl:py-14"
    >
      <div
        className={cn(
          'relative mx-auto flex w-full max-w-7xl items-center justify-center overflow-hidden rounded-[2rem] bg-neutral-950 shadow-xl lg:max-w-[90rem] lg:rounded-[2.5rem] xl:max-w-[100rem]',
          heroHeights,
        )}
      >
        <video
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          aria-hidden
          className="absolute inset-0 z-0 h-full w-full object-cover object-center"
        >
          <source src={featuredHeroVideoSrc} type="video/mp4" />
        </video>

        <div className="pointer-events-none absolute inset-0 z-10 bg-black/40" />

        <div className="relative z-20 flex max-w-3xl flex-col items-center px-6 py-16 text-center sm:px-10 sm:py-20 lg:px-12 lg:py-24">
          <h1 className="text-4xl font-bold tracking-tight text-white text-balance sm:text-5xl lg:text-6xl">
            {featuredHeroCopy.headline}
          </h1>
          <p className="mt-4 max-w-xl text-base leading-relaxed text-white/90 sm:text-lg">
            {featuredHeroCopy.subtext}
          </p>

          <div className="mt-8 flex w-full flex-col items-stretch justify-center gap-3 sm:mt-10 sm:w-auto sm:flex-row sm:items-center">
            <Link
              href="/shop"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-[#D4FF59] px-8 py-4 text-base font-bold text-[#1a2e05] transition-all hover:bg-[#c8f24d] hover:shadow-lg hover:shadow-black/20"
            >
              Shop now
              <span aria-hidden>→</span>
            </Link>
            <HeroSmileQuizButton />
          </div>
        </div>
      </div>
    </section>
  )
}
