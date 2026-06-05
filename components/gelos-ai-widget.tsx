'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ExternalLink, Loader2, Send, Sparkles, X } from 'lucide-react'
import { useEffect, useRef, useState, type FormEvent } from 'react'
import {
  GelosAiMessageContent,
  GelosAiProductLinks,
} from '@/components/gelos-ai/message-content'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { GelosAiMessage } from '@/lib/gelos-ai/types'

const STARTER_PROMPTS = [
  'Which toothpaste flavor should I try first?',
  'I want whiter teeth — what do you recommend?',
  'What is the V34 Shade Correction Kit?',
  'Help me build a complete oral care routine',
] as const

const WELCOME_MESSAGE: GelosAiMessage = {
  role: 'assistant',
  content:
    "Hi, I'm **Gelos AI** — your smile care guide. Ask me about flavors, whitening, mouthwash, bundles, or finding the right product for your routine.",
}

export function GelosAiWidget() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<GelosAiMessage[]>([WELCOME_MESSAGE])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const isAdmin = pathname.startsWith('/admin')
  const isAiPage = pathname.startsWith('/ai')
  const showStarters =
    messages.length === 1 && messages[0] === WELCOME_MESSAGE && !isLoading

  useEffect(() => {
    if (open) {
      inputRef.current?.focus()
    }
  }, [open])

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    el.scrollTop = el.scrollHeight
  }, [messages, isLoading, open])

  if (isAdmin || isAiPage) return null

  const sendMessage = async (text: string) => {
    const trimmed = text.trim()
    if (!trimmed || isLoading) return

    setError(null)
    const userMessage: GelosAiMessage = { role: 'user', content: trimmed }
    const nextMessages = [...messages, userMessage]
    setMessages(nextMessages)
    setInput('')
    setIsLoading(true)

    try {
      const history = nextMessages.filter((m) => m !== WELCOME_MESSAGE)
      const res = await fetch('/api/gelos-ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history }),
      })
      const data = (await res.json()) as {
        message?: GelosAiMessage
        error?: string
      }

      if (!res.ok || !data.message) {
        throw new Error(data.error ?? 'Gelos AI could not respond.')
      }

      setMessages((prev) => [...prev, data.message!])
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Something went wrong. Please try again.'
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    void sendMessage(input)
  }

  return (
    <>
      <div
        className={cn(
          'fixed bottom-5 right-4 z-[60] flex flex-col items-end gap-3 sm:right-6',
          open && 'pointer-events-none sm:pointer-events-auto',
        )}
      >
        <div
          className={cn(
            'pointer-events-auto flex w-[min(100vw-2rem,24rem)] flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-2xl transition-all duration-300 sm:w-[24rem]',
            open
              ? 'translate-y-0 opacity-100'
              : 'pointer-events-none translate-y-4 opacity-0',
          )}
          aria-hidden={!open}
        >
          <div className="flex items-center justify-between border-b border-neutral-100 bg-neutral-950 px-4 py-3 text-white">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#84CC16] text-neutral-950">
                <Sparkles className="h-4 w-4" strokeWidth={2.25} />
              </div>
              <div>
                <p className="text-sm font-semibold tracking-wide">Gelos AI</p>
                <p className="text-xs text-neutral-400">Your smile care guide</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Link
                href="/ai"
                onClick={() => setOpen(false)}
                className="rounded-lg p-1.5 text-neutral-300 transition-colors hover:bg-white/10 hover:text-white"
                aria-label="Open Gelos AI platform"
              >
                <ExternalLink className="h-4 w-4" />
              </Link>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg p-1.5 text-neutral-300 transition-colors hover:bg-white/10 hover:text-white"
                aria-label="Close Gelos AI"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div
            ref={scrollRef}
            className="flex max-h-[min(60vh,28rem)] flex-col gap-3 overflow-y-auto px-4 py-4"
          >
            {messages.map((message, index) => {
              const isUser = message.role === 'user'
              return (
                <div
                  key={`${message.role}-${index}`}
                  className={cn('flex', isUser ? 'justify-end' : 'justify-start')}
                >
                  <div
                    className={cn(
                      'max-w-[88%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed',
                      isUser
                        ? 'bg-neutral-900 text-white'
                        : 'bg-neutral-50 text-foreground',
                    )}
                  >
                    <GelosAiMessageContent content={message.content} />
                    {!isUser && <GelosAiProductLinks content={message.content} />}
                  </div>
                </div>
              )
            })}

            {isLoading && (
              <div className="flex justify-start">
                <div className="inline-flex items-center gap-2 rounded-2xl bg-neutral-50 px-3.5 py-2.5 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Thinking…
                </div>
              </div>
            )}
          </div>

          {showStarters && (
            <div className="flex flex-wrap gap-2 border-t border-neutral-100 px-4 py-3">
              {STARTER_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => void sendMessage(prompt)}
                  className="rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-left text-xs font-medium text-foreground transition-colors hover:border-[#84CC16] hover:bg-[#84CC16]/10"
                >
                  {prompt}
                </button>
              ))}
            </div>
          )}

          {error && (
            <p className="border-t border-neutral-100 px-4 py-2 text-xs text-red-600">
              {error}
            </p>
          )}

          <form
            onSubmit={onSubmit}
            className="flex items-end gap-2 border-t border-neutral-100 p-3"
          >
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  void sendMessage(input)
                }
              }}
              rows={1}
              placeholder="Ask about products, flavors, whitening…"
              className="max-h-24 min-h-10 flex-1 resize-none rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2.5 text-sm outline-none transition-colors placeholder:text-neutral-400 focus:border-neutral-300 focus:bg-white"
              disabled={isLoading}
            />
            <Button
              type="submit"
              size="icon"
              disabled={!input.trim() || isLoading}
              className="h-10 w-10 shrink-0 rounded-xl bg-[#84CC16] text-neutral-950 hover:bg-[#73b512]"
              aria-label="Send message"
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>

        {open ? (
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="pointer-events-auto flex items-center gap-2 rounded-full bg-neutral-950 px-4 py-3 text-sm font-semibold text-white shadow-xl transition-all hover:bg-neutral-800"
            aria-expanded={open}
            aria-label="Close Gelos AI"
          >
            <X className="h-5 w-5" />
          </button>
        ) : (
          <Link
            href="/ai"
            className="pointer-events-auto group flex items-center gap-2 rounded-full bg-neutral-950 px-4 py-3 text-sm font-semibold text-white shadow-xl transition-all hover:bg-neutral-800"
            aria-label="Open Gelos AI platform"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#84CC16] text-neutral-950">
              <Sparkles className="h-4 w-4" strokeWidth={2.25} />
            </span>
            <span className="hidden sm:inline">Gelos AI</span>
            <Image
              src="/gelos/gelos-logo.png"
              alt=""
              width={56}
              height={14}
              className="hidden h-3.5 w-auto opacity-80 sm:block"
              aria-hidden
            />
          </Link>
        )}
      </div>
    </>
  )
}
