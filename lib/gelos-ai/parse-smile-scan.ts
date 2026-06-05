import type { SmileScanReport } from '@/lib/gelos-ai/smile-scan-types'

function clampScore(value: unknown): number {
  const num = Number(value)
  if (!Number.isFinite(num)) return 0
  return Math.min(10, Math.max(0, Math.round(num)))
}

function stripMarkdown(text: string): string {
  return text
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/^[-*]\s+/gm, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

function parseProducts(value: unknown): SmileScanReport['products'] {
  if (!Array.isArray(value)) return []
  return value
    .map((item) => {
      if (!item || typeof item !== 'object') return null
      const record = item as Record<string, unknown>
      const name = String(record.name ?? '').trim()
      const href = String(record.href ?? '').trim()
      const reason = String(record.reason ?? '').trim()
      if (!name || !href.startsWith('/')) return null
      return { name, href, reason: reason || 'Recommended for your smile routine' }
    })
    .filter((item): item is SmileScanReport['products'][number] => Boolean(item))
    .slice(0, 3)
}

export function parseSmileScanReport(raw: string): SmileScanReport {
  const cleaned = raw
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```$/i, '')
    .trim()

  try {
    const parsed = JSON.parse(cleaned) as Record<string, unknown>
    const scores =
      parsed.scores && typeof parsed.scores === 'object'
        ? (parsed.scores as Record<string, unknown>)
        : {}

    const tips = Array.isArray(parsed.tips)
      ? parsed.tips.map((t) => stripMarkdown(String(t).trim())).filter(Boolean).slice(0, 3)
      : []

    return {
      snapshot: stripMarkdown(String(parsed.snapshot ?? '').trim()),
      scores: {
        brightness: clampScore(scores.brightness),
        freshness: clampScore(scores.freshness),
        confidence: clampScore(scores.confidence),
      },
      tips,
      products: parseProducts(parsed.products),
      dentistNote: stripMarkdown(
        String(parsed.dentistNote ?? 'Book a dentist for a professional check-up when you have ongoing concerns.'),
      ),
      disclaimer: stripMarkdown(
        String(
          parsed.disclaimer ??
            'Visual wellness guide only — not a medical diagnosis.',
        ),
      ),
    }
  } catch {
    return fallbackFromMarkdown(raw)
  }
}

function fallbackFromMarkdown(raw: string): SmileScanReport {
  const text = stripMarkdown(raw)
  const brightness = Number(text.match(/brightness[:\s]*(\d+)/i)?.[1] ?? 0)
  const freshness = Number(text.match(/freshness[:\s]*(\d+)/i)?.[1] ?? 0)
  const confidence = Number(
    text.match(/confidence[:\s]*(\d+)/i)?.[1] ?? 0,
  )

  const linkMatches = [...text.matchAll(/\[([^\]]+)\]\((\/[^)]+)\)/g)]

  return {
    snapshot: text.split('\n').slice(0, 3).join(' ').slice(0, 320) || text.slice(0, 320),
    scores: {
      brightness: clampScore(brightness),
      freshness: clampScore(freshness),
      confidence: clampScore(confidence),
    },
    tips: text
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 12 && line.length < 120)
      .slice(0, 3),
    products: linkMatches.slice(0, 3).map((match) => ({
      name: match[1],
      href: match[2],
      reason: 'Suggested for your smile goals',
    })),
    dentistNote:
      'Consider booking a partner dentist for a professional check-up if you have sensitivity or ongoing concerns.',
    disclaimer: 'Visual wellness guide only — not a medical diagnosis.',
  }
}
