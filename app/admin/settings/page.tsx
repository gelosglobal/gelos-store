'use client'

import { useState } from 'react'
import {
  ArrowUpRight,
  Check,
  ChevronDown,
  Info,
  Save,
} from 'lucide-react'
import { ImageUploadField } from '@/components/admin/image-upload-field'
import { AnalyticsMetricCard } from '@/components/admin/analytics-metric-card'
import { SettingsSectionCard } from '@/components/admin/settings-section-card'
import { Badge } from '@/components/ui/badge'
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
import {
  brandColorPresets,
  notificationOptions,
  paymentProviders,
  settingsInsight,
  settingsSections,
  settingsStatusCards,
  storeDefaults,
  type SettingsSectionId,
} from '@/lib/admin/settings-data'
import { cn } from '@/lib/utils'

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState<SettingsSectionId>('store')
  const [saved, setSaved] = useState(false)
  const [primaryColor, setPrimaryColor] = useState('#D4FF59')
  const [logoUrl, setLogoUrl] = useState('')
  const [notifications, setNotifications] = useState<Record<string, boolean>>(
    () =>
      Object.fromEntries(
        notificationOptions.map((n) => [n.id, n.defaultOn]),
      ),
  )

  const activeAlerts = Object.values(notifications).filter(Boolean).length

  const handleSave = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  const scrollToSection = (id: SettingsSectionId) => {
    setActiveSection(id)
    document.getElementById(`settings-${id}`)?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    })
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-950 sm:text-3xl">
            Settings
          </h1>
          <p className="mt-1 text-sm text-neutral-500">
            Store configuration, notifications, and branding
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" className="h-9 bg-white">
            Discard
          </Button>
          <Button
            size="sm"
            className="h-9 gap-1.5 bg-neutral-950 text-white hover:bg-neutral-800"
            onClick={handleSave}
          >
            {saved ? (
              <>
                <Check className="h-3.5 w-3.5" />
                Saved
              </>
            ) : (
              <>
                <Save className="h-3.5 w-3.5" />
                Save changes
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Insight */}
      <div className="flex flex-col gap-4 rounded-xl border border-neutral-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div className="flex gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#D4FF59]/40">
            <Info className="h-5 w-5 text-neutral-800" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
              Recommendation
            </p>
            <p className="mt-0.5 font-semibold text-neutral-950">
              {settingsInsight.title}
            </p>
            <p className="mt-1 max-w-2xl text-sm text-neutral-600">
              {settingsInsight.body}
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="shrink-0 gap-1"
          onClick={() => scrollToSection('payments')}
        >
          {settingsInsight.action}
          <ArrowUpRight className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Status cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {settingsStatusCards.map((card, i) => (
          <AnalyticsMetricCard
            key={card.title}
            title={card.title}
            value={i === 3 ? `${activeAlerts} active` : card.value}
            change={
              card.positive
                ? { label: card.detail, positive: true }
                : { label: card.detail, positive: false }
            }
          />
        ))}
      </div>

      {/* Section nav */}
      <div className="flex flex-wrap gap-2">
        {settingsSections.map((section) => {
          const Icon = section.icon
          const active = activeSection === section.id
          return (
            <button
              key={section.id}
              type="button"
              onClick={() => scrollToSection(section.id)}
              className={cn(
                'inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors',
                active
                  ? 'border-neutral-950 bg-neutral-950 text-white'
                  : 'border-neutral-200 bg-white text-neutral-600 hover:border-neutral-300 hover:text-neutral-950',
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {section.label}
            </button>
          )
        })}
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        {/* Main column */}
        <div className="space-y-5 lg:col-span-2">
          <div id="settings-store">
            <SettingsSectionCard
              title="Store information"
              description="How your shop appears to customers and in receipts"
              icon={settingsSections[0].icon}
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="store-name">Store name</Label>
                  <Input
                    id="store-name"
                    defaultValue={storeDefaults.name}
                    className="bg-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="store-email">Contact email</Label>
                  <Input
                    id="store-email"
                    type="email"
                    defaultValue={storeDefaults.email}
                    className="bg-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="store-phone">Support phone</Label>
                  <Input
                    id="store-phone"
                    defaultValue={storeDefaults.supportPhone}
                    className="bg-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Country / region</Label>
                  <Select defaultValue={storeDefaults.country}>
                    <SelectTrigger className="bg-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="gh">Ghana</SelectItem>
                      <SelectItem value="ng">Nigeria</SelectItem>
                      <SelectItem value="ke">Kenya</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Currency</Label>
                  <Select defaultValue={storeDefaults.currency}>
                    <SelectTrigger className="bg-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ghs">GH₵ GHS</SelectItem>
                      <SelectItem value="usd">USD ($)</SelectItem>
                      <SelectItem value="gbp">GBP (£)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label>Timezone</Label>
                  <Select defaultValue={storeDefaults.timezone}>
                    <SelectTrigger className="bg-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Africa/Accra">
                        (GMT) Africa/Accra
                      </SelectItem>
                      <SelectItem value="Africa/Lagos">
                        (GMT+1) Africa/Lagos
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="store-description">Store description</Label>
                  <Textarea
                    id="store-description"
                    defaultValue={storeDefaults.description}
                    rows={3}
                    className="resize-none bg-white"
                  />
                </div>
              </div>
            </SettingsSectionCard>
          </div>

          <div id="settings-notifications">
            <SettingsSectionCard
              title="Notifications"
              description="Choose what your team hears about"
              icon={settingsSections[1].icon}
            >
              <ul className="divide-y divide-neutral-100">
                {notificationOptions.map((item) => (
                  <li
                    key={item.id}
                    className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0"
                  >
                    <div>
                      <p className="text-sm font-medium text-neutral-900">
                        {item.label}
                      </p>
                      <p className="text-xs text-neutral-500">
                        {item.description}
                      </p>
                    </div>
                    <Switch
                      checked={notifications[item.id] ?? false}
                      onCheckedChange={(checked) =>
                        setNotifications((prev) => ({
                          ...prev,
                          [item.id]: checked,
                        }))
                      }
                    />
                  </li>
                ))}
              </ul>
            </SettingsSectionCard>
          </div>

          <div id="settings-payments">
            <SettingsSectionCard
              title="Payment methods"
              description="Providers available at checkout"
              icon={settingsSections[2].icon}
            >
              <ul className="space-y-3">
                {paymentProviders.map((provider) => (
                  <li
                    key={provider.id}
                    className="flex flex-col gap-3 rounded-lg border border-neutral-200 p-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-neutral-950">
                          {provider.name}
                        </p>
                        {provider.recommended && (
                          <Badge
                            variant="secondary"
                            className="bg-[#D4FF59]/50 text-neutral-800"
                          >
                            Recommended
                          </Badge>
                        )}
                        {provider.connected && (
                          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                            Connected
                          </Badge>
                        )}
                      </div>
                      <p className="mt-1 text-sm text-neutral-500">
                        {provider.description}
                      </p>
                    </div>
                    <Button
                      variant={provider.connected ? 'outline' : 'default'}
                      size="sm"
                      className={cn(
                        'shrink-0',
                        !provider.connected &&
                          'bg-neutral-950 text-white hover:bg-neutral-800',
                      )}
                    >
                      {provider.connected ? 'Manage' : 'Connect'}
                      {!provider.connected && (
                        <ChevronDown className="ml-1 h-3.5 w-3.5 rotate-[-90deg]" />
                      )}
                    </Button>
                  </li>
                ))}
              </ul>
            </SettingsSectionCard>
          </div>

          <div id="settings-appearance">
            <SettingsSectionCard
              title="Branding & appearance"
              description="Visual identity on the storefront and admin"
              icon={settingsSections[3].icon}
            >
              <div className="space-y-5">
                <div className="space-y-2">
                  <Label>Accent color</Label>
                  <div className="flex flex-wrap items-center gap-3">
                    {brandColorPresets.map((preset) => (
                      <button
                        key={preset.id}
                        type="button"
                        title={preset.label}
                        onClick={() => setPrimaryColor(preset.hex)}
                        className={cn(
                          'h-10 w-10 rounded-lg border-2 transition-all',
                          primaryColor === preset.hex
                            ? 'border-neutral-950 scale-105'
                            : 'border-transparent hover:border-neutral-300',
                        )}
                        style={{ backgroundColor: preset.hex }}
                      />
                    ))}
                    <input
                      type="color"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className="h-10 w-10 cursor-pointer rounded-lg border border-neutral-200 bg-white p-0.5"
                      aria-label="Custom accent color"
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between rounded-lg border border-neutral-200 px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-neutral-900">
                      Dark mode (admin)
                    </p>
                    <p className="text-xs text-neutral-500">
                      Applies to CMS only, not the storefront
                    </p>
                  </div>
                  <Switch />
                </div>
                <ImageUploadField
                  label="Store logo"
                  endpoint="storeLogo"
                  value={logoUrl}
                  onChange={setLogoUrl}
                  hint="PNG or SVG up to 2MB. Uploaded to UploadThing."
                />
              </div>
            </SettingsSectionCard>
          </div>
        </div>

        {/* Sidebar */}
        <aside className="space-y-5">
          <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-neutral-950">
              Settings overview
            </h3>
            <ul className="mt-4 space-y-3">
              {settingsSections.map((section) => {
                const Icon = section.icon
                return (
                  <li key={section.id}>
                    <button
                      type="button"
                      onClick={() => scrollToSection(section.id)}
                      className="flex w-full items-start gap-3 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-neutral-50"
                    >
                      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-neutral-500" />
                      <div>
                        <p className="text-sm font-medium text-neutral-900">
                          {section.label}
                        </p>
                        <p className="text-xs text-neutral-500">
                          {section.description}
                        </p>
                      </div>
                    </button>
                  </li>
                )
              })}
            </ul>
          </div>

          <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-neutral-950">
              Data & environment
            </h3>
            <dl className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between gap-2">
                <dt className="text-neutral-500">CMS mode</dt>
                <dd className="font-medium text-neutral-900">Preview</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-neutral-500">Database</dt>
                <dd className="font-medium text-neutral-900">MongoDB</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-neutral-500">Products source</dt>
                <dd className="font-medium text-neutral-900">Mock + API</dd>
              </div>
            </dl>
            <p className="mt-4 text-xs text-neutral-500">
              Set <code className="rounded bg-neutral-100 px-1">DATABASE_URL</code>{' '}
              in <code className="rounded bg-neutral-100 px-1">.env.local</code>{' '}
              to persist edits.
            </p>
          </div>
        </aside>
      </div>
    </div>
  )
}
