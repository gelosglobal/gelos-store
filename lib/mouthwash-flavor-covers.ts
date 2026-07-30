import { lookupByProductLineKey } from '@/lib/product-line-keys'
import type { Product } from '@/lib/types/product'

/** Promotional cover art for mouthwash flavour picker on PDP. */
export const mouthwashFlavorCoverByKey: Record<string, string> = {
  'watermelon-foaming-mouthwash': '/gelos/mouthwash-cover-watermelon.png',
  '12': '/gelos/mouthwash-cover-watermelon.png',

  'strawberry-foaming-mouthwash': '/gelos/mouthwash-cover-strawberry.png',
  'strawberry-mouthwash': '/gelos/mouthwash-cover-strawberry.png',
  '20': '/gelos/mouthwash-cover-strawberry.png',

  'blue-raspberry-foaming-mouthwash':
    '/gelos/mouthwash-cover-blue-raspberry.png',
  'blue-raspberry-foaming-mouth-wash':
    '/gelos/mouthwash-cover-blue-raspberry.png',
  '21': '/gelos/mouthwash-cover-blue-raspberry.png',

  'grape-bubblegum-foaming-mouthwash':
    '/gelos/mouthwash-cover-grape-bubblegum.png',
  '22': '/gelos/mouthwash-cover-grape-bubblegum.png',
}

export const mouthwashFlavorOrder = [
  'watermelon-foaming-mouthwash',
  'strawberry-foaming-mouthwash',
  'strawberry-mouthwash',
  'blue-raspberry-foaming-mouthwash',
  'blue-raspberry-foaming-mouth-wash',
  'grape-bubblegum-foaming-mouthwash',
  '12',
  '20',
  '21',
  '22',
] as const

/** @deprecated Use mouthwashFlavorCoverByKey */
export const mouthwashFlavorCoverByProductId = mouthwashFlavorCoverByKey

export function getMouthwashFlavorCover(
  product: Pick<Product, 'id' | 'name' | 'image'> & { handle?: string },
  fallbackImage?: string,
): string {
  const fallback = fallbackImage ?? product.image
  return lookupByProductLineKey(mouthwashFlavorCoverByKey, product) ?? fallback
}
