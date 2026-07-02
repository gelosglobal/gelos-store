'use client'

import { useCallback, useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Loader2, Package, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { AdminPageHeader } from '@/components/admin/admin-page-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { isExternalImageUrl } from '@/lib/image-url'
import type { ProductBundle } from '@/lib/types/product-bundle'

export function ProductBundlesList() {
  const [bundles, setBundles] = useState<ProductBundle[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/product-bundles', { cache: 'no-store' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setBundles(data.bundles ?? [])
    } catch {
      toast.error('Failed to load bundles')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-neutral-500">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        Loading bundles…
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Bundles"
        description="Create named product sets for the shop. Shoppers add each included product to cart separately."
      >
        <Button
          asChild
          className="rounded-full bg-neutral-950 hover:bg-neutral-800"
        >
          <Link href="/admin/collections/bundles/new">
            <Plus className="mr-2 h-4 w-4" />
            New bundle
          </Link>
        </Button>
      </AdminPageHeader>

      {bundles.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-neutral-200 bg-white px-6 py-12 text-center">
          <Package className="mx-auto h-8 w-8 text-neutral-300" />
          <p className="mt-3 text-sm font-medium text-neutral-950">No bundles yet</p>
          <p className="mt-1 text-sm text-neutral-500">
            Create your first bundle with a name and product list.
          </p>
          <Button asChild className="mt-4 rounded-full">
            <Link href="/admin/collections/bundles/new">Create bundle</Link>
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {bundles.map((bundle) => (
            <Link
              key={bundle.id}
              href={`/admin/collections/bundles/${bundle.id}`}
              className="overflow-hidden rounded-2xl border border-neutral-200 bg-white transition-shadow hover:shadow-md"
            >
              <div className="relative aspect-[16/9] bg-neutral-100">
                <Image
                  src={bundle.image || '/gelos/watermelon2.jpeg'}
                  alt=""
                  fill
                  className="object-cover"
                  unoptimized={isExternalImageUrl(bundle.image)}
                />
                {!bundle.active ? (
                  <Badge className="absolute left-3 top-3 bg-neutral-900/80 text-white">
                    Hidden
                  </Badge>
                ) : bundle.badge ? (
                  <Badge className="absolute left-3 top-3 bg-violet-600 text-white">
                    {bundle.badge}
                  </Badge>
                ) : null}
              </div>
              <div className="space-y-2 p-4">
                <h3 className="font-semibold text-neutral-950">{bundle.name}</h3>
                {bundle.description ? (
                  <p className="line-clamp-2 text-sm text-neutral-500">
                    {bundle.description}
                  </p>
                ) : null}
                <p className="text-xs text-neutral-400">
                  {bundle.productIds.length} product
                  {bundle.productIds.length === 1 ? '' : 's'}
                  {bundle.price > 0 ? ` · ${bundle.price.toFixed(2)}` : ''}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
