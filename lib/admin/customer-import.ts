import {
  adminCustomerInputSchema,
  normalizeCustomerEmail,
  normalizeCustomerPhone,
  subscriptionFromEmail,
  type AdminCustomerInput,
} from '@/lib/admin/customer-input'

export type ParsedCustomerImportRow = AdminCustomerInput & {
  rowNumber: number
  lifetimeOrders?: number
  lifetimeSpent?: number
  lifetimeCurrency?: string
}

export type CustomerImportParseResult = {
  rows: ParsedCustomerImportRow[]
  errors: Array<{ rowNumber: number; message: string }>
}

type ImportDraftField =
  | keyof AdminCustomerInput
  | 'firstName'
  | 'lastName'
  | 'addressLine1'
  | 'addressCity'
  | 'addressProvince'
  | 'addressCountry'
  | 'totalOrders'
  | 'totalSpent'
  | 'currency'
  | 'skip'

const HEADER_ALIASES: Record<string, ImportDraftField> = {
  name: 'name',
  'customer name': 'name',
  'full name': 'name',
  'first name': 'firstName',
  'last name': 'lastName',
  email: 'email',
  'email address': 'email',
  phone: 'phone',
  'phone number': 'phone',
  mobile: 'phone',
  'default address phone': 'phone',
  location: 'location',
  city: 'location',
  address: 'location',
  country: 'location',
  'default address city': 'addressCity',
  'default address province': 'addressProvince',
  'default address country': 'addressCountry',
  'default address address1': 'addressLine1',
  'default address address 1': 'addressLine1',
  'email subscription': 'emailSubscription',
  'accepts email marketing': 'emailSubscription',
  subscription: 'emailSubscription',
  subscribed: 'emailSubscription',
  'customer id': 'skip',
  'default address company': 'skip',
  'accepts sms marketing': 'skip',
  'total spent': 'totalSpent',
  'total orders': 'totalOrders',
  currency: 'currency',
  note: 'skip',
  'tax exempt': 'skip',
  tags: 'skip',
  'accepts whatsapp marketing': 'skip',
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

function normalizeHeader(header: string) {
  return header
    .trim()
    .replace(/^\uFEFF/, '')
    .replace(/^"|"$/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
}

function mapHeader(header: string): ImportDraftField | null {
  const key = normalizeHeader(header)
  if (HEADER_ALIASES[key]) return HEADER_ALIASES[key]
  if (key.includes('total spent') || key.includes('amount spent')) {
    return 'totalSpent'
  }
  if (key.includes('total orders') || key.includes('order count')) {
    return 'totalOrders'
  }
  return null
}

type ImportDraft = {
  name?: string
  firstName?: string
  lastName?: string
  email?: string
  phone?: string
  location?: string
  addressLine1?: string
  addressCity?: string
  addressProvince?: string
  addressCountry?: string
  totalOrders?: string
  totalSpent?: string
  currency?: string
  emailSubscription?: AdminCustomerInput['emailSubscription']
}

function normalizeNumericCell(value: string) {
  const trimmed = value.trim().replace(/^\uFEFF/, '').replace(/^"|"$/g, '')
  const match = trimmed.match(/-?\d[\d,]*(?:\.\d+)?/)
  return match?.[0]?.replace(/,/g, '') ?? ''
}

function parseIntegerCell(value: string) {
  const normalized = normalizeNumericCell(value)
  if (!normalized) return 0
  const parsed = Number.parseInt(normalized, 10)
  return Number.isFinite(parsed) ? parsed : 0
}

function parseFloatCell(value: string) {
  const normalized = normalizeNumericCell(value)
  if (!normalized) return 0
  const parsed = Number.parseFloat(normalized)
  return Number.isFinite(parsed) ? parsed : 0
}

// Handles Excel/Sheets CSV exports that turn long phone numbers into scientific notation.
function tryExpandScientificNotation(value: string) {
  const trimmed = value.trim()
  const match = trimmed.match(/^([+-]?\d+)(?:\.(\d+))?[eE]\+?(\d+)$/)
  if (!match) return trimmed
  const intPart = match[1] ?? ''
  const fracPart = match[2] ?? ''
  const exp = Number.parseInt(match[3] ?? '0', 10)
  if (!Number.isFinite(exp) || exp < 0) return trimmed

  const digits = `${intPart}${fracPart}`.replace(/^0+/, '') || '0'
  const decimalIndex = intPart.length + exp
  if (decimalIndex <= digits.length) {
    return digits.slice(0, decimalIndex)
  }
  return digits + '0'.repeat(decimalIndex - digits.length)
}

function resolveImportDraft(draft: ImportDraft) {
  const name =
    draft.name?.trim() ||
    [draft.firstName, draft.lastName].filter(Boolean).join(' ').trim()

  const location =
    draft.location?.trim() ||
    [
      draft.addressLine1,
      draft.addressCity,
      draft.addressProvince,
      draft.addressCountry,
    ]
      .map((part) => part?.trim())
      .filter(Boolean)
      .join(', ')

  return {
    name,
    email: normalizeCustomerEmail(draft.email),
    phone: normalizeCustomerPhone(tryExpandScientificNotation(draft.phone ?? '')),
    location: location ?? '',
    emailSubscription: subscriptionFromEmail(
      normalizeCustomerEmail(draft.email),
      draft.emailSubscription,
    ),
    lifetimeOrders: parseIntegerCell(draft.totalOrders ?? ''),
    lifetimeSpent: parseFloatCell(draft.totalSpent ?? ''),
    lifetimeCurrency: (draft.currency ?? '').trim() || undefined,
  }
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

  const hasNameColumn =
    columnMap.includes('name') ||
    columnMap.includes('firstName') ||
    columnMap.includes('lastName')

  if (!hasNameColumn) {
    return {
      rows: [],
      errors: [
        {
          rowNumber: 1,
          message:
            'CSV must include a Name column, or First Name / Last Name columns.',
        },
      ],
    }
  }

  const rows: ParsedCustomerImportRow[] = []
  const errors: CustomerImportParseResult['errors'] = []

  for (let index = 1; index < lines.length; index += 1) {
    const rowNumber = index + 1
    const cells = parseCsvLine(lines[index])
    const draft: ImportDraft = {}

    columnMap.forEach((field, columnIndex) => {
      if (!field || field === 'skip') return
      const value = cells[columnIndex]?.trim() ?? ''
      if (!value) return
      if (field === 'emailSubscription') {
        const subscription = normalizeSubscription(value)
        if (subscription) draft.emailSubscription = subscription
      } else if (field === 'phone') {
        const current = draft.phone?.trim() ?? ''
        if (!current || value.length > current.length) {
          draft.phone = value
        }
      } else if (field === 'totalOrders' || field === 'totalSpent') {
        draft[field] = value
      } else if (field === 'currency') {
        draft.currency = value
      } else {
        draft[field] = value
      }
    })

    const resolved = resolveImportDraft(draft)
    const parsed = adminCustomerInputSchema.safeParse(resolved)

    if (!parsed.success) {
      const message =
        parsed.error.issues[0]?.message ?? 'Invalid customer row'
      errors.push({ rowNumber, message })
      continue
    }

    rows.push({
      ...parsed.data,
      rowNumber,
      lifetimeOrders: resolved.lifetimeOrders,
      lifetimeSpent: resolved.lifetimeSpent,
      lifetimeCurrency: resolved.lifetimeCurrency,
    })
  }

  return { rows, errors }
}

export const CUSTOMER_IMPORT_TEMPLATE = `Name,Email,Phone,Location,Email subscription
Ama Mensah,ama@example.com,+233201234567,Accra,Subscribed
Kwame Boateng,,+233501112233,Kumasi,Not subscribed`
