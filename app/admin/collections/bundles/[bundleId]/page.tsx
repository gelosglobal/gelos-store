import { notFound } from 'next/navigation'
import { ProductBundleEditor } from '@/components/admin/product-bundle-editor'

type PageProps = { params: Promise<{ bundleId: string }> }

export default async function AdminEditBundlePage({ params }: PageProps) {
  const { bundleId } = await params
  if (!bundleId || bundleId === 'new') notFound()

  return <ProductBundleEditor bundleId={bundleId} />
}
