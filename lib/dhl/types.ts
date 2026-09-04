export type DhlAccountType = 'EXP' | 'IMP'
export type DhlProductCode = 'N' | 'D' | 'P'

export type DhlPostalAddress = {
  addressLine1: string
  addressLine2?: string
  addressLine3?: string
  postalCode?: string
  cityName: string
  countyName?: string
  countryCode: string
}

export type DhlContact = {
  fullName: string
  companyName: string
  email: string
  phone: string
}

export type DhlPackage = {
  weight: number
  dimensions: {
    length: number
    width: number
    height: number
  }
}

export type DhlShipmentProfile = {
  productCode: DhlProductCode
  isCustomsDeclarable: boolean
  accountNumber: string
  accountType: DhlAccountType
  payerCountryCode?: string
}

export type ShippingDetails = {
  countryCode: string
  city: string
  postalCode?: string
  addressLine1?: string
  countyName?: string
  productCode?: string
}

export type DhlDocument = {
  typeCode: string
  imageFormat: string
  content: string
}

export type DhlTrackingEvent = {
  timestamp?: string
  typeCode?: string
  description?: string
  serviceArea?: string
}

export type DhlShipmentRecord = {
  productCode: string
  productName?: string
  trackingNumber?: string
  trackingUrl?: string
  pickupConfirmationNumber?: string
  dispatchConfirmationNumber?: string
  accountType?: DhlAccountType
  isCustomsDeclarable?: boolean
  addressValid?: boolean
  addressMessage?: string
  documents?: DhlDocument[]
  lastStatus?: string
  lastDescription?: string
  lastEvents?: DhlTrackingEvent[]
  lastTrackedAt?: string
  createdAt?: string
  error?: string
}

export type PublicDhlShipment = Omit<DhlShipmentRecord, 'documents'> & {
  hasDocuments: boolean
}

export type DhlRateOption = {
  productCode: string
  productName: string
  /** Account billed amount (BILLC). */
  totalPrice: number
  currency: string
  /** Pickup-country amount (PULCL), when DHL returns one. */
  localPrice?: number
  localCurrency?: string
  /** GHS for catalog totals — DHL PULCL when GHS, otherwise FX from billed. */
  totalPriceBase: number
  deliveryDate?: string
}

export type DhlAddressValidation = {
  valid: boolean
  cityName?: string
  postalCode?: string
  countryCode?: string
  serviceArea?: string
  message?: string
}
