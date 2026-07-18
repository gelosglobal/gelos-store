'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Check, Save } from 'lucide-react'
import { toast } from 'sonner'
import { AdminPageHeader } from '@/components/admin/admin-page-header'
import { SettingsSectionCard } from '@/components/admin/settings-section-card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { useProducts } from '@/components/products-provider'
import { locations, type LocationId } from '@/lib/locations'
import {
  DEFAULT_ALL_MARKET_SETTINGS,
  sanitizeMarketSettings,
  type AllMarketSettings,
  type MarketPaymentMethod,
  type MarketSettings,
} from '@/lib/market-settings'
import { cn } from '@/lib/utils'

export function MarketsSettingsForm() {
  const { products } = useProducts()
  const [activeMarket, setActiveMarket] = useState<LocationId>('ghana')
  const [markets, setMarkets] = useState<AllMarketSettings>(
    DEFAULT_ALL_MARKET_SETTINGS,
  )
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const market = markets[activeMarket]

  const loadSettings = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/markets', { cache: 'no-store' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setMarkets(data.markets ?? DEFAULT_ALL_MARKET_SETTINGS)
    } catch {
      toast.error('Failed to load market settings')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadSettings()
  }, [loadSettings])

  const updateMarket = <K extends keyof MarketSettings>(
    key: K,
    value: MarketSettings[K],
  ) => {
    setMarkets((prev) => ({
      ...prev,
      [activeMarket]: {
        ...prev[activeMarket],
        [key]: value,
      },
    }))
  }

  const toggleProduct = (productId: string) => {
    const next = market.productIds.includes(productId)
      ? market.productIds.filter((id) => id !== productId)
      : [...market.productIds, productId]
    updateMarket('productIds', next)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const sanitized = sanitizeMarketSettings(activeMarket, market)
      const res = await fetch('/api/admin/markets', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ locationId: activeMarket, market: sanitized }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setMarkets(data.markets)
      setSaved(true)
      toast.success(`${locations.find((l) => l.id === activeMarket)?.label} market saved`)
      setTimeout(() => setSaved(false), 2500)
    } catch {
      toast.error('Failed to save market settings')
    } finally {
      setSaving(false)
    }
  }

  const sortedProducts = useMemo(
    () => [...products].sort((a, b) => a.name.localeCompare(b.name)),
    [products],
  )

  const paymentOptions: {
    id: MarketPaymentMethod
    label: string
    hint: string
  }[] = [
    { id: 'paystack', label: 'Paystack', hint: 'Card / mobile money' },
    { id: 'stripe', label: 'Stripe', hint: 'Card (typically US)' },
    { id: 'cod', label: 'Cash on delivery', hint: 'Pay when delivered' },
  ]

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Markets"
        description="Currency, shipping, WhatsApp, payments, and catalog rules for each shopping region."
      >
        <Button
          size="sm"
          className="h-9 gap-1.5 bg-neutral-950 text-white hover:bg-neutral-800"
          onClick={handleSave}
          disabled={loading || saving}
        >
          {saved ? (
            <>
              <Check className="h-3.5 w-3.5" />
              Saved
            </>
          ) : (
            <>
              <Save className="h-3.5 w-3.5" />
              {saving ? 'Saving…' : 'Save market'}
            </>
          )}
        </Button>
      </AdminPageHeader>

      <div className="flex flex-wrap gap-2">
        {locations.map((loc) => (
          <button
            key={loc.id}
            type="button"
            onClick={() => setActiveMarket(loc.id)}
            className={cn(
              'inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-sm font-medium transition-colors',
              activeMarket === loc.id
                ? 'border-neutral-950 bg-neutral-950 text-white'
                : 'border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50',
            )}
          >
            <span aria-hidden>{loc.flag}</span>
            {loc.label}
            {!markets[loc.id].enabled ? (
              <Badge variant="secondary" className="ml-0.5 text-[10px]">
                Off
              </Badge>
            ) : null}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-sm text-neutral-500">Loading market settings…</p>
      ) : (
        <div className="grid gap-5 lg:grid-cols-2">
          <SettingsSectionCard
            title="Market status"
            description="Control whether this region appears in the storefront picker."
          >
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-neutral-950">
                  Market enabled
                </p>
                <p className="text-xs text-neutral-500">
                  Disabled markets are hidden from shoppers.
                </p>
              </div>
              <Switch
                checked={market.enabled}
                onCheckedChange={(checked) => updateMarket('enabled', checked)}
              />
            </div>
          </SettingsSectionCard>

          <SettingsSectionCard
            title="Currency & exchange rate"
            description="Catalog prices are stored in GHS. Set how many local units equal 1 GHS."
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="currencyCode">Currency code</Label>
                <Input
                  id="currencyCode"
                  value={market.currencyCode}
                  onChange={(e) =>
                    updateMarket('currencyCode', e.target.value.toUpperCase())
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="exchangeRate">
                  Rate (local per 1 GHS)
                </Label>
                <Input
                  id="exchangeRate"
                  type="number"
                  step="any"
                  min="0"
                  value={market.exchangeRate}
                  onChange={(e) =>
                    updateMarket('exchangeRate', Number(e.target.value) || 0)
                  }
                />
              </div>
            </div>
            <p className="mt-3 text-xs text-neutral-500">
              Example: NGN 108 means GH₵1 displays as ₦108.
            </p>
          </SettingsSectionCard>

          <SettingsSectionCard
            title="Shipping"
            description="Amounts are in GHS (catalog base), then converted for the shopper."
          >
            <div className="mb-4 flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-neutral-950">
                  Free shipping enabled
                </p>
                <p className="text-xs text-neutral-500">
                  When off, every order pays the flat fee.
                </p>
              </div>
              <Switch
                checked={market.freeShippingEnabled}
                onCheckedChange={(checked) =>
                  updateMarket('freeShippingEnabled', checked)
                }
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="shippingFee">Shipping fee (GHS)</Label>
                <Input
                  id="shippingFee"
                  type="number"
                  min="0"
                  step="0.01"
                  value={market.shippingFee}
                  onChange={(e) =>
                    updateMarket('shippingFee', Number(e.target.value) || 0)
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="freeShippingThreshold">
                  Free shipping over (GHS)
                </Label>
                <Input
                  id="freeShippingThreshold"
                  type="number"
                  min="0"
                  step="0.01"
                  value={market.freeShippingThreshold}
                  disabled={!market.freeShippingEnabled}
                  onChange={(e) =>
                    updateMarket(
                      'freeShippingThreshold',
                      Number(e.target.value) || 0,
                    )
                  }
                />
              </div>
            </div>
          </SettingsSectionCard>

          <SettingsSectionCard
            title="WhatsApp"
            description="Optional per-market number. Leave blank to use the global env number."
          >
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="whatsappNumber">WhatsApp number</Label>
                <Input
                  id="whatsappNumber"
                  placeholder="e.g. 233241234567"
                  value={market.whatsappNumber}
                  onChange={(e) =>
                    updateMarket('whatsappNumber', e.target.value)
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="whatsappMessage">Default message</Label>
                <Textarea
                  id="whatsappMessage"
                  rows={3}
                  placeholder="Hi Gelos! I'd like some help with my order."
                  value={market.whatsappMessage}
                  onChange={(e) =>
                    updateMarket('whatsappMessage', e.target.value)
                  }
                />
              </div>
            </div>
          </SettingsSectionCard>

          <SettingsSectionCard
            title="Payment methods"
            description="Choose what shoppers can use at checkout in this market."
          >
            <div className="space-y-3">
              {paymentOptions.map((option) => (
                <div
                  key={option.id}
                  className="flex items-center justify-between gap-4 rounded-xl border border-neutral-200 px-3 py-2.5"
                >
                  <div>
                    <p className="text-sm font-medium text-neutral-950">
                      {option.label}
                    </p>
                    <p className="text-xs text-neutral-500">{option.hint}</p>
                  </div>
                  <Switch
                    checked={market.payments[option.id]}
                    onCheckedChange={(checked) =>
                      updateMarket('payments', {
                        ...market.payments,
                        [option.id]: checked,
                      })
                    }
                  />
                </div>
              ))}
            </div>
            <div className="mt-4 space-y-2">
              <Label>Default payment method</Label>
              <div className="flex flex-wrap gap-2">
                {paymentOptions.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    disabled={!market.payments[option.id]}
                    onClick={() =>
                      updateMarket('defaultPaymentMethod', option.id)
                    }
                    className={cn(
                      'rounded-full border px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-40',
                      market.defaultPaymentMethod === option.id
                        ? 'border-neutral-950 bg-neutral-950 text-white'
                        : 'border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50',
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          </SettingsSectionCard>

          <SettingsSectionCard
            title="Product availability"
            description="Limit which products can be sold in this market."
            className="lg:col-span-2"
          >
            <div className="mb-4 flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-neutral-950">
                  Restrict catalog
                </p>
                <p className="text-xs text-neutral-500">
                  When on, only checked products appear and can be checked out.
                </p>
              </div>
              <Switch
                checked={market.restrictCatalog}
                onCheckedChange={(checked) =>
                  updateMarket('restrictCatalog', checked)
                }
              />
            </div>

            {market.restrictCatalog ? (
              <div className="max-h-80 space-y-2 overflow-y-auto rounded-xl border border-neutral-200 p-3">
                {sortedProducts.length === 0 ? (
                  <p className="text-sm text-neutral-500">No products found.</p>
                ) : (
                  sortedProducts.map((product) => {
                    const checked = market.productIds.includes(product.id)
                    return (
                      <label
                        key={product.id}
                        className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-2 hover:bg-neutral-50"
                      >
                        <input
                          type="checkbox"
                          className="size-4 rounded border-neutral-300"
                          checked={checked}
                          onChange={() => toggleProduct(product.id)}
                        />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium text-neutral-950">
                            {product.name}
                          </span>
                          <span className="block text-xs text-neutral-500">
                            ID {product.id} · {product.category}
                          </span>
                        </span>
                      </label>
                    )
                  })
                )}
              </div>
            ) : (
              <p className="text-sm text-neutral-500">
                Full catalog is available in this market.
              </p>
            )}
          </SettingsSectionCard>
        </div>
      )}
    </div>
  )
}
