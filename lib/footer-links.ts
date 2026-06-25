export type FooterLink = {
  label: string
  href: string
}

export type FooterLinkGroup = {
  title: string
  links: FooterLink[]
}

export const footerLinkGroups: FooterLinkGroup[] = [
  {
    title: 'Shop',
    links: [
      { label: 'All Products', href: '/shop' },
      { label: 'Toothpaste', href: '/shop?category=Toothpaste' },
      { label: 'Electric Toothbrushes', href: '/shop?category=Toothbrushes' },
      { label: 'Bundles & Kits', href: '/shop?bundles=true' },
      { label: 'Accessories', href: '/shop?category=Accessories' },
    ],
  },
  {
    title: 'Collections',
    links: [
      { label: 'Care', href: '/shop?category=Wellness' },
      { label: 'Prevention', href: '/collections/mouth-washes' },
      { label: 'Whitening', href: '/shop?category=Whitening' },
      { label: 'Wellness', href: '/shop?category=Wellness' },
      { label: 'Kids', href: '/shop?category=Toothbrushes' },
    ],
  },
  {
    title: 'Help',
    links: [
      { label: 'FAQs', href: '/contact' },
      { label: 'Shipping & Delivery', href: '/contact' },
      { label: 'Returns', href: '/contact' },
      { label: 'Payments', href: '/checkout' },
      { label: 'Contact Us', href: '/contact' },
    ],
  },
  {
    title: 'About',
    links: [
      { label: 'Our Story', href: '/contact' },
      { label: 'Ingredients', href: '/shop' },
      { label: 'Careers', href: '/contact' },
      { label: 'Press', href: '/contact' },
      { label: 'Find a Store', href: '/find-a-store' },
    ],
  },
]

export const footerSocialLinks = [
  {
    label: 'Instagram',
    href: 'https://www.instagram.com/gelosglobal/',
    className: 'bg-gradient-to-br from-[#f9ce34] via-[#ee2a7b] to-[#6228d7]',
    icon: 'instagram' as const,
  },
  {
    label: 'Facebook',
    href: 'https://facebook.com/p/GELOS-61558412705085/',
    className: 'bg-[#1877F2]',
    icon: 'facebook' as const,
  },
  {
    label: 'TikTok',
    href: 'https://www.tiktok.com/@gelosglobal',
    className: 'bg-neutral-950',
    icon: 'tiktok' as const,
  },
]

export const footerPaymentMethods = [
  'Visa',
  'Mastercard',
  'MoMo',
  'Bank',
] as const
