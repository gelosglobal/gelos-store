import Link from 'next/link'
import type { LegalSection } from '@/lib/legal-content'

type LegalPageLayoutProps = {
  title: string
  description: string
  lastUpdated: string
  sections: LegalSection[]
  otherPage?: { label: string; href: string }
}

export function LegalPageLayout({
  title,
  description,
  lastUpdated,
  sections,
  otherPage,
}: LegalPageLayoutProps) {
  return (
    <div className="min-h-screen bg-neutral-50 text-foreground">
      <section className="border-b border-neutral-200 bg-[radial-gradient(ellipse_at_top,#f7fbfe_0%,#ffffff_100%)] py-12 md:py-16">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-neutral-500">
            Legal
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-neutral-950 sm:text-4xl">
            {title}
          </h1>
          <p className="mt-3 text-sm text-neutral-600 sm:text-base">{description}</p>
          <p className="mt-2 text-xs text-neutral-500">Last updated: {lastUpdated}</p>
        </div>
      </section>

      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
        <article className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm sm:p-8">
          <nav aria-label="Table of contents" className="mb-8 rounded-xl bg-neutral-50 p-4 ring-1 ring-neutral-200">
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-neutral-500">
              On this page
            </p>
            <ol className="mt-2 space-y-1.5 text-sm">
              {sections.map((section) => (
                <li key={section.id}>
                  <a
                    href={`#${section.id}`}
                    className="text-neutral-700 underline-offset-4 hover:text-neutral-950 hover:underline"
                  >
                    {section.title}
                  </a>
                </li>
              ))}
            </ol>
          </nav>

          <div className="space-y-8">
            {sections.map((section) => (
              <section key={section.id} id={section.id} className="scroll-mt-24">
                <h2 className="text-base font-bold text-neutral-950 sm:text-lg">
                  {section.title}
                </h2>
                <div className="mt-3 space-y-3">
                  {section.paragraphs.map((paragraph) => (
                    <p key={paragraph} className="text-sm leading-relaxed text-neutral-600">
                      {paragraph}
                    </p>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </article>

        <div className="mt-8 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-neutral-600">
          {otherPage ? (
            <Link
              href={otherPage.href}
              className="font-semibold text-neutral-950 underline-offset-4 hover:underline"
            >
              {otherPage.label}
            </Link>
          ) : null}
          <Link
            href="/contact"
            className="font-semibold text-neutral-950 underline-offset-4 hover:underline"
          >
            Contact support
          </Link>
        </div>
      </div>
    </div>
  )
}
