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
    ],
  },
}

export default nextConfig
