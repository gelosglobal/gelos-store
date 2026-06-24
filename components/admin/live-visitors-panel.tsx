'use client'

import { useCallback, useEffect, useState } from 'react'
import { Globe, RefreshCw, Users } from 'lucide-react'
import type { LiveVisitorsPayload } from '@/lib/admin/live-visitors-types'
import { cn } from '@/lib/utils'

const emptyLive: LiveVisitorsPayload = {
  liveCount: 0,
  todayVisitors: 0,
  activePages: [],
  sessions: [],
  activeWindowSeconds: 120,
  refreshedAt: '',
}

type LiveVisitorsPanelProps = {
  pollMs?: number
  compact?: boolean
}

export function LiveVisitorsPanel({
  pollMs = 10_000,
  compact = false,
}: LiveVisitorsPanelProps) {
  const [data, setData] = useState<LiveVisitorsPayload>(emptyLive)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/analytics/live-visitors', {
        cache: 'no-store',
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error)
      setData(json)
    } catch {
      // Keep last good data on poll failures.
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    setLoading(true)
    load()
    const interval = window.setInterval(load, pollMs)
    return () => window.clearInterval(interval)
  }, [load, pollMs])

  const refreshedLabel = data.refreshedAt
    ? new Date(data.refreshedAt).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        second: '2-digit',
      })
    : '—'

  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
      {!compact ? (
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50">
              <Globe className="h-5 w-5 text-emerald-700" />
              <span className="absolute -right-0.5 -top-0.5 flex h-3 w-3">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-500" />
              </span>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                Live visitors
              </p>
              <div className="mt-1 flex items-baseline gap-2">
                <p className="text-3xl font-bold tracking-tight text-neutral-950">
                  {data.liveCount}
                </p>
                <p className="text-sm text-neutral-500">online now</p>
              </div>
              <p className="mt-1 text-sm text-neutral-600">
                {data.todayVisitors.toLocaleString()} visitors today · active in last{' '}
                {Math.round(data.activeWindowSeconds / 60)} min
              </p>
            </div>
          </div>

          <p className="flex items-center gap-1.5 text-xs text-neutral-500">
            <RefreshCw className={cn('h-3.5 w-3.5', loading && 'animate-spin')} />
            Updated {refreshedLabel}
          </p>
        </div>
      ) : (
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-neutral-950">Live activity</h2>
          <p className="flex items-center gap-1.5 text-xs text-neutral-500">
            <RefreshCw className={cn('h-3.5 w-3.5', loading && 'animate-spin')} />
            Updated {refreshedLabel}
          </p>
        </div>
      )}

      <div className={cn('grid gap-6 lg:grid-cols-2', !compact && 'mt-6')}>
        <div>
          <h3 className="text-sm font-semibold text-neutral-950">Active pages</h3>
          {data.activePages.length > 0 ? (
            <ul className="mt-3 space-y-2">
              {data.activePages.map((page) => (
                <li
                  key={page.path}
                  className="flex items-center justify-between rounded-lg bg-neutral-50 px-3 py-2 text-sm"
                >
                  <span className="line-clamp-1 font-medium text-neutral-800">
                    {page.pathLabel}
                  </span>
                  <span className="ml-3 shrink-0 rounded-full bg-white px-2 py-0.5 text-xs font-semibold text-neutral-700 ring-1 ring-neutral-200">
                    {page.visitors}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-neutral-500">
              No active visitors right now. Open the storefront in another tab to test.
            </p>
          )}
        </div>

        <div>
          <h3 className="flex items-center gap-1.5 text-sm font-semibold text-neutral-950">
            <Users className="h-4 w-4 text-neutral-500" />
            Sessions
          </h3>
          {data.sessions.length > 0 ? (
            <ul className="mt-3 divide-y divide-neutral-100 rounded-lg border border-neutral-100">
              {data.sessions.slice(0, 8).map((session) => (
                <li
                  key={session.visitorId}
                  className="flex items-start justify-between gap-3 px-3 py-2.5 text-sm"
                >
                  <div className="min-w-0">
                    <p className="line-clamp-1 font-medium text-neutral-800">
                      {session.pathLabel}
                    </p>
                    <p className="mt-0.5 text-xs text-neutral-500">
                      {session.referrerLabel}
                    </p>
                  </div>
                  <span className="shrink-0 text-xs text-neutral-500">
                    {session.lastSeenLabel}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-neutral-500">No live sessions to show.</p>
          )}
        </div>
      </div>
    </div>
  )
}
