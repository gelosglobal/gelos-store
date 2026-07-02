const DEFAULT_WHATSAPP_MESSAGE =
  "Hi Gelos! I'd like some help with my order."

/** Digits-only WhatsApp number (country code, no + or spaces). */
export function normalizeWhatsAppNumber(raw: string): string | null {
  const digits = raw.replace(/\D/g, '')
  return digits.length >= 10 ? digits : null
}

export function getWhatsAppNumber(): string | null {
  const raw = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER?.trim()
  if (!raw) return null
  return normalizeWhatsAppNumber(raw)
}

export function getWhatsAppChatUrl(message?: string): string | null {
  const number = getWhatsAppNumber()
  if (!number) return null

  const text =
    message?.trim() ||
    process.env.NEXT_PUBLIC_WHATSAPP_MESSAGE?.trim() ||
    DEFAULT_WHATSAPP_MESSAGE

  const params = new URLSearchParams({ text })
  return `https://wa.me/${number}?${params.toString()}`
}
