'use client'

import { useCallback, useEffect, useState } from 'react'
import { Check, Copy, Share2, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import {
  buildAffiliateProductUrl,
  buildProductShareUrl,
  normalizeAffiliateCode,
} from '@/lib/affiliates'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

const PARTNER_CODE_STORAGE_KEY = 'gelos-partner-code'

type PartnerSummary = {
  code: string
  name: string
  commissionPercent: number
}

type ProductShareMenuProps = {
  productName: string
  productHref: string
}

function readPartnerCode(): string {
  if (typeof window === 'undefined') return ''
  return localStorage.getItem(PARTNER_CODE_STORAGE_KEY)?.trim() ?? ''
}

function writePartnerCode(code: string) {
  if (typeof window === 'undefined') return
  if (code) localStorage.setItem(PARTNER_CODE_STORAGE_KEY, code)
  else localStorage.removeItem(PARTNER_CODE_STORAGE_KEY)
}

async function validatePartnerCode(
  code: string,
): Promise<PartnerSummary | null> {
  const res = await fetch(
    `/api/store/affiliate?code=${encodeURIComponent(code)}`,
    { cache: 'no-store' },
  )
  if (!res.ok) return null
  return (await res.json()) as PartnerSummary
}

async function copyText(text: string) {
  await navigator.clipboard.writeText(text)
}

async function nativeShare(title: string, text: string, url: string) {
  if (typeof navigator.share === 'function') {
    await navigator.share({ title, text, url })
    return true
  }
  return false
}

export function ProductShareMenu({
  productName,
  productHref,
}: ProductShareMenuProps) {
  const [open, setOpen] = useState(false)
  const [partnerCodeInput, setPartnerCodeInput] = useState('')
  const [partner, setPartner] = useState<PartnerSummary | null>(null)
  const [validating, setValidating] = useState(false)
  const [copiedProduct, setCopiedProduct] = useState(false)
  const [copiedAffiliate, setCopiedAffiliate] = useState(false)

  const productUrl =
    typeof window !== 'undefined'
      ? buildProductShareUrl(productHref, window.location.origin)
      : buildProductShareUrl(productHref)

  const affiliateUrl =
    partner && typeof window !== 'undefined'
      ? buildAffiliateProductUrl(
          productHref,
          partner.code,
          window.location.origin,
        )
      : ''

  const loadSavedPartner = useCallback(async () => {
    const saved = readPartnerCode()
    if (!saved) return
    setPartnerCodeInput(saved)
    const summary = await validatePartnerCode(saved)
    setPartner(summary)
  }, [])

  useEffect(() => {
    if (open) void loadSavedPartner()
  }, [open, loadSavedPartner])

  const handleShareProduct = async () => {
    const text = `Check out ${productName} on Gelos`
    const shared = await nativeShare(productName, text, productUrl)
    if (!shared) {
      await copyText(productUrl)
      toast.success('Product link copied')
    }
  }

  const handleCopyProduct = async () => {
    await copyText(productUrl)
    setCopiedProduct(true)
    toast.success('Product link copied')
    window.setTimeout(() => setCopiedProduct(false), 2000)
  }

  const handleVerifyPartner = async () => {
    const code = normalizeAffiliateCode(partnerCodeInput)
    if (!code) {
      toast.error('Enter your affiliate code')
      return
    }

    setValidating(true)
    try {
      const summary = await validatePartnerCode(code)
      if (!summary) {
        setPartner(null)
        toast.error('Invalid or inactive affiliate code')
        return
      }
      setPartner(summary)
      setPartnerCodeInput(summary.code)
      writePartnerCode(summary.code)
      toast.success(`Welcome back, ${summary.name}`)
    } finally {
      setValidating(false)
    }
  }

  const handleShareAffiliate = async () => {
    if (!partner || !affiliateUrl) return
    const text = `I recommend ${productName} from Gelos — shop with my link`
    const shared = await nativeShare(productName, text, affiliateUrl)
    if (!shared) {
      await copyText(affiliateUrl)
      toast.success('Affiliate link copied')
    }
  }

  const handleCopyAffiliate = async () => {
    if (!affiliateUrl) return
    await copyText(affiliateUrl)
    setCopiedAffiliate(true)
    toast.success('Affiliate link copied')
    window.setTimeout(() => setCopiedAffiliate(false), 2000)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="shrink-0 gap-2 rounded-full"
        >
          <Share2 className="h-4 w-4" />
          Share
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 rounded-2xl p-0">
        <div className="border-b border-neutral-200 p-4">
          <p className="text-sm font-semibold text-neutral-950">Share product</p>
          <p className="mt-1 text-xs text-neutral-500">
            Send this page to friends and family.
          </p>
          <div className="mt-3 flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="flex-1 gap-2"
              onClick={handleCopyProduct}
            >
              {copiedProduct ? (
                <Check className="h-4 w-4" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
              Copy link
            </Button>
            <Button
              type="button"
              size="sm"
              className="flex-1 gap-2 bg-neutral-950 hover:bg-neutral-800"
              onClick={handleShareProduct}
            >
              <Share2 className="h-4 w-4" />
              Share
            </Button>
          </div>
        </div>

        <div className="p-4">
          <div className="flex items-start gap-2">
            <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-[#84CC16]" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-neutral-950">
                Share & earn
              </p>
              <p className="mt-1 text-xs text-neutral-500">
                Affiliates earn commission when someone buys through your link.
              </p>
            </div>
          </div>

          {partner ? (
            <div className="mt-3 space-y-3">
              <div className="rounded-xl bg-neutral-50 px-3 py-2 text-xs text-neutral-600">
                <span className="font-medium text-neutral-900">
                  {partner.name}
                </span>{' '}
                · {partner.commissionPercent}% commission ·{' '}
                <span className="font-mono">{partner.code}</span>
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="flex-1 gap-2"
                  onClick={handleCopyAffiliate}
                >
                  {copiedAffiliate ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                  Copy earn link
                </Button>
                <Button
                  type="button"
                  size="sm"
                  className="flex-1 gap-2 bg-[#84CC16] text-neutral-950 hover:bg-[#74b814]"
                  onClick={handleShareAffiliate}
                >
                  <Share2 className="h-4 w-4" />
                  Share
                </Button>
              </div>
              <button
                type="button"
                className="text-xs text-neutral-500 underline-offset-2 hover:text-neutral-800 hover:underline"
                onClick={() => {
                  setPartner(null)
                  setPartnerCodeInput('')
                  writePartnerCode('')
                }}
              >
                Use a different code
              </button>
            </div>
          ) : (
            <div className="mt-3 space-y-2">
              <Label htmlFor="partner-code" className="text-xs">
                Your affiliate code
              </Label>
              <div className="flex gap-2">
                <Input
                  id="partner-code"
                  value={partnerCodeInput}
                  onChange={(event) =>
                    setPartnerCodeInput(event.target.value.toUpperCase())
                  }
                  placeholder="AMA10"
                  className="h-9 font-mono text-sm"
                />
                <Button
                  type="button"
                  size="sm"
                  className="shrink-0"
                  onClick={handleVerifyPartner}
                  disabled={validating}
                >
                  {validating ? '…' : 'Verify'}
                </Button>
              </div>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
