'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import { ArrowDown, ArrowUp, Loader2, Plus, ShoppingBag, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { SettingsSectionCard } from '@/components/admin/settings-section-card'
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
import {
  DEFAULT_CART_UPSELL_SETTINGS,
  sanitizeCartUpsellSettings,
  type CartUpsellSettings,
} from '@/lib/cart-upsell-settings'
import { isExternalImageUrl } from '@/lib/image-url'
import type { Product } from '@/lib/types/product'

function ProductIdList({
  title,
  description,
  productIds,
  productsById,
  availableProducts,
  onChange,
}: {
  title: string
  description: string
  productIds: string[]
  productsById: Map<string, Product>
  availableProducts: Product[]
  onChange: (ids: string[]) => void
}) {
  const [addProductId, setAddProductId] = useState('')

  const move = (index: number, direction: -1 | 1) => {
    const target = index + direction
    if (target < 0 || target >= productIds.length) return
    const next = [...productIds]
    ;[next[index], next[target]] = [next[target], next[index]]
    onChange(next)
  }

  const addProduct = () => {
    if (!addProductId) return
    onChange([...productIds, addProductId])
    setAddProductId('')
  }

  return (
    <div className="space-y-3 rounded-lg border border-neutral-200 p-4">
      <div>
        <p className="text-sm font-medium text-neutral-950">{title}</p>
        <p className="mt-1 text-xs text-neutral-500">{description}</p>
      </div>

      {productIds.length === 0 ? (
        <p className="rounded-lg border border-dashed border-neutral-200 px-4 py-5 text-center text-sm text-neutral-500">
          No products selected. Automatic rules will apply.
        </p>
      ) : (
        <ul className="space-y-2">
          {productIds.map((id, index) => {
            const product = productsById.get(id)
            return (
              <li
                key={id}
                className="flex items-center gap-3 rounded-lg border border-neutral-100 bg-neutral-50 px-3 py-2"
              >
                <div className="relative size-10 shrink-0 overflow-hidden rounded-md bg-white">
                  {product?.image ? (
                    <Image
                      src={product.image}
                      alt=""
                      fill
                      className="object-cover"
                      unoptimized={isExternalImageUrl(product.image)}
                    />
                  ) : null}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-neutral-950">
                    {product?.name ?? `Product ${id}`}
                  </p>
                  <p className="text-xs text-neutral-500">{product?.category}</p>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-8"
                    disabled={index === 0}
                    onClick={() => move(index, -1)}
                    aria-label="Move up"
                  >
                    <ArrowUp className="size-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-8"
                    disabled={index === productIds.length - 1}
                    onClick={() => move(index, 1)}
                    aria-label="Move down"
                  >
                    <ArrowDown className="size-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-8 text-neutral-500 hover:text-red-600"
                    onClick={() =>
                      onChange(productIds.filter((productId) => productId !== id))
                    }
                    aria-label="Remove product"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </li>
            )
          })}
        </ul>
      )}

      <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
        <div className="min-w-0 flex-1 space-y-1.5">
          <Label className="text-xs text-neutral-500">Add product</Label>
          <Select value={addProductId} onValueChange={setAddProductId}>
            <SelectTrigger className="border-neutral-200 bg-white">
              <SelectValue placeholder="Choose a product" />
            </SelectTrigger>
            <SelectContent>
              {availableProducts.map((product) => (
                <SelectItem key={product.id} value={product.id}>
                  {product.name}
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
          <Plus className="mr-2 size-4" />
          Add
        </Button>
      </div>
    </div>
  )
}

export function CartUpsellSettingsForm() {
  const [settings, setSettings] = useState<CartUpsellSettings>(
    DEFAULT_CART_UPSELL_SETTINGS,
  )
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [settingsRes, productsRes] = await Promise.all([
        fetch('/api/admin/cart-upsells', { cache: 'no-store' }),
        fetch('/api/admin/products', { cache: 'no-store' }),
      ])
      const settingsData = await settingsRes.json()
      const productsData = await productsRes.json()
      if (!settingsRes.ok) throw new Error(settingsData.error)
      if (!productsRes.ok) throw new Error(productsData.error)
      setSettings(settingsData.settings ?? DEFAULT_CART_UPSELL_SETTINGS)
      setProducts(productsData.products ?? [])
    } catch {
      toast.error('Failed to load cart upsell settings')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const productsById = useMemo(
    () => new Map(products.map((product) => [product.id, product])),
    [products],
  )

  const updateField = <K extends keyof CartUpsellSettings>(
    key: K,
    value: CartUpsellSettings[K],
  ) => {
    setSettings((prev) => ({ ...prev, [key]: value }))
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/admin/cart-upsells', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sanitizeCartUpsellSettings(settings)),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setSettings(data.settings)
      toast.success('Cart upsells saved')
    } catch {
      toast.error('Failed to save cart upsell settings')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[20vh] items-center justify-center rounded-xl border border-neutral-200 bg-white text-sm text-neutral-500 shadow-sm">
        <Loader2 className="mr-2 size-5 animate-spin" />
        Loading cart upsell settings…
      </div>
    )
  }

  const quantityAvailable = products.filter(
    (product) => !settings.quantityProductIds.includes(product.id),
  )
  const crossSellAvailable = products.filter(
    (product) => !settings.crossSellProductIds.includes(product.id),
  )

  return (
    <SettingsSectionCard
      title="Cart upsells"
      description="Control the progressive offers shown in the cart: bundle qty 2, qty 3, then cross-sell."
      icon={ShoppingBag}
    >
      <div className="space-y-5">
        <div className="flex items-center justify-between rounded-lg border border-neutral-200 px-4 py-3">
          <div>
            <p className="text-sm font-medium text-neutral-900">Enable cart upsells</p>
            <p className="text-xs text-neutral-500">
              Show the green promo card in the cart sidebar
            </p>
          </div>
          <Switch
            checked={settings.enabled}
            onCheckedChange={(checked) => updateField('enabled', checked)}
          />
        </div>

        <ProductIdList
          title="Quantity upsell products"
          description="Products that trigger “Get 2” and “Get 3” offers. Leave empty to use toothpaste, mouthwash, and toothbrush categories."
          productIds={settings.quantityProductIds}
          productsById={productsById}
          availableProducts={quantityAvailable}
          onChange={(ids) => updateField('quantityProductIds', ids)}
        />

        <ProductIdList
          title="Cross-sell products"
          description="Products offered after quantity upsells, in priority order. Leave empty for automatic complementary picks."
          productIds={settings.crossSellProductIds}
          productsById={productsById}
          availableProducts={crossSellAvailable}
          onChange={(ids) => updateField('crossSellProductIds', ids)}
        />

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="tier-2-discount">Qty 2 discount %</Label>
            <Input
              id="tier-2-discount"
              type="number"
              min={0}
              max={100}
              value={settings.tier2DiscountPercent}
              onChange={(e) =>
                updateField('tier2DiscountPercent', Number(e.target.value) || 0)
              }
              className="bg-white"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="tier-3-discount">Qty 3 discount %</Label>
            <Input
              id="tier-3-discount"
              type="number"
              min={0}
              max={100}
              value={settings.tier3DiscountPercent}
              onChange={(e) =>
                updateField('tier3DiscountPercent', Number(e.target.value) || 0)
              }
              className="bg-white"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cross-sell-discount">Cross-sell discount %</Label>
            <Input
              id="cross-sell-discount"
              type="number"
              min={0}
              max={100}
              value={settings.crossSellDiscountPercent}
              onChange={(e) =>
                updateField(
                  'crossSellDiscountPercent',
                  Number(e.target.value) || 0,
                )
              }
              className="bg-white"
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="tier-2-badge">Qty 2 badge</Label>
            <Input
              id="tier-2-badge"
              value={settings.tier2Badge}
              onChange={(e) => updateField('tier2Badge', e.target.value)}
              className="bg-white"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="tier-3-badge">Qty 3 badge</Label>
            <Input
              id="tier-3-badge"
              value={settings.tier3Badge}
              onChange={(e) => updateField('tier3Badge', e.target.value)}
              className="bg-white"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cross-sell-badge">Cross-sell badge</Label>
            <Input
              id="cross-sell-badge"
              value={settings.crossSellBadge}
              onChange={(e) => updateField('crossSellBadge', e.target.value)}
              className="bg-white"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cross-sell-urgency">Cross-sell urgency line</Label>
            <Input
              id="cross-sell-urgency"
              value={settings.crossSellUrgency}
              onChange={(e) => updateField('crossSellUrgency', e.target.value)}
              className="bg-white"
            />
          </div>
        </div>

        <Button
          type="button"
          className="bg-neutral-950 text-white hover:bg-neutral-800"
          onClick={() => void handleSave()}
          disabled={saving}
        >
          {saving ? 'Saving…' : 'Save cart upsells'}
        </Button>
      </div>
    </SettingsSectionCard>
  )
}
