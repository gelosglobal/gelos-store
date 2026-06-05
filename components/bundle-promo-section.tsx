import Image from 'next/image'
import Link from 'next/link'

const BUNDLE_PRODUCTS = [
  {
    src: '/gelos/watermelon.png',
    alt: 'Gelos Watermelon Toothpaste',
    width: 320,
    height: 380,
    className:
      'absolute bottom-2 left-[2%] z-20 w-[56%] -rotate-6 drop-shadow-[0_22px_34px_rgba(15,23,42,0.2)] sm:left-[4%] sm:w-[52%]',
  },
  {
    src: '/gelos/toothbrush.png',
    alt: 'Gelos Toothbrush',
    width: 180,
    height: 420,
    className:
      'absolute bottom-0 right-[2%] z-10 w-[40%] rotate-3 drop-shadow-[0_18px_28px_rgba(15,23,42,0.18)] sm:right-[4%] sm:w-[36%]',
  },
] as const

export function BundlePromoSection() {
  return (
    <section
      aria-labelledby="bundles-heading"
      className="border-b border-border bg-[radial-gradient(ellipse_at_top,#cfe8f6_0%,#e8f4fb_42%,#f7fbfe_100%)] py-12 md:py-16 lg:py-20"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 items-center gap-10 md:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] md:gap-12 lg:gap-16">
          <div className="max-w-xl md:py-4">
            <h2
              id="bundles-heading"
              className="text-3xl font-bold leading-[1.1] tracking-tight text-neutral-950 sm:text-4xl lg:text-[2.75rem]"
            >
              Your everyday smile bundle, sorted.
            </h2>
            <p className="mt-4 text-base leading-relaxed text-neutral-800 sm:mt-5 sm:text-lg">
              An easy way to stay consistent with whitening at home.
            </p>
            <Link
              href="/shop?bundles=true"
              className="mt-8 inline-flex rounded-full bg-neutral-950 px-8 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-neutral-800 sm:mt-10 sm:px-10 sm:text-base"
            >
              Shop now
            </Link>
          </div>

          <div className="relative mx-auto aspect-[4/3] w-full max-w-3xl md:max-w-none">
            <div className="absolute inset-0">
              {BUNDLE_PRODUCTS.map((product) => (
                <Image
                  key={product.src}
                  src={product.src}
                  alt={product.alt}
                  width={product.width}
                  height={product.height}
                  className={product.className}
                  sizes="(max-width: 768px) 45vw, 320px"
                />
              ))}

              <div
                aria-hidden
                className="absolute bottom-[38%] left-1/2 z-30 flex h-10 w-10 -translate-x-1/2 items-center justify-center bg-neutral-950 text-2xl font-bold text-[#ffe500] shadow-lg"
              >
                +
              </div>
            </div>
          </div>
        </div>

        {/* <p className="mx-auto mt-8 max-w-4xl text-center text-[11px] leading-relaxed text-neutral-500 sm:mt-10 sm:text-xs">
          *Watermelon Foaming Mouthwash included free with select Gelos whitening bundles.
          Value based on purchasing items individually at standard prices. T&amp;C&apos;s apply.
        </p> */}
      </div>
    </section>
  )
}
