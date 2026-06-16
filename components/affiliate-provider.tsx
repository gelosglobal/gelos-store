'use client'

import {
  createContext,
  Suspense,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import { useSearchParams } from 'next/navigation'
import { normalizeAffiliateCode } from '@/lib/affiliates'

const AFFILIATE_STORAGE_KEY = 'gelos-affiliate-code'

type AffiliateSummary = {
  code: string
  name: string
  commissionPercent: number
}

type AffiliateContextValue = {
  affiliateCode: string
  affiliate: AffiliateSummary | null
  loading: boolean
  setAffiliateCode: (code: string) => void
  clearAffiliateCode: () => void
}

const AffiliateContext = createContext<AffiliateContextValue | null>(null)

function readStoredAffiliateCode(): string {
  if (typeof window === 'undefined') return ''
  return sessionStorage.getItem(AFFILIATE_STORAGE_KEY)?.trim() ?? ''
}

function writeStoredAffiliateCode(code: string) {
  if (typeof window === 'undefined') return
  if (code) {
    sessionStorage.setItem(AFFILIATE_STORAGE_KEY, code)
  } else {
    sessionStorage.removeItem(AFFILIATE_STORAGE_KEY)
  }
}

async function fetchAffiliateSummary(
  code: string,
): Promise<AffiliateSummary | null> {
  const res = await fetch(
    `/api/store/affiliate?code=${encodeURIComponent(code)}`,
    { cache: 'no-store' },
  )
  if (!res.ok) return null
  const data = (await res.json()) as AffiliateSummary
  return data
}

function AffiliateTracker({ onCode }: { onCode: (code: string) => void }) {
  const searchParams = useSearchParams()

  useEffect(() => {
    const ref = searchParams.get('ref')?.trim()
    if (ref) onCode(ref)
  }, [searchParams, onCode])

  return null
}

export function AffiliateProvider({ children }: { children: ReactNode }) {
  const [affiliateCode, setAffiliateCodeState] = useState('')
  const [affiliate, setAffiliate] = useState<AffiliateSummary | null>(null)
  const [loading, setLoading] = useState(true)

  const applyCode = useCallback(async (rawCode: string) => {
    const code = normalizeAffiliateCode(rawCode)
    if (!code) {
      setAffiliateCodeState('')
      setAffiliate(null)
      writeStoredAffiliateCode('')
      setLoading(false)
      return
    }

    setLoading(true)
    const summary = await fetchAffiliateSummary(code)
    if (!summary) {
      setAffiliateCodeState('')
      setAffiliate(null)
      writeStoredAffiliateCode('')
      setLoading(false)
      return
    }

    setAffiliateCodeState(summary.code)
    setAffiliate(summary)
    writeStoredAffiliateCode(summary.code)
    setLoading(false)
  }, [])

  useEffect(() => {
    const stored = readStoredAffiliateCode()
    if (stored) {
      void applyCode(stored)
      return
    }
    setLoading(false)
  }, [applyCode])

  const setAffiliateCode = useCallback(
    (code: string) => {
      void applyCode(code)
    },
    [applyCode],
  )

  const clearAffiliateCode = useCallback(() => {
    setAffiliateCodeState('')
    setAffiliate(null)
    writeStoredAffiliateCode('')
  }, [])

  return (
    <AffiliateContext.Provider
      value={{
        affiliateCode,
        affiliate,
        loading,
        setAffiliateCode,
        clearAffiliateCode,
      }}
    >
      <Suspense fallback={null}>
        <AffiliateTracker onCode={setAffiliateCode} />
      </Suspense>
      {children}
    </AffiliateContext.Provider>
  )
}

export function useAffiliate() {
  const context = useContext(AffiliateContext)
  if (!context) {
    throw new Error('useAffiliate must be used within AffiliateProvider')
  }
  return context
}
