import { NextResponse } from 'next/server'
import { z } from 'zod'
import {
  buildSmileScanCatalogContext,
  getSmileScanCatalog,
  resolveSmileScanProducts,
} from '@/lib/gelos-ai/smile-scan-catalog'
import { buildSmileScanSystemPrompt } from '@/lib/gelos-ai/smile-scan-prompt'
import { analyzeSmileImage } from '@/lib/gelos-ai/vision'
import { isGroqConfigured } from '@/lib/env'

export const dynamic = 'force-dynamic'

const scanRequestSchema = z.object({
  image: z
    .string()
    .min(100)
    .max(4_000_000)
    .refine(
      (value) => value.startsWith('data:image/'),
      'Image must be a data URL',
    ),
})

export async function POST(request: Request) {
  if (!isGroqConfigured()) {
    return NextResponse.json(
      { error: 'Gelos AI is not available right now.' },
      { status: 503 },
    )
  }

  try {
    const json = await request.json()
    const parsed = scanRequestSchema.safeParse(json)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Please provide a valid smile photo.' },
        { status: 400 },
      )
    }

    const catalog = await getSmileScanCatalog()
    const systemPrompt = buildSmileScanSystemPrompt(
      buildSmileScanCatalogContext(catalog),
    )
    const report = await analyzeSmileImage(parsed.data.image, systemPrompt)

    return NextResponse.json({
      report: {
        ...report,
        products: resolveSmileScanProducts(report.products, catalog, report),
      },
    })
  } catch (error) {
    console.error('[POST /api/gelos-ai/scan-smile]', error)
    const message =
      error instanceof Error ? error.message : 'Smile scan failed. Please try again.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
