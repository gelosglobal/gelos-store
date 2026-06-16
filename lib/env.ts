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

/** Verified sender on gelosglobal.com, e.g. Gelos <orders@gelosglobal.com> */
export function getResendFromEmail(): string {
  return (
    process.env.RESEND_FROM_EMAIL?.trim() || 'Gelos <orders@gelosglobal.com>'
  )
}

/** Store team inbox for new-order alerts */
export function getAdminNotificationEmail(): string | undefined {
  const email =
    process.env.ADMIN_NOTIFICATION_EMAIL?.trim() ||
    process.env.STORE_CONTACT_EMAIL?.trim()
  return email || undefined
}

export function getAppUrl(): string {
  const url = process.env.NEXT_PUBLIC_APP_URL?.trim()
  if (url) return url.replace(/\/$/, '')
  // Used for absolute URLs in emails (logo, links). `localhost` breaks in real inboxes.
  return 'https://gelosglobal.com'
}

/** Groq — powers Gelos AI shopping assistant */
export function getGroqApiKey(): string | undefined {
  const key = process.env.GROQ_API_KEY?.trim()
  return key || undefined
}

export function isGroqConfigured(): boolean {
  return Boolean(getGroqApiKey())
}
