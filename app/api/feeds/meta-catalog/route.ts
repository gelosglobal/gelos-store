import { NextResponse } from 'next/server'
import { getAllProducts } from '@/lib/db/products'
import {
  buildMetaCatalogItems,
  getMetaCatalogContentType,
  getMetaCatalogFilename,
  parseMetaCatalogCurrency,
  parseMetaCatalogFormat,
  serializeMetaCatalogFeed,
} from '@/lib/meta-catalog-feed'

export const dynamic = 'force-dynamic'

/**
 * Public Meta Commerce Manager product feed.
 *
 * Examples:
 *   /api/feeds/meta-catalog
 *   /api/feeds/meta-catalog?format=tsv
 *   /api/feeds/meta-catalog?format=xml
 *   /api/feeds/meta-catalog?format=csv&currency=USD
 *   /api/feeds/meta-catalog?download=1
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const format = parseMetaCatalogFormat(searchParams.get('format'))
  const currency = parseMetaCatalogCurrency(searchParams.get('currency'))
  const download = searchParams.get('download') === '1'

  try {
    const products = await getAllProducts()
    const items = buildMetaCatalogItems(products, { currency })
    const body = serializeMetaCatalogFeed(items, format)

    const headers = new Headers({
      'Content-Type': getMetaCatalogContentType(format),
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    })

    if (download) {
      headers.set(
        'Content-Disposition',
        `attachment; filename="${getMetaCatalogFilename(format)}"`,
      )
    }

    return new NextResponse(body, { status: 200, headers })
  } catch (error) {
    console.error('[meta-catalog-feed]', error)
    return NextResponse.json(
      { error: 'Failed to build Meta catalog feed.' },
      { status: 500 },
    )
  }
}
