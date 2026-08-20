import { NextResponse } from 'next/server'
import { isAdminDatabaseReady } from '@/lib/db/admin-products'
import { getWhatsappAgentConfig } from '@/lib/whatsapp-agent/config'
import {
  connectCatalogToWaba,
  getMetaCatalogStatus,
  syncStoreProductsToMetaCatalog,
} from '@/lib/whatsapp-agent/meta-catalog'

export const dynamic = 'force-dynamic'

export async function GET() {
  if (!isAdminDatabaseReady()) {
    return NextResponse.json(
      { error: 'Database is not connected.' },
      { status: 503 },
    )
  }

  try {
    const config = getWhatsappAgentConfig()
    const status = await getMetaCatalogStatus(config.meta)
    return NextResponse.json(status)
  } catch (error) {
    console.error('[GET /api/admin/whatsapp/catalog]', error)
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Failed to load catalog status',
      },
      { status: 500 },
    )
  }
}

export async function POST(request: Request) {
  if (!isAdminDatabaseReady()) {
    return NextResponse.json(
      { error: 'Database is not connected.' },
      { status: 503 },
    )
  }

  try {
    const body = (await request.json().catch(() => ({}))) as {
      action?: string
    }
    const action = body.action || 'sync'
    const config = getWhatsappAgentConfig()

    if (!config.meta.catalogId) {
      return NextResponse.json(
        {
          error:
            'META_CATALOG_ID is not set. Create a Commerce Catalog in Meta Business Suite, then add its ID to env.',
        },
        { status: 400 },
      )
    }

    if (action === 'connect') {
      const result = await connectCatalogToWaba(config.meta)
      return NextResponse.json(result)
    }

    if (action === 'sync') {
      const connect = await connectCatalogToWaba(config.meta).catch(
        (error) => ({
          connected: false as const,
          alreadyLinked: false as const,
          connectError:
            error instanceof Error ? error.message : 'Connect failed',
        }),
      )
      const sync = await syncStoreProductsToMetaCatalog(config.meta)
      return NextResponse.json({ connect, sync })
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  } catch (error) {
    console.error('[POST /api/admin/whatsapp/catalog]', error)
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Catalog operation failed',
      },
      { status: 500 },
    )
  }
}
