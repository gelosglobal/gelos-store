import { NextResponse } from 'next/server'
import { getSmileScanByScanId } from '@/lib/db/smile-scans'

export const dynamic = 'force-dynamic'

type RouteContext = {
  params: Promise<{ scanId: string }>
}

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { scanId } = await context.params
    const scan = await getSmileScanByScanId(scanId)

    if (!scan) {
      return NextResponse.json({ error: 'Smile report not found.' }, { status: 404 })
    }

    return NextResponse.json({ scan })
  } catch (error) {
    console.error('[GET /api/store/smile-scans/[scanId]]', error)
    return NextResponse.json(
      { error: 'Could not load smile report.' },
      { status: 500 },
    )
  }
}
