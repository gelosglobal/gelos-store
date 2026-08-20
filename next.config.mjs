/** @type {import('next').NextConfig} */
const nextConfig = {
  /** Keep Prisma out of the webpack bundle so all models (e.g. SmileScan) work on Vercel */
  serverExternalPackages: ['@prisma/client'],
  typescript: {
    ignoreBuildErrors: true,
  },
  /**
   * Stripe Elements needs a publishable key in the browser bundle.
   * Prefer NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY; fall back to STRIPE_PUBLISHABLE_KEY
   * so Production still works if only the non-prefixed name was set in Vercel.
   */
  env: {
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY:
      process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.trim() ||
      process.env.STRIPE_PUBLISHABLE_KEY?.trim() ||
      '',
  },
  images: {
    unoptimized: true,
    remotePatterns: [
      { protocol: 'https', hostname: 'utfs.io', pathname: '/**' },
      { protocol: 'https', hostname: '**.ufs.sh', pathname: '/**' },
      { protocol: 'https', hostname: 'cdn.shopify.com', pathname: '/**' },
      { protocol: 'https', hostname: '**.myshopify.com', pathname: '/**' },
    ],
  },
}

export default nextConfig
