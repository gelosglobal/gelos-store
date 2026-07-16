'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useMemo } from 'react'
import { ShopCollectionCard } from '@/components/shop-collection-card'
import { useLocation } from '@/components/location-provider'
import { useProducts } from '@/components/products-provider'
import { US_INHALER_PRODUCT_IDS } from '@/lib/us-market'
import { getProductDisplayBadge } from '@/lib/product-tags'
import { cn } from '@/lib/utils'

export default function UsInhalersPage() {
  const { products } = useProducts()
  const { locationId, setLocationId, isHydrated } = useLocation()

  useEffect(() => {
    if (!isHydrated) return
    if (locationId !== 'usa') {
      setLocationId('usa')
    }
  }, [isHydrated, locationId, setLocationId])

  const inhalers = useMemo(() => {
    const order = new Map<string, number>(
      US_INHALER_PRODUCT_IDS.map((id, index) => [id, index]),
    )
    return products
      .filter((p) => order.has(p.id))
      .sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0))
  }, [products])

  return (
    <div className="min-h-screen bg-white text-foreground">
      <section className="relative overflow-hidden bg-neutral-950">
        <div className="absolute inset-0">
          <Image
            src="/gelos/mango-inhaler.png"
            alt=""
            fill
            priority
            className="object-cover object-center opacity-35"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-neutral-950 via-neutral-950/85 to-neutral-950/40" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/70">
            USA · Ships nationwide
          </p>
          <h1 className="mt-4 max-w-2xl text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-[3.25rem] lg:leading-tight">
            Gelos
          </h1>
          <p className="mt-3 max-w-xl text-xl font-medium text-white sm:text-2xl">
            Nasal inhalers for clearer breathing on the go
          </p>
          <p className="mt-4 max-w-lg text-base leading-relaxed text-white/85 sm:text-lg">
            Fruit-energy aromatherapy inhalers — the only Gelos products
            available for the US market. Secure checkout with Stripe.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href="#shop-inhalers"
              className="inline-flex rounded-full bg-white px-7 py-3 text-sm font-semibold text-neutral-950 transition-colors hover:bg-neutral-100"
            >
              Shop inhalers
            </a>
            <Link
              href="/cart"
              className="inline-flex rounded-full border border-white/40 px-7 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10"
            >
              View cart
            </Link>
          </div>
        </div>
      </section>

      <section
        id="shop-inhalers"
        className="border-b border-neutral-200 bg-white"
      >
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <p className="text-sm font-medium text-neutral-700">
            {inhalers.length} inhaler
            {inhalers.length === 1 ? '' : 's'} · Prices in USD · Pay with Stripe
          </p>
        </div>
      </section>

      <section className="bg-neutral-50/80">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8 lg:py-14">
          {inhalers.length === 0 ? (
            <p className="text-center text-neutral-500">
              Inhalers are loading — refresh if nothing appears.
            </p>
          ) : (
            <div
              className={cn(
                'grid gap-6 sm:gap-8',
                inhalers.length === 1
                  ? 'mx-auto max-w-sm'
                  : 'grid-cols-2 lg:max-w-3xl lg:mx-auto',
              )}
            >
              {inhalers.map((product) => (
                <ShopCollectionCard
                  key={product.id}
                  product={product}
                  badge={getProductDisplayBadge(product)}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="border-t border-neutral-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <h2 className="text-xl font-bold tracking-tight text-neutral-950 sm:text-2xl">
            How US checkout works
          </h2>
          <ol className="mt-6 grid gap-6 sm:grid-cols-3">
            {[
              {
                step: '1',
                title: 'Add an inhaler',
                body: 'Choose Grape Mint or Fruit Energy and add it to your cart.',
              },
              {
                step: '2',
                title: 'Enter delivery details',
                body: 'We ship across the USA — include your full shipping address at checkout.',
              },
              {
                step: '3',
                title: 'Pay with Stripe',
                body: 'Cards and Apple Pay / Google Pay where available — secure USD payment.',
              },
            ].map((item) => (
              <li key={item.step} className="flex gap-4">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-neutral-950 text-sm font-semibold text-white">
                  {item.step}
                </span>
                <div>
                  <p className="font-semibold text-neutral-950">{item.title}</p>
                  <p className="mt-1 text-sm leading-relaxed text-neutral-600">
                    {item.body}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>
    </div>
  )
}
