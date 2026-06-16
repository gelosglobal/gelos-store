'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Inbox,
  Loader2,
  Mail,
  Phone,
  Search,
  Send,
  User,
} from 'lucide-react'
import { toast } from 'sonner'
import { AdminPageHeader } from '@/components/admin/admin-page-header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Textarea } from '@/components/ui/textarea'
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { cn } from '@/lib/utils'

type InboxThreadSummary = {
  threadId: string
  customerName: string
  customerEmail: string
  customerPhone: string
  subject: string
  status: 'open' | 'closed'
  lastMessageAt: string
  createdAt: string
}

type InboxMessage = {
  messageId: string
  threadId: string
  direction: 'in' | 'out'
  body: string
  sentBy: string
  createdAt: string
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

export default function AdminInboxPage() {
  const [threads, setThreads] = useState<InboxThreadSummary[]>([])
  const [loadingThreads, setLoadingThreads] = useState(true)
  const [activeThreadId, setActiveThreadId] = useState<string>('')
  const [messages, setMessages] = useState<InboxMessage[]>([])
  const [loadingThread, setLoadingThread] = useState(false)
  const [search, setSearch] = useState('')
  const [reply, setReply] = useState('')
  const [sending, setSending] = useState(false)

  const loadThreads = useCallback(async () => {
    setLoadingThreads(true)
    try {
      const res = await fetch('/api/admin/inbox', { cache: 'no-store' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to load inbox')
      const nextThreads = (data.threads ?? []) as InboxThreadSummary[]
      setThreads(nextThreads)
      if (!activeThreadId && nextThreads.length > 0) {
        setActiveThreadId(nextThreads[0]!.threadId)
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to load inbox')
    } finally {
      setLoadingThreads(false)
    }
  }, [activeThreadId])

  const loadThread = useCallback(async (threadId: string) => {
    if (!threadId) return
    setLoadingThread(true)
    try {
      const res = await fetch(`/api/admin/inbox/${encodeURIComponent(threadId)}`, {
        cache: 'no-store',
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to load thread')
      setMessages((data.messages ?? []) as InboxMessage[])
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to load thread')
    } finally {
      setLoadingThread(false)
    }
  }, [])

  useEffect(() => {
    loadThreads()
  }, [loadThreads])

  useEffect(() => {
    if (activeThreadId) void loadThread(activeThreadId)
  }, [activeThreadId, loadThread])

  const filteredThreads = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return threads
    return threads.filter((t) => {
      return (
        t.customerName.toLowerCase().includes(q) ||
        t.customerEmail.toLowerCase().includes(q) ||
        t.customerPhone.includes(q) ||
        t.subject.toLowerCase().includes(q) ||
        t.threadId.toLowerCase().includes(q)
      )
    })
  }, [threads, search])

  const activeThread = useMemo(
    () => threads.find((t) => t.threadId === activeThreadId) ?? null,
    [threads, activeThreadId],
  )

  const handleSendReply = async () => {
    const body = reply.trim()
    if (!activeThreadId || !body) return
    setSending(true)
    try {
      const res = await fetch(`/api/admin/inbox/${encodeURIComponent(activeThreadId)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to send reply')

      setReply('')
      await loadThread(activeThreadId)
      await loadThreads()

      toast.success(data.emailed ? 'Reply sent' : 'Reply saved (email not sent)')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to send reply')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="space-y-5">
      <AdminPageHeader
        title="Inbox"
        description="Receive, view, and reply to customer messages from the storefront."
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
            <Inbox className="h-4 w-4" />
          )}
          Refresh
        </Button>
      </AdminPageHeader>

      <div className="grid min-h-[70vh] grid-cols-1 gap-4 lg:grid-cols-[360px_1fr]">
        <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white">
          <div className="border-b border-neutral-200 p-3">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search messages"
                className="h-9 pl-9"
              />
            </div>
          </div>

          <ScrollArea className="h-[calc(70vh-3.25rem)]">
            {loadingThreads ? (
              <div className="p-4 text-sm text-neutral-500">Loading inbox…</div>
            ) : filteredThreads.length === 0 ? (
              <div className="p-6 text-sm text-neutral-500">No messages yet.</div>
            ) : (
              <div className="divide-y divide-neutral-100">
                {filteredThreads.map((thread) => {
                  const active = thread.threadId === activeThreadId
                  return (
                    <button
                      key={thread.threadId}
                      type="button"
                      onClick={() => setActiveThreadId(thread.threadId)}
                      className={cn(
                        'w-full p-4 text-left transition-colors',
                        active ? 'bg-neutral-50' : 'hover:bg-neutral-50/70',
                      )}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-neutral-950">
                            {thread.customerName}
                          </p>
                          <p className="truncate text-xs text-neutral-500">
                            {thread.subject || thread.customerEmail}
                          </p>
                        </div>
                        <p className="shrink-0 text-xs text-neutral-400">
                          {formatTime(thread.lastMessageAt)}
                        </p>
                      </div>
                      <p className="mt-2 truncate text-xs text-neutral-500">
                        {thread.threadId}
                      </p>
                    </button>
                  )
                })}
              </div>
            )}
          </ScrollArea>
        </div>

        <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white">
          {!activeThread ? (
            <div className="flex h-full min-h-[70vh] items-center">
              <Empty className="mx-auto max-w-xl border-0">
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <Inbox className="h-6 w-6" />
                  </EmptyMedia>
                  <EmptyTitle>No thread selected</EmptyTitle>
                  <EmptyDescription>
                    Select a conversation on the left to view messages and reply.
                  </EmptyDescription>
                </EmptyHeader>
                <EmptyContent />
              </Empty>
            </div>
          ) : (
            <div className="flex h-[70vh] flex-col">
              <div className="border-b border-neutral-200 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-lg font-bold text-neutral-950">
                      {activeThread.customerName}
                    </p>
                    <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-neutral-600">
                      <span className="inline-flex items-center gap-1">
                        <Mail className="h-4 w-4 text-neutral-400" />
                        {activeThread.customerEmail}
                      </span>
                      {activeThread.customerPhone ? (
                        <span className="inline-flex items-center gap-1">
                          <Phone className="h-4 w-4 text-neutral-400" />
                          {activeThread.customerPhone}
                        </span>
                      ) : null}
                      <span className="inline-flex items-center gap-1">
                        <User className="h-4 w-4 text-neutral-400" />
                        {activeThread.threadId}
                      </span>
                    </div>
                    {activeThread.subject ? (
                      <p className="mt-2 text-sm text-neutral-500">
                        Subject: {activeThread.subject}
                      </p>
                    ) : null}
                  </div>
                </div>
              </div>

              <ScrollArea className="flex-1">
                <div className="space-y-3 p-4">
                  {loadingThread ? (
                    <div className="text-sm text-neutral-500">Loading thread…</div>
                  ) : messages.length === 0 ? (
                    <div className="text-sm text-neutral-500">No messages yet.</div>
                  ) : (
                    messages.map((msg) => {
                      const outgoing = msg.direction === 'out'
                      return (
                        <div
                          key={msg.messageId}
                          className={cn(
                            'flex',
                            outgoing ? 'justify-end' : 'justify-start',
                          )}
                        >
                          <div
                            className={cn(
                              'max-w-[min(560px,90%)] rounded-2xl px-4 py-3 text-sm leading-relaxed',
                              outgoing
                                ? 'bg-neutral-950 text-white'
                                : 'bg-neutral-100 text-neutral-900',
                            )}
                          >
                            <p className="whitespace-pre-wrap">{msg.body}</p>
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
                </div>
              </ScrollArea>

              <div className="border-t border-neutral-200 p-4">
                <div className="flex gap-3">
                  <Textarea
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                    placeholder="Write a reply…"
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
                  Replies are emailed to the customer via Resend (if configured) and saved to this thread.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

