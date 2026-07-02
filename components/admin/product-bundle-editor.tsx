'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
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
import { ImageUploadField } from '@/components/admin/image-upload-field'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { notifyProductsUpdated } from '@/lib/products-events'
import { isExternalImageUrl } from '@/lib/image-url'
import { sumProductPrices } from '@/lib/product-bundle-pricing'
import type { Product } from '@/lib/types/product'
import type { ProductBundle } from '@/lib/types/product-bundle'

type ProductBundleEditorProps = {
  bundleId?: string
}

export function ProductBundleEditor({ bundleId }: ProductBundleEditorProps) {
  const router = useRouter()
  const isNew = !bundleId

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [badge, setBadge] = useState('')
  const [image, setImage] = useState('')
  const [price, setPrice] = useState('')
  const [active, setActive] = useState(true)
  const [orderedIds, setOrderedIds] = useState<string[]>([])
  const [allProducts, setAllProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(!isNew)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [addProductId, setAddProductId] = useState('')

  const load = useCallback(async () => {
    if (isNew) {
      try {
        const productsRes = await fetch('/api/admin/products', {
          cache: 'no-store',
        })
        const productsData = await productsRes.json()
        if (!productsRes.ok) throw new Error(productsData.error)
        setAllProducts(productsData.products ?? [])
      } catch {
        toast.error('Failed to load products')
      }
      return
    }

    setLoading(true)
    try {
      const [bundleRes, productsRes] = await Promise.all([
        fetch(`/api/admin/product-bundles/${bundleId}`, { cache: 'no-store' }),
        fetch('/api/admin/products', { cache: 'no-store' }),
      ])
      const bundleData = await bundleRes.json()
      const productsData = await productsRes.json()
      if (!bundleRes.ok) throw new Error(bundleData.error)
      if (!productsRes.ok) throw new Error(productsData.error)

      const bundle = bundleData.bundle as ProductBundle
      setName(bundle.name)
      setDescription(bundle.description)
      setBadge(bundle.badge ?? '')
      setImage(bundle.image)
      setPrice(bundle.price > 0 ? String(bundle.price) : '')
      setActive(bundle.active)
      setOrderedIds(bundle.productIds)
      setAllProducts(productsData.products ?? [])
    } catch {
      toast.error('Failed to load bundle')
    } finally {
      setLoading(false)
    }
  }, [bundleId, isNew])

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

  const catalogTotal = useMemo(
    () => sumProductPrices(orderedIds, orderedProducts),
    [orderedIds, orderedProducts],
  )

  const previewImage =
    image ||
    orderedProducts[0]?.image ||
    '/gelos/watermelon2.jpeg'

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
    if (!name.trim()) {
      toast.error('Bundle name is required')
      return
    }
    if (orderedIds.length === 0) {
      toast.error('Add at least one product to the bundle')
      return
    }

    const parsedPrice = price.trim() === '' ? 0 : Number(price)
    if (!Number.isFinite(parsedPrice) || parsedPrice < 0) {
      toast.error('Enter a valid bundle price')
      return
    }

    setSaving(true)
    try {
      const payload = {
        name: name.trim(),
        description: description.trim(),
        badge: badge.trim() || null,
        image: image.trim(),
        price: parsedPrice,
        productIds: orderedIds,
        active,
      }

      const res = await fetch(
        isNew
          ? '/api/admin/product-bundles'
          : `/api/admin/product-bundles/${bundleId}`,
        {
          method: isNew ? 'POST' : 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        },
      )
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Save failed')

      notifyProductsUpdated()
      toast.success(isNew ? 'Bundle created' : 'Bundle saved')

      if (isNew && data.bundle?.id) {
        router.replace(`/admin/collections/bundles/${data.bundle.id}`)
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!bundleId) return
    if (!window.confirm('Delete this bundle? This cannot be undone.')) return

    setDeleting(true)
    try {
      const res = await fetch(`/api/admin/product-bundles/${bundleId}`, {
        method: 'DELETE',
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Delete failed')
      notifyProductsUpdated()
      toast.success('Bundle deleted')
      router.push('/admin/collections/bundles')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Delete failed')
    } finally {
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-neutral-500">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        Loading bundle…
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={isNew ? 'New bundle' : name || 'Edit bundle'}
        description="Name your bundle and choose which products are included. Shoppers add each product to cart separately at checkout."
      >
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" asChild className="rounded-full">
            <Link href="/admin/collections/bundles">Back to bundles</Link>
          </Button>
          {!isNew ? (
            <Button
              variant="outline"
              className="rounded-full text-red-600 hover:text-red-700"
              onClick={() => void handleDelete()}
              disabled={deleting}
            >
              {deleting ? 'Deleting…' : 'Delete'}
            </Button>
          ) : null}
          <Button
            className="rounded-full bg-neutral-950 hover:bg-neutral-800"
            onClick={() => void handleSave()}
            disabled={saving}
          >
            {saving ? 'Saving…' : isNew ? 'Create bundle' : 'Save bundle'}
          </Button>
        </div>
      </AdminPageHeader>

      <div className="rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-600">
        When a shopper taps <strong>Add bundle</strong> on the storefront, each
        product below is added as its own cart line for checkout — not a single
        bundle SKU.
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_220px]">
        <div className="space-y-4 rounded-2xl border border-neutral-200 bg-white p-4 sm:p-5">
          <div className="space-y-1.5">
            <Label htmlFor="bundle-name">Bundle name</Label>
            <Input
              id="bundle-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Everyday Smile Duo"
              className="border-neutral-200"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="bundle-description">Description</Label>
            <Textarea
              id="bundle-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Short copy shown on the bundle card."
              rows={3}
              className="border-neutral-200"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="bundle-price">Bundle price</Label>
              <Input
                id="bundle-price"
                type="number"
                min="0"
                step="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder={catalogTotal > 0 ? String(catalogTotal) : '0.00'}
                className="border-neutral-200"
              />
              <p className="text-xs text-neutral-500">
                Leave empty to use the individual product total
                {catalogTotal > 0 ? ` (${catalogTotal.toFixed(2)})` : ''}.
              </p>
              {catalogTotal > 0 ? (
                <Button
                  type="button"
                  variant="link"
                  className="h-auto p-0 text-xs"
                  onClick={() => setPrice(String(catalogTotal))}
                >
                  Use individual total ({catalogTotal.toFixed(2)})
                </Button>
              ) : null}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="bundle-badge">Badge (optional)</Label>
              <Input
                id="bundle-badge"
                value={badge}
                onChange={(e) => setBadge(e.target.value)}
                placeholder="Popular bundle"
                className="border-neutral-200"
              />
            </div>
          </div>
          <ImageUploadField
            value={image}
            onChange={setImage}
            endpoint="productImage"
            label="Bundle cover image"
            hint="PNG or JPG up to 8MB. Leave empty to use the first product image."
            allowManualUrl={false}
          />
          <label className="flex items-center gap-2 text-sm text-neutral-700">
            <input
              type="checkbox"
              checked={active}
              onChange={(e) => setActive(e.target.checked)}
              className="rounded border-neutral-300"
            />
            Show on storefront
          </label>
        </div>

        <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white">
          <div className="relative aspect-[4/3] bg-neutral-100">
            <Image
              src={previewImage}
              alt=""
              fill
              className="object-cover"
              unoptimized={isExternalImageUrl(previewImage)}
            />
          </div>
          <div className="p-3 text-xs text-neutral-500">Storefront preview</div>
        </div>
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
            Add to bundle
          </Button>
        </div>

        {orderedIds.length === 0 ? (
          <p className="p-8 text-center text-sm text-neutral-500">
            No products in this bundle yet. Add products above, then save.
          </p>
        ) : (
          <ul className="divide-y divide-neutral-100">
            {orderedIds.map((id, index) => {
              const product = productsById.get(id)

              if (!product) {
                return (
                  <li
                    key={id}
                    className="flex items-center gap-3 bg-amber-50 px-4 py-3"
                  >
                    <span className="w-6 shrink-0 text-center text-xs font-semibold text-amber-500">
                      {index + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-amber-900">
                        Unavailable product
                      </p>
                      <p className="text-xs text-amber-700">
                        This product was removed from the catalog. Remove it and
                        add a replacement.
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="shrink-0 text-amber-700 hover:text-red-600"
                      onClick={() => remove(id)}
                      aria-label="Remove unavailable product"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </li>
                )
              }

              return (
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
                    disabled={index === orderedIds.length - 1}
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
                  aria-label="Remove from bundle"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}
