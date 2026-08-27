import type { DhlShipmentRecord, PublicDhlShipment } from '@/lib/dhl/types'

export function asDhlShipmentRecord(value: unknown): DhlShipmentRecord | undefined {
  if (!value || typeof value !== 'object') return undefined
  const record = value as DhlShipmentRecord
  if (!record.productCode && !record.trackingNumber) return undefined
  return record
}

export function toPublicDhlShipment(
  value: unknown,
): PublicDhlShipment | undefined {
  const record = asDhlShipmentRecord(value)
  if (!record) return undefined
  const { documents, ...rest } = record
  return {
    ...rest,
    hasDocuments: Boolean(documents && documents.length > 0),
  }
}
