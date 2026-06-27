import type { HelpContentSection } from '@/lib/help-content'

export function HelpContentSections({ sections }: { sections: HelpContentSection[] }) {
  return (
    <div className="space-y-4">
      {sections.map((section) => (
        <section
          key={section.title}
          className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm sm:p-6"
        >
          <h2 className="text-base font-bold text-neutral-950 sm:text-lg">{section.title}</h2>
          <div className="mt-3 space-y-2">
            {section.body.map((paragraph) => (
              <p key={paragraph} className="text-sm leading-relaxed text-neutral-600">
                {paragraph}
              </p>
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}
