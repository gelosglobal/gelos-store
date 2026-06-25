'use client'

import Image from 'next/image'
import type { CartUpsellOffer } from '@/lib/cart-upsells'
import { getProductImageDisplayClass } from '@/lib/product-image-display'
import { cn } from '@/lib/utils'

type CartUpsellBannerProps = {
  offer: CartUpsellOffer
  formatPrice: (amount: number) => string
  onAccept: () => void
  className?: string
  compact?: boolean
}

export function CartUpsellBanner({
  offer,
  formatPrice,
  onAccept,
  className,
  compact = false,
}: CartUpsellBannerProps) {
  const isQuantity = offer.kind === 'quantity'
  const crossSellShortName =
    offer.kind === 'cross-sell'
      ? offer.productName.split(' ').slice(0, 4).join(' ') +
        (offer.productName.split(' ').length > 4 ? '…' : '')
      : ''

  return (
    <div className={cn('relative', className)}>
      <div
        className={cn(
          'relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#E0F2FE] via-[#F0F9FF] to-[#DBEAFE]',
          compact && 'rounded-xl',
        )}
      >
        <div
          className={cn(
            'absolute top-0 left-0 z-10 rounded-br-xl px-3 py-1.5 text-[11px] font-bold tracking-wide uppercase sm:px-4 sm:text-xs',
            compact ? 'rounded-tl-xl' : 'rounded-tl-2xl',
          )}
          style={{
            backgroundColor: offer.badgeStyle.background,
            color: offer.badgeStyle.text,
          }}
        >
          {offer.badge}
        </div>

        <div
          className={cn(
            'flex min-h-[9.5rem] items-stretch pt-8 sm:min-h-[10.5rem] sm:pt-9',
            compact && 'min-h-[8.5rem] pt-7 sm:min-h-[9rem]',
          )}
        >
          <div
            className={cn(
              'flex flex-1 flex-col justify-center gap-3 px-5 py-5 pr-2 sm:gap-4 sm:px-6 sm:py-6',
              compact && 'gap-2 px-4 py-4 pr-1 sm:px-4 sm:py-4',
            )}
          >
            {isQuantity ? (
              <>
                <h3
                  className={cn(
                    'text-xl leading-tight font-bold text-neutral-950 sm:text-2xl',
                    compact && 'text-base sm:text-lg',
                  )}
                >
                  Get {offer.targetQuantity} for{' '}
                  <span className="inline-flex flex-wrap items-baseline gap-2">
                    <span className="text-base font-semibold text-neutral-500 line-through sm:text-lg">
                      {formatPrice(offer.fullTotal)}
                    </span>
                    <span className="text-[#E91E8C]">
                      {formatPrice(offer.offerTotal)}
                    </span>
                  </span>
                </h3>
                <p className="text-sm leading-snug text-neutral-700 sm:text-base">
                  Enjoy an instant{' '}
                  <span className="font-bold">saving</span> of over{' '}
                  {offer.savingsPercent}%* when you buy {offer.targetQuantity}{' '}
                  {offer.targetQuantity === 2 ? 'units' : 'and stock up'}.
                </p>
              </>
            ) : (
              <>
                <h3
                  className={cn(
                    'text-lg leading-tight font-bold text-neutral-950 sm:text-xl',
                    compact && 'text-sm sm:text-base',
                  )}
                >
                  Add {crossSellShortName} for only{' '}
                  <span className="mt-1 inline-flex flex-wrap items-baseline gap-2">
                    <span className="text-sm font-semibold text-neutral-500 line-through sm:text-base">
                      {formatPrice(offer.regularPrice)}
                    </span>
                    <span className="text-[#E91E8C]">
                      {formatPrice(offer.offerPrice)}
                    </span>
                  </span>
                </h3>
                <p className="text-sm leading-snug text-neutral-700 sm:text-base">
                  You&apos;ve unlocked {offer.savingsPercent}% off*
                </p>
                <p className="text-sm font-medium text-neutral-600">
                  {offer.urgency}
                </p>
              </>
            )}

            <button
              type="button"
              onClick={onAccept}
              className={cn(
                'mt-1 w-fit rounded-full bg-neutral-950 px-6 py-2.5 text-sm font-bold text-white transition-colors hover:bg-neutral-800 sm:px-7 sm:py-3',
                compact && 'px-5 py-2 text-xs sm:px-5 sm:py-2',
              )}
            >
              Add to Cart
            </button>
          </div>

          <div
            className={cn(
              'relative w-[38%] max-w-[11rem] shrink-0 sm:max-w-[12.5rem]',
              compact && 'max-w-[7rem] sm:max-w-[8rem]',
            )}
          >
            <Image
              src={offer.image}
              alt=""
              fill
              className={cn(
                getProductImageDisplayClass(
                  offer.productId,
                  offer.image,
                  'object-contain object-bottom drop-shadow-lg',
                ),
              )}
              sizes="160px"
            />
          </div>
        </div>
      </div>

      <p className="mt-2 px-1 text-[10px] leading-relaxed text-neutral-500 sm:text-xs">
        {offer.disclaimer}
      </p>
    </div>
  )
}
