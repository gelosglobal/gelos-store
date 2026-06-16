import { z } from 'zod'
import { normalizeAffiliateCode } from '@/lib/affiliates'

export const adminAffiliateInputSchema = z.object({
  name: z.string().trim().min(2, 'Name is required').max(120),
  code: z
    .string()
    .trim()
    .min(3, 'Code must be at least 3 characters')
    .max(24, 'Code is too long')
    .transform(normalizeAffiliateCode)
    .refine((code) => /^[A-Z0-9_-]+$/.test(code), {
      message: 'Use letters, numbers, hyphens, or underscores only',
    }),
  email: z.string().trim().email('Enter a valid email').or(z.literal('')).optional(),
  phone: z.string().trim().max(40).optional(),
  commissionPercent: z
    .number()
    .min(0, 'Commission cannot be negative')
    .max(100, 'Commission cannot exceed 100%'),
  enabled: z.boolean().optional(),
  notes: z.string().trim().max(500).optional(),
})

export type AdminAffiliateInput = z.infer<typeof adminAffiliateInputSchema>
