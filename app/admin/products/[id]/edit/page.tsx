'use client'

import { use } from 'react'
import { ProductEditor } from '@/components/admin/product-editor'

type PageProps = {
  params: Promise<{ id: string }>
}

export default function EditProductPage({ params }: PageProps) {
  const { id } = use(params)
  return <ProductEditor mode="edit" productId={id} />
}
