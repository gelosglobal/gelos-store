/** Optional display extras for best-seller carousel cards */
export type BestSellerMeta = {
  badge?: string
  /** Thumbnail images for variant picker */
  variantImages?: string[]
  /** How the main image fills the card */
  imageFit?: 'contain' | 'cover'
  /** Inner padding for contain-fit product shots (tailwind scale) */
  imagePadding?: 'none' | 'sm' | 'md' | 'lg'
}

function inferImageFit(src: string): 'contain' | 'cover' {
  const path = src.split('?')[0].toLowerCase()
  if (path.endsWith('.png') || path.endsWith('.webp')) {
    return 'contain'
  }

  const lower = src.toLowerCase()
  if (
    lower.includes('watermelon-toothpaste') ||
    lower.includes('grape-mint-fruit-energy') ||
    lower.includes('energy-drink-toothpaste') ||
    lower.includes('mouthwash-') ||
    lower.includes('watermelon-foaming-mouthwash') ||
    lower.includes('led-whitening-device') ||
    lower.includes('electric-toothbrush') ||
    lower.includes('sonicwave') ||
    lower.includes('strips') ||
    lower.includes('inhaler')
  ) {
    return 'contain'
  }
  return 'cover'
}

export function getBestSellerImageFit(
  productId: string,
  imageSrc: string,
): 'contain' | 'cover' {
  return bestSellerMeta[productId]?.imageFit ?? inferImageFit(imageSrc)
}

export function getBestSellerImagePadding(
  productId: string,
): 'none' | 'sm' | 'md' | 'lg' {
  return bestSellerMeta[productId]?.imagePadding ?? 'md'
}

export const bestSellerMeta: Record<string, BestSellerMeta> = {
  '1': {
    badge: 'Best seller',
    imageFit: 'contain',
    imagePadding: 'sm',
    variantImages: [
      '/gelos/watermelon-toothpaste.png',
      '/gelos/strawberry-toothpaste.png',
      '/gelos/coconut-whip-toothpaste.png',
      '/gelos/grape-bubblegum-toothpaste.png',
      '/gelos/bananaa.png',
    ],
  },
  '9': {
    badge: 'Best seller',
    imageFit: 'contain',
    imagePadding: 'sm',
    variantImages: ['/gelos/grape-mint-fruit-energy.png'],
  },
  '2': {
    imageFit: 'cover',
  },
  '3': {
    badge: 'Best seller',
    imageFit: 'cover',
  },
  '7': {
    badge: 'Best seller',
    imageFit: 'contain',
    imagePadding: 'sm',
  },
  '8': {
    imageFit: 'cover',
  },
  '10': {
    badge: 'Best seller',
    imageFit: 'contain',
    imagePadding: 'sm',
  },
  '11': {
    badge: 'Best seller',
    imageFit: 'contain',
    imagePadding: 'sm',
    variantImages: [
      '/gelos/energy-drink-toothpaste.png',
      '/gelos/watermelon-toothpaste.png',
    ],
  },
  '12': {
    badge: 'Best seller',
    imageFit: 'contain',
    imagePadding: 'sm',
    variantImages: [
      '/gelos/mouthwash-watermelon.png',
      '/gelos/mouthwash-strawberry.png',
      '/gelos/mouthwash-blue-raspberry.png',
      '/gelos/mouthwash-grape-bubblegum.png',
    ],
  },
  '20': {
    imageFit: 'contain',
    imagePadding: 'sm',
  },
  '21': {
    badge: 'NEW',
    imageFit: 'contain',
    imagePadding: 'sm',
  },
  '22': {
    imageFit: 'contain',
    imagePadding: 'sm',
  },
}

/** Curated carousel order — featured products first */
export const bestSellerIds = [
  '9',
  '1',
  '10',
  '11',
  '12',
  '3',
  '7',
  '2',
] as const
