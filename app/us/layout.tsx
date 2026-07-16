import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'USA Nasal Inhalers | Gelos',
  description:
    'Shop Gelos nasal inhalers in the USA — Fruit Energy aromatherapy for clearer breathing. Secure Stripe checkout in USD.',
}

export default function UsLayout({ children }: { children: React.ReactNode }) {
  return children
}
