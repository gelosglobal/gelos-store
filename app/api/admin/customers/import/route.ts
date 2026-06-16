import { NextResponse } from 'next/server'
import { parseCustomerCsv } from '@/lib/admin/customer-import'
import { importStoredCustomers } from '@/lib/db/customers'
import { isAdminDatabaseReady } from '@/lib/db/admin-products'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  if (!isAdminDatabaseReady()) {
    return NextResponse.json(
      { error: 'Database is not connected.' },
      { status: 503 },
    )
  }

  try {
    const contentType = request.headers.get('content-type') ?? ''
    let csvText = ''

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData()
      const file = formData.get('file')
      if (!(file instanceof File)) {
        return NextResponse.json(
          { error: 'Upload a CSV file to import customers.' },
          { status: 400 },
        )
      }
      csvText = await file.text()
    } else {
      const json = (await request.json()) as { csv?: string }
      csvText = json.csv?.trim() ?? ''
    }

    if (!csvText) {
      return NextResponse.json(
        { error: 'CSV content is required.' },
        { status: 400 },
      )
    }

    const parsed = parseCustomerCsv(csvText)
    if (!parsed.rows.length && parsed.errors.length) {
      return NextResponse.json(
        {
          error: parsed.errors[0]?.message ?? 'Could not parse CSV.',
          errors: parsed.errors,
        },
        { status: 400 },
      )
    }

    const result = await importStoredCustomers(parsed.rows)

    return NextResponse.json({
      created: result.created,
      skipped: result.skipped,
      errors: [...parsed.errors, ...result.errors],
    })
  } catch (error) {
    console.error('[POST /api/admin/customers/import]', error)
    return NextResponse.json(
      { error: 'Failed to import customers' },
      { status: 500 },
    )
  }
}
