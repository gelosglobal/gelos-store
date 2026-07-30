import { lookupByProductLineKey } from '@/lib/product-line-keys'
import type { Product } from '@/lib/types/product'

/** Cover art for toothbrush style picker on PDP. */
export const toothbrushStyleCoverByKey: Record<string, string> = {
  'bamboo-toothbrush-set-3-pack': '/gelos/bb.brushbl.png',
  'bamboo-toothbrush': '/gelos/bb.brushbl.png',
  'bamboo-toothbrush-1': '/gelos/bb.brushbl.png',
  '8': '/gelos/bb.brushbl.png',

  'sonicwave-g1-series-electric-toothbrush':
    '/gelos/3d-sonicwave-g1-electric-toothbrush.png',
  '3d-sonicwave-g1-electric-toothbrush':
    '/gelos/3d-sonicwave-g1-electric-toothbrush.png',
  'electric-toothbrush': '/gelos/3d-sonicwave-g1-electric-toothbrush.png',
  'white-electric-toothbrush': '/gelos/3d-sonicwave-g1-electric-toothbrush.png',
  'pink-electric-toothbrush': '/gelos/3d-sonicwave-g1-electric-toothbrush.png',
  'blue-electric-toothbrush': '/gelos/3d-sonicwave-g1-electric-toothbrush.png',
  'green-electric-toothbrush': '/gelos/3d-sonicwave-g1-electric-toothbrush.png',
  '24': '/gelos/3d-sonicwave-g1-electric-toothbrush.png',
}

export const toothbrushStyleOrder = [
  'sonicwave-g1-series-electric-toothbrush',
  '3d-sonicwave-g1-electric-toothbrush',
  'electric-toothbrush',
  'white-electric-toothbrush',
  'pink-electric-toothbrush',
  'blue-electric-toothbrush',
  'green-electric-toothbrush',
  'bamboo-toothbrush-set-3-pack',
  'bamboo-toothbrush',
  'bamboo-toothbrush-1',
  '24',
  '8',
] as const

/** @deprecated Use toothbrushStyleCoverByKey */
export const toothbrushStyleCoverByProductId = toothbrushStyleCoverByKey

export function getToothbrushStyleCover(
  product: Pick<Product, 'id' | 'name' | 'image'> & { handle?: string },
  fallbackImage?: string,
): string {
  const fallback = fallbackImage ?? product.image
  const cover = lookupByProductLineKey(toothbrushStyleCoverByKey, product)
  if (cover) return cover
  return fallback.startsWith('/')
    ? fallback
    : `/${fallback.replace(/^\/+/, '')}`
}

export function getToothbrushStyleLabel(name: string): string {
  const colour = name.match(/SonicWave G1 Series Electric Toothbrush\s*[-–]\s*(.+)$/i)
  if (colour?.[1]?.trim()) return colour[1].trim()

  return name
    .replace(/ \(3-pack\)$/i, '')
    .replace(/ Set$/i, '')
    .trim()
}
