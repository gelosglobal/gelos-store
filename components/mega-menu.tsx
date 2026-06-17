'use client'

import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, ChevronRight } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useProducts } from '@/components/products-provider'
import { useIsMobile } from '@/components/ui/use-mobile'
import { navCategories, type NavCategoryId } from '@/lib/nav-config'
import { getProductHref } from '@/lib/product-utils'
import { cn } from '@/lib/utils'

type MegaMenuProps = {
  onNavigate?: () => void
}

/** Max products shown in the grid (2 rows × 4 columns on desktop) */
const PRODUCT_PREVIEW_LIMIT = 8

export function MegaMenu({ onNavigate }: MegaMenuProps) {
  const { products } = useProducts()
  const isMobile = useIsMobile()
  const [activeCategory, setActiveCategory] = useState<NavCategoryId>('toothpaste')
  const previewLimit = isMobile ? 4 : PRODUCT_PREVIEW_LIMIT

  const activeConfig = navCategories.find((c) => c.id === activeCategory) ?? navCategories[0]

  const filteredProducts = useMemo(() => {
    if (activeConfig.productIds) {
      const idSet = new Set(activeConfig.productIds)
      return products.filter((p) => idSet.has(p.id))
    }
    if (activeConfig.productCategory) {
      return products.filter((p) => p.category === activeConfig.productCategory)
    }
    if (activeCategory === 'packages') {
      return products.filter((p) => p.price <= 20)
    }
    return products
  }, [activeCategory, activeConfig])

  const previewProducts = filteredProducts.slice(0, previewLimit)
  const hasMoreProducts = filteredProducts.length > previewLimit

  return (
    <div className="font-nav flex h-[min(640px,90vh)] flex-col overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-2xl lg:flex-row">
      {/* Sidebar */}
      <aside className="flex w-full shrink-0 flex-col border-b border-neutral-100 lg:w-[260px] lg:border-b-0 lg:border-r xl:w-[280px]">
        <nav className="flex flex-1 flex-col gap-1 p-3 lg:min-h-[280px] lg:p-4 lg:pb-2">
          {navCategories.map((category) => {
            const Icon = category.icon
            const isActive = activeCategory === category.id
            return (
              <button
                key={category.id}
                type="button"
                onMouseEnter={() => setActiveCategory(category.id)}
                onFocus={() => setActiveCategory(category.id)}
                onClick={() => setActiveCategory(category.id)}
                className={cn(
                  'flex w-full items-center gap-3 rounded-xl px-3 py-3.5 text-left text-sm font-semibold tracking-wide transition-colors',
                  isActive
                    ? 'bg-neutral-100 text-foreground'
                    : 'text-foreground/80 hover:bg-neutral-50',
                )}
              >
                <span
                  className={cn(
                    'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors',
                    isActive
                      ? 'bg-neutral-950 text-white'
                      : 'bg-neutral-100 text-foreground',
                  )}
                >
                  <Icon className="h-4 w-4" strokeWidth={2} />
                </span>
                <span className="flex-1">{category.label}</span>
                <ChevronRight className="h-4 w-4 shrink-0 text-neutral-400" />
              </button>
            )
          })}
        </nav>

        <div className="mt-auto hidden p-4 lg:block">
          <Link
            href="/shop?bundles=true"
            onClick={onNavigate}
            className="group relative block overflow-hidden rounded-2xl"
          >
            <div className="relative aspect-[4/3] w-full">
              <Image
                src="/gelos/GELOS1530.jpg"
                alt="Friends smiling with Gelos toothpaste bundles"
                fill
                className="object-cover object-center"
                sizes="280px"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-4">
                <p className="text-lg font-bold uppercase tracking-wide text-white">
                  Bundle builder
                </p>
                <span className="mt-2 flex items-center justify-between rounded-full bg-[#E91E8C] px-4 py-2 text-xs font-semibold text-white">
                  Create your own package
                  <ArrowRight className="h-3.5 w-3.5" />
                </span>
              </div>
            </div>
          </Link>

          <Link
            href="/shop"
            onClick={onNavigate}
            className="mt-4 flex items-center gap-1 text-sm font-semibold text-foreground hover:underline"
          >
            See all products
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      </aside>

      {/* Product grid */}
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <div className="flex items-center justify-between border-b border-neutral-100 px-4 py-3 lg:px-6">
          <p className="text-sm font-medium text-neutral-500">
            {filteredProducts.length} products
          </p>
          <Link
            href={activeConfig.href}
            onClick={onNavigate}
            className="text-sm font-semibold hover:underline"
          >
            View category
          </Link>
        </div>

        <div className="flex min-h-0 flex-1 flex-col p-4 lg:p-6 lg:pt-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 lg:grid-rows-2">
            {previewProducts.map((product) => (
              <Link
                key={product.id}
                href={getProductHref(product)}
                onClick={onNavigate}
                className="group flex flex-col"
              >
                <div className="relative aspect-square overflow-hidden rounded-2xl bg-white transition-transform group-hover:scale-[1.02]">
                  <Image
                    src={product.image}
                    alt={product.name}
                    fill
                    className={cn(megaMenuImageClass(product.image))}
                    sizes="160px"
                  />
                </div>
                <p className="mt-2 line-clamp-2 text-center text-xs font-medium leading-snug text-foreground">
                  {product.name}
                </p>
              </Link>
            ))}
          </div>

          {hasMoreProducts && (
            <Link
              href={activeConfig.href}
              onClick={onNavigate}
              className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-full border border-neutral-200 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-neutral-50"
            >
              See more
              <span className="text-neutral-500">
                ({filteredProducts.length - previewLimit} more)
              </span>
              <ChevronRight className="h-4 w-4" />
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}

function megaMenuImageClass(src: string) {
  const lower = src.toLowerCase()
  if (
    lower.endsWith('.png') ||
    lower.includes('watermelon') ||
    lower.includes('grape-mint') ||
    lower.includes('energy-drink') ||
    lower.includes('foaming-mouthwash') ||
    lower.includes('led-whitening') ||
    lower.includes('inhaler') ||
    lower.includes('-toothpaste')
  ) {
    return 'object-contain p-2'
  }
  return 'object-cover'
}
