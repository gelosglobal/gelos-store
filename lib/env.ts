/** MongoDB connection URL for Prisma (DATABASE_URL preferred, MONGODB_URI supported) */
export function getDatabaseUrl(): string | undefined {
  const url = process.env.DATABASE_URL?.trim() || process.env.MONGODB_URI?.trim()
  return url || undefined
}

export function isDatabaseConfigured(): boolean {
  return Boolean(getDatabaseUrl())
}
