import { Resend } from 'resend'
import { getResendApiKey } from '@/lib/env'

let client: Resend | null = null

export function getResendClient(): Resend | null {
  const apiKey = getResendApiKey()
  if (!apiKey) return null

  if (!client) {
    client = new Resend(apiKey)
  }

  return client
}
