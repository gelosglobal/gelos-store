export const productCategories = [
  'Toothpaste',
  'Mouthwash',
  'Tongue Scraper',
  'Whitening',
  'Water Flossers',
  'Tools',
  'Accessories',
  'Wellness',
  'Toothbrushes',
] as const

export type ProductCategory = (typeof productCategories)[number]
