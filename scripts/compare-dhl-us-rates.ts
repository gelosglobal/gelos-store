/**
 * Postman-parity check: Accra → New York package (P) rates + sample tracking.
 * Run: pnpm exec tsx --env-file=.env.local scripts/compare-dhl-us-rates.ts
 *
 * Prints BILLC / PULCL only — no credentials.
 */
import { getDhlConfig, isDhlConfigured } from '../lib/dhl/config'
import { dhlFetch } from '../lib/dhl/client'
import { fetchDhlRates } from '../lib/dhl/rates'
import { plannedShippingDateAndTime } from '../lib/dhl/text'
import { pickDhlPriceLines } from '../lib/dhl/prices'

type Price = {
  currencyType?: string
  priceCurrency?: string
  price?: number
}

type Product = {
  productCode?: string
  productName?: string
  totalPrice?: Price[]
}

async function main() {
  if (!isDhlConfigured()) {
    throw new Error('DHL is not configured in .env.local')
  }

  const config = getDhlConfig()
  console.log(`DHL env: ${config.env}`)
  console.log(`baseUrl: ${config.baseUrl}`)
  console.log(
    `parcel: ${config.defaultWeightKg}kg ${config.lengthCm}×${config.widthCm}×${config.heightCm}cm`,
  )

  const body = {
    plannedShippingDateAndTime: plannedShippingDateAndTime(),
    productCode: 'P',
    unitOfMeasurement: 'metric',
    isCustomsDeclarable: true,
    nextBusinessDay: true,
    accounts: [{ number: config.exportAccount, typeCode: 'shipper' }],
    customerDetails: {
      shipperDetails: {
        addressLine1: config.shipperAddressLine1 || 'Gelos warehouse, Accra',
        postalCode: config.shipperPostalCode || '',
        cityName: config.shipperCity,
        countyName: config.shipperCounty || 'Greater Accra',
        countryCode: config.shipperCountryCode,
      },
      receiverDetails: {
        addressLine1: '350 5th Avenue',
        postalCode: '10001',
        cityName: 'New York',
        countyName: 'NY',
        countryCode: 'US',
      },
    },
    packages: [
      {
        weight: config.defaultWeightKg,
        dimensions: {
          length: config.lengthCm,
          width: config.widthCm,
          height: config.heightCm,
        },
      },
    ],
  }

  console.log('\n=== Raw MyDHL /rates (Postman GR05 equivalent) ===')
  const raw = await dhlFetch<{ products?: Product[] }>('/rates', {
    method: 'POST',
    body: JSON.stringify(body),
  })

  for (const product of raw.products ?? []) {
    if (String(product.productCode).toUpperCase() !== 'P') continue
    const lines = pickDhlPriceLines(product.totalPrice)
    console.log(`product: ${product.productCode} ${product.productName ?? ''}`)
    console.log(
      `BILLC: ${lines?.billed.amount} ${lines?.billed.currency}`,
    )
    if (lines?.local) {
      console.log(`PULCL: ${lines.local.amount} ${lines.local.currency}`)
    }
    for (const p of product.totalPrice ?? []) {
      console.log(
        `  ${p.currencyType}: ${p.price} ${p.priceCurrency}`,
      )
    }
  }

  console.log('\n=== Gelos fetchDhlRates (checkout path) ===')
  const gelos = await fetchDhlRates({
    destinationCountryCode: 'US',
    destinationCityName: 'New York',
    destinationPostalCode: '10001',
    destinationAddressLine1: '350 5th Avenue',
    itemCount: 1,
    productCode: 'P',
  })
  const s = gelos.selected
  console.log(
    `selected P: billed ${s.totalPrice} ${s.currency}` +
      (s.localPrice != null
        ? ` | local ${s.localPrice} ${s.localCurrency}`
        : '') +
      ` | catalog GHS ${s.totalPriceBase}`,
  )
  console.log(`weightKg used: ${gelos.weightKg}`)

  console.log('\n=== Tracking sample 9356579890 ===')
  const track = await dhlFetch<{
    shipments?: Array<{
      shipmentTrackingNumber?: string
      status?: { statusCode?: string; description?: string }
      events?: unknown[]
    }>
  }>('/shipments/9356579890/tracking?trackingView=all-checkpoints&levelOfDetail=all', {
    method: 'GET',
  })
  const shipment = track.shipments?.[0]
  console.log(
    `AWB ${shipment?.shipmentTrackingNumber ?? '9356579890'}: ` +
      `${shipment?.status?.statusCode ?? '?'} — ${shipment?.status?.description ?? ''}`,
  )
  console.log(`events: ${shipment?.events?.length ?? 0}`)
  console.log('Compare majors-only at /track/9356579890')
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err)
  process.exit(1)
})
