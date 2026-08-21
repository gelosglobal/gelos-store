'use client'

import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, ChevronRight } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useProducts } from '@/components/products-provider'
import { useIsMobile } from '@/components/ui/use-mobile'
import { navCategories, type NavCategoryId } from '@/lib/nav-config'
import { normalizeImageUrl } from '@/lib/image-url'
import { getResolvableBundleProductIds } from '@/lib/product-bundle-pricing'
import { sortProductsByLineOrder } from '@/lib/product-line-keys'
import { getProductLineParentConfigForCategory } from '@/lib/product-line-parents'
import { productHasTag } from '@/lib/product-tags'
import { expandProductsForShopCatalog } from '@/lib/shop-catalog-items'
import type { Product } from '@/lib/types/product'
import type { ProductBundle } from '@/lib/types/product-bundle'
import { cn } from '@/lib/utils'

type MegaMenuProps = {
  onNavigate?: () => void
}

type MegaMenuPreviewItem = {
  key: string
  href: string
  displayName: string
  image: string
}

/** Max products shown in the grid (2 rows × 4 columns on desktop) */
const PRODUCT_PREVIEW_LIMIT = 8

function bundlePreviewItems(
  bundles: ProductBundle[],
  products: Product[],
): MegaMenuPreviewItem[] {
  return bundles
    .filter((bundle) => bundle.active && bundle.productIds.length > 0)
    .filter(
      (bundle) =>
        getResolvableBundleProductIds(bundle.productIds, products).length > 0,
    )
    .slice()
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((bundle) => {
      const firstProduct = products.find((product) =>
        bundle.productIds.includes(product.id),
      )
      return {
        key: bundle.id,
        href: '/shop?bundles=true',
        displayName: bundle.name,
        image: normalizeImageUrl(
          bundle.image || firstProduct?.image || '/gelos/watermelon2.jpeg',
        ),
      }
    })
}

export function MegaMenu({ onNavigate }: MegaMenuProps) {
  const { products, productBundles } = useProducts()
  const isMobile = useIsMobile()
  const [activeCategory, setActiveCategory] = useState<NavCategoryId>('toothpaste')
  const previewLimit = isMobile ? 4 : PRODUCT_PREVIEW_LIMIT

  const activeConfig =
    navCategories.find((c) => c.id === activeCategory) ?? navCategories[0]
  const isBundlesCategory = activeCategory === 'packages'

  const filteredProducts = useMemo(() => {
    let next: typeof products = []
    if (activeConfig.productIds) {
      const idSet = new Set(activeConfig.productIds)
      const byIds = products.filter((p) => idSet.has(p.id))
      if (byIds.length > 0) {
        next = byIds
      } else if (activeCategory === 'bestsellers') {
        // Legacy Prisma IDs won't match Shopify product IDs — use tags instead.
        next = products.filter((p) => productHasTag(p, 'best-seller'))
      }
    } else if (activeConfig.productCategory) {
      next = products.filter((p) => p.category === activeConfig.productCategory)
    } else {
      next = products
    }

    const lineConfig = activeConfig.productCategory
      ? getProductLineParentConfigForCategory(activeConfig.productCategory)
      : null
    if (lineConfig) {
      return sortProductsByLineOrder(next, lineConfig.order)
    }
    return next
  }, [activeCategory, activeConfig, products])

  const catalogItems = useMemo(
    // Mega menu lists each flavour (not the collapsed "Flavored Toothpaste" parent).
    () =>
      expandProductsForShopCatalog(filteredProducts, {
        collapseLineParents: false,
        expandGenericMultiFlavour: true,
      }),
    [filteredProducts],
  )

  const bundleItems = useMemo(
    () => bundlePreviewItems(productBundles, products),
    [productBundles, products],
  )

  const allPreviewItems = isBundlesCategory ? bundleItems : catalogItems.map((item) => ({
    key: item.key,
    href: item.href,
    displayName: item.displayName,
    image: item.image,
  }))

  const previewItems = allPreviewItems.slice(0, previewLimit)
  const totalCount = allPreviewItems.length
  const hasMoreProducts = totalCount > previewLimit

  return (
    <div className="font-nav flex flex-col overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-2xl lg:h-[min(640px,90vh)] lg:flex-row">
      {/* Sidebar */}
      <aside className="flex w-full min-h-0 shrink-0 flex-col border-b border-neutral-100 lg:h-full lg:w-[260px] lg:border-b-0 lg:border-r xl:w-[280px]">
        <nav className="flex max-h-[min(52vh,420px)] flex-col gap-0.5 overflow-y-auto overscroll-contain p-3 [scrollbar-width:thin] lg:max-h-none lg:min-h-0 lg:flex-1 lg:p-4 lg:pr-2">
          {navCategories.map((category) => {
            const Icon = category.icon
            const isActive = activeCategory === category.id
            return (
              <Link
                key={category.id}
                href={category.href}
                onClick={onNavigate}
                onMouseEnter={() => setActiveCategory(category.id)}
                onFocus={() => setActiveCategory(category.id)}
                className={cn(
                  'flex w-full shrink-0 items-center gap-2.5 rounded-xl px-2.5 py-2.5 text-left text-sm font-semibold tracking-wide transition-colors lg:gap-3 lg:px-3 lg:py-3',
                  isActive
                    ? 'bg-neutral-100 text-foreground'
                    : 'text-foreground/80 hover:bg-neutral-50',
                )}
              >
                <span
                  className={cn(
                    'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors lg:h-9 lg:w-9',
                    isActive
                      ? 'bg-neutral-950 text-white'
                      : 'bg-neutral-100 text-foreground',
                  )}
                >
                  <Icon className="h-4 w-4" strokeWidth={2} />
                </span>
                <span className="min-w-0 flex-1 leading-snug">{category.label}</span>
                <ChevronRight className="h-4 w-4 shrink-0 text-neutral-400" />
              </Link>
            )
          })}
        </nav>

        <div className="shrink-0 border-t border-neutral-100 bg-white p-3 lg:p-4">
          <Link
            href="/shop?bundles=true"
            onClick={onNavigate}
            className="group relative mb-3 hidden overflow-hidden rounded-xl lg:block"
          >
            <div className="relative h-[5.5rem] w-full">
              <Image
                src="/gelos/GELOS1530.jpg"
                alt="Friends smiling with Gelos toothpaste bundles"
                fill
                className="object-cover object-center"
                sizes="280px"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/45 to-black/20" />
              <div className="absolute inset-0 flex flex-col justify-center px-3.5">
                <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-white/90">
                  Bundle builder
                </p>
                <p className="mt-0.5 text-sm font-semibold text-white">
                  Shop curated sets
                </p>
              </div>
              <span className="absolute bottom-2.5 right-2.5 flex h-7 w-7 items-center justify-center rounded-full bg-[#E91E8C] text-white transition-transform group-hover:scale-105">
                <ArrowRight className="h-3.5 w-3.5" />
              </span>
            </div>
          </Link>

          <Link
            href="/shop"
            onClick={onNavigate}
            className="flex items-center gap-1 text-sm font-semibold text-foreground hover:underline"
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
            {totalCount}{' '}
            {isBundlesCategory
              ? totalCount === 1
                ? 'bundle'
                : 'bundles'
              : totalCount === 1
                ? 'product'
                : 'products'}
          </p>
          <Link
            href={activeConfig.href}
            onClick={onNavigate}
            className="text-sm font-semibold hover:underline"
          >
            {isBundlesCategory ? 'View all bundles' : 'View category'}
          </Link>
        </div>

        <div className="flex min-h-0 flex-1 flex-col p-4 lg:p-6 lg:pt-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 lg:grid-rows-2">
            {previewItems.map((item) => (
              <Link
                key={item.key}
                href={item.href}
                onClick={onNavigate}
                className="group flex flex-col"
              >
                <div className="relative aspect-square overflow-hidden rounded-2xl bg-white transition-transform group-hover:scale-[1.02]">
                  <Image
                    src={item.image}
                    alt={item.displayName}
                    fill
                    className={cn(megaMenuImageClass(item.image))}
                    sizes="160px"
                  />
                </div>
                <p className="mt-2 line-clamp-2 text-center text-xs font-medium leading-snug text-foreground">
                  {item.displayName}
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
                ({totalCount - previewLimit} more)
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
  const path = src.split('?')[0].toLowerCase()
  const lower = src.toLowerCase()
  if (
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
  if (
    (path.endsWith('.png') || path.endsWith('.webp')) &&
    (path.includes('/gelos/') || path.includes('/_next/'))
  ) {
    return 'object-contain p-2'
  }
  return 'object-cover'
}
