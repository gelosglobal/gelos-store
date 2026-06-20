export type Collection = {
  id: string
  title: string
  category: string
  image: string
  description?: string
  /** Override default `/shop?category=…` link */
  href?: string
  /** Desktop bento placement (12-col grid) */
  className: string
  /** Featured = larger tile on mobile carousel */
  featured?: boolean
  /** Default: contain for PNG, cover for photos */
  imageFit?: 'cover' | 'contain'
}

export const collections: Collection[] = [
  {
    id: 'flavored-toothpastes',
    title: 'Flavored Toothpastes',
    category: 'Toothpaste',
    image: '/gelos/IMG_8526.JPG',
    description: '',
    className: 'md:col-span-3 md:row-start-1 md:col-start-1',
  },
  {
    id: 'toothbrushes',
    title: 'Toothbrushes',
    category: 'Toothbrushes',
    image: '/gelos/GELOS1335.jpg',
    description: '',
    className: 'md:col-span-6 md:row-start-1 md:col-start-4',
    featured: true,
  },
  {
    id: 'tongue-scrapers',
    title: 'Tongue Scrapers',
    category: 'Tongue Scraper',
    image: '/gelos/IMG_0785.JPG',
    description: '',
    className: 'md:col-span-3 md:row-start-1 md:col-start-10',
  },
  {
    id: 'teeth-whiteners',
    title: 'Teeth Whiteners',
    category: 'Whitening',
    image: '/gelos/teethwhiteners2.png',
    description: '',
    imageFit: 'cover',
    className: 'md:col-span-3 md:row-start-2 md:col-start-1',
    featured: true,
  },
  {
    id: 'wellness-and-care',
    title: 'Wellness and Care',
    category: 'Wellness',
    image: '/gelos/GELOS1424.jpg',
    description: '',
    imageFit: 'cover',
    className: 'md:col-span-3 md:row-start-2 md:col-start-4',
    featured: true,
  },
  {
    id: 'flossers',
    title: 'Water Flossers',
    category: 'Water Flossers',
    image: '/gelos/IMG_9442.JPG',
    description: '',
    className: 'md:col-span-3 md:row-start-2 md:col-start-7',
  },
  {
    id: 'mouth-washes',
    title: 'Mouth Washes / Sprays ',
    category: 'Mouthwash',
    href: '/collections/mouth-washes',
    image: '/gelos/black-male-model-close-up-with-blue-raspberry-mouthwash.png',
    description: '',
    imageFit: 'cover',
    className: 'md:col-span-3 md:row-start-2 md:col-start-10',
  },
]
