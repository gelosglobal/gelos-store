export const productCategories = [
  'Toothpaste',
  'Mouthwash',
  'Tongue Scraper',
  'Whitening',
  'Tools',
  'Accessories',
  'Wellness',
  'Toothbrushes',
] as const

export type ProductCategory = (typeof productCategories)[number]
