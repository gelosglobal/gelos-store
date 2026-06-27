'use client'

import { Loader2, Send } from 'lucide-react'
import { useEffect, useRef, useState, type FormEvent } from 'react'
import {
  GelosAiMessageContent,
  GelosAiProductLinks,
} from '@/components/gelos-ai/message-content'
import { GelosAiProductRecommendationCards } from '@/components/gelos-ai/product-recommendation-cards'
import { Button } from '@/components/ui/button'
import { extractProductLinks } from '@/lib/gelos-ai/chat-reply'
import { cn } from '@/lib/utils'
import { loadChatMessages, saveChatMessages } from '@/lib/gelos-ai/session-storage'
import type { GelosAiMessage } from '@/lib/gelos-ai/types'
import { CHAT_WELCOME_MESSAGE } from '@/lib/gelos-ai/welcome-message'

const STARTER_PROMPTS = [
  'I am new to Gelos — where should I start?',
  'I want whiter teeth — what actually works?',
  'Compare watermelon vs coconut toothpaste',
  'Build me a morning and night oral care routine',
  'What mouthwash pairs best with flavored toothpaste?',
  'Any bundles or promos worth using today?',
] as const

const WELCOME_MESSAGE = CHAT_WELCOME_MESSAGE

type AiChatPanelProps = {
  className?: string
  compact?: boolean
  fullPage?: boolean
  variant?: 'default' | 'wellness'
}

export function AiChatPanel({
  className,
  compact = false,
  fullPage = false,
  variant = 'default',
}: AiChatPanelProps) {
  const isWellness = variant === 'wellness'
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<GelosAiMessage[]>([WELCOME_MESSAGE])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hydrated, setHydrated] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const hasConversation =
    messages.length > 1 ||
    (messages.length === 1 && messages[0] !== WELCOME_MESSAGE)

  const showStarters =
    !isWellness &&
    messages.length === 1 &&
    messages[0] === WELCOME_MESSAGE &&
    !isLoading

  useEffect(() => {
    const saved = loadChatMessages()
    if (saved?.length) setMessages(saved)
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (!hydrated) return
    saveChatMessages(messages)
  }, [hydrated, messages])

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    el.scrollTop = el.scrollHeight
  }, [messages, isLoading])

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
    <div
      className={cn(
        'flex flex-col overflow-hidden',
        isWellness
          ? 'min-h-0 rounded-2xl border border-neutral-200 bg-white shadow-lg'
          : 'rounded-2xl border border-neutral-200 bg-white shadow-sm',
        fullPage && !isWellness && 'h-[min(72vh,52rem)]',
        fullPage && isWellness && 'h-[min(34vh,16rem)] sm:h-[min(36vh,17.5rem)]',
        className,
      )}
    >
      <div
        ref={scrollRef}
        className={cn(
          'flex flex-col overflow-y-auto',
          isWellness
            ? 'gap-2.5 px-3 py-3 sm:px-5 sm:py-4'
            : 'gap-3 px-4 py-4 sm:px-6 sm:py-5',
          fullPage || isWellness
            ? 'min-h-0 flex-1'
            : compact
              ? 'max-h-[28rem]'
              : 'min-h-[22rem] max-h-[32rem]',
        )}
      >
        {isWellness && !hasConversation ? (
          <p className="text-sm text-neutral-500">
            Ask about products, flavors, whitening, bundles, or your smile routine…
          </p>
        ) : null}

        {messages.map((message, index) => {
            const isUser = message.role === 'user'
            if (isWellness && message === WELCOME_MESSAGE) return null
            if (isWellness && !hasConversation) return null

            const productLinks =
              !isUser && isWellness ? extractProductLinks(message.content) : []
            const showProductCards = productLinks.length > 0

            return (
              <div
                key={`${message.role}-${index}`}
                className={cn(
                  'flex w-full max-w-full flex-col',
                  isUser ? 'items-end' : 'items-start',
                )}
              >
                <div
                  className={cn(
                    'max-w-[88%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed',
                    isUser
                      ? 'bg-neutral-900 text-white'
                      : 'bg-neutral-50 text-foreground',
                  )}
                >
                  <GelosAiMessageContent
                    content={message.content}
                    hideProductLinks={showProductCards}
                  />
                  {!isUser && !isWellness ? (
                    <GelosAiProductLinks content={message.content} />
                  ) : null}
                </div>
                {!isUser && isWellness ? (
                  <GelosAiProductRecommendationCards
                    content={message.content}
                    className="mt-2 max-w-full px-0.5"
                  />
                ) : null}
              </div>
            )
          })}

        {isLoading && (
          <div className="flex justify-start">
            <div
              className={cn(
                'inline-flex items-center gap-2 rounded-2xl px-3.5 py-2.5 text-sm',
                'bg-neutral-50 text-muted-foreground',
              )}
            >
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

      {error ? (
        <p
          className={cn(
            'px-4 py-2 text-xs',
            isWellness ? 'text-red-600' : 'border-t border-neutral-100 text-red-600',
          )}
        >
          {error}
        </p>
      ) : null}

      <form
        onSubmit={onSubmit}
        className={cn(
          'flex items-end gap-3 p-3 sm:px-5',
          isWellness ? '' : 'border-t border-neutral-100 p-3',
        )}
      >
        {isWellness ? (
          <div className="flex min-w-0 flex-1 items-end gap-2">
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
              placeholder="Tell us what you need help with…"
              className="max-h-24 min-h-10 flex-1 resize-none rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2.5 text-sm text-foreground outline-none transition-colors placeholder:text-neutral-400 focus:border-neutral-300 focus:bg-white"
              disabled={isLoading}
            />
            <Button
              type="submit"
              size="icon"
              disabled={!input.trim() || isLoading}
              className="size-10 shrink-0 rounded-xl bg-[#84CC16] text-neutral-950 hover:bg-[#73b512]"
              aria-label="Send message"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <>
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
          </>
        )}
      </form>
    </div>
  )
}
