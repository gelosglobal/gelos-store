import Image from 'next/image'
import Link from 'next/link'

export function LifestylePromoBanner() {
  return (
    <section
      aria-labelledby="lifestyle-promo-heading"
      className="relative overflow-hidden border-b border-border bg-[#9ed4f2] py-10 sm:py-14 md:py-16"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <p
          id="lifestyle-promo-heading"
          className="text-center text-5xl font-black uppercase leading-none tracking-tighter text-[#D4FF59] drop-shadow-[0_2px_0_rgba(0,0,0,0.08)] sm:text-6xl md:text-7xl lg:text-8xl"
        >
          Gelos
        </p>

        <div className="relative mx-auto mt-6 max-w-5xl sm:mt-8">
          <p
            aria-hidden
            className="pointer-events-none select-none text-center text-[clamp(3.5rem,16vw,9.5rem)] font-black uppercase leading-[0.85] tracking-tighter text-[#ff4f9a]"
          >
            Strawberry
          </p>

          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative z-10 w-[min(72vw,280px)] overflow-hidden rounded-md shadow-2xl shadow-black/20 sm:w-[min(42vw,360px)] md:w-[min(38vw,420px)]">
              <Image
                src="/gelos/gelos-fair.jpg"
                alt="Person enjoying Gelos strawberry toothpaste"
                width={420}
                height={560}
                className="h-auto w-full object-cover"
                sizes="(max-width: 640px) 72vw, (max-width: 1024px) 42vw, 420px"
                priority={false}
              />
            </div>
          </div>

          <div className="h-[min(72vw,360px)] sm:h-[min(42vw,380px)] md:h-[min(38vw,420px)]" aria-hidden />
        </div>

        <p className="mx-auto mt-6 max-w-md text-center text-sm font-medium text-[#d61f7a] sm:mt-8 sm:text-base">
          With Gelos toothpastes, your smile will shine brighter every day.
        </p>

        <div className="mt-6 flex justify-center sm:mt-8">
          <Link
            href="/shop"
            className="inline-flex rounded-full bg-neutral-950 px-10 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-neutral-800 sm:px-12 sm:text-base"
          >
            Shop now
          </Link>
        </div>
      </div>
    </section>
  )
}
