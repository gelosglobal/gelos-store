'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Bold,
  ChevronRight,
  Italic,
  Loader2,
  Tag,
  Underline,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  ProductFormCard,
  ProductFormCardBody,
  ProductFormCardHeader,
} from '@/components/admin/product-form-card'
import { ProductMediaZone } from '@/components/admin/product-media-zone'
import { ProductGalleryImagesField } from '@/components/admin/product-gallery-images-field'
import { ProductVariantImagesField } from '@/components/admin/product-variant-images-field'
import { ProductOptionPills } from '@/components/admin/product-option-pills'
import { ProductTagSelector } from '@/components/admin/product-tag-selector'
import { productCategories } from '@/lib/admin/categories'
import type { AdminProductInput } from '@/lib/admin/types'
import {
  getEffectiveProductTags,
  normalizeProductTags,
} from '@/lib/product-tags'
import {
  getAdminGalleryImages,
  normalizeGalleryImages,
} from '@/lib/product-gallery-images'
import {
  getEffectiveVariantImages,
  normalizeVariantImages,
} from '@/lib/product-variant-images'
import { normalizeImageUrl } from '@/lib/image-url'
import { notifyProductsUpdated } from '@/lib/products-events'
import type { ProductTagId } from '@/lib/product-tags'
import type { Product } from '@/lib/types/product'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'

const emptyForm: AdminProductInput = {
  name: '',
  category: '',
  price: 0,
  stock: 0,
  description: '',
  image: '',
  rating: 4.8,
  reviews: 0,
  tags: [],
  variantImages: [],
  galleryImages: [],
}

type ProductEditorProps = {
  mode: 'create' | 'edit'
  productId?: string
}

export function ProductEditor({ mode, productId }: ProductEditorProps) {
  const router = useRouter()
  const [form, setForm] = useState<AdminProductInput>(emptyForm)
  const [loading, setLoading] = useState(mode === 'edit')
  const [saving, setSaving] = useState(false)

  const [inventoryTracked, setInventoryTracked] = useState(true)
  const [ghStock, setGhStock] = useState(0)
  const [usaStock, setUsaStock] = useState(0)
  const [physicalProduct, setPhysicalProduct] = useState(true)
  const [chargeTax, setChargeTax] = useState(true)
  const [compareAtPrice, setCompareAtPrice] = useState('')
  const [costPerItem, setCostPerItem] = useState('')
  const [sku, setSku] = useState('')
  const [barcode, setBarcode] = useState('')
  const [sellWhenOutOfStock, setSellWhenOutOfStock] = useState(false)
  const [pricingExpanded, setPricingExpanded] = useState(false)
  const [inventoryExpanded, setInventoryExpanded] = useState(false)
  const [activePricingPills, setActivePricingPills] = useState<string[]>([
    'charge-tax',
  ])
  const [activeInventoryPills, setActiveInventoryPills] = useState<string[]>([])

  useEffect(() => {
    if (mode !== 'edit' || !productId) return

    let cancelled = false
    setLoading(true)

    fetch('/api/admin/products', { cache: 'no-store' })
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return
        const product = (data.products as Product[] | undefined)?.find(
          (p) => p.id === productId,
        )
        if (!product) {
          toast.error('Product not found')
          router.push('/admin/products')
          return
        }
        setForm({
          name: product.name,
          category: product.category,
          price: product.price,
          stock: product.stock,
          description: product.description,
          image: product.image,
          rating: product.rating,
          reviews: product.reviews,
          tags: getEffectiveProductTags(product),
          variantImages: getEffectiveVariantImages(product),
          galleryImages: getAdminGalleryImages(product),
        })
        setGhStock(product.stock)
        setUsaStock(0)
      })
      .catch(() => toast.error('Failed to load product'))
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [mode, productId, router])

  useEffect(() => {
    if (inventoryTracked) {
      setForm((f) => ({ ...f, stock: ghStock + usaStock }))
    }
  }, [ghStock, usaStock, inventoryTracked])

  const togglePricingPill = (id: string) => {
    if (id === 'charge-tax') {
      setChargeTax((v) => !v)
      return
    }
    setActivePricingPills((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id],
    )
    if (id === 'compare-at') setPricingExpanded(true)
    if (id === 'cost') setPricingExpanded(true)
  }

  const toggleInventoryPill = (id: string) => {
    setActiveInventoryPills((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id],
    )
    setInventoryExpanded(true)
    if (id === 'sell-out') setSellWhenOutOfStock((v) => !v)
  }

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.error('Title is required')
      return
    }
    if (!form.category) {
      toast.error('Category is required')
      return
    }

    const payload: AdminProductInput = {
      ...form,
      name: form.name.trim(),
      description: form.description.trim(),
      image: normalizeImageUrl(form.image.trim() || '/placeholder.svg'),
      stock: inventoryTracked ? ghStock + usaStock : 999,
      price: Number(form.price) || 0,
      tags: normalizeProductTags(form.tags),
      variantImages: normalizeVariantImages(form.variantImages),
      galleryImages: normalizeGalleryImages(form.galleryImages),
    }

    setSaving(true)
    try {
      const url =
        mode === 'edit' && productId
          ? `/api/admin/products/${productId}`
          : '/api/admin/products'
      const method = mode === 'edit' ? 'PATCH' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Save failed')

      notifyProductsUpdated()
      router.refresh()
      toast.success(
        mode === 'edit'
          ? 'Product updated on the storefront'
          : 'Product created on the storefront',
      )
      router.push('/admin/products')
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
        Loading product…
      </div>
    )
  }

  const pageTitle = mode === 'edit' ? form.name || 'Edit product' : 'Add product'

  return (
    <div className="space-y-5 pb-16">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <nav className="flex items-center gap-1.5 text-sm text-neutral-500">
          <Tag className="h-4 w-4 shrink-0" />
          <Link
            href="/admin/products"
            className="hover:text-neutral-900 hover:underline"
          >
            Products
          </Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="font-medium text-neutral-950">{pageTitle}</span>
        </nav>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="bg-white" asChild>
            <Link href="/admin/products">Discard</Link>
          </Button>
          <Button
            size="sm"
            className="bg-neutral-950 text-white hover:bg-neutral-800"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? 'Saving…' : 'Save'}
          </Button>
        </div>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault()
          void handleSave()
        }}
        className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]"
      >
        {/* Main column */}
        <div className="space-y-4">
          <ProductFormCard>
            <ProductFormCardBody className="space-y-5">
              <div className="space-y-1.5">
                <Label htmlFor="title" className="text-neutral-700">
                  Title
                </Label>
                <Input
                  id="title"
                  placeholder="Short sleeve t-shirt"
                  value={form.name}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, name: e.target.value }))
                  }
                  className="border-neutral-200 bg-white text-base"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="description" className="text-neutral-700">
                  Description
                </Label>
                <div className="overflow-hidden rounded-lg border border-neutral-200 bg-white">
                  <div className="flex flex-wrap items-center gap-0.5 border-b border-neutral-100 px-2 py-1.5">
                    {[
                      { icon: Bold, label: 'Bold' },
                      { icon: Italic, label: 'Italic' },
                      { icon: Underline, label: 'Underline' },
                    ].map(({ icon: Icon, label }) => (
                      <button
                        key={label}
                        type="button"
                        className="rounded p-1.5 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-800"
                        aria-label={label}
                        tabIndex={-1}
                      >
                        <Icon className="h-4 w-4" />
                      </button>
                    ))}
                  </div>
                  <Textarea
                    id="description"
                    placeholder="Describe your product for customers…"
                    value={form.description}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, description: e.target.value }))
                    }
                    rows={6}
                    className="min-h-[120px] resize-y border-0 bg-white shadow-none focus-visible:ring-0"
                  />
                </div>
              </div>
            </ProductFormCardBody>
          </ProductFormCard>

          <ProductFormCard>
            <ProductFormCardBody>
              <Label className="text-neutral-700">Media</Label>
              <ProductMediaZone
                value={form.image}
                onChange={(image) => setForm((f) => ({ ...f, image }))}
              />
            </ProductFormCardBody>
          </ProductFormCard>

          <ProductFormCard>
            <ProductFormCardHeader title="Variant images" />
            <ProductFormCardBody>
              <ProductVariantImagesField
                value={form.variantImages ?? []}
                onChange={(variantImages) =>
                  setForm((f) => ({ ...f, variantImages }))
                }
              />
            </ProductFormCardBody>
          </ProductFormCard>

          <ProductFormCard>
            <ProductFormCardHeader title="Gallery images" />
            <ProductFormCardBody>
              <ProductGalleryImagesField
                value={form.galleryImages ?? []}
                onChange={(galleryImages) =>
                  setForm((f) => ({ ...f, galleryImages }))
                }
              />
            </ProductFormCardBody>
          </ProductFormCard>

          <ProductFormCard>
            <ProductFormCardBody className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-neutral-700">Category</Label>
                <Select
                  value={form.category || undefined}
                  onValueChange={(v) => setForm((f) => ({ ...f, category: v }))}
                >
                  <SelectTrigger className="border-neutral-200 bg-white">
                    <SelectValue placeholder="Choose a product category" />
                  </SelectTrigger>
                  <SelectContent>
                    {productCategories.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs leading-relaxed text-neutral-500">
                  Determines how products appear in shop filters and collection
                  pages.
                </p>
              </div>
              <div className="space-y-1.5">
                <Label className="text-neutral-700">Tags</Label>
                <ProductTagSelector
                  value={(form.tags ?? []) as ProductTagId[]}
                  onChange={(tags) => setForm((f) => ({ ...f, tags }))}
                />
              </div>
            </ProductFormCardBody>
          </ProductFormCard>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <ProductFormCard>
            <ProductFormCardHeader title="Status" />
            <ProductFormCardBody>
              <Select defaultValue="active">
                <SelectTrigger className="border-neutral-200 bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                </SelectContent>
              </Select>
            </ProductFormCardBody>
          </ProductFormCard>

          <ProductFormCard>
            <ProductFormCardHeader title="Pricing" />
            <ProductFormCardBody className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="price" className="text-neutral-700">
                  Price
                </Label>
                <div className="relative max-w-[200px]">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-neutral-500">
                    GH₵
                  </span>
                  <Input
                    id="price"
                    type="number"
                    min={0}
                    step={0.01}
                    placeholder="0.00"
                    value={form.price || ''}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        price: Number(e.target.value),
                      }))
                    }
                    className="border-neutral-200 bg-white pl-12"
                    required
                  />
                </div>
              </div>

              <ProductOptionPills
                options={[
                  {
                    id: 'compare-at',
                    label: 'Compare-at',
                    active: activePricingPills.includes('compare-at'),
                  },
                  {
                    id: 'unit-price',
                    label: 'Unit price',
                    active: activePricingPills.includes('unit-price'),
                  },
                  {
                    id: 'charge-tax',
                    label: 'Charge tax',
                    badge: chargeTax ? 'Yes' : 'Off',
                    active: chargeTax,
                  },
                  {
                    id: 'cost',
                    label: 'Cost per item',
                    active: activePricingPills.includes('cost'),
                  },
                ]}
                onToggle={togglePricingPill}
                expanded={pricingExpanded}
                onExpandToggle={() => setPricingExpanded((v) => !v)}
              >
                {activePricingPills.includes('compare-at') && (
                  <div className="space-y-1.5">
                    <Label className="text-xs text-neutral-600">
                      Compare-at price
                    </Label>
                    <div className="relative max-w-[200px]">
                      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-neutral-500">
                        GH₵
                      </span>
                      <Input
                        type="number"
                        min={0}
                        step={0.01}
                        placeholder="0.00"
                        value={compareAtPrice}
                        onChange={(e) => setCompareAtPrice(e.target.value)}
                        className="border-neutral-200 bg-white pl-12"
                      />
                    </div>
                  </div>
                )}
                {activePricingPills.includes('cost') && (
                  <div className="space-y-1.5">
                    <Label className="text-xs text-neutral-600">
                      Cost per item
                    </Label>
                    <div className="relative max-w-[200px]">
                      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-neutral-500">
                        GH₵
                      </span>
                      <Input
                        type="number"
                        min={0}
                        step={0.01}
                        placeholder="0.00"
                        value={costPerItem}
                        onChange={(e) => setCostPerItem(e.target.value)}
                        className="border-neutral-200 bg-white pl-12"
                      />
                    </div>
                  </div>
                )}
              </ProductOptionPills>
            </ProductFormCardBody>
          </ProductFormCard>

          <ProductFormCard>
            <ProductFormCardHeader
              title="Inventory"
              action={
                <div className="flex items-center gap-2">
                  <Label
                    htmlFor="inventory-tracked"
                    className="text-xs font-normal text-neutral-500"
                  >
                    Inventory tracked
                  </Label>
                  <Switch
                    id="inventory-tracked"
                    checked={inventoryTracked}
                    onCheckedChange={setInventoryTracked}
                  />
                </div>
              }
            />
            <ProductFormCardBody className="space-y-4">
              {inventoryTracked && (
                <div className="overflow-hidden rounded-lg border border-neutral-200">
                  <div className="grid grid-cols-[1fr_auto] items-center gap-2 border-b border-neutral-100 bg-neutral-50/80 px-3 py-2 text-xs font-medium text-neutral-600">
                    <span>Locations</span>
                    <span className="w-20 text-right">Quantity</span>
                  </div>
                  <div className="divide-y divide-neutral-100">
                    <div className="grid grid-cols-[1fr_auto] items-center gap-2 px-3 py-2.5">
                      <span className="text-sm text-neutral-800">GH</span>
                      <Input
                        type="number"
                        min={0}
                        value={ghStock}
                        onChange={(e) =>
                          setGhStock(Number(e.target.value) || 0)
                        }
                        className="h-8 w-20 border-neutral-200 bg-white text-right text-sm"
                      />
                    </div>
                    <div className="grid grid-cols-[1fr_auto] items-center gap-2 px-3 py-2.5">
                      <span className="text-sm text-neutral-800">
                        USA Market
                      </span>
                      <Input
                        type="number"
                        min={0}
                        value={usaStock}
                        onChange={(e) =>
                          setUsaStock(Number(e.target.value) || 0)
                        }
                        className="h-8 w-20 border-neutral-200 bg-white text-right text-sm"
                      />
                    </div>
                  </div>
                </div>
              )}

              <ProductOptionPills
                options={[
                  {
                    id: 'sku',
                    label: 'SKU',
                    active: activeInventoryPills.includes('sku'),
                  },
                  {
                    id: 'barcode',
                    label: 'Barcode',
                    active: activeInventoryPills.includes('barcode'),
                  },
                  {
                    id: 'sell-out',
                    label: 'Sell when out of stock',
                    badge: sellWhenOutOfStock ? 'On' : 'Off',
                    active: sellWhenOutOfStock,
                  },
                ]}
                onToggle={toggleInventoryPill}
                expanded={inventoryExpanded}
                onExpandToggle={() => setInventoryExpanded((v) => !v)}
              >
                {activeInventoryPills.includes('sku') && (
                  <div className="space-y-1.5">
                    <Label className="text-xs text-neutral-600">SKU</Label>
                    <Input
                      value={sku}
                      onChange={(e) => setSku(e.target.value)}
                      className="border-neutral-200 bg-white"
                      placeholder="SKU-001"
                    />
                  </div>
                )}
                {activeInventoryPills.includes('barcode') && (
                  <div className="space-y-1.5">
                    <Label className="text-xs text-neutral-600">Barcode</Label>
                    <Input
                      value={barcode}
                      onChange={(e) => setBarcode(e.target.value)}
                      className="border-neutral-200 bg-white"
                      placeholder="012345678905"
                    />
                  </div>
                )}
              </ProductOptionPills>
            </ProductFormCardBody>
          </ProductFormCard>

          <ProductFormCard>
            <ProductFormCardHeader
              title="Shipping"
              action={
                <div className="flex items-center gap-2">
                  <Label
                    htmlFor="physical-product"
                    className="text-xs font-normal text-neutral-500"
                  >
                    Physical product
                  </Label>
                  <Switch
                    id="physical-product"
                    checked={physicalProduct}
                    onCheckedChange={setPhysicalProduct}
                  />
                </div>
              }
            />
            {physicalProduct && (
              <ProductFormCardBody>
                <p className="text-xs text-neutral-500">
                  Weight and shipping rates can be configured when checkout
                  goes live.
                </p>
              </ProductFormCardBody>
            )}
          </ProductFormCard>

          <ProductFormCard>
            <ProductFormCardHeader title="Storefront" />
            <ProductFormCardBody className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-neutral-600">Rating</Label>
                <Input
                  type="number"
                  min={0}
                  max={5}
                  step={0.1}
                  value={form.rating}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      rating: Number(e.target.value),
                    }))
                  }
                  className="border-neutral-200 bg-white"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-neutral-600">Reviews</Label>
                <Input
                  type="number"
                  min={0}
                  value={form.reviews}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      reviews: Number(e.target.value),
                    }))
                  }
                  className="border-neutral-200 bg-white"
                />
              </div>
            </ProductFormCardBody>
          </ProductFormCard>
        </div>
      </form>
    </div>
  )
}
