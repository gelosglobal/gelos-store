export type EmailSubscription = 'Subscribed' | 'Not subscribed'

export type CustomerSource = 'checkout' | 'manual' | 'import' | 'newsletter'

export type StoreCustomer = {
  id: string
  name: string
  email: string
  phone: string
  location: string
  emailSubscription: EmailSubscription
  orders: number
  totalSpent: number
  currency: string
  lifetimeOrders?: number
  lifetimeSpent?: number
  lifetimeCurrency?: string
  joinDate: string
  source?: CustomerSource
}
