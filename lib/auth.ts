import { betterAuth } from 'better-auth'
import { prismaAdapter } from 'better-auth/adapters/prisma'
import { admin } from 'better-auth/plugins'
import { nextCookies } from 'better-auth/next-js'
import { prisma } from '@/lib/prisma'
import { getAuthBaseUrl, getAuthTrustedOrigins } from '@/lib/auth-url'

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
    // Enable if your host only exposes the public domain via x-forwarded-host.
    trustedProxyHeaders: process.env.BETTER_AUTH_TRUSTED_PROXY_HEADERS === 'true',
  },
  emailAndPassword: {
    enabled: true,
    disableSignUp: true,
  },
  trustedOrigins: getAuthTrustedOrigins(),
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
