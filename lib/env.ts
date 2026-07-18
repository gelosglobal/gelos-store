import { normalizeAuthOrigin } from '@/lib/auth-url'

/** MongoDB connection URL for Prisma (DATABASE_URL preferred, MONGODB_URI supported) */
export function getDatabaseUrl(): string | undefined {
  const url = process.env.DATABASE_URL?.trim() || process.env.MONGODB_URI?.trim()
  return url || undefined
}

export function isDatabaseConfigured(): boolean {
  return Boolean(getDatabaseUrl())
}

export function getResendApiKey(): string | undefined {
  const key = process.env.RESEND_API_KEY?.trim()
  return key || undefined
}

export function isResendConfigured(): boolean {
  return Boolean(getResendApiKey())
}

export function getPushAlertApiKey(): string | undefined {
  const key = process.env.PUSHALERT_API_KEY?.trim()
  return key || undefined
}

export function isPushAlertConfigured(): boolean {
  return Boolean(getPushAlertApiKey())
}

/** Verified sender on gelosglobal.com, e.g. Gelos <orders@gelosglobal.com> */
export function getResendFromEmail(): string {
  return (
    process.env.RESEND_FROM_EMAIL?.trim() || 'Gelos <orders@gelosglobal.com>'
  )
}

/** Store team inbox(es) for new-order notifications — comma-separated for multiple */
export function getAdminNotificationEmails(): string[] {
  const raw =
    process.env.ADMIN_NOTIFICATION_EMAIL?.trim() ||
    process.env.STORE_CONTACT_EMAIL?.trim()

  const emails = raw
    ? raw.split(',').map((email) => email.trim()).filter(Boolean)
    : ['hello@gelosglobal.com']

  return [...new Set(emails)]
}

/** Primary admin notification inbox */
export function getAdminNotificationEmail(): string | undefined {
  return getAdminNotificationEmails()[0]
}

export function getPublicAppUrl(): string {
  const url = process.env.NEXT_PUBLIC_APP_URL?.trim()
  let origin = url ? url.replace(/\/$/, '') : 'https://www.gelosglobal.com'

  // Vercel redirects apex -> www; use canonical www in links.
  if (origin === 'https://gelosglobal.com') {
    origin = 'https://www.gelosglobal.com'
  }

  return origin
}

/** Absolute links in outbound email (dev uses local app URL). */
export function getEmailAppUrl(): string {
  if (process.env.NODE_ENV === 'development') {
    return (
      normalizeAuthOrigin(process.env.BETTER_AUTH_URL) ?? 'http://localhost:3000'
    )
  }

  return getPublicAppUrl()
}

export function getAppUrl(): string {
  return getPublicAppUrl()
}

/** Groq — powers Gelos AI shopping assistant */
export function getGroqApiKey(): string | undefined {
  const key = process.env.GROQ_API_KEY?.trim()
  return key || undefined
}

export function isGroqConfigured(): boolean {
  return Boolean(getGroqApiKey())
}
