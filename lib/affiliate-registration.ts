import { z } from 'zod'
import { normalizeAffiliateCode } from '@/lib/affiliates'

export const DEFAULT_AFFILIATE_COMMISSION_PERCENT = 10

export const affiliateRegistrationSchema = z.object({
  name: z.string().trim().min(2, 'Name is required').max(120),
  email: z.string().trim().email('Enter a valid email').max(200),
  phone: z.string().trim().max(40).optional(),
  code: z
    .string()
    .trim()
    .min(3, 'Code must be at least 3 characters')
    .max(24, 'Code is too long')
    .transform(normalizeAffiliateCode)
    .refine((code) => /^[A-Z0-9_-]+$/.test(code), {
      message: 'Use letters, numbers, hyphens, or underscores only',
    }),
  message: z.string().trim().max(1000).optional(),
})

export type AffiliateRegistrationInput = z.infer<typeof affiliateRegistrationSchema>

export function suggestAffiliateCodeFromName(name: string): string {
  const base = name
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '')
    .slice(0, 12)
  return base.length >= 3 ? base : ''
}
