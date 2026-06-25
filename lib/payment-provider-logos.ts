export type PaymentProviderLogo = {
  id: string
  label: string
  src: string
  /** Optional max width class for wide marks like Paystack */
  className?: string
}

export const paymentProviderLogos: PaymentProviderLogo[] = [
  {
    id: 'visa',
    label: 'Visa',
    src: '/gelos/pay-logo/IMG_2026.PNG',
    className: 'max-h-5 max-w-[2.75rem]',
  },
  {
    id: 'mastercard',
    label: 'Mastercard',
    src: '/gelos/pay-logo/Mastercard.jpeg',
    className: 'max-h-6 max-w-[2.75rem]',
  },
  {
    id: 'momo',
    label: 'MoMo from MTN',
    src: '/gelos/pay-logo/IMG_2023.PNG',
    className: 'max-h-6 max-w-[4.5rem]',
  },
  {
    id: 'paystack',
    label: 'Paystack',
    src: '/gelos/pay-logo/IMG_2025.JPG',
    className: 'max-h-5 max-w-[5.5rem]',
  },
]
