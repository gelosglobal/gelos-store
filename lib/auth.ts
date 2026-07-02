import { betterAuth } from 'better-auth'
import { prismaAdapter } from 'better-auth/adapters/prisma'
import { admin } from 'better-auth/plugins'
import { nextCookies } from 'better-auth/next-js'
import { prisma } from '@/lib/prisma'

function getAuthBaseUrl(): string {
  if (process.env.BETTER_AUTH_URL?.trim()) {
    return process.env.BETTER_AUTH_URL.trim()
  }
  if (process.env.NEXT_PUBLIC_APP_URL?.trim()) {
    return process.env.NEXT_PUBLIC_APP_URL.trim()
  }
  if (process.env.VERCEL_URL?.trim()) {
    return `https://${process.env.VERCEL_URL.trim()}`
  }
  return 'http://localhost:3000'
}

const adminUserIds = (process.env.BETTER_AUTH_ADMIN_USER_IDS ?? '')
  .split(',')
  .map((id) => id.trim())
  .filter(Boolean)

export const auth = betterAuth({
  appName: 'Gelos',
  baseURL: getAuthBaseUrl(),
  secret: process.env.BETTER_AUTH_SECRET,
  database: prismaAdapter(prisma, {
    provider: 'mongodb',
  }),
  advanced: {
    database: {
      generateId: false,
    },
  },
  emailAndPassword: {
    enabled: true,
    disableSignUp: true,
  },
  trustedOrigins: [
    getAuthBaseUrl(),
    process.env.NEXT_PUBLIC_APP_URL?.trim(),
  ].filter((value): value is string => Boolean(value)),
  plugins: [
    admin({
      defaultRole: 'user',
      adminRoles: ['admin'],
      ...(adminUserIds.length > 0 ? { adminUserIds } : {}),
    }),
    nextCookies(),
  ],
})

export type Session = typeof auth.$Infer.Session
