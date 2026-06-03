import type { LucideIcon } from 'lucide-react'
import {
  Bell,
  CreditCard,
  Globe,
  Palette,
  Shield,
} from 'lucide-react'

export type SettingsSectionId =
  | 'store'
  | 'notifications'
  | 'payments'
  | 'appearance'

export type SettingsSection = {
  id: SettingsSectionId
  label: string
  description: string
  icon: LucideIcon
}

export const settingsSections: SettingsSection[] = [
  {
    id: 'store',
    label: 'Store',
    description: 'Name, contact, and regional defaults',
    icon: Globe,
  },
  {
    id: 'notifications',
    label: 'Notifications',
    description: 'Email and in-app alerts',
    icon: Bell,
  },
  {
    id: 'payments',
    label: 'Payments',
    description: 'Checkout providers and payout',
    icon: CreditCard,
  },
  {
    id: 'appearance',
    label: 'Branding',
    description: 'Colors, logo, and storefront look',
    icon: Palette,
  },
]

export const storeDefaults = {
  name: 'Gelos',
  email: 'hello@gelos.com',
  country: 'gh',
  currency: 'ghs',
  timezone: 'Africa/Accra',
  description:
    'Premium dental care products crafted for brighter smiles across Ghana.',
  supportPhone: '+233 30 000 0000',
}

export const settingsStatusCards = [
  {
    title: 'Storefront',
    value: 'Live',
    detail: 'Public catalog is visible',
    positive: true,
  },
  {
    title: 'Region',
    value: 'Ghana',
    detail: 'GH₵ · Africa/Accra',
    positive: true,
  },
  {
    title: 'Checkout',
    value: 'Preview',
    detail: 'Payments not connected yet',
    positive: false,
  },
  {
    title: 'Alerts',
    value: '3 active',
    detail: 'Orders, stock, weekly report',
    positive: true,
  },
]

export const settingsInsight = {
  title: 'Regional defaults match your storefront',
  body: 'Currency is set to Ghanaian Cedi (GH₵) and timezone to Accra. Connect a payment provider when you are ready to take live orders.',
  action: 'View payment options',
}

export const notificationOptions = [
  {
    id: 'new-orders',
    label: 'New orders',
    description: 'Email when a customer completes checkout',
    defaultOn: true,
  },
  {
    id: 'low-stock',
    label: 'Low stock',
    description: 'Alert when SKU inventory drops below threshold',
    defaultOn: true,
  },
  {
    id: 'customer-messages',
    label: 'Customer messages',
    description: 'Notify on new contact form submissions',
    defaultOn: false,
  },
  {
    id: 'weekly-reports',
    label: 'Weekly reports',
    description: 'Summary of sales and traffic every Monday',
    defaultOn: true,
  },
] as const

export const paymentProviders = [
  {
    id: 'paystack',
    name: 'Paystack',
    description: 'Cards, mobile money, and bank transfers in Ghana',
    connected: false,
    recommended: true,
  },
  {
    id: 'stripe',
    name: 'Stripe',
    description: 'International cards and wallets',
    connected: false,
    recommended: false,
  },
  {
    id: 'manual',
    name: 'Manual payments',
    description: 'Mark orders paid outside the storefront',
    connected: true,
    recommended: false,
  },
] as const

export const brandColorPresets = [
  { id: 'gelos-lime', hex: '#D4FF59', label: 'Gelos lime' },
  { id: 'sky', hex: '#3b82f6', label: 'Sky' },
  { id: 'emerald', hex: '#10b981', label: 'Emerald' },
  { id: 'amber', hex: '#f59e0b', label: 'Amber' },
] as const

export const securityNote = {
  title: 'Admin access',
  body: 'Authentication is not enabled yet. Anyone with the /admin URL can edit content until you add sign-in.',
  icon: Shield,
}
