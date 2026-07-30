/** @type {import('next').NextConfig} */
const nextConfig = {
  /** Keep Prisma out of the webpack bundle so all models (e.g. SmileScan) work on Vercel */
  serverExternalPackages: ['@prisma/client'],
  typescript: {
    ignoreBuildErrors: true,
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
