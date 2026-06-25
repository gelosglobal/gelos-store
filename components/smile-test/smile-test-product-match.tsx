'use client'

import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, Plus } from 'lucide-react'
import { useCart } from '@/components/cart-provider'
import { useLocation } from '@/components/location-provider'
import { useProducts } from '@/components/products-provider'
import type { SmileTestProductMatch } from '@/lib/gelos-ai/smile-test-types'
import { toast } from 'sonner'

type SmileTestProductMatchSectionProps = {
  matches: SmileTestProductMatch[]
}

export function SmileTestProductMatchSection({ matches }: SmileTestProductMatchSectionProps) {
  const { products } = useProducts()
  const { addItem } = useCart()
  const { formatPrice } = useLocation()

  const handleAdd = (productId: string, name: string) => {
    addItem(productId, 1)
    toast.success(`${name} added to cart`)
  }

  return (
    <section className="rounded-[1.75rem] border border-neutral-200 bg-white p-6 shadow-sm sm:p-7">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-neutral-950">Your AI Product Match</h2>
          <p className="mt-1 text-sm text-neutral-600">
            Products selected to match your goals and concerns.
          </p>
        </div>
        <Link
          href="/shop"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#65A30D] transition-colors hover:text-[#15803D]"
        >
          View all products
          <ArrowRight className="size-4" />
        </Link>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {matches.map((match) => {
          const product = products.find((item) => item.id === match.productId)
          if (!product) return null

          return (
            <article
              key={match.productId}
              className="flex min-w-0 flex-col rounded-2xl border border-neutral-200 bg-[#FAFCFE] p-4"
            >
              <span className="inline-flex w-fit rounded-full bg-[#DCFCE7] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-[#15803D]">
                {match.matchPercent}% match
              </span>

              <div className="relative mx-auto mt-3 h-28 w-full sm:h-32">
                <Image
                  src={product.image}
                  alt={product.name}
                  fill
                  className="object-contain"
                  sizes="120px"
                />
              </div>

              <h3 className="mt-3 line-clamp-2 text-sm font-bold leading-snug text-neutral-950">
                {product.name}
              </h3>
              <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-neutral-500">
                {match.description}
              </p>

              <div className="mt-auto flex items-end justify-between gap-2 pt-3">
                <p className="text-sm font-bold text-neutral-950">{formatPrice(product.price)}</p>
                <button
                  type="button"
                  onClick={() => handleAdd(product.id, product.name)}
                  className="flex size-8 items-center justify-center rounded-full bg-[#84CC16] text-neutral-950 transition-colors hover:bg-[#73b512]"
                  aria-label={`Add ${product.name} to cart`}
                >
                  <Plus className="size-4" />
                </button>
              </div>
            </article>
          )
        })}
      </div>
    </section>
  )
}
