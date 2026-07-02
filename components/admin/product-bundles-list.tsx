'use client'

import { useCallback, useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  ArrowDown,
  ArrowUp,
  Loader2,
  Package,
  Pencil,
  Plus,
} from 'lucide-react'
import { toast } from 'sonner'
import { AdminPageHeader } from '@/components/admin/admin-page-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { isExternalImageUrl } from '@/lib/image-url'
import { notifyProductsUpdated } from '@/lib/products-events'
import type { ProductBundle } from '@/lib/types/product-bundle'

export function ProductBundlesList() {
  const [bundles, setBundles] = useState<ProductBundle[]>([])
  const [loading, setLoading] = useState(true)
  const [savingOrder, setSavingOrder] = useState(false)

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

  const persistOrder = async (orderedBundles: ProductBundle[]) => {
    setSavingOrder(true)
    try {
      const res = await fetch('/api/admin/product-bundles/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bundleIds: orderedBundles.map((bundle) => bundle.id),
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setBundles(data.bundles ?? orderedBundles)
      notifyProductsUpdated()
      toast.success('Bundle order updated')
    } catch {
      toast.error('Failed to save bundle order')
      await load()
    } finally {
      setSavingOrder(false)
    }
  }

  const move = (index: number, direction: -1 | 1) => {
    const target = index + direction
    if (target < 0 || target >= bundles.length) return

    const next = [...bundles]
    ;[next[index], next[target]] = [next[target], next[index]]
    setBundles(next)
    void persistOrder(next)
  }

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
        description="Create named product sets for the shop. Use the arrows to control the order bundles appear on /shop?bundles=true."
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
        <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white">
          <div className="border-b border-neutral-200 px-4 py-3 sm:px-5">
            <p className="text-sm font-medium text-neutral-950">Storefront order</p>
            <p className="mt-0.5 text-xs text-neutral-500">
              Top of the list appears first on the bundles shop page.
              {savingOrder ? ' Saving…' : null}
            </p>
          </div>
          <ul className="divide-y divide-neutral-100">
            {bundles.map((bundle, index) => (
              <li
                key={bundle.id}
                className="flex items-center gap-3 px-4 py-3 sm:gap-4 sm:px-5"
              >
                <span className="w-6 shrink-0 text-center text-xs font-semibold text-neutral-400">
                  {index + 1}
                </span>
                <div className="flex flex-col gap-0.5">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-neutral-400"
                    disabled={index === 0 || savingOrder}
                    onClick={() => move(index, -1)}
                    aria-label={`Move ${bundle.name} up`}
                  >
                    <ArrowUp className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-neutral-400"
                    disabled={index === bundles.length - 1 || savingOrder}
                    onClick={() => move(index, 1)}
                    aria-label={`Move ${bundle.name} down`}
                  >
                    <ArrowDown className="h-3.5 w-3.5" />
                  </Button>
                </div>
                <div className="relative h-14 w-20 shrink-0 overflow-hidden rounded-lg border border-neutral-100 bg-neutral-50 sm:h-16 sm:w-24">
                  <Image
                    src={bundle.image || '/gelos/watermelon2.jpeg'}
                    alt=""
                    fill
                    className="object-contain p-1"
                    unoptimized={isExternalImageUrl(bundle.image)}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate text-sm font-semibold text-neutral-950">
                      {bundle.name}
                    </p>
                    {!bundle.active ? (
                      <Badge className="bg-neutral-900/80 text-white">Hidden</Badge>
                    ) : bundle.badge ? (
                      <Badge className="bg-violet-600 text-white">{bundle.badge}</Badge>
                    ) : null}
                  </div>
                  <p className="mt-0.5 text-xs text-neutral-500">
                    {bundle.productIds.length} product
                    {bundle.productIds.length === 1 ? '' : 's'}
                    {bundle.price > 0 ? ` · ${bundle.price.toFixed(2)}` : ''}
                  </p>
                </div>
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  className="shrink-0 rounded-full"
                >
                  <Link href={`/admin/collections/bundles/${bundle.id}`}>
                    <Pencil className="mr-1.5 h-3.5 w-3.5" />
                    Edit
                  </Link>
                </Button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
