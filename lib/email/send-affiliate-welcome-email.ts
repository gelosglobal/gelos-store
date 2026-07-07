import type { AffiliateWelcomeEmailInput } from '@/lib/email/templates/affiliate-welcome'
import { buildAffiliateWelcomeEmail } from '@/lib/email/templates/affiliate-welcome'
import { getResendFromEmail, isResendConfigured } from '@/lib/env'
import { getResendClient } from '@/lib/email/resend'

export async function sendAffiliateWelcomeEmail(
  input: AffiliateWelcomeEmailInput,
) {
  const email = input.email.trim().toLowerCase()
  if (!email) {
    return { sent: false as const, reason: 'missing_email' as const }
  }

  if (!isResendConfigured()) {
    return { sent: false as const, reason: 'not_configured' as const }
  }

  const resend = getResendClient()
  if (!resend) {
    return { sent: false as const, reason: 'not_configured' as const }
  }

  const { subject, html } = buildAffiliateWelcomeEmail(input)

  const { error } = await resend.emails.send({
    from: getResendFromEmail(),
    to: email,
    subject,
    html,
  })

  if (error) {
    console.error('[affiliate welcome email]', error)
    return { sent: false as const, reason: 'send_failed' as const }
  }

  return { sent: true as const }
}
