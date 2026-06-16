import {
  adminCustomerInputSchema,
  normalizeCustomerEmail,
  normalizeCustomerPhone,
  subscriptionFromEmail,
  type AdminCustomerInput,
} from '@/lib/admin/customer-input'

export type ParsedCustomerImportRow = AdminCustomerInput & {
  rowNumber: number
}

export type CustomerImportParseResult = {
  rows: ParsedCustomerImportRow[]
  errors: Array<{ rowNumber: number; message: string }>
}

const HEADER_ALIASES: Record<string, keyof AdminCustomerInput | 'skip'> = {
  name: 'name',
  'customer name': 'name',
  'full name': 'name',
  email: 'email',
  'email address': 'email',
  phone: 'phone',
  'phone number': 'phone',
  mobile: 'phone',
  location: 'location',
  city: 'location',
  address: 'location',
  country: 'location',
  'email subscription': 'emailSubscription',
  subscription: 'emailSubscription',
  subscribed: 'emailSubscription',
}

function parseCsvLine(line: string): string[] {
  const values: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i]
    const next = line[i + 1]

    if (char === '"') {
      if (inQuotes && next === '"') {
        current += '"'
        i += 1
      } else {
        inQuotes = !inQuotes
      }
      continue
    }

    if (char === ',' && !inQuotes) {
      values.push(current.trim())
      current = ''
      continue
    }

    current += char
  }

  values.push(current.trim())
  return values
}

function normalizeSubscription(value: string): AdminCustomerInput['emailSubscription'] {
  const normalized = value.trim().toLowerCase()
  if (!normalized) return undefined
  if (['yes', 'true', 'subscribed', '1', 'y'].includes(normalized)) {
    return 'Subscribed'
  }
  if (['no', 'false', 'not subscribed', '0', 'n'].includes(normalized)) {
    return 'Not subscribed'
  }
  return normalized === 'subscribed' ? 'Subscribed' : 'Not subscribed'
}

function mapHeader(header: string): keyof AdminCustomerInput | 'skip' | null {
  const key = header.trim().toLowerCase()
  return HEADER_ALIASES[key] ?? null
}

export function parseCustomerCsv(text: string): CustomerImportParseResult {
  const lines = text
    .replace(/^\uFEFF/, '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)

  if (!lines.length) {
    return { rows: [], errors: [{ rowNumber: 0, message: 'CSV file is empty.' }] }
  }

  const headerCells = parseCsvLine(lines[0])
  const columnMap = headerCells.map((header) => mapHeader(header))

  if (!columnMap.includes('name')) {
    return {
      rows: [],
      errors: [
        {
          rowNumber: 1,
          message: 'CSV must include a Name column.',
        },
      ],
    }
  }

  const rows: ParsedCustomerImportRow[] = []
  const errors: CustomerImportParseResult['errors'] = []

  for (let index = 1; index < lines.length; index += 1) {
    const rowNumber = index + 1
    const cells = parseCsvLine(lines[index])
    const draft: Record<string, string> = {}

    columnMap.forEach((field, columnIndex) => {
      if (!field || field === 'skip') return
      const value = cells[columnIndex]?.trim() ?? ''
      if (!value) return
      if (field === 'emailSubscription') {
        const subscription = normalizeSubscription(value)
        if (subscription) draft.emailSubscription = subscription
      } else {
        draft[field] = value
      }
    })

    const email = normalizeCustomerEmail(draft.email)
    const phone = normalizeCustomerPhone(draft.phone)
    const parsed = adminCustomerInputSchema.safeParse({
      name: draft.name ?? '',
      email,
      phone,
      location: draft.location ?? '',
      emailSubscription: subscriptionFromEmail(
        email,
        draft.emailSubscription as AdminCustomerInput['emailSubscription'],
      ),
    })

    if (!parsed.success) {
      const message =
        parsed.error.issues[0]?.message ?? 'Invalid customer row'
      errors.push({ rowNumber, message })
      continue
    }

    rows.push({ ...parsed.data, rowNumber })
  }

  return { rows, errors }
}

export const CUSTOMER_IMPORT_TEMPLATE = `Name,Email,Phone,Location,Email subscription
Ama Mensah,ama@example.com,+233201234567,Accra,Subscribed
Kwame Boateng,,+233501112233,Kumasi,Not subscribed`
