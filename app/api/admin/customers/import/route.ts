import { NextResponse } from 'next/server'
import { adminCustomerInputSchema } from '@/lib/admin/customer-input'
import { parseCustomerCsv } from '@/lib/admin/customer-import'
import type { ParsedCustomerImportRow } from '@/lib/admin/customer-import'
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
    let rowsToImport: ParsedCustomerImportRow[] | null = null
    let csvText = ''

    if (contentType.includes('application/json')) {
      const json = (await request.json()) as {
        csv?: string
        rows?: ParsedCustomerImportRow[]
      }

      if (Array.isArray(json.rows) && json.rows.length > 0) {
        rowsToImport = json.rows.map((row, index) => ({
          ...row,
          rowNumber:
            'rowNumber' in row && typeof row.rowNumber === 'number'
              ? row.rowNumber
              : index + 2,
        }))
      } else {
        csvText = json.csv?.trim() ?? ''
      }
    } else if (contentType.includes('multipart/form-data')) {
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
      return NextResponse.json(
        { error: 'Send a CSV file or JSON body with selected rows.' },
        { status: 400 },
      )
    }

    if (!rowsToImport) {
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

      rowsToImport = parsed.rows

      const result = await importStoredCustomers(rowsToImport)

      return NextResponse.json({
        created: result.created,
        updated: result.updated,
        skipped: result.skipped,
        errors: [...parsed.errors, ...result.errors],
      })
    }

    const validatedRows: ParsedCustomerImportRow[] = []
    const validationErrors: Array<{ rowNumber: number; message: string }> = []

    rowsToImport.forEach((row, index) => {
      const parsed = adminCustomerInputSchema.safeParse(row)
      if (!parsed.success) {
        validationErrors.push({
          rowNumber: row.rowNumber ?? index + 2,
          message: parsed.error.issues[0]?.message ?? 'Invalid customer row',
        })
        return
      }
      validatedRows.push({
        ...parsed.data,
        rowNumber: row.rowNumber ?? index + 2,
        lifetimeOrders: row.lifetimeOrders,
        lifetimeSpent: row.lifetimeSpent,
        lifetimeCurrency: row.lifetimeCurrency,
      })
    })

    if (!validatedRows.length) {
      return NextResponse.json(
        {
          error:
            validationErrors[0]?.message ?? 'No valid customers to import.',
          errors: validationErrors,
        },
        { status: 400 },
      )
    }

    const result = await importStoredCustomers(validatedRows)

    return NextResponse.json({
      created: result.created,
      updated: result.updated,
      skipped: result.skipped,
      errors: [...validationErrors, ...result.errors],
    })
  } catch (error) {
    console.error('[POST /api/admin/customers/import]', error)
    return NextResponse.json(
      { error: 'Failed to import customers' },
      { status: 500 },
    )
  }
}
