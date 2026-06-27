'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useMemo } from 'react'
import { useLocation } from '@/components/location-provider'
import { useProducts } from '@/components/products-provider'
import { extractProductLinks } from '@/lib/gelos-ai/chat-reply'
import { isExternalImageUrl } from '@/lib/image-url'
import { getProductImageDisplayClass } from '@/lib/product-image-display'
import { getDefaultVariantDisplayImage } from '@/lib/product-variant-images'
import { getProductHref, getProductSlug } from '@/lib/product-utils'
import type { Product } from '@/lib/types/product'
import { cn } from '@/lib/utils'

function resolveProductFromHref(
  products: Product[],
  href: string,
): Product | undefined {
  const normalized = href.replace(/\/$/, '')
  const slug = normalized.replace('/product/', '')

  return products.find(
    (product) =>
      getProductHref(product) === normalized || getProductSlug(product) === slug,
  )
}

type GelosAiProductRecommendationCardsProps = {
  content: string
  className?: string
}

export function GelosAiProductRecommendationCards({
  content,
  className,
}: GelosAiProductRecommendationCardsProps) {
  const { products } = useProducts()
  const { formatPrice } = useLocation()

  const recommendations = useMemo(
    () =>
      extractProductLinks(content)
        .map((link) => {
          const product = resolveProductFromHref(products, link.href)
          if (!product) return null
          return {
            href: link.href,
            product,
            image: getDefaultVariantDisplayImage(product),
          }
        })
        .filter(
          (
            item,
          ): item is {
            href: string
            product: Product
            image: string
          } => Boolean(item),
        ),
    [content, products],
  )

  if (!recommendations.length) return null

  return (
    <div
      className={cn(
        'flex gap-3 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
        className,
      )}
    >
      {recommendations.map(({ href, product, image }) => (
        <Link
          key={href}
          href={href}
          className="flex w-[8.75rem] shrink-0 flex-col overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm transition-shadow hover:shadow-md sm:w-36"
        >
          <div className="relative aspect-square bg-neutral-50">
            <Image
              src={image}
              alt={product.name}
              fill
              className={getProductImageDisplayClass(
                product.id,
                image,
                'object-contain p-2',
              )}
              sizes="144px"
              unoptimized={isExternalImageUrl(image)}
            />
          </div>
          <div className="flex flex-1 flex-col p-2.5">
            <p className="line-clamp-2 text-xs font-semibold leading-snug text-neutral-950">
              {product.name}
            </p>
            <p className="mt-1.5 text-xs font-bold text-[#E91E8C]">
              {formatPrice(product.price)}
            </p>
          </div>
        </Link>
      ))}
    </div>
  )
}
