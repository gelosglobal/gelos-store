export type TrustStatIcon = 'shield-check' | 'atom' | 'truck' | 'rabbit'

export type TrustStat = {
  id: string
  label: string
  icon: TrustStatIcon
}

export const trustStats: TrustStat[] = [
  {
    id: 'dentist-approved',
    label: 'Dentist Approved',
    icon: 'shield-check',
  },
  {
    id: 'clinically-proven',
    label: 'Clinically Proven',
    icon: 'atom',
  },
  {
    id: 'free-delivery',
    label: 'Free delivery for orders over GHS 1000',
    icon: 'truck',
  },
  {
    id: 'vegan-cruelty-free',
    label: 'Vegan & Cruelty Free',
    icon: 'rabbit',
  },
]
