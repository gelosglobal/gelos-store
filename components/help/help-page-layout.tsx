import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { helpTopics } from '@/lib/help-content'
import { cn } from '@/lib/utils'

type HelpPageLayoutProps = {
  eyebrow?: string
  title: string
  description: string
  currentHref: string
  children: React.ReactNode
}

export function HelpPageLayout({
  eyebrow = 'Help',
  title,
  description,
  currentHref,
  children,
}: HelpPageLayoutProps) {
  const otherTopics = helpTopics.filter((topic) => topic.href !== currentHref)

  return (
    <div className="min-h-screen bg-neutral-50 text-foreground">
      <section className="border-b border-neutral-200 bg-[radial-gradient(ellipse_at_top,#f7fbfe_0%,#ffffff_100%)] py-12 md:py-16">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-neutral-500">
            {eyebrow}
          </p>
          <h1 className="mt-2 max-w-2xl text-3xl font-bold tracking-tight text-neutral-950 sm:text-4xl">
            {title}
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-neutral-600 sm:text-base">
            {description}
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_240px] lg:gap-12">
          <div className="min-w-0">{children}</div>

          <aside className="lg:pt-1">
            <h2 className="text-[11px] font-bold uppercase tracking-[0.14em] text-neutral-500">
              More help
            </h2>
            <ul className="mt-3 space-y-2">
              {otherTopics.map((topic) => (
                <li key={topic.href}>
                  <Link
                    href={topic.href}
                    className={cn(
                      'block rounded-xl border border-neutral-200 bg-white px-3.5 py-3 text-sm transition-colors',
                      'hover:border-neutral-300 hover:bg-neutral-50',
                    )}
                  >
                    <span className="font-semibold text-neutral-950">{topic.label}</span>
                    <span className="mt-0.5 block text-xs leading-snug text-neutral-500">
                      {topic.description}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </aside>
        </div>

        <div className="mt-10 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm sm:p-8">
          <h2 className="text-lg font-bold text-neutral-950">Still need help?</h2>
          <p className="mt-2 max-w-xl text-sm text-neutral-600">
            Our team is happy to assist with orders, products, and delivery questions.
          </p>
          <Link
            href="/contact"
            className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-neutral-950 underline-offset-4 hover:underline"
          >
            Contact Gelos support
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  )
}
