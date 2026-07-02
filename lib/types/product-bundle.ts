export type ProductBundle = {
  id: string
  name: string
  description: string
  productIds: string[]
  image: string
  badge?: string
  /** 0 = auto-calculate from product prices */
  price: number
  active: boolean
  sortOrder: number
}
