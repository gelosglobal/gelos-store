import {
  getAdminNotificationEmail,
  getResendFromEmail,
  isResendConfigured,
} from '@/lib/env'
import type { OrderEmailData } from '@/lib/email/order-email-data'
import { getResendClient } from '@/lib/email/resend'
import { buildAdminNewOrderEmail } from '@/lib/email/templates/admin-new-order'
import { buildOrderConfirmationEmail } from '@/lib/email/templates/order-confirmation'

async function sendEmail(input: {
  to: string | string[]
  subject: string
  html: string
  replyTo?: string
}) {
  const resend = getResendClient()
  if (!resend) return { sent: false as const, reason: 'not_configured' as const }

  const to = Array.isArray(input.to) ? input.to : [input.to]
  const { error } = await resend.emails.send({
    from: getResendFromEmail(),
    to,
    subject: input.subject,
    html: input.html,
    replyTo: input.replyTo,
  })

  if (error) {
    console.error('[email]', error)
    return { sent: false as const, reason: 'send_failed' as const, error }
  }

  return { sent: true as const }
}

export async function sendOrderConfirmationEmail(order: OrderEmailData) {
  const email = order.customerEmail.trim()
  if (!email) {
    return { sent: false as const, reason: 'missing_customer_email' as const }
  }

  const { subject, html } = buildOrderConfirmationEmail(order)
  return sendEmail({
    to: email,
    subject,
    html,
    replyTo: 'hello@gelosglobal.com',
  })
}

export async function sendAdminNewOrderEmail(order: OrderEmailData) {
  const adminEmail = getAdminNotificationEmail()
  if (!adminEmail) {
    return { sent: false as const, reason: 'missing_admin_email' as const }
  }

  const { subject, html } = buildAdminNewOrderEmail(order)
  return sendEmail({
    to: adminEmail,
    subject,
    html,
    replyTo: order.customerEmail.trim() || undefined,
  })
}

/** Fire-and-forget wrapper — logs failures without throwing. */
export function notifyOrderPlaced(order: OrderEmailData) {
  if (!isResendConfigured()) {
    console.warn('[email] RESEND_API_KEY not set — skipping order notifications')
    return
  }

  void Promise.all([
    sendOrderConfirmationEmail(order),
    sendAdminNewOrderEmail(order),
  ]).then((results) => {
    const [customer, admin] = results
    if (!customer.sent) {
      console.warn('[email] Customer confirmation not sent:', customer.reason)
    }
    if (!admin.sent) {
      console.warn('[email] Admin notification not sent:', admin.reason)
    }
  })
}
