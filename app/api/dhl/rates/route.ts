import { NextResponse } from 'next/server'
import { z } from 'zod'
import { isDhlConfigured, isDhlShippingConfigured } from '@/lib/dhl/config'
import { fetchDhlRates } from '@/lib/dhl/rates'
import { normalizeDhlCity } from '@/lib/dhl/locations'
import { validateDhlAddress } from '@/lib/dhl/address'

const bodySchema = z.object({
  destinationCountryCode: z.string().trim().length(2),
  destinationCityName: z.string().trim().min(2).max(80),
  destinationPostalCode: z.string().trim().max(20).optional(),
  destinationAddressLine1: z.string().trim().max(45).optional(),
  itemCount: z.number().int().min(1).max(200),
  productCode: z.string().trim().max(10).optional(),
})

export async function GET() {
  return NextResponse.json({
    configured: isDhlConfigured(),
    shippingConfigured: isDhlShippingConfigured(),
  })
}

export async function POST(request: Request) {
  if (!isDhlConfigured()) {
    return NextResponse.json(
      {
        error:
          'DHL Express is not configured. Add DHL_API_KEY, DHL_API_SECRET, DHL_ACCOUNT_NUMBER (or DHL_EXPORT_ACCOUNT), and shipper address env vars.',
        configured: false,
      },
      { status: 503 },
    )
  }

  try {
    const json = await request.json()
    const parsed = bodySchema.safeParse(json)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid shipping destination', details: parsed.error.flatten() },
        { status: 400 },
      )
    }

    const cityName = normalizeDhlCity(
      parsed.data.destinationCountryCode,
      parsed.data.destinationCityName,
    )

    let address:
      | { valid: boolean; message?: string; serviceArea?: string; cityName?: string; postalCode?: string }
      | undefined
    try {
      address = await validateDhlAddress({
        countryCode: parsed.data.destinationCountryCode,
        cityName,
        postalCode: parsed.data.destinationPostalCode,
        type: 'delivery',
      })
    } catch {
      address = undefined
    }

    const result = await fetchDhlRates({
      ...parsed.data,
      destinationCityName:
        address?.valid && address.cityName ? address.cityName : cityName,
      destinationPostalCode:
        parsed.data.destinationPostalCode ||
        (address?.valid ? address.postalCode : undefined) ||
        undefined,
    })

    return NextResponse.json({
      ok: true,
      configured: true,
      weightKg: result.weightKg,
      selected: result.selected,
      options: result.options,
      address,
    })
  } catch (error) {
    console.error('[POST /api/dhl/rates]', error)
    const message =
      error instanceof Error ? error.message : 'Failed to fetch DHL rates'
    return NextResponse.json({ error: message, configured: true }, { status: 502 })
  }
}
