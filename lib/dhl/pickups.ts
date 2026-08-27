import { estimateShipmentWeightKg, getDhlConfig } from '@/lib/dhl/config'
import { dhlFetch } from '@/lib/dhl/client'
import type { DhlShipmentProfile, ShippingDetails } from '@/lib/dhl/types'
import { addressLine } from '@/lib/dhl/shipping-details'
import { clip, dhlPhone, plannedShippingDateAndTime } from '@/lib/dhl/text'

export type CreateDhlPickupInput = {
  shipper: {
    fullName: string
    companyName?: string
    email?: string
    phone?: string
    address: ShippingDetails
  }
  receiver: {
    fullName: string
    companyName?: string
    email?: string
    phone?: string
    address: ShippingDetails
  }
  profile: DhlShipmentProfile
  itemCount: number
  declaredValue?: number
}

export type DhlPickupResult = {
  confirmationNumber?: string
  dispatchConfirmationNumber?: string
}

type PickupApiResponse = {
  confirmationNumber?: string
  dispatchConfirmationNumbers?: string[]
}

export async function createDhlPickup(
  input: CreateDhlPickupInput,
): Promise<DhlPickupResult> {
  const config = getDhlConfig()
  const weightKg = estimateShipmentWeightKg(
    Math.max(1, input.itemCount),
    config.weightPerItemKg,
    config.defaultWeightKg,
  )

  const shipperAddress: Record<string, string> = {
    addressLine1: addressLine(input.shipper.address.addressLine1, 'Gelos warehouse'),
    postalCode: input.shipper.address.postalCode || '',
    cityName: input.shipper.address.city,
    countryCode: input.shipper.address.countryCode,
  }
  if (input.shipper.address.countyName) {
    shipperAddress.countyName = input.shipper.address.countyName
  }

  const receiverAddress: Record<string, string> = {
    addressLine1: addressLine(
      input.receiver.address.addressLine1,
      'Delivery address',
    ),
    postalCode: input.receiver.address.postalCode || '',
    cityName: input.receiver.address.city,
    countryCode: input.receiver.address.countryCode,
  }
  if (input.receiver.address.countyName) {
    receiverAddress.countyName = input.receiver.address.countyName
  }

  const shipmentDetails: Record<string, unknown> = {
    productCode: input.profile.productCode,
    isCustomsDeclarable: input.profile.isCustomsDeclarable,
    unitOfMeasurement: 'metric',
    packages: [
      {
        weight: weightKg,
        dimensions: {
          length: config.lengthCm,
          width: config.widthCm,
          height: config.heightCm,
        },
      },
    ],
  }

  if (input.profile.isCustomsDeclarable && input.declaredValue != null) {
    shipmentDetails.declaredValue = input.declaredValue
    shipmentDetails.declaredValueCurrency = config.accountCurrency
  }

  const body = {
    plannedPickupDateAndTime: plannedShippingDateAndTime(),
    closeTime: '18:00',
    location: 'reception',
    locationType: 'business',
    accounts: [
      {
        number: input.profile.accountNumber,
        typeCode: 'shipper',
      },
    ],
    specialInstructions: [
      {
        value: 'Gelos store pickup',
        typeCode: 'TBD',
      },
    ],
    customerDetails: {
      shipperDetails: {
        postalAddress: shipperAddress,
        contactInformation: {
          fullName: clip(input.shipper.fullName, 60),
          companyName: clip(
            input.shipper.companyName || input.shipper.fullName,
            60,
          ),
          email: input.shipper.email || config.shipperEmail,
          phone: dhlPhone(input.shipper.phone, config.shipperPhone),
        },
      },
      receiverDetails: {
        postalAddress: receiverAddress,
        contactInformation: {
          fullName: clip(input.receiver.fullName, 60),
          companyName: clip(
            input.receiver.companyName || input.receiver.fullName,
            60,
          ),
          email: input.receiver.email || config.shipperEmail,
          phone: dhlPhone(input.receiver.phone, config.shipperPhone),
        },
      },
    },
    shipmentDetails: [shipmentDetails],
  }

  const json = await dhlFetch<PickupApiResponse>('/pickups', {
    method: 'POST',
    body: JSON.stringify(body),
  })

  return {
    confirmationNumber: json.confirmationNumber,
    dispatchConfirmationNumber: json.dispatchConfirmationNumbers?.[0],
  }
}

export async function cancelDhlPickup(input: {
  confirmationNumber: string
  requestorName: string
  reason?: string
}): Promise<void> {
  const params = new URLSearchParams({
    requestorName: input.requestorName,
    reason: input.reason || 'Unavailable For Pickup',
  })
  await dhlFetch(
    `/pickups/${encodeURIComponent(input.confirmationNumber)}?${params.toString()}`,
    { method: 'DELETE' },
  )
}
