import { z } from 'zod'

export const productBundleInputSchema = z.object({
  name: z.string().trim().min(1, 'Bundle name is required').max(120),
  description: z.string().trim().max(500).optional().default(''),
  image: z.string().trim().optional().default(''),
  badge: z.string().trim().max(40).optional().nullable(),
  productIds: z.array(z.string().trim().min(1)).min(1, 'Add at least one product'),
  price: z.coerce.number().min(0, 'Price cannot be negative').optional().default(0),
  active: z.boolean().optional().default(true),
  sortOrder: z.number().int().optional().default(0),
})

export type ProductBundleInput = z.infer<typeof productBundleInputSchema>
