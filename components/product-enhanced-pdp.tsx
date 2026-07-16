'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { useSearchParams } from 'next/navigation'
import { useCart } from '@/components/cart-provider'
import { useLocation } from '@/components/location-provider'
import { ProductAccordionSection } from '@/components/product-accordion-section'
import { ProductAdminVariantPicker } from '@/components/product-admin-variant-picker'
import { ProductFeatureGallery } from '@/components/product-feature-gallery'
import { ProductGallery } from '@/components/product-gallery'
import { ProductRating } from '@/components/product-rating'
import { ProductShareMenu } from '@/components/product-share-menu'
import { ProductVariantChoiceDialog } from '@/components/product-variant-choice-dialog'
import {
  getAdminGalleryMedia,
  getAdminCarouselImages,
  getProductCarouselImages,
} from '@/lib/product-gallery-images'
import {
  getAdminVariantImages,
  getAvailableStockForVariant,
  getDefaultVariantDisplayImage,
  getProductPickerImages,
  getProductVariantPickerOptions,
  getVariantPickerLabel,
  productNeedsVariantChoice,
} from '@/lib/product-variant-images'
import { getProductHref } from '@/lib/product-utils'
import { ShopCollectionCard } from '@/components/shop-collection-card'
import { getProductDisplayBadge } from '@/lib/product-tags'
import {
  getUsageStepsSectionMeta,
  type ProductPdpContent,
} from '@/lib/product-pdp-content'
import {
  getVariantDisplayName,
  getVariantSelectionForCart,
} from '@/lib/variant-display'
import { findVariantOptionByFlavourSlug } from '@/lib/shop-catalog-items'
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
  const searchParams = useSearchParams()
  const flavourParam = searchParams.get('flavour')
  const [quantity, setQuantity] = useState(1)
  const [variantDialogOpen, setVariantDialogOpen] = useState(false)

  const adminVariantImages = getAdminVariantImages(product)
  const hasAdminVariants = adminVariantImages.length > 0
  const needsVariantChoice = productNeedsVariantChoice(product)
  const pickerImages = getProductPickerImages(product)
  const variantPickerOptions = useMemo(
    () => getProductVariantPickerOptions(product),
    [product],
  )
  const pickerLabel = getVariantPickerLabel(product.category)

  const initialImage = useMemo(() => {
    if (flavourParam) {
      const match = findVariantOptionByFlavourSlug(product, flavourParam)
      if (match?.url) return match.url
    }
    return getDefaultVariantDisplayImage(product)
  }, [flavourParam, product])

  const [activeImage, setActiveImage] = useState(initialImage)

  useEffect(() => {
    if (flavourParam) {
      const match = findVariantOptionByFlavourSlug(product, flavourParam)
      if (match?.url) {
        setActiveImage(match.url)
        return
      }
    }
    const custom = getAdminCarouselImages(product)
    if (custom.length > 0) {
      setActiveImage(custom[0])
      return
    }
    setActiveImage(getDefaultVariantDisplayImage(product))
  }, [
    flavourParam,
    product.id,
    product.image,
    product.carouselImages,
    product.variantImageOptions,
    product.variantImages,
  ])

  useEffect(() => {
    setQuantity((current) => {
      const max = getAvailableStockForVariant(product, activeImage)
      if (max <= 0) return 1
      return Math.min(current, max)
    })
  }, [activeImage, product])

  const featureMedia = useMemo(
    () => getAdminGalleryMedia(product),
    [product],
  )

  const featureImages = useMemo(
    () => featureMedia.filter((item) => item.type === 'image').map((item) => item.url),
    [featureMedia],
  )

  const customCarousel = useMemo(
    () => getAdminCarouselImages(product),
    [product],
  )

  const carouselThumbnails = useMemo(
    () =>
      getProductCarouselImages({
        product,
        pickerImages,
        contentGalleryFallback: content.galleryImages,
        featureImages,
        hasAdminVariants,
        activeImage,
      }),
    [
      activeImage,
      content.galleryImages,
      featureImages,
      hasAdminVariants,
      pickerImages,
      product,
    ],
  )

  const galleryControlled =
    carouselThumbnails.length > 1 ||
    customCarousel.length > 0 ||
    hasAdminVariants

  const displayName = getVariantDisplayName(product, activeImage)
  const usageSection = getUsageStepsSectionMeta(product.category, content)
  const availableStock = getAvailableStockForVariant(product, activeImage)
  const isOutOfStock = availableStock <= 0
  const hasAnyFlavourInStock = variantPickerOptions.some(
    (option) => getAvailableStockForVariant(product, option.url) > 0,
  )
  const canAddToCart = needsVariantChoice
    ? hasAnyFlavourInStock
    : !isOutOfStock

  const variantPicker = hasAdminVariants ? (
    <ProductAdminVariantPicker
      options={variantPickerOptions}
      activeImage={activeImage}
      onSelect={setActiveImage}
      label={pickerLabel}
      isOptionDisabled={(option) =>
        getAvailableStockForVariant(product, option.url) <= 0
      }
    />
  ) : (
    flavorPicker
  )

  const handleAddToCart = () => {
    if (needsVariantChoice) {
      setVariantDialogOpen(true)
      return
    }

    const { variantImage, variantLabel } = getVariantSelectionForCart(
      product,
      activeImage,
    )
    addItem(product.id, quantity, { variantImage, variantLabel })
  }

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
            images={carouselThumbnails}
            alt={displayName}
            badge={content.imageBadge}
            activeSrc={galleryControlled ? activeImage : undefined}
            onActiveSrcChange={galleryControlled ? setActiveImage : undefined}
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
              <ProductRating
                rating={product.rating}
                reviews={product.reviews}
                className="mt-3"
              />
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
                    onClick={() =>
                      setQuantity(
                        Math.min(
                          needsVariantChoice
                            ? Math.max(product.stock, availableStock)
                            : availableStock,
                          quantity + 1,
                        ),
                      )
                    }
                    disabled={
                      needsVariantChoice
                        ? quantity >= Math.max(product.stock, 1)
                        : quantity >= availableStock
                    }
                    className="px-4 py-2.5 text-lg hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-40"
                    aria-label="Increase quantity"
                  >
                    +
                  </button>
                </div>
              </div>

              {!needsVariantChoice && isOutOfStock ? (
                <p className="mt-4 text-sm font-medium text-red-600">
                  This flavour is currently out of stock. Pick another flavour.
                </p>
              ) : !needsVariantChoice && availableStock <= 5 ? (
                <p className="mt-4 text-sm text-neutral-600">
                  Only {availableStock} left for this flavour.
                </p>
              ) : needsVariantChoice ? (
                <p className="mt-4 text-sm text-neutral-600">
                  You&apos;ll choose your flavour in the next step.
                </p>
              ) : null}

              <button
                type="button"
                onClick={handleAddToCart}
                disabled={!canAddToCart}
                className="mt-6 w-full rounded-full bg-neutral-950 py-4 text-base font-semibold text-white transition-colors hover:bg-neutral-800 disabled:cursor-not-allowed disabled:bg-neutral-400"
              >
                {!canAddToCart ? 'Out of stock' : 'Add to cart'}
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

        <ProductFeatureGallery items={featureMedia} alt={displayName} />

        {usageSection && content.usageSteps && content.usageSteps.length > 0 && (
          <section className="mt-14 lg:mt-16">
            <h2 className="text-xl font-bold text-neutral-950 sm:text-2xl">
              {usageSection.title}
            </h2>
            <p className="mt-2 max-w-2xl text-sm text-neutral-600 sm:text-base">
              {usageSection.intro}
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

      {needsVariantChoice ? (
        <ProductVariantChoiceDialog
          open={variantDialogOpen}
          onOpenChange={setVariantDialogOpen}
          product={product}
          quantity={quantity}
          onConfirm={({ variantImage, variantLabel }) => {
            addItem(product.id, quantity, { variantImage, variantLabel })
            if (variantImage) setActiveImage(variantImage)
          }}
        />
      ) : null}
    </div>
  )
}
