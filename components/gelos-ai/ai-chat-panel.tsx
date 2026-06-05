'use client'

import { Loader2, Send } from 'lucide-react'
import { useEffect, useRef, useState, type FormEvent } from 'react'
import {
  GelosAiMessageContent,
  GelosAiProductLinks,
} from '@/components/gelos-ai/message-content'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { loadChatMessages, saveChatMessages } from '@/lib/gelos-ai/session-storage'
import type { GelosAiMessage } from '@/lib/gelos-ai/types'

const STARTER_PROMPTS = [
  'I am new to Gelos — where should I start?',
  'I want whiter teeth — what actually works?',
  'Compare watermelon vs coconut toothpaste',
  'Build me a morning and night oral care routine',
  'What mouthwash pairs best with flavored toothpaste?',
  'Any bundles or promos worth using today?',
] as const

const WELCOME_MESSAGE: GelosAiMessage = {
  role: 'assistant',
  content:
    "Hi, I'm **Gelos AI** — your Gelos product expert.\n\nAsk me to compare flavors, pick whitening products, build a daily routine, or find the best value. I'll recommend real products with prices and links.",
}

type AiChatPanelProps = {
  className?: string
  compact?: boolean
}

export function AiChatPanel({ className, compact = false }: AiChatPanelProps) {
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<GelosAiMessage[]>([WELCOME_MESSAGE])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hydrated, setHydrated] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const showStarters =
    messages.length === 1 && messages[0] === WELCOME_MESSAGE && !isLoading

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
        'flex flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm',
        className,
      )}
    >
      <div
        ref={scrollRef}
        className={cn(
          'flex flex-col gap-3 overflow-y-auto px-4 py-4',
          compact ? 'max-h-[28rem]' : 'min-h-[22rem] max-h-[32rem]',
        )}
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
  )
}
