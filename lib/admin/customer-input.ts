import { z } from 'zod'
import type { EmailSubscription } from '@/lib/types/customer'

export const emailSubscriptionSchema = z.enum(['Subscribed', 'Not subscribed'])

export const adminCustomerInputSchema = z
  .object({
    name: z.string().trim().min(2, 'Name is required').max(120),
    email: z.string().trim().max(200).optional(),
    phone: z.string().trim().max(40).optional(),
    location: z.string().trim().max(200).optional(),
    emailSubscription: emailSubscriptionSchema.optional(),
  })
  .superRefine((data, ctx) => {
    if (!data.email?.trim() && !data.phone?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Add an email or phone number',
        path: ['email'],
      })
    }

    if (data.email?.trim() && !z.string().email().safeParse(data.email.trim()).success) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Enter a valid email',
        path: ['email'],
      })
    }
  })

export type AdminCustomerInput = z.infer<typeof adminCustomerInputSchema>

export function normalizeCustomerEmail(email?: string): string {
  return email?.trim().toLowerCase() ?? ''
}

export function normalizeCustomerPhone(phone?: string): string {
  return phone?.trim() ?? ''
}

export function customerMatchKey(email: string, phone: string): string | null {
  const normalizedEmail = normalizeCustomerEmail(email)
  if (normalizedEmail) return `email:${normalizedEmail}`
  const normalizedPhone = normalizeCustomerPhone(phone)
  if (normalizedPhone) return `phone:${normalizedPhone}`
  return null
}

export function subscriptionFromEmail(
  email: string,
  explicit?: EmailSubscription,
): EmailSubscription {
  if (explicit) return explicit
  return email.trim() ? 'Subscribed' : 'Not subscribed'
}
