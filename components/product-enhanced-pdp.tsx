'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { useCart } from '@/components/cart-provider'
import { useLocation } from '@/components/location-provider'
import { ProductAccordionSection } from '@/components/product-accordion-section'
import { ProductAdminVariantPicker } from '@/components/product-admin-variant-picker'
import { ProductFeatureGallery } from '@/components/product-feature-gallery'
import { ProductFlavorPicker } from '@/components/product-flavor-picker'
import { ProductGallery } from '@/components/product-gallery'
import { ProductShareMenu } from '@/components/product-share-menu'
import { getAdminGalleryImages } from '@/lib/product-gallery-images'
import {
  getAdminVariantImages,
  getProductPickerImages,
  getProductVariantPickerOptions,
  getVariantLabelForImage,
  getVariantPickerLabel,
} from '@/lib/product-variant-images'
import { normalizeImageUrl } from '@/lib/image-url'
import { getProductHref } from '@/lib/product-utils'
import { ShopCollectionCard } from '@/components/shop-collection-card'
import { getProductDisplayBadge } from '@/lib/product-tags'
import {
  getProductLineVariantLabel,
  getVariantDisplayName,
} from '@/lib/variant-display'
import type { ProductPdpContent } from '@/lib/product-pdp-content'
import type { Product } from '@/lib/types/product'

type ProductEnhancedPdpProps = {
  product: Product
  variants: Product[]
  communityFavorites: Product[]
  content: ProductPdpContent
  categoryLabel: string
  categoryShopHref: string
  /** Custom flavour/variant picker (e.g. mouthwash cover tiles) */
  flavorPicker?: ReactNode
}

function favoriteBadge(product: Product): 'NEW' | 'Best seller' | undefined {
  return getProductDisplayBadge(product)
}

export function ProductEnhancedPdp({
  product,
  variants,
  communityFavorites,
  content,
  categoryLabel,
  categoryShopHref,
  flavorPicker,
}: ProductEnhancedPdpProps) {
  const { addItem } = useCart()
  const { formatPrice } = useLocation()
  const [quantity, setQuantity] = useState(1)

  const adminVariantImages = getAdminVariantImages(product)
  const hasAdminVariants = adminVariantImages.length > 0
  const pickerImages = getProductPickerImages(product)
  const variantPickerOptions = useMemo(() => {
    const tiles = getProductVariantPickerOptions(product)
    if (tiles.length > 0) {
      const main = normalizeImageUrl(product.image)
      const hasMain = tiles.some(
        (option) => normalizeImageUrl(option.url) === main,
      )
      if (hasMain) return tiles
      return [
        {
          url: main,
          label:
            getVariantLabelForImage(product, main) ||
            product.name.split(' ')[0] ||
            'Default',
        },
        ...tiles,
      ]
    }

    return pickerImages.map((url) => ({
      url,
      label: getVariantLabelForImage(product, url) || 'Variant',
    }))
  }, [pickerImages, product])
  const pickerLabel = getVariantPickerLabel(product.category)

  const [activeImage, setActiveImage] = useState(
    () => normalizeImageUrl(product.image),
  )

  useEffect(() => {
    setActiveImage(normalizeImageUrl(product.image))
  }, [product.id, product.image])

  const featureImages = useMemo(
    () => getAdminGalleryImages(product),
    [product],
  )

  const galleryImages = useMemo(() => {
    const featureSet = new Set(featureImages.map((src) => normalizeImageUrl(src)))
    const codeFallback = content.galleryImages
      .map((s) => normalizeImageUrl(s))
      .filter((url) => !featureSet.has(url))

    // Carousel: main + variant images + legacy code defaults (admin gallery is feature-only)
    const extraGallery = hasAdminVariants ? [] : codeFallback

    const seen = new Set<string>()
    const merged: string[] = []
    const sources = hasAdminVariants
      ? [...pickerImages, ...extraGallery]
      : [activeImage, ...pickerImages, ...extraGallery]

    for (const src of sources) {
      const url = normalizeImageUrl(src)
      if (seen.has(url) || featureSet.has(url)) continue
      seen.add(url)
      merged.push(url)
    }
    return merged.length > 0 ? merged : ['/placeholder.svg']
  }, [
    activeImage,
    content.galleryImages,
    featureImages,
    hasAdminVariants,
    pickerImages,
  ])

  const displayName = getVariantDisplayName(product, activeImage)

  const variantPicker = hasAdminVariants ? (
    <ProductAdminVariantPicker
      options={variantPickerOptions}
      activeImage={activeImage}
      onSelect={setActiveImage}
      label={pickerLabel}
    />
  ) : (
    flavorPicker ?? (
      <ProductFlavorPicker products={variants} currentProduct={product} />
    )
  )

  return (
    <div className="min-h-screen bg-white text-foreground">
      <div className="border-b border-neutral-200">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <nav
            className="flex flex-wrap items-center gap-2 text-sm text-neutral-500"
            aria-label="Breadcrumb"
          >
            <Link href="/" className="hover:text-neutral-950">
              Home
            </Link>
            <span aria-hidden>/</span>
            <Link href="/shop" className="hover:text-neutral-950">
              Shop
            </Link>
            <span aria-hidden>/</span>
            <Link href={categoryShopHref} className="hover:text-neutral-950">
              {categoryLabel}
            </Link>
            <span aria-hidden>/</span>
            <span className="text-neutral-950">{displayName}</span>
          </nav>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:gap-14">
          <ProductGallery
            images={galleryImages}
            alt={displayName}
            badge={content.imageBadge}
            activeSrc={hasAdminVariants ? activeImage : undefined}
            onActiveSrcChange={hasAdminVariants ? setActiveImage : undefined}
          />

          <div className="space-y-6">
            <div>
              <div className="flex items-start justify-between gap-3">
                <h1 className="text-3xl font-bold tracking-tight text-neutral-950 sm:text-4xl lg:text-[2.5rem] lg:leading-tight">
                  {displayName}
                </h1>
                <ProductShareMenu
                  productName={displayName}
                  productHref={getProductHref(product)}
                />
              </div>
              {variantPicker}
            </div>

            <div className="rounded-3xl bg-white p-6 ring-1 ring-neutral-200 sm:p-8">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <p className="text-3xl font-bold text-[#E91E8C] sm:text-4xl">
                  {formatPrice(product.price)}
                </p>
                <div className="inline-flex items-center rounded-lg border border-neutral-200 bg-neutral-50">
                  <button
                    type="button"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="px-4 py-2.5 text-lg hover:bg-neutral-100"
                    aria-label="Decrease quantity"
                  >
                    −
                  </button>
                  <span className="min-w-[2.5rem] px-2 text-center font-semibold tabular-nums">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQuantity(quantity + 1)}
                    className="px-4 py-2.5 text-lg hover:bg-neutral-100"
                    aria-label="Increase quantity"
                  >
                    +
                  </button>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  const variantLabel = hasAdminVariants
                    ? getVariantDisplayName(product, activeImage)
                    : getProductLineVariantLabel(product)

                  addItem(product.id, quantity, {
                    variantImage: hasAdminVariants ? activeImage : undefined,
                    variantLabel,
                  })
                }}
                className="mt-6 w-full rounded-full bg-neutral-950 py-4 text-base font-semibold text-white transition-colors hover:bg-neutral-800"
              >
                Add to cart
              </button>
            </div>

            <div className="grid grid-cols-3 gap-4 rounded-3xl bg-white px-4 py-6 ring-1 ring-neutral-200 sm:px-6">
              {content.highlights.map((item) => (
                <div
                  key={item.label}
                  className="flex flex-col items-center gap-2 text-center"
                >
                  <span
                    className="text-[1.75rem] leading-none sm:text-3xl"
                    role="img"
                    aria-label={item.label}
                  >
                    {item.emoji}
                  </span>
                  <p className="text-xs font-medium leading-snug text-neutral-700 sm:text-sm">
                    {item.label}
                  </p>
                </div>
              ))}
            </div>

            <div className="rounded-3xl bg-white p-6 ring-1 ring-neutral-200 sm:p-8">
              <h2 className="text-xl font-bold text-neutral-950 sm:text-2xl">
                {content.headline}
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-neutral-600 sm:text-base">
                {content.intro}
              </p>
              <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-neutral-700 sm:text-base">
                {content.bullets.map((bullet) => (
                  <li key={bullet}>{bullet}</li>
                ))}
              </ul>
              <div className="mt-6 border-t border-neutral-200">
                <ProductAccordionSection items={content.detailsAccordion} />
              </div>
            </div>
          </div>
        </div>

        <ProductFeatureGallery images={featureImages} alt={displayName} />

        {content.usageSteps && content.usageSteps.length > 0 && (
          <section className="mt-14 lg:mt-16">
            <h2 className="text-xl font-bold text-neutral-950 sm:text-2xl">
              How to use your tongue scraper
            </h2>
            <p className="mt-2 max-w-2xl text-sm text-neutral-600 sm:text-base">
              Add this 30-second step before brushing for a cleaner tongue and
              fresher breath.
            </p>
            <ol className="mt-8 grid gap-4 sm:grid-cols-3 sm:gap-6">
              {content.usageSteps.map((step, index) => (
                <li
                  key={step.title}
                  className="rounded-3xl bg-neutral-50 px-5 py-6 ring-1 ring-neutral-200 sm:px-6"
                >
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-neutral-950 text-sm font-bold text-white">
                    {index + 1}
                  </span>
                  <h3 className="mt-4 text-base font-bold text-neutral-950">
                    {step.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-neutral-600">
                    {step.body}
                  </p>
                </li>
              ))}
            </ol>
          </section>
        )}

        <section className="mt-16 lg:mt-20">
          <h2 className="text-2xl font-bold text-neutral-950 sm:text-3xl">
            Got questions? We&apos;ve got answers
          </h2>
          <div className="mt-6 rounded-3xl bg-white px-4 ring-1 ring-neutral-200 sm:px-6">
            <ProductAccordionSection
              items={content.faq}
              variant="faq"
              type="single"
            />
          </div>
        </section>

        {communityFavorites.length > 0 && (
          <section className="mt-16 lg:mt-20">
            <h2 className="text-2xl font-bold text-neutral-950 sm:text-3xl">
              People also love:
            </h2>
            <p className="mt-1 text-neutral-600">
              Shop our community favourites
            </p>
            <div className="mt-8 grid grid-cols-2 gap-6 sm:grid-cols-4 sm:gap-8">
              {communityFavorites.map((p) => (
                <ShopCollectionCard
                  key={p.id}
                  product={p}
                  badge={favoriteBadge(p)}
                />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
