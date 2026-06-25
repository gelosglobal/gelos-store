'use client'

import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { flavors, getFlavorCollectionHref } from '@/lib/flavors'

function FlavorCard({
  label,
  coverImage,
  href,
  backgroundColor,
  imagePosition = 'center',
}: {
  label: string
  coverImage: string
  href: string
  backgroundColor: string
  imagePosition?: string
}) {
  return (
    <Link
      href={href}
      className="group relative block aspect-[4/5] overflow-hidden rounded-2xl transition-transform duration-300 hover:-translate-y-0.5 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:ring-offset-2 sm:rounded-3xl"
      style={{ backgroundColor }}
    >
      <Image
        src={coverImage}
        alt=""
        fill
        className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
        style={{ objectPosition: imagePosition }}
        sizes="(max-width: 640px) 45vw, (max-width: 1024px) 30vw, 280px"
      />

      <div
        className="absolute inset-0 bg-gradient-to-b from-black/35 via-black/5 to-black/15"
        aria-hidden
      />

      <div className="absolute inset-x-0 top-0 z-10 p-4 sm:p-5">
        <h3 className="text-lg font-bold leading-tight text-white drop-shadow-sm sm:text-xl">
          {label}
        </h3>
      </div>

      <span
        className="absolute bottom-4 right-4 z-10 flex size-9 items-center justify-center rounded-full bg-white text-neutral-900 shadow-sm transition-transform duration-300 group-hover:scale-105 sm:bottom-5 sm:right-5 sm:size-10"
        aria-hidden
      >
        <ArrowRight className="size-4 sm:size-[18px]" strokeWidth={2} />
      </span>
    </Link>
  )
}

export function OurFlavorsSection() {
  return (
    <section
      aria-labelledby="our-flavors-heading"
      className="border-b border-border bg-white py-12 md:py-16 lg:py-20"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <header className="max-w-2xl">
          <h2
            id="our-flavors-heading"
            className="text-3xl font-bold tracking-tight text-neutral-950 md:text-4xl"
          >
            Our Flavours
          </h2>
          <p className="mt-3 text-base text-neutral-600 md:text-lg">
            Irresistible tastes. Powerful care.
          </p>
          <p className="mt-1 text-base text-neutral-600 md:text-lg">
            Pick a flavour to shop the full range.
          </p>
        </header>

        <div className="mt-8 grid grid-cols-2 gap-3 sm:gap-4 md:mt-10 md:grid-cols-3 lg:grid-cols-4">
          {flavors.map((flavor) => (
            <FlavorCard
              key={flavor.slug}
              label={flavor.label}
              coverImage={flavor.coverImage}
              href={getFlavorCollectionHref(flavor.slug)}
              backgroundColor={flavor.backgroundColor}
              imagePosition={flavor.imagePosition}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
