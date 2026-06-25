import { getBestSellerImageFit } from '@/lib/best-seller-meta'

export type FeaturedHeroSlide = {
  productId: string
  headline: string
  /** Plain text before the bold product highlight */
  bodyLead: string
  /** Bold product name or callout in the body */
  bodyHighlight: string
  /** Plain text after the highlight */
  bodyTail: string
  /** Optional lifestyle or hero image (defaults to product image) */
  image?: string
  imageFit?: 'contain' | 'cover'
  /** CTA button label (defaults to "Shop now") */
  ctaLabel?: string
}

/** Default homepage featured slider order (hero shows first 3 only) */
export const featuredHeroProductIds = [
  '1',
  '9',
  '3',
] as const

/** Temporary hero background while custom slide banners are in design. */
export const featuredHeroVideoSrc = '/gelos/GELOS%20VIDEO.mp4'

/** Static homepage hero copy (no carousel). */
export const featuredHeroCopy = {
  headline: 'Premium smile care for every day',
  subtext:
    '',
}

export const featuredHeroSlides: Record<string, FeaturedHeroSlide> = {
  '1': {
    productId: '1',
    headline: 'Tough stains need real flavor',
    bodyLead: 'Supercharge your routine with the ingredients your teeth and mouth love. ',
    bodyHighlight: 'NEW Watermelon Fluoride+ Toothpaste.',
    bodyTail: ' Order NOW.',
    image: '/gelos/GELOS2141.jpg',
    imageFit: 'cover',
  },
  '9': {
    productId: '9',
    headline: 'Fresh breath, fruit energy',
    bodyLead: 'Power through your day with a pocket-size boost. ',
    bodyHighlight: 'NEW Grape Mint Fruit Energy.',
    bodyTail: ' Order NOW.',
    image: '/gelos/mango-inhaler.png',
    imageFit: 'contain',
  },
  '3': {
    productId: '3',
    headline: 'Correct shade, confidently',
    bodyLead: 'Professional-grade color correction for a brighter-looking smile. ',
    bodyHighlight: 'V34 Shade Correction Kit.',
    bodyTail: ' Order NOW.',
    image: '/gelos/GELOS1967.jpg',
    imageFit: 'cover',
  },
  // '10': {
  //   productId: '10',
  //   headline: 'Whiten while you unwind',
  //   bodyLead: 'At-home LED whitening made simple. ',
  //   bodyHighlight: 'LED Whitening Device.',
  //   bodyTail: ' Order NOW.',
  //   image: '/gelos/GELOS1701.jpg',
  //   imageFit: 'cover',
  // },
  '12': {
    productId: '12',
    headline: 'Foam meets flavor',
    bodyLead: 'Foaming mouthwash that tastes as good as it works. ',
    bodyHighlight: 'NEW Watermelon Foaming Mouthwash.',
    bodyTail: ' Order NOW.',
    image: '/gelos/mouthwash-watermelon.png',
    imageFit: 'contain',
  },
}

export function getFeaturedHeroImageFit(
  productId: string,
  imageSrc: string,
  override?: 'contain' | 'cover',
): 'contain' | 'cover' {
  return override ?? featuredHeroSlides[productId]?.imageFit ?? getBestSellerImageFit(productId, imageSrc)
}
