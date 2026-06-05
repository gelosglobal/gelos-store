import Link from 'next/link'
import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

function renderInline(text: string, keyPrefix: string) {
  const parts = text.split(/(\[[^\]]+\]\([^)]+\)|https?:\/\/[^\s]+)/g)

  return parts.map((part, index) => {
    const markdownLink = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/)
    if (markdownLink) {
      const [, label, href] = markdownLink
      const isInternal = href.startsWith('/')
      if (isInternal) {
        return (
          <Link
            key={`${keyPrefix}-link-${index}`}
            href={href}
            className="font-medium text-[#4F6CF7] underline underline-offset-2 hover:text-[#3b57e8]"
          >
            {label}
          </Link>
        )
      }
      return (
        <a
          key={`${keyPrefix}-link-${index}`}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-[#4F6CF7] underline underline-offset-2 hover:text-[#3b57e8]"
        >
          {label}
        </a>
      )
    }

    if (/^https?:\/\//.test(part)) {
      return (
        <a
          key={`${keyPrefix}-url-${index}`}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          className="break-all font-medium text-[#4F6CF7] underline underline-offset-2"
        >
          {part}
        </a>
      )
    }

    const boldParts = part.split(/(\*\*[^*]+\*\*)/g)
    return (
      <span key={`${keyPrefix}-text-${index}`}>
        {boldParts.map((segment, i) => {
          const bold = segment.match(/^\*\*([^*]+)\*\*$/)
          if (bold) {
            return (
              <strong key={`${keyPrefix}-bold-${i}`} className="font-semibold text-foreground">
                {bold[1]}
              </strong>
            )
          }
          return segment
        })}
      </span>
    )
  })
}

function renderBlock(text: string, key: string) {
  const bulletMatch = text.match(/^[-•]\s+(.+)$/)
  if (bulletMatch) {
    return (
      <li key={key} className="ml-4 list-disc pl-1">
        {renderInline(bulletMatch[1], key)}
      </li>
    )
  }

  const numberedMatch = text.match(/^\d+\.\s+(.+)$/)
  if (numberedMatch) {
    return (
      <li key={key} className="ml-4 list-decimal pl-1">
        {renderInline(numberedMatch[1], key)}
      </li>
    )
  }

  return (
    <p key={key} className={text ? undefined : 'min-h-[1em]'}>
      {renderInline(text, key)}
    </p>
  )
}

export function GelosAiMessageContent({ content }: { content: string }) {
  const blocks = content.split('\n')
  const elements: ReactNode[] = []
  let listItems: ReactNode[] = []
  let listType: 'ul' | 'ol' | null = null

  const flushList = () => {
    if (!listItems.length || !listType) return
    elements.push(
      listType === 'ol' ? (
        <ol key={`list-${elements.length}`} className="my-1.5 space-y-1">
          {listItems}
        </ol>
      ) : (
        <ul key={`list-${elements.length}`} className="my-1.5 space-y-1">
          {listItems}
        </ul>
      ),
    )
    listItems = []
    listType = null
  }

  blocks.forEach((block, index) => {
    const trimmed = block.trim()
    const isBullet = /^[-•]\s+/.test(trimmed)
    const isNumbered = /^\d+\.\s+/.test(trimmed)

    if (isBullet || isNumbered) {
      const nextType = isNumbered ? 'ol' : 'ul'
      if (listType && listType !== nextType) flushList()
      listType = nextType
      listItems.push(renderBlock(trimmed, `block-${index}`))
      return
    }

    flushList()
    elements.push(renderBlock(trimmed, `block-${index}`))
  })

  flushList()

  return <div className="space-y-1.5">{elements}</div>
}

export function GelosAiProductLinks({
  content,
  className,
}: {
  content: string
  className?: string
}) {
  const links = [...content.matchAll(/\[([^\]]+)\]\((\/product\/[^)]+)\)/g)]
    .map((match) => ({ name: match[1], href: match[2] }))
    .filter((link, index, arr) => arr.findIndex((item) => item.href === link.href) === index)
    .slice(0, 4)

  if (!links.length) return null

  return (
    <div className={cn('mt-2 flex flex-wrap gap-2', className)}>
      {links.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className="inline-flex items-center rounded-full border border-[#84CC16]/40 bg-[#84CC16]/10 px-3 py-1 text-xs font-medium text-foreground transition-colors hover:bg-[#84CC16]/20"
        >
          {link.name}
        </Link>
      ))}
    </div>
  )
}
