'use client'

import { createAuthClient } from 'better-auth/react'
import { adminClient } from 'better-auth/client/plugins'
import { getAuthClientBaseUrl } from '@/lib/auth-url'

export const authClient = createAuthClient({
  baseURL: getAuthClientBaseUrl(),
  plugins: [adminClient()],
})

export const { signIn, signOut, useSession } = authClient
