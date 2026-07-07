'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Loader2, Save } from 'lucide-react'
import { toast } from 'sonner'
import type { AffiliateSettingsPayload } from '@/app/api/affiliate/settings/route'
import {
  BANK_PROVIDERS,
  MOBILE_MONEY_PROVIDERS,
  type AffiliatePayoutMethod,
} from '@/lib/affiliate/payout'
import { normalizeAffiliateCode } from '@/lib/affiliates'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'

const PAYOUT_METHOD_OPTIONS: {
  value: AffiliatePayoutMethod
  label: string
  description: string
}[] = [
  {
    value: 'mobile_money',
    label: 'Mobile money',
    description: 'MTN, Vodafone, or AirtelTigo',
  },
  {
    value: 'bank_transfer',
    label: 'Bank transfer',
    description: 'Direct deposit to your bank account',
  },
]

type CodeCheckState =
  | 'idle'
  | 'too_short'
  | 'invalid'
  | 'checking'
  | 'available'
  | 'taken'
  | 'unchanged'

function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delayMs)
    return () => window.clearTimeout(timer)
  }, [value, delayMs])

  return debounced
}

export function AffiliateSettingsView() {
  const [loading, setLoading] = useState(true)
  const [savingCode, setSavingCode] = useState(false)
  const [saving, setSaving] = useState(false)
  const [payload, setPayload] = useState<AffiliateSettingsPayload | null>(null)
  const [referralCode, setReferralCode] = useState('')
  const [codeCheck, setCodeCheck] = useState<CodeCheckState>('idle')
  const [payoutMethod, setPayoutMethod] = useState<AffiliatePayoutMethod | ''>('')
  const [payoutAccountName, setPayoutAccountName] = useState('')
  const [payoutAccountNumber, setPayoutAccountNumber] = useState('')
  const [payoutProvider, setPayoutProvider] = useState('')

  const loadSettings = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/affiliate/settings', { cache: 'no-store' })
      const data = (await res.json()) as AffiliateSettingsPayload & {
        error?: string
      }
      if (!res.ok) throw new Error(data.error ?? 'Failed to load settings')
      setPayload(data)
      setReferralCode(data.affiliate.code)
      setPayoutMethod(data.payout.payoutMethod)
      setPayoutAccountName(data.payout.payoutAccountName)
      setPayoutAccountNumber(data.payout.payoutAccountNumber)
      setPayoutProvider(data.payout.payoutProvider)
    } catch (error) {
      setPayload(null)
      toast.error(
        error instanceof Error ? error.message : 'Failed to load settings',
      )
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadSettings()
  }, [loadSettings])

  const normalizedCode = useMemo(
    () => normalizeAffiliateCode(referralCode),
    [referralCode],
  )
  const debouncedCode = useDebouncedValue(normalizedCode, 400)
  const savedCode = payload?.affiliate.code ?? ''

  useEffect(() => {
    if (!debouncedCode) {
      setCodeCheck('idle')
      return
    }

    if (debouncedCode === savedCode) {
      setCodeCheck('unchanged')
      return
    }

    if (debouncedCode.length < 3) {
      setCodeCheck('too_short')
      return
    }

    if (!/^[A-Z0-9_-]+$/.test(debouncedCode)) {
      setCodeCheck('invalid')
      return
    }

    let cancelled = false
    setCodeCheck('checking')

    void (async () => {
      try {
        const res = await fetch(
          `/api/store/affiliate/register?code=${encodeURIComponent(debouncedCode)}`,
          { cache: 'no-store' },
        )
        const data = (await res.json()) as {
          available?: boolean
          reason?: string
        }
        if (cancelled) return

        if (!res.ok) {
          setCodeCheck('invalid')
          return
        }

        if (data.available) setCodeCheck('available')
        else if (data.reason === 'taken') setCodeCheck('taken')
        else setCodeCheck('invalid')
      } catch {
        if (!cancelled) setCodeCheck('invalid')
      }
    })()

    return () => {
      cancelled = true
    }
  }, [debouncedCode, savedCode])

  const referralPreview = useMemo(() => {
    if (!normalizedCode || typeof window === 'undefined') return ''
    return `${window.location.origin}/?ref=${encodeURIComponent(normalizedCode)}`
  }, [normalizedCode])

  const canSaveCode =
    normalizedCode.length >= 3 &&
    /^[A-Z0-9_-]+$/.test(normalizedCode) &&
    (codeCheck === 'available' || codeCheck === 'unchanged') &&
    normalizedCode !== savedCode

  const providerOptions = useMemo(() => {
    if (payoutMethod === 'mobile_money') return MOBILE_MONEY_PROVIDERS
    if (payoutMethod === 'bank_transfer') return BANK_PROVIDERS
    return []
  }, [payoutMethod])

  const handleMethodChange = (method: AffiliatePayoutMethod) => {
    setPayoutMethod(method)
    setPayoutProvider('')
  }

  const handleSaveCode = async () => {
    if (!canSaveCode) return

    setSavingCode(true)
    try {
      const res = await fetch('/api/affiliate/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: referralCode }),
      })
      const data = (await res.json()) as AffiliateSettingsPayload & {
        error?: string
      }
      if (!res.ok) throw new Error(data.error ?? 'Failed to save referral code')
      setPayload(data)
      setReferralCode(data.affiliate.code)
      toast.success('Referral code updated')
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to save referral code',
      )
    } finally {
      setSavingCode(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/affiliate/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          payoutMethod,
          payoutAccountName,
          payoutAccountNumber,
          payoutProvider,
        }),
      })
      const data = (await res.json()) as AffiliateSettingsPayload & {
        error?: string
      }
      if (!res.ok) throw new Error(data.error ?? 'Failed to save settings')
      setPayload(data)
      toast.success('Payment method updated')
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to save settings',
      )
    } finally {
      setSaving(false)
    }
  }

  if (loading && !payload) {
    return (
      <div className="flex items-center justify-center rounded-3xl border border-neutral-200 bg-white py-20">
        <Loader2 className="h-6 w-6 animate-spin text-neutral-500" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-neutral-950 sm:text-3xl">
          Settings
        </h1>
        <p className="mt-1 text-sm text-neutral-600">
          Manage your referral code and payout details.
        </p>
      </div>

      <Card className="rounded-2xl border-neutral-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Account</CardTitle>
          <CardDescription>Your affiliate profile on file.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">
                Name
              </p>
              <p className="mt-1 text-sm font-medium text-neutral-950">
                {payload?.affiliate.name ?? '—'}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">
                Email
              </p>
              <p className="mt-1 text-sm text-neutral-800">
                {payload?.affiliate.email || '—'}
              </p>
            </div>
            <div className="sm:col-span-2">
              <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">
                Phone
              </p>
              <p className="mt-1 text-sm text-neutral-800">
                {payload?.affiliate.phone || '—'}
              </p>
            </div>
          </div>

          <div className="space-y-2 border-t border-neutral-100 pt-4">
            <Label htmlFor="referral-code">Referral code</Label>
            <Input
              id="referral-code"
              value={referralCode}
              onChange={(event) => setReferralCode(event.target.value.toUpperCase())}
              className="font-mono uppercase"
              placeholder="YOUR-CODE"
              spellCheck={false}
            />
            <p
              className={cn(
                'text-xs',
                codeCheck === 'available' || codeCheck === 'unchanged'
                  ? 'text-emerald-700'
                  : codeCheck === 'taken'
                    ? 'text-red-600'
                    : 'text-neutral-500',
              )}
            >
              {codeCheck === 'idle'
                ? 'Letters, numbers, hyphens, and underscores only.'
                : codeCheck === 'too_short'
                  ? 'Code must be at least 3 characters.'
                  : codeCheck === 'invalid'
                    ? 'Use letters, numbers, hyphens, or underscores only.'
                    : codeCheck === 'checking'
                      ? 'Checking availability…'
                      : codeCheck === 'taken'
                        ? 'That code is already taken.'
                        : codeCheck === 'unchanged'
                          ? 'This is your current referral code.'
                          : 'This code is available.'}
            </p>
            {referralPreview ? (
              <p className="break-all font-mono text-xs text-neutral-600">
                {referralPreview}
              </p>
            ) : null}
            <div className="flex justify-end">
              <Button
                type="button"
                variant="outline"
                className="gap-2 rounded-full"
                onClick={() => void handleSaveCode()}
                disabled={savingCode || !canSaveCode}
              >
                {savingCode ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Save referral code
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-2xl border-neutral-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Payment method</CardTitle>
          <CardDescription>
            Choose how you want to be paid and keep your details up to date.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-3 sm:grid-cols-2">
            {PAYOUT_METHOD_OPTIONS.map((option) => {
              const selected = payoutMethod === option.value
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleMethodChange(option.value)}
                  className={cn(
                    'rounded-2xl border px-4 py-4 text-left transition-colors',
                    selected
                      ? 'border-neutral-950 bg-neutral-950 text-white'
                      : 'border-neutral-200 bg-white hover:border-neutral-300',
                  )}
                >
                  <p className="text-sm font-semibold">{option.label}</p>
                  <p
                    className={cn(
                      'mt-1 text-xs',
                      selected ? 'text-neutral-200' : 'text-neutral-500',
                    )}
                  >
                    {option.description}
                  </p>
                </button>
              )
            })}
          </div>

          {payoutMethod ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="payout-account-name">Account holder name</Label>
                <Input
                  id="payout-account-name"
                  value={payoutAccountName}
                  onChange={(event) => setPayoutAccountName(event.target.value)}
                  placeholder="Name on account or wallet"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="payout-provider">
                  {payoutMethod === 'mobile_money' ? 'Network' : 'Bank'}
                </Label>
                <Select
                  value={payoutProvider || undefined}
                  onValueChange={setPayoutProvider}
                >
                  <SelectTrigger id="payout-provider" className="w-full">
                    <SelectValue placeholder="Select provider" />
                  </SelectTrigger>
                  <SelectContent>
                    {providerOptions.map((provider) => (
                      <SelectItem key={provider} value={provider}>
                        {provider}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="payout-account-number">
                  {payoutMethod === 'mobile_money'
                    ? 'Mobile money number'
                    : 'Account number'}
                </Label>
                <Input
                  id="payout-account-number"
                  value={payoutAccountNumber}
                  onChange={(event) => setPayoutAccountNumber(event.target.value)}
                  placeholder={
                    payoutMethod === 'mobile_money' ? '0241234567' : 'Account number'
                  }
                  inputMode={
                    payoutMethod === 'mobile_money' ? 'numeric' : 'text'
                  }
                />
              </div>
            </div>
          ) : null}

          <div className="flex justify-end">
            <Button
              type="button"
              className="gap-2 rounded-full bg-neutral-950 text-white hover:bg-neutral-800"
              onClick={() => void handleSave()}
              disabled={saving || !payoutMethod}
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Save payment method
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
