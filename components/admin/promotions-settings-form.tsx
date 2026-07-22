'use client'

import { useCallback, useEffect, useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { SettingsSectionCard } from '@/components/admin/settings-section-card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Gift } from 'lucide-react'
import {
  DEFAULT_STORE_PROMOTIONS,
  sanitizeStorePromotions,
  type PromoCode,
  type StorePromotions,
} from '@/lib/store-promotions'

function createEmptyPromo(): PromoCode {
  return {
    id: crypto.randomUUID(),
    code: '',
    discountPercent: 10,
    enabled: true,
    label: 'Discount',
  }
}

export function PromotionsSettingsForm() {
  const [settings, setSettings] = useState<StorePromotions>(
    DEFAULT_STORE_PROMOTIONS,
  )
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const loadSettings = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/promotions', { cache: 'no-store' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setSettings(data.promotions ?? DEFAULT_STORE_PROMOTIONS)
    } catch {
      toast.error('Failed to load promotions settings')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadSettings()
  }, [loadSettings])

  const updateField = <K extends keyof StorePromotions>(
    key: K,
    value: StorePromotions[K],
  ) => {
    setSettings((prev) => ({ ...prev, [key]: value }))
  }

  const updatePromo = (id: string, patch: Partial<PromoCode>) => {
    setSettings((prev) => ({
      ...prev,
      promos: prev.promos.map((promo) =>
        promo.id === id ? { ...promo, ...patch } : promo,
      ),
    }))
  }

  const addPromo = () => {
    setSettings((prev) => ({
      ...prev,
      promos: [...prev.promos, createEmptyPromo()],
    }))
  }

  const removePromo = (id: string) => {
    setSettings((prev) => ({
      ...prev,
      promos: prev.promos.filter((promo) => promo.id !== id),
    }))
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/admin/promotions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sanitizeStorePromotions(settings)),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setSettings(data.promotions)
      toast.success('Rewards & promos saved')
    } catch {
      toast.error('Failed to save promotions settings')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="rounded-xl border border-neutral-200 bg-white p-8 text-center text-sm text-neutral-500 shadow-sm">
        Loading checkout settings…
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <SettingsSectionCard
        title="Free shipping reward"
        description="Cart progress bar and shipping rules customers see at checkout"
        icon={Gift}
      >
        <div className="space-y-5">
          <div className="flex items-center justify-between rounded-lg border border-neutral-200 px-4 py-3">
            <div>
              <p className="text-sm font-medium text-neutral-900">
                Enable free shipping reward
              </p>
              <p className="text-xs text-neutral-500">
                Show progress toward free shipping in the cart
              </p>
            </div>
            <Switch
              checked={settings.freeShippingEnabled}
              onCheckedChange={(checked) =>
                updateField('freeShippingEnabled', checked)
              }
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="free-shipping-threshold">
                Free shipping threshold (GHS)
              </Label>
              <Input
                id="free-shipping-threshold"
                type="number"
                min={0}
                step={1}
                value={settings.freeShippingThreshold}
                onChange={(e) =>
                  updateField(
                    'freeShippingThreshold',
                    Number(e.target.value) || 0,
                  )
                }
                className="bg-white"
              />
              <p className="text-xs text-neutral-500">
                Base catalog amount before currency conversion
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="shipping-fee">Standard shipping fee (GHS)</Label>
              <Input
                id="shipping-fee"
                type="number"
                min={0}
                step={1}
                value={settings.shippingFee}
                onChange={(e) =>
                  updateField('shippingFee', Number(e.target.value) || 0)
                }
                className="bg-white"
              />
              <p className="text-xs text-neutral-500">
                Applied to Ghana checkout. Other countries use Admin → Markets.
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="progress-label">Progress message</Label>
            <Input
              id="progress-label"
              value={settings.freeShippingProgressLabel}
              onChange={(e) =>
                updateField('freeShippingProgressLabel', e.target.value)
              }
              className="bg-white"
            />
            <p className="text-xs text-neutral-500">
              Use <code className="rounded bg-neutral-100 px-1">{'{{amount}}'}</code>{' '}
              for the remaining amount
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="unlocked-label">Unlocked message</Label>
            <Input
              id="unlocked-label"
              value={settings.freeShippingUnlockedLabel}
              onChange={(e) =>
                updateField('freeShippingUnlockedLabel', e.target.value)
              }
              className="bg-white"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="reward-label">Reward name</Label>
            <Input
              id="reward-label"
              value={settings.freeShippingRewardLabel}
              onChange={(e) =>
                updateField('freeShippingRewardLabel', e.target.value)
              }
              className="bg-white"
            />
            <p className="text-xs text-neutral-500">
              Used in footer copy, e.g. &quot;Free shipping on orders over…&quot;
            </p>
          </div>
        </div>
      </SettingsSectionCard>

      <SettingsSectionCard
        title="Promo codes"
        description="Discount codes customers can apply in the cart"
        icon={Gift}
      >
        <div className="space-y-3">
          {settings.promos.length === 0 ? (
            <p className="rounded-lg border border-dashed border-neutral-200 px-4 py-6 text-center text-sm text-neutral-500">
              No promo codes yet. Add one below.
            </p>
          ) : (
            settings.promos.map((promo) => (
              <div
                key={promo.id}
                className="grid gap-3 rounded-lg border border-neutral-200 p-4 sm:grid-cols-[1fr_120px_1fr_auto_auto]"
              >
                <div className="space-y-1">
                  <Label className="text-xs text-neutral-500">Code</Label>
                  <Input
                    value={promo.code}
                    onChange={(e) =>
                      updatePromo(promo.id, {
                        code: e.target.value.toUpperCase(),
                      })
                    }
                    placeholder="WELCOME"
                    className="bg-white uppercase"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-neutral-500">Discount %</Label>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    value={promo.discountPercent}
                    onChange={(e) =>
                      updatePromo(promo.id, {
                        discountPercent: Number(e.target.value) || 0,
                      })
                    }
                    className="bg-white"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-neutral-500">Cart label</Label>
                  <Input
                    value={promo.label}
                    onChange={(e) =>
                      updatePromo(promo.id, { label: e.target.value })
                    }
                    placeholder="15% off"
                    className="bg-white"
                  />
                </div>
                <div className="flex items-end pb-1">
                  <Switch
                    checked={promo.enabled}
                    onCheckedChange={(checked) =>
                      updatePromo(promo.id, { enabled: checked })
                    }
                    aria-label={`Enable ${promo.code || 'promo'}`}
                  />
                </div>
                <div className="flex items-end pb-0.5">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="text-neutral-500 hover:text-red-600"
                    onClick={() => removePromo(promo.id)}
                    aria-label="Remove promo code"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))
          )}

          <div className="flex flex-wrap gap-2 pt-2">
            <Button type="button" variant="outline" size="sm" onClick={addPromo}>
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              Add promo code
            </Button>
            <Button
              type="button"
              size="sm"
              className="bg-neutral-950 text-white hover:bg-neutral-800"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? 'Saving…' : 'Save changes'}
            </Button>
          </div>
        </div>
      </SettingsSectionCard>
    </div>
  )
}
