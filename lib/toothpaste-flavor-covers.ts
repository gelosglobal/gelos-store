import { lookupByProductLineKey } from '@/lib/product-line-keys'
import type { Product } from '@/lib/types/product'

/** Cover art for toothpaste flavour picker on PDP (keyed by handle / slug / legacy id). */
export const toothpasteFlavorCoverByKey: Record<string, string> = {
  // Featured flavours
  'watermelon-toothpaste': '/gelos/watermelon-toothpaste.png',
  '1': '/gelos/watermelon-toothpaste.png',

  'strawberry-toothpaste': '/gelos/strawberry-toothpaste.png',
  'strawberry-toothpaste-1': '/gelos/strawberry-toothpaste.png',
  '15': '/gelos/strawberry-toothpaste.png',

  'coconut-whip-toothpaste': '/gelos/coconut-whip-toothpaste.png',
  '13': '/gelos/coconut-whip-toothpaste.png',

  'grape-bubblegum-toothpaste': '/gelos/grape-bubblegum-toothpaste.png',
  '17': '/gelos/grape-bubblegum-toothpaste.png',

  'energy-drink-toothpaste': '/gelos/energy-drink-toothpaste.png',
  '11': '/gelos/energy-drink-toothpaste.png',

  'banana-toothpaste': '/gelos/bananaa.png',
  '14': '/gelos/bananaa.png',

  'passion-fruit-toothpaste': '/gelos/passion-fruit-toothpaste.png',
  'passion-fruit-toothapaste': '/gelos/passion-fruit-toothpaste.png',
  '16': '/gelos/passion-fruit-toothpaste.png',

  'vanilla-toothpaste': '/gelos/vanilla-toothpaste.png',
  '18': '/gelos/vanilla-toothpaste.png',

  'red-velvet-toothpaste': '/gelos/red-velvet-toothpaste.png',
  toothpaste: '/gelos/red-velvet-toothpaste.png',
  '19': '/gelos/red-velvet-toothpaste.png',
}

/** Featured order for flavour picker (handles + legacy ids). */
export const toothpasteFlavorOrder = [
  'watermelon-toothpaste',
  'strawberry-toothpaste',
  'strawberry-toothpaste-1',
  'coconut-whip-toothpaste',
  'grape-bubblegum-toothpaste',
  'energy-drink-toothpaste',
  'banana-toothpaste',
  'passion-fruit-toothpaste',
  'passion-fruit-toothapaste',
  'vanilla-toothpaste',
  'red-velvet-toothpaste',
  'toothpaste',
  // Legacy Prisma ids
  '1',
  '15',
  '13',
  '17',
  '11',
  '14',
  '16',
  '18',
  '19',
] as const

/** @deprecated Use toothpasteFlavorCoverByKey */
export const toothpasteFlavorCoverByProductId = toothpasteFlavorCoverByKey

export function getToothpasteFlavorCover(
  product: Pick<Product, 'id' | 'name' | 'image'> & { handle?: string },
  fallbackImage?: string,
): string {
  const fallback = fallbackImage ?? product.image
  return lookupByProductLineKey(toothpasteFlavorCoverByKey, product) ?? fallback
}

export function getToothpasteFlavorLabel(name: string): string {
  return name.replace(/ Toothpaste$/i, '').trim()
}
