import Link from 'next/link'

export function GelosAiMessageContent({ content }: { content: string }) {
  const parts = content.split(/(\[[^\]]+\]\([^)]+\)|https?:\/\/[^\s]+)/g)

  return (
    <>
      {parts.map((part, index) => {
        const markdownLink = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/)
        if (markdownLink) {
          const [, label, href] = markdownLink
          const isInternal = href.startsWith('/')
          if (isInternal) {
            return (
              <Link
                key={index}
                href={href}
                className="font-medium text-[#4F6CF7] underline underline-offset-2 hover:text-[#3b57e8]"
              >
                {label}
              </Link>
            )
          }
          return (
            <a
              key={index}
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
              key={index}
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
          <span key={index}>
            {boldParts.map((segment, i) => {
              const bold = segment.match(/^\*\*([^*]+)\*\*$/)
              if (bold) {
                return (
                  <strong key={i} className="font-semibold text-foreground">
                    {bold[1]}
                  </strong>
                )
              }
              return segment
            })}
          </span>
        )
      })}
    </>
  )
}
