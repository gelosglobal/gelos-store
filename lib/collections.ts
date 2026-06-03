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
}

export const collections: Collection[] = [
  {
    id: 'flavored-toothpastes',
    title: 'Flavored Toothpastes',
    category: 'Toothpaste',
    image: '/gelos/watermelon.png',
    description: '',
    className: 'md:col-span-3 md:row-start-1 md:col-start-1',
  },
  {
    id: 'teeth-whiteners',
    title: 'Teeth Whiteners',
    category: 'Whitening',
    image: '/gelos/led-whitening-device.png',
    description: '',
    className: 'md:col-span-6 md:row-start-1 md:col-start-4',
    featured: true,
  },
  {
    id: 'tongue-scrapers',
    title: 'Tongue Scrapers',
    category: 'Tongue Scraper',
    image: '/gelos/IMG_8030.JPG',
    description: '',
    className: 'md:col-span-3 md:row-start-1 md:col-start-10',
  },
  {
    id: 'toothbrushes',
    title: 'Toothbrushes',
    category: 'Toothbrushes',
    image: '/gelos/toothbrush.png',
    description: '',
    className: 'md:col-span-6 md:row-start-2 md:col-start-1',
    featured: true,
  },
  {
    id: 'flossers',
    title: 'Flossers',
    category: 'Accessories',
    image: '/gelos/IMG-0372.jpg',
    description: '',
    className: 'md:col-span-3 md:row-start-2 md:col-start-7',
  },
  {
    id: 'mouth-washes',
    title: 'Mouth Washes',
    category: 'Mouthwash',
    href: '/collections/mouth-washes',
    image: '/gelos/IMG_2061.JPG',
    description: '',
    className: 'md:col-span-3 md:row-start-2 md:col-start-10',
  },
]
