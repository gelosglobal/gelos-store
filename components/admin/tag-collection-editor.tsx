'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import {
  ArrowDown,
  ArrowUp,
  GripVertical,
  Loader2,
  Plus,
  Trash2,
} from 'lucide-react'
import { toast } from 'sonner'
import { AdminPageHeader } from '@/components/admin/admin-page-header'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { notifyProductsUpdated } from '@/lib/products-events'
import {
  getTagDefinition,
  type ProductTagId,
} from '@/lib/product-tags'
import type { Product } from '@/lib/types/product'
import { isExternalImageUrl } from '@/lib/image-url'

type TagCollectionEditorProps = {
  tagId: ProductTagId
}

export function TagCollectionEditor({ tagId }: TagCollectionEditorProps) {
  const tag = getTagDefinition(tagId)!
  const [orderedIds, setOrderedIds] = useState<string[]>([])
  const [allProducts, setAllProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [addProductId, setAddProductId] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [collectionRes, productsRes] = await Promise.all([
        fetch(`/api/admin/tag-collections/${tagId}`, { cache: 'no-store' }),
        fetch('/api/admin/products', { cache: 'no-store' }),
      ])
      const collectionData = await collectionRes.json()
      const productsData = await productsRes.json()
      if (!collectionRes.ok) throw new Error(collectionData.error)
      if (!productsRes.ok) throw new Error(productsData.error)
      setOrderedIds(collectionData.productIds ?? [])
      setAllProducts(productsData.products ?? [])
    } catch {
      toast.error('Failed to load collection')
    } finally {
      setLoading(false)
    }
  }, [tagId])

  useEffect(() => {
    void load()
  }, [load])

  const productsById = useMemo(
    () => new Map(allProducts.map((p) => [p.id, p])),
    [allProducts],
  )

  const orderedProducts = useMemo(
    () =>
      orderedIds
        .map((id) => productsById.get(id))
        .filter((p): p is Product => Boolean(p)),
    [orderedIds, productsById],
  )

  const availableToAdd = useMemo(
    () => allProducts.filter((p) => !orderedIds.includes(p.id)),
    [allProducts, orderedIds],
  )

  const move = (index: number, direction: -1 | 1) => {
    const target = index + direction
    if (target < 0 || target >= orderedIds.length) return
    const next = [...orderedIds]
    ;[next[index], next[target]] = [next[target], next[index]]
    setOrderedIds(next)
  }

  const remove = (id: string) => {
    setOrderedIds((ids) => ids.filter((x) => x !== id))
  }

  const addProduct = () => {
    if (!addProductId) return
    setOrderedIds((ids) => [...ids, addProductId])
    setAddProductId('')
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/tag-collections/${tagId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productIds: orderedIds }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Save failed')
      setOrderedIds(data.productIds ?? orderedIds)
      notifyProductsUpdated()
      toast.success(`${tag.label} order saved`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-neutral-500">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        Loading collection…
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={tag.label}
        description={tag.description}
      >
        <Button
          className="rounded-full bg-neutral-950 hover:bg-neutral-800"
          onClick={() => void handleSave()}
          disabled={saving}
        >
          {saving ? 'Saving…' : 'Save order'}
        </Button>
      </AdminPageHeader>

      <div className="rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-600">
        Drag order controls set how products appear on the storefront for this
        collection. Saving also applies the <strong>{tag.label}</strong> tag to
        products in the list and removes it from products you remove.
      </div>

      <div className="rounded-2xl border border-neutral-200 bg-white">
        <div className="flex flex-col gap-3 border-b border-neutral-100 p-4 sm:flex-row sm:items-end">
          <div className="flex-1 space-y-1.5">
            <p className="text-sm font-medium text-neutral-950">Add product</p>
            <Select value={addProductId} onValueChange={setAddProductId}>
              <SelectTrigger className="border-neutral-200 bg-white">
                <SelectValue placeholder="Choose a product" />
              </SelectTrigger>
              <SelectContent>
                {availableToAdd.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            type="button"
            variant="outline"
            className="shrink-0 bg-white"
            disabled={!addProductId}
            onClick={addProduct}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add to collection
          </Button>
        </div>

        {orderedProducts.length === 0 ? (
          <p className="p-8 text-center text-sm text-neutral-500">
            No products in this collection yet. Add products above, then save.
          </p>
        ) : (
          <ul className="divide-y divide-neutral-100">
            {orderedProducts.map((product, index) => (
              <li
                key={product.id}
                className="flex items-center gap-3 px-4 py-3"
              >
                <span className="w-6 shrink-0 text-center text-xs font-semibold text-neutral-400">
                  {index + 1}
                </span>
                <div className="flex flex-col gap-0.5">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-neutral-400"
                    disabled={index === 0}
                    onClick={() => move(index, -1)}
                    aria-label="Move up"
                  >
                    <ArrowUp className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-neutral-400"
                    disabled={index === orderedProducts.length - 1}
                    onClick={() => move(index, 1)}
                    aria-label="Move down"
                  >
                    <ArrowDown className="h-3.5 w-3.5" />
                  </Button>
                </div>
                <GripVertical className="h-4 w-4 shrink-0 text-neutral-300" />
                <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-md border border-neutral-100 bg-neutral-50">
                  <Image
                    src={product.image}
                    alt=""
                    fill
                    className="object-contain p-1"
                    unoptimized={isExternalImageUrl(product.image)}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-neutral-950">
                    {product.name}
                  </p>
                  <p className="text-xs text-neutral-500">{product.category}</p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="shrink-0 text-neutral-500 hover:text-red-600"
                  onClick={() => remove(product.id)}
                  aria-label="Remove from collection"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
