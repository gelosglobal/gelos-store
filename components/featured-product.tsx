'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useProducts } from '@/components/products-provider'
import { productHasTag } from '@/lib/product-tags'
import { getProductHref } from '@/lib/product-utils'

/** Paste your video path here (file in `public/`, e.g. `/gelos/my-feature.mp4`) */
const VIDEO_SRC = '/gelos/gelos-video2.mp4'

/** Optional poster shown before the video loads */
const POSTER_SRC = '/gelos/IMG_8031.JPG'

export function FeaturedProduct() {
  const { products, getProductById, getTagCollectionOrder } = useProducts()
  const useVideo = VIDEO_SRC.trim().length > 0
  const featuredOrder = getTagCollectionOrder('featured')
  const featuredProduct =
    (featuredOrder[0] ? getProductById(featuredOrder[0]) : undefined) ??
    products.find((p) => productHasTag(p, 'featured')) ??
    getProductById('1')
  const shopHref = featuredProduct ? getProductHref(featuredProduct) : '/shop'

  return (
    <section className="border-b border-border bg-background">
      <div className="grid grid-cols-1 items-center gap-8 py-10 sm:py-12 lg:grid-cols-2 lg:gap-12 lg:py-14">
        {/* Copy */}
        <div className="flex flex-col justify-center bg-background px-6 sm:px-10 lg:pl-20 lg:pr-14 xl:pl-28 xl:pr-16">
          <h2 className="max-w-md text-4xl font-bold leading-[1.1] tracking-tight text-neutral-950 sm:text-5xl lg:text-[3.25rem]">
            Bright smiles
            <br />
            start with Gelos
          </h2>
          <p className="mt-6 max-w-md text-base leading-relaxed text-neutral-600 sm:text-lg">
            Supercharge your routine with ingredients your teeth and mouth love.{' '}
            <span className="font-semibold text-neutral-900">
              NEW Gelos Tumeric whitening powder
            </span>{' '}
            Order now.
          </p>
          <Link
            href={'/product/tumeric-teeth-whitening-powder'}
            className="mt-8 inline-flex w-[17.5rem] max-w-full items-center justify-center rounded-full bg-neutral-950 py-4 text-base font-semibold text-white transition-colors hover:bg-neutral-800"
          >
            Shop now
          </Link>
        </div>

        {/* Media — inset with rounded corners */}
        <div className="flex justify-center bg-background px-6 pb-2 sm:px-10 lg:justify-end lg:pl-8 lg:pr-14 xl:pr-20">
          <div className="relative aspect-[4/5] w-full max-w-[min(100%,420px)] overflow-hidden rounded-[1.75rem] shadow-md ring-1 ring-black/5 sm:max-w-[480px] lg:max-h-[min(520px,62vh)] lg:max-w-[520px] lg:translate-x-4 xl:translate-x-8">
            {useVideo ? (
              <video
                className="absolute inset-0 h-full w-full object-cover object-center"
                src={VIDEO_SRC}
                poster={POSTER_SRC || undefined}
                autoPlay
                loop
                muted
                playsInline
                preload="auto"
              />
            ) : (
              <Image
                src={POSTER_SRC}
                alt="Gelos featured product"
                fill
                className="object-cover object-center"
                sizes="(max-width: 768px) 90vw, 520px"
              />
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
