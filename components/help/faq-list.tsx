'use client'

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import type { FaqItem } from '@/lib/help-content'

export function FaqList({ items }: { items: FaqItem[] }) {
  return (
    <Accordion type="single" collapsible className="rounded-2xl border border-neutral-200 bg-white px-5 shadow-sm sm:px-6">
      {items.map((item) => (
        <AccordionItem key={item.id} value={item.id}>
          <AccordionTrigger className="text-left text-sm font-semibold text-neutral-950 hover:no-underline sm:text-base">
            {item.question}
          </AccordionTrigger>
          <AccordionContent className="text-sm leading-relaxed text-neutral-600">
            {item.answer}
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  )
}
