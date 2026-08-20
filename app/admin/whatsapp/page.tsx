'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import {
  Loader2,
  MessageCircle,
  Pause,
  Phone,
  Play,
  RefreshCw,
  Search,
  Send,
} from 'lucide-react'
import { toast } from 'sonner'
import { AdminPageHeader } from '@/components/admin/admin-page-header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty'
import { cn } from '@/lib/utils'

type ThreadSummary = {
  whatsappId: string
  displayName: string | null
  aiPaused: boolean
  aiPausedReason: string | null
  lastMessageAt: string
  lastMessagePreview: string
  lastMessageRole: string
  openHandoffs: number
}

type ThreadDetail = {
  customer: {
    whatsappId: string
    displayName: string | null
    alternatePhone: string | null
    notes: string | null
    aiPaused: boolean
    aiPausedAt: string | null
    aiPausedReason: string | null
  }
  messages: Array<{
    id: string
    role: string
    content: string
    createdAt: string
  }>
  cart: {
    items: Array<{
      product_name: string
      variant: string | null
      quantity: number
      unit_price_ghs: number | null
    }>
    delivery_area: string | null
    payment_method: string | null
  } | null
  handoffs: Array<{
    id: string
    reason: string
    urgency: string
    status: string
    createdAt: string
  }>
  orders: Array<{
    orderId: string
    totalGhs: number
    orderStatus: string
    createdAt: string
  }>
}

function formatTime(iso: string) {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function threadLabel(thread: {
  displayName?: string | null
  whatsappId: string
}) {
  return thread.displayName?.trim() || `+${thread.whatsappId}`
}

export default function AdminWhatsappPage() {
  const searchParams = useSearchParams()
  const deepLinkCustomer = searchParams.get('c')?.trim() || ''
  const [threads, setThreads] = useState<ThreadSummary[]>([])
  const [loadingThreads, setLoadingThreads] = useState(true)
  const [activeId, setActiveId] = useState(deepLinkCustomer)
  const [detail, setDetail] = useState<ThreadDetail | null>(null)
  const [loadingThread, setLoadingThread] = useState(false)
  const [search, setSearch] = useState('')
  const [reply, setReply] = useState('')
  const [sending, setSending] = useState(false)
  const [pausing, setPausing] = useState(false)
  const [sendingLink, setSendingLink] = useState(false)

  const loadThreads = useCallback(async () => {
    setLoadingThreads(true)
    try {
      const res = await fetch('/api/admin/whatsapp', { cache: 'no-store' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to load chats')
      const next = (data.threads ?? []) as ThreadSummary[]
      setThreads(next)
      if (deepLinkCustomer) {
        setActiveId(deepLinkCustomer)
      } else if (!activeId && next.length > 0) {
        setActiveId(next[0]!.whatsappId)
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to load chats')
    } finally {
      setLoadingThreads(false)
    }
  }, [activeId, deepLinkCustomer])

  const loadThread = useCallback(async (whatsappId: string) => {
    if (!whatsappId) return
    setLoadingThread(true)
    try {
      const res = await fetch(
        `/api/admin/whatsapp/${encodeURIComponent(whatsappId)}`,
        { cache: 'no-store' },
      )
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to load thread')
      setDetail(data as ThreadDetail)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to load thread')
      setDetail(null)
    } finally {
      setLoadingThread(false)
    }
  }, [])

  useEffect(() => {
    void loadThreads()
  }, [loadThreads])

  useEffect(() => {
    if (activeId) void loadThread(activeId)
  }, [activeId, loadThread])

  const filteredThreads = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return threads
    return threads.filter((t) => {
      return (
        (t.displayName || '').toLowerCase().includes(q) ||
        t.whatsappId.includes(q) ||
        t.lastMessagePreview.toLowerCase().includes(q)
      )
    })
  }, [threads, search])

  const activeSummary = useMemo(
    () => threads.find((t) => t.whatsappId === activeId) ?? null,
    [threads, activeId],
  )

  const handleTogglePause = async () => {
    if (!activeId || !detail) return
    const nextPaused = !detail.customer.aiPaused
    setPausing(true)
    try {
      const res = await fetch(
        `/api/admin/whatsapp/${encodeURIComponent(activeId)}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            aiPaused: nextPaused,
            reason: nextPaused ? 'Paused by staff in admin' : null,
          }),
        },
      )
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to update AI')
      toast.success(nextPaused ? 'AI paused' : 'AI resumed')
      await loadThread(activeId)
      await loadThreads()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update AI')
    } finally {
      setPausing(false)
    }
  }

  const handleSendReply = async () => {
    const body = reply.trim()
    if (!activeId || !body) return
    setSending(true)
    try {
      const res = await fetch(
        `/api/admin/whatsapp/${encodeURIComponent(activeId)}/reply`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: body }),
        },
      )
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to send')
      setReply('')
      toast.success('Sent on WhatsApp (AI paused)')
      await loadThread(activeId)
      await loadThreads()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to send')
    } finally {
      setSending(false)
    }
  }

  const handleSendPaymentLink = async () => {
    if (!activeId) return
    setSendingLink(true)
    try {
      const res = await fetch(
        `/api/admin/whatsapp/${encodeURIComponent(activeId)}/payment-link`,
        { method: 'POST' },
      )
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to send payment link')
      toast.success('Paystack link sent')
      await loadThread(activeId)
      await loadThreads()
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to send payment link',
      )
    } finally {
      setSendingLink(false)
    }
  }

  return (
    <div className="space-y-5">
      <AdminPageHeader
        title="WhatsApp"
        description="Monitor live agent chats, pause the AI, and reply as Gelos."
      >
        <Button
          variant="outline"
          size="sm"
          className="h-9 gap-2"
          onClick={() => loadThreads()}
          disabled={loadingThreads}
        >
          {loadingThreads ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          Refresh
        </Button>
      </AdminPageHeader>

      <div className="grid h-[min(72vh,calc(100dvh-11rem))] grid-cols-1 gap-4 lg:grid-cols-[360px_1fr]">
        <div className="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-white">
          <div className="shrink-0 border-b border-neutral-200 p-3">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search chats"
                className="h-9 pl-9"
              />
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto">
            {loadingThreads ? (
              <div className="p-4 text-sm text-neutral-500">Loading chats…</div>
            ) : filteredThreads.length === 0 ? (
              <div className="p-6 text-sm text-neutral-500">No WhatsApp chats yet.</div>
            ) : (
              <div className="divide-y divide-neutral-100">
                {filteredThreads.map((thread) => {
                  const active = thread.whatsappId === activeId
                  return (
                    <button
                      key={thread.whatsappId}
                      type="button"
                      onClick={() => setActiveId(thread.whatsappId)}
                      className={cn(
                        'w-full p-4 text-left transition-colors',
                        active ? 'bg-neutral-50' : 'hover:bg-neutral-50/70',
                      )}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-neutral-950">
                            {threadLabel(thread)}
                          </p>
                          <p className="truncate text-xs text-neutral-500">
                            {thread.lastMessagePreview}
                          </p>
                        </div>
                        <p className="shrink-0 text-xs text-neutral-400">
                          {formatTime(thread.lastMessageAt)}
                        </p>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {thread.aiPaused ? (
                          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-800">
                            AI paused
                          </span>
                        ) : (
                          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-medium text-emerald-800">
                            AI on
                          </span>
                        )}
                        {thread.openHandoffs > 0 ? (
                          <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[11px] font-medium text-rose-800">
                            Handoff
                          </span>
                        ) : null}
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        <div className="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-white">
          {!activeSummary ? (
            <div className="flex h-full items-center">
              <Empty className="mx-auto max-w-xl border-0">
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <MessageCircle className="h-6 w-6" />
                  </EmptyMedia>
                  <EmptyTitle>No chat selected</EmptyTitle>
                  <EmptyDescription>
                    Select a WhatsApp conversation to view the transcript and reply.
                  </EmptyDescription>
                </EmptyHeader>
                <EmptyContent />
              </Empty>
            </div>
          ) : (
            <>
              <div className="shrink-0 border-b border-neutral-200 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-lg font-bold text-neutral-950">
                      {threadLabel(activeSummary)}
                    </p>
                    <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-neutral-600">
                      <span className="inline-flex items-center gap-1">
                        <Phone className="h-4 w-4 text-neutral-400" />
                        +{activeSummary.whatsappId}
                      </span>
                      {detail?.customer.aiPausedReason ? (
                        <span className="text-xs text-amber-700">
                          {detail.customer.aiPausedReason}
                        </span>
                      ) : null}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-9 gap-2"
                      disabled={sendingLink || !detail}
                      onClick={handleSendPaymentLink}
                    >
                      {sendingLink ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                      Paystack link
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-9 gap-2"
                      disabled={pausing || !detail}
                      onClick={handleTogglePause}
                    >
                      {pausing ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : detail?.customer.aiPaused ? (
                        <Play className="h-4 w-4" />
                      ) : (
                        <Pause className="h-4 w-4" />
                      )}
                      {detail?.customer.aiPaused ? 'Resume AI' : 'Pause AI'}
                    </Button>
                  </div>
                </div>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto">
                <div className="space-y-3 p-4">
                  {loadingThread ? (
                    <div className="text-sm text-neutral-500">Loading thread…</div>
                  ) : !detail || detail.messages.length === 0 ? (
                    <div className="text-sm text-neutral-500">No messages yet.</div>
                  ) : (
                    detail.messages.map((msg) => {
                      const outgoing = msg.role !== 'user'
                      return (
                        <div
                          key={msg.id}
                          className={cn(
                            'flex',
                            outgoing ? 'justify-end' : 'justify-start',
                          )}
                        >
                          <div
                            className={cn(
                              'max-w-[min(560px,90%)] rounded-2xl px-4 py-3 text-sm leading-relaxed',
                              outgoing
                                ? msg.role === 'staff'
                                  ? 'bg-sky-700 text-white'
                                  : 'bg-neutral-950 text-white'
                                : 'bg-neutral-100 text-neutral-900',
                            )}
                          >
                            {msg.role === 'staff' ? (
                              <p className="mb-1 text-[11px] font-medium text-white/80">
                                Staff
                              </p>
                            ) : msg.role === 'assistant' ? (
                              <p className="mb-1 text-[11px] font-medium text-white/80">
                                AI
                              </p>
                            ) : null}
                            <p className="whitespace-pre-wrap">{msg.content}</p>
                            <p
                              className={cn(
                                'mt-2 text-[11px]',
                                outgoing ? 'text-white/70' : 'text-neutral-500',
                              )}
                            >
                              {formatTime(msg.createdAt)}
                            </p>
                          </div>
                        </div>
                      )
                    })
                  )}

                  {detail?.cart && detail.cart.items.length > 0 ? (
                    <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-3 text-xs text-neutral-700">
                      <p className="font-semibold text-neutral-900">Cart draft</p>
                      <ul className="mt-1 space-y-1">
                        {detail.cart.items.map((item, i) => (
                          <li key={`${item.product_name}-${i}`}>
                            {item.quantity}× {item.product_name}
                            {item.variant ? ` (${item.variant})` : ''}
                          </li>
                        ))}
                      </ul>
                      {detail.cart.delivery_area ? (
                        <p className="mt-2">Area: {detail.cart.delivery_area}</p>
                      ) : null}
                      {detail.cart.payment_method ? (
                        <p>Payment: {detail.cart.payment_method}</p>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="shrink-0 border-t border-neutral-200 bg-white p-4">
                <div className="flex gap-3">
                  <Textarea
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                    placeholder="Reply as Gelos on WhatsApp…"
                    className="min-h-[44px] flex-1 resize-none"
                  />
                  <Button
                    type="button"
                    className="h-[44px] gap-2 bg-neutral-950 hover:bg-neutral-800"
                    disabled={sending || !reply.trim()}
                    onClick={handleSendReply}
                  >
                    {sending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                    Send
                  </Button>
                </div>
                <p className="mt-2 text-xs text-neutral-500">
                  Sending a reply pauses the AI so it won’t interrupt your conversation.
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
