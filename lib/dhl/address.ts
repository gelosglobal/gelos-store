import { dhlFetch } from '@/lib/dhl/client'
import type { DhlAddressValidation } from '@/lib/dhl/types'

export async function validateDhlAddress(input: {
  countryCode: string
  cityName: string
  postalCode?: string
  type?: 'delivery' | 'pickup'
  strictValidation?: boolean
}): Promise<DhlAddressValidation> {
  const countryCode = input.countryCode.trim().toUpperCase()
  const cityName = input.cityName.trim()
  if (!countryCode || countryCode.length !== 2 || cityName.length < 2) {
    return { valid: false, message: 'City and country are required' }
  }

  const params = new URLSearchParams({
    type: input.type ?? 'delivery',
    countryCode,
    cityName,
    strictValidation: input.strictValidation === false ? 'false' : 'true',
  })
  if (input.postalCode?.trim()) {
    params.set('postalCode', input.postalCode.trim())
  }

  const json = await dhlFetch<{
    address?: Array<{
      countryCode?: string
      postalCode?: string
      cityName?: string
      serviceArea?: { code?: string; description?: string }
    }>
  }>(`/address-validate?${params.toString()}`, { method: 'GET' })

  const match = json.address?.[0]
  if (!match) {
    return {
      valid: false,
      countryCode,
      cityName,
      message: 'DHL could not validate this delivery address',
    }
  }

  return {
    valid: true,
    countryCode: match.countryCode ?? countryCode,
    cityName: match.cityName ?? cityName,
    postalCode: match.postalCode,
    serviceArea: match.serviceArea?.description || match.serviceArea?.code,
  }
}
