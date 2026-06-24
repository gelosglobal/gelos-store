import { jsPDF } from 'jspdf'
import { formatPackingSlipDate } from '@/lib/admin/order-format'
import type { AdminOrderDetail, StoreOrderLineItem } from '@/lib/types/order'

const MARGIN = 18
const PAGE_WIDTH = 210
const PAGE_HEIGHT = 297
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2

const STORE_FOOTER = {
  name: 'GELOS',
  address: 'Osabu Link, HSE 9, GW-063-1043 Adenta , Ghana',
  email: 'gelosbrand@gmail.com',
  website: 'gelosglobal.com',
} as const

type PackingUnit = {
  item: StoreOrderLineItem
  unitIndex: number
  totalUnits: number
}

function buildPackingUnits(lineItems: StoreOrderLineItem[]): PackingUnit[] {
  const totalUnits = lineItems.reduce((sum, item) => sum + item.quantity, 0)
  const units: PackingUnit[] = []
  let unitIndex = 0

  for (const item of lineItems) {
    for (let count = 0; count < item.quantity; count += 1) {
      unitIndex += 1
      units.push({ item, unitIndex, totalUnits })
    }
  }

  return units
}

function splitAddressLines(address?: string): string[] {
  if (!address?.trim()) return []
  return address
    .split(/\n|,/)
    .map((part) => part.trim())
    .filter(Boolean)
}

function resolveAssetUrl(path: string): string {
  if (path.startsWith('http://') || path.startsWith('https://')) return path
  const origin =
    typeof window !== 'undefined'
      ? window.location.origin
      : 'https://gelosglobal.com'
  return `${origin}${path.startsWith('/') ? path : `/${path}`}`
}

async function loadImageDataUrl(src: string): Promise<string | null> {
  try {
    const response = await fetch(resolveAssetUrl(src))
    if (!response.ok) return null

    const blob = await response.blob()
    return await new Promise((resolve) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(typeof reader.result === 'string' ? reader.result : null)
      reader.onerror = () => resolve(null)
      reader.readAsDataURL(blob)
    })
  } catch {
    return null
  }
}

function drawAddressBlock(
  doc: jsPDF,
  title: string,
  x: number,
  y: number,
  width: number,
  lines: string[],
) {
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.setTextColor(20)
  doc.text(title, x, y)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  let lineY = y + 6

  for (const line of lines) {
    const wrapped = doc.splitTextToSize(line, width)
    doc.text(wrapped, x, lineY)
    lineY += wrapped.length * 5
  }
}

function drawFooter(doc: jsPDF) {
  const centerX = PAGE_WIDTH / 2
  let y = PAGE_HEIGHT - 42

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.setTextColor(20)
  doc.text('Thank you for shopping with us!', centerX, y, { align: 'center' })

  y += 8
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.text(STORE_FOOTER.name, centerX, y, { align: 'center' })

  y += 6
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(60)
  doc.text(STORE_FOOTER.address, centerX, y, { align: 'center' })
  y += 5
  doc.text(STORE_FOOTER.email, centerX, y, { align: 'center' })
  y += 5
  doc.text(STORE_FOOTER.website, centerX, y, { align: 'center' })
}

export async function buildOrderReceiptPdf(
  order: AdminOrderDetail,
): Promise<jsPDF> {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const orderDate = formatPackingSlipDate(new Date(order.createdAt))
  const addressLines = splitAddressLines(order.shippingAddress)
  const shipToLines = [
    order.customer,
    ...addressLines,
    ...(order.customerPhone ? [order.customerPhone] : []),
  ]
  const billToLines = [order.customer, ...addressLines]
  const packingUnits = buildPackingUnits(order.lineItems)

  const imageCache = new Map<string, string | null>()
  const imageSources = [
    ...new Set(
      order.lineItems
        .map((item) => item.image ?? item.variantImage)
        .filter((src): src is string => Boolean(src?.trim())),
    ),
  ]

  await Promise.all(
    imageSources.map(async (src) => {
      imageCache.set(src, await loadImageDataUrl(src))
    }),
  )

  let y = MARGIN

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(24)
  doc.setTextColor(20)
  doc.text('GELOS', MARGIN, y)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.text(order.orderNumber, PAGE_WIDTH - MARGIN, y, { align: 'right' })

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.text(orderDate, PAGE_WIDTH - MARGIN, y + 6, { align: 'right' })

  y += 18

  const columnGap = 10
  const columnWidth = (CONTENT_WIDTH - columnGap) / 2
  const leftX = MARGIN
  const rightX = MARGIN + columnWidth + columnGap

  drawAddressBlock(doc, 'SHIP TO', leftX, y, columnWidth, shipToLines)
  drawAddressBlock(doc, 'BILL TO', rightX, y, columnWidth, billToLines)

  const addressHeight = Math.max(shipToLines.length, billToLines.length) * 5 + 10
  y += addressHeight + 10

  doc.setDrawColor(20)
  doc.setLineWidth(0.35)
  doc.line(MARGIN, y, PAGE_WIDTH - MARGIN, y)
  y += 8

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.setTextColor(20)
  doc.text('ITEMS', MARGIN, y)
  doc.text('QUANTITY', PAGE_WIDTH - MARGIN, y, { align: 'right' })

  y += 4
  doc.line(MARGIN, y, PAGE_WIDTH - MARGIN, y)
  y += 8

  const imageSize = 14
  const rowGap = 6
  const textX = MARGIN + imageSize + 4
  const textWidth = CONTENT_WIDTH - imageSize - 30

  for (const unit of packingUnits) {
    if (y > PAGE_HEIGHT - 55) {
      doc.addPage()
      y = MARGIN
    }

    const imageSrc = unit.item.image ?? unit.item.variantImage
    const imageData = imageSrc ? imageCache.get(imageSrc) : null

    if (imageData) {
      try {
        const format = imageData.includes('image/png') ? 'PNG' : 'JPEG'
        doc.addImage(imageData, format, MARGIN, y - 2, imageSize, imageSize)
      } catch {
        doc.setDrawColor(220)
        doc.rect(MARGIN, y - 2, imageSize, imageSize)
      }
    } else {
      doc.setDrawColor(220)
      doc.setFillColor(245)
      doc.rect(MARGIN, y - 2, imageSize, imageSize, 'FD')
    }

    const productName = unit.item.productName ?? unit.item.name
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.setTextColor(20)
    const nameLines = doc.splitTextToSize(productName, textWidth)
    doc.text(nameLines, textX, y + 2)

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.text(
      `${unit.unitIndex} of ${unit.totalUnits}`,
      PAGE_WIDTH - MARGIN,
      y + 2,
      { align: 'right' },
    )

    const rowHeight = Math.max(imageSize, nameLines.length * 5) + rowGap
    y += rowHeight
  }

  y += 2
  doc.line(MARGIN, y, PAGE_WIDTH - MARGIN, y)

  drawFooter(doc)

  return doc
}

export async function openOrderReceiptPdf(
  order: AdminOrderDetail,
): Promise<boolean> {
  if (typeof window === 'undefined') return false

  try {
    const doc = await buildOrderReceiptPdf(order)
    const blob = doc.output('blob')
    const url = URL.createObjectURL(blob)
    const opened = window.open(url, '_blank', 'noopener,noreferrer')

    if (!opened) {
      URL.revokeObjectURL(url)
      return false
    }

    window.setTimeout(() => URL.revokeObjectURL(url), 120_000)
    return true
  } catch (error) {
    console.error('[openOrderReceiptPdf]', error)
    return false
  }
}
