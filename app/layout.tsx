import type { Metadata } from 'next'
import { Geist, Geist_Mono, Plus_Jakarta_Sans } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { CartProvider } from '@/components/cart-provider'
import { LocationProvider } from '@/components/location-provider'
import { ProductsProvider } from '@/components/products-provider'
import { SiteNavbar } from '@/components/site-navbar'
import { Toaster } from 'sonner'
import { UploadThingSSRPlugin } from '@/components/uploadthing-ssr-plugin'
import './globals.css'

const _geist = Geist({ subsets: ['latin'] })
const _geistMono = Geist_Mono({ subsets: ['latin'] })

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-plus-jakarta',
})

export const metadata: Metadata = {
  title: 'Gelos | Premium Dental Care',
  description: 'Discover premium dental care products including whitening kits, charcoal powder, tongue scrapers, and more.',
  generator: 'v0.app',
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body
        className={`${plusJakarta.variable} font-sans antialiased bg-background text-foreground`}
      >
        <UploadThingSSRPlugin />
        <ProductsProvider>
        <LocationProvider>
          <CartProvider>
            <SiteNavbar />
            {children}
            <Toaster position="top-center" richColors closeButton />
            {process.env.NODE_ENV === 'production' && <Analytics />}
          </CartProvider>
        </LocationProvider>
        </ProductsProvider>
      </body>
    </html>
  )
}
