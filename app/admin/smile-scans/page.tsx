'use client'

import Link from 'next/link'
import { Fragment, useCallback, useEffect, useMemo, useState } from 'react'
import { ChevronDown, ChevronRight, RefreshCw, ScanFace, Search } from 'lucide-react'
import { toast } from 'sonner'
import { AdminPageHeader } from '@/components/admin/admin-page-header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { AdminSmileScan } from '@/lib/types/smile-scan'
import { cn } from '@/lib/utils'

function ScorePill({ value }: { value: number }) {
  if (value <= 0) {
    return <span className="text-neutral-400">—</span>
  }

  return (
    <span
      className={cn(
        'inline-flex min-w-10 items-center justify-center rounded-full px-2 py-0.5 text-xs font-semibold',
        value >= 8
          ? 'bg-[#84CC16]/20 text-[#4d7c0f]'
          : value >= 6
            ? 'bg-amber-100 text-amber-800'
            : 'bg-neutral-100 text-neutral-700',
      )}
    >
      {value}/10
    </span>
  )
}

function ScanDetail({ scan }: { scan: AdminSmileScan }) {
  return (
    <div className="grid gap-4 rounded-xl border border-neutral-200 bg-neutral-50 p-4 md:grid-cols-2">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
          Snapshot
        </p>
        <p className="mt-2 text-sm leading-relaxed text-neutral-800">
          {scan.report.snapshot}
        </p>
      </div>

      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
          Scores
        </p>
        <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
          <p>Brightness: <strong>{scan.brightness || '—'}</strong></p>
          <p>Freshness: <strong>{scan.freshness || '—'}</strong></p>
          <p>Confidence: <strong>{scan.confidence || '—'}</strong></p>
          <p>Overall: <strong>{scan.overallScore || '—'}</strong></p>
        </div>
      </div>

      {scan.report.tips.length > 0 && (
        <div className="md:col-span-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
            Tips
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-neutral-800">
            {scan.report.tips.map((tip) => (
              <li key={tip}>{tip}</li>
            ))}
          </ul>
        </div>
      )}

      {scan.report.products.length > 0 && (
        <div className="md:col-span-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
            Recommended products
          </p>
          <div className="mt-2 space-y-2">
            {scan.report.products.map((product) => (
              <div
                key={`${scan.scanId}-${product.href}`}
                className="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm"
              >
                <Link href={product.href} className="font-medium text-[#4F6CF7] hover:underline">
                  {product.name}
                </Link>
                <p className="mt-1 text-neutral-600">{product.reason}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="md:col-span-2 text-sm text-neutral-600">
        <p>
          <span className="font-medium text-neutral-800">Dentist note:</span>{' '}
          {scan.report.dentistNote}
        </p>
        <p className="mt-1">
          <span className="font-medium text-neutral-800">Disclaimer:</span>{' '}
          {scan.report.disclaimer}
        </p>
      </div>
    </div>
  )
}

export default function AdminSmileScansPage() {
  const [scans, setScans] = useState<AdminSmileScan[]>([])
  const [databaseConnected, setDatabaseConnected] = useState(false)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [refreshedAt, setRefreshedAt] = useState<Date | null>(null)
  const [search, setSearch] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const loadScans = useCallback(async (options?: { silent?: boolean }) => {
    const silent = options?.silent ?? false
    if (!silent) setRefreshing(true)

    try {
      const res = await fetch('/api/admin/smile-scans', {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' },
      })
      const data = (await res.json()) as {
        scans?: AdminSmileScan[]
        databaseConnected?: boolean
        error?: string
      }

      if (!res.ok) {
        throw new Error(data.error ?? 'Failed to load smile scans')
      }

      setScans(data.scans ?? [])
      setDatabaseConnected(Boolean(data.databaseConnected))
      setRefreshedAt(new Date())
    } catch {
      toast.error('Failed to load smile scans')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    void loadScans()
  }, [loadScans])

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible') {
        void loadScans({ silent: true })
      }
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [loadScans])

  useEffect(() => {
    const interval = window.setInterval(() => {
      void loadScans({ silent: true })
    }, 15_000)

    return () => window.clearInterval(interval)
  }, [loadScans])

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return scans
    return scans.filter((scan) => {
      return (
        scan.scanId.toLowerCase().includes(query) ||
        scan.customerName.toLowerCase().includes(query) ||
        scan.sessionId?.toLowerCase().includes(query) ||
        scan.report.snapshot.toLowerCase().includes(query) ||
        scan.report.products.some((product) =>
          product.name.toLowerCase().includes(query),
        )
      )
    })
  }, [scans, search])

  const stats = useMemo(() => {
    const withScores = scans.filter((scan) => scan.overallScore > 0)
    const average =
      withScores.length > 0
        ? Math.round(
            withScores.reduce((sum, scan) => sum + scan.overallScore, 0) /
              withScores.length,
          )
        : 0
    return {
      total: scans.length,
      today: scans.filter((scan) => {
        const created = new Date(scan.createdAt)
        const now = new Date()
        return created.toDateString() === now.toDateString()
      }).length,
      average,
    }
  }, [scans])

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Smile scans"
        description="Gelos AI smile scan reports submitted from the storefront."
      >
        <div className="flex flex-col items-end gap-1">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={refreshing}
            onClick={() => void loadScans()}
            className="rounded-full"
          >
            <RefreshCw className={cn('h-4 w-4', refreshing && 'animate-spin')} />
            Refresh
          </Button>
          {refreshedAt && (
            <p className="text-xs text-neutral-500">
              Updated{' '}
              {refreshedAt.toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
                second: '2-digit',
              })}
            </p>
          )}
        </div>
      </AdminPageHeader>

      {!databaseConnected && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Database is not connected. Smile scans will appear here once MongoDB is configured.
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: 'Total scans', value: stats.total },
          { label: 'Today', value: stats.today },
          { label: 'Avg overall score', value: stats.average ? `${stats.average}/10` : '—' },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm"
          >
            <p className="text-sm text-neutral-500">{stat.label}</p>
            <p className="mt-1 text-2xl font-bold text-neutral-950">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-neutral-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-neutral-200 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative max-w-sm flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search scan ID, session, snapshot, products…"
              className="pl-9"
            />
          </div>
          <div className="flex items-center gap-3 text-sm text-neutral-500">
            <span className="inline-flex items-center gap-1.5">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#84CC16] opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-[#84CC16]" />
              </span>
              Live
            </span>
            <span>
              {filtered.length} scan{filtered.length === 1 ? '' : 's'}
            </span>
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10" />
              <TableHead>Scan</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Overall</TableHead>
              <TableHead>Brightness</TableHead>
              <TableHead>Freshness</TableHead>
              <TableHead>Confidence</TableHead>
              <TableHead>Products</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={9} className="py-10 text-center text-neutral-500">
                  Loading smile scans…
                </TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="py-10 text-center text-neutral-500">
                  <ScanFace className="mx-auto mb-2 h-8 w-8 text-neutral-300" />
                  No smile scans yet.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((scan) => {
                const expanded = expandedId === scan.id
                return (
                  <Fragment key={scan.id}>
                    <TableRow
                      className="cursor-pointer hover:bg-neutral-50"
                      onClick={() => setExpandedId(expanded ? null : scan.id)}
                    >
                      <TableCell>
                        {expanded ? (
                          <ChevronDown className="h-4 w-4 text-neutral-500" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-neutral-500" />
                        )}
                      </TableCell>
                      <TableCell>
                        <p className="font-medium text-neutral-950">{scan.scanId}</p>
                        {scan.sessionId && (
                          <p className="mt-0.5 max-w-[12rem] truncate text-xs text-neutral-500">
                            Session {scan.sessionId}
                          </p>
                        )}
                      </TableCell>
                      <TableCell className="font-medium text-neutral-950">
                        {scan.customerName || '—'}
                      </TableCell>
                      <TableCell className="text-neutral-600">{scan.dateLabel}</TableCell>
                      <TableCell>
                        <ScorePill value={scan.overallScore} />
                      </TableCell>
                      <TableCell>
                        <ScorePill value={scan.brightness} />
                      </TableCell>
                      <TableCell>
                        <ScorePill value={scan.freshness} />
                      </TableCell>
                      <TableCell>
                        <ScorePill value={scan.confidence} />
                      </TableCell>
                      <TableCell>{scan.productCount}</TableCell>
                    </TableRow>
                    {expanded && (
                      <TableRow>
                        <TableCell colSpan={9} className="bg-white pb-4">
                          <ScanDetail scan={scan} />
                        </TableCell>
                      </TableRow>
                    )}
                  </Fragment>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
