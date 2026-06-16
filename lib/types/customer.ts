export type EmailSubscription = 'Subscribed' | 'Not subscribed'

export type CustomerSource = 'checkout' | 'manual' | 'import'

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
  joinDate: string
  source?: CustomerSource
}
