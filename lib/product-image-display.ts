import {
  getBestSellerImageFit,
  getBestSellerImagePadding,
} from '@/lib/best-seller-meta'
import { cn } from '@/lib/utils'

export const productImagePaddingClass = {
  none: 'p-0',
  sm: 'p-2 sm:p-3',
  md: 'p-4 sm:p-5',
  lg: 'p-6 sm:p-8',
} as const

/** Image classes for product cards/grids — matches PDP contain behavior for PNG cutouts. */
export function getProductImageDisplayClass(
  productId: string,
  imageSrc: string,
  extra?: string,
) {
  const fit = getBestSellerImageFit(productId, imageSrc)
  const padding = getBestSellerImagePadding(productId)

  return cn(
    extra,
    fit === 'contain'
      ? cn('object-contain', productImagePaddingClass[padding])
      : 'object-cover object-center',
  )
}
