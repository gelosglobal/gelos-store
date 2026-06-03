import { notFound } from 'next/navigation'
import { TagCollectionEditor } from '@/components/admin/tag-collection-editor'
import {
  productTagDefinitions,
  type ProductTagId,
} from '@/lib/product-tags'

type PageProps = { params: Promise<{ tagId: string }> }

const validIds = new Set(productTagDefinitions.map((t) => t.id))

export default async function AdminTagCollectionPage({ params }: PageProps) {
  const { tagId } = await params
  if (!validIds.has(tagId)) notFound()

  return <TagCollectionEditor tagId={tagId as ProductTagId} />
}
