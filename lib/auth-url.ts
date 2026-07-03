/** Normalize env URL to origin (no trailing slash or path). */
export function normalizeAuthOrigin(url: string | undefined | null): string | null {
  if (!url?.trim()) return null

  try {
    const withProtocol = url.trim().startsWith('http')
      ? url.trim()
      : `https://${url.trim()}`
    return new URL(withProtocol).origin
  } catch {
    return null
  }
}

/** Include www and non-www variants so either domain works in production. */
function addOriginWithWwwVariants(origin: string, origins: Set<string>) {
  origins.add(origin)

  try {
    const { protocol, hostname } = new URL(origin)
    if (hostname === 'localhost' || hostname.endsWith('.localhost')) return

    if (hostname.startsWith('www.')) {
      origins.add(`${protocol}//${hostname.slice(4)}`)
    } else {
      origins.add(`${protocol}//www.${hostname}`)
    }
  } catch {
    // ignore invalid URLs
  }
}

export function getAuthBaseUrl(): string {
  const fromEnv =
    normalizeAuthOrigin(process.env.BETTER_AUTH_URL) ??
    normalizeAuthOrigin(process.env.NEXT_PUBLIC_APP_URL) ??
    normalizeAuthOrigin(
      process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined,
    )

  return fromEnv ?? 'http://localhost:3000'
}

export function getAuthTrustedOrigins(): string[] {
  const origins = new Set<string>()

  const candidates = [
    process.env.BETTER_AUTH_URL,
    process.env.NEXT_PUBLIC_APP_URL,
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined,
    ...(process.env.BETTER_AUTH_TRUSTED_ORIGINS?.split(',') ?? []),
  ]

  for (const candidate of candidates) {
    const origin = normalizeAuthOrigin(candidate)
    if (origin) addOriginWithWwwVariants(origin, origins)
  }

  if (process.env.NODE_ENV === 'development') {
    origins.add('http://localhost:3000')
    origins.add('http://127.0.0.1:3000')
  }

  if (origins.size === 0) {
    origins.add('http://localhost:3000')
  }

  return [...origins]
}

export function getAuthClientBaseUrl(): string | undefined {
  if (typeof window !== 'undefined') {
    return window.location.origin
  }

  return normalizeAuthOrigin(process.env.NEXT_PUBLIC_APP_URL) ?? undefined
}
