export type EmailSubscription = 'Subscribed' | 'Not subscribed'

export type StoreCustomer = {
  id: string
  name: string
  email: string
  phone: string
  location: string
  emailSubscription: EmailSubscription
  orders: number
  totalSpent: number
  joinDate: string
}
