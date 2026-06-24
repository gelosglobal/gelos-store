export type Stockist = {
  /** Unique slug, e.g. melcom */
  id: string
  /** Accessible name for screen readers */
  name: string
  /** Path under public/, e.g. /gelos/melcom.png — use true PNG with transparency */
  logo: string
}

/**
 * Add a retailer:
 * 1. Drop the logo in `public/gelos/` (PNG with transparent background).
 * 2. Append an entry below — the homepage marquee picks it up automatically.
 */
export const stockists: Stockist[] = [
  {
    id: 'oaktree-pharmacy',
    name: 'Oaktree Pharmacy',
    logo: '/gelos/oak-gelos.PNG',
  },
  {
    id: 'bedita-pharmaceuticals',
    name: 'Bedita Pharmaceuticals',
    logo: '/gelos/bedita-gelos.PNG',
  },
  {
    id: 'origin-chemist',
    name: 'Origin Chemist',
    logo: '/gelos/origin-gelos.PNG',
  },
  {
    id: 'palace-mall',
    name: 'Palace mall',
    logo: '/gelos/IMG_6827.PNG',
  },
  {
    id: 'top-up-pharmacy',
    name: 'Top up',
    logo: '/gelos/top-gelos.PNG',
  },
  {
    id: 'prime-pharmacy',
    name: 'Top up',
    logo: '/gelos/prime-gelos.PNG',
  },
  {
    id: 'marina-pharmacy',
    name: 'Marina',
    logo: '/gelos/marina-gelos.PNG',
  },
  {
    id: 'panacea-pharmacy',
    name: 'Panacea',
    logo: '/gelos/panacea-gelos.PNG',
  },
  {
    id: 'Smart Cart',
    name: 'Smart Cart',
    logo: '/gelos/smart-gelos.png',
  },
  {
    id: 'Whole Health',
    name: 'Whole Health',
    logo: '/gelos/whole-gelos.png',
  },
]

