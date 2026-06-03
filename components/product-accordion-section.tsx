'use client'

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Minus, Plus } from 'lucide-react'
import type { ProductAccordionItem } from '@/lib/toothpaste-product-content'
import { cn } from '@/lib/utils'

type ProductAccordionSectionProps = {
  items: ProductAccordionItem[]
  type?: 'single' | 'multiple'
  className?: string
  /** Larger FAQ-style headings */
  variant?: 'default' | 'faq'
}

export function ProductAccordionSection({
  items,
  type = 'single',
  className,
  variant = 'default',
}: ProductAccordionSectionProps) {
  return (
    <Accordion
      type={type}
      collapsible={type === 'single'}
      className={cn('w-full', className)}
    >
      {items.map((item) => (
        <AccordionItem
          key={item.id}
          value={item.id}
          className="group border-neutral-200"
        >
          <AccordionTrigger
            className={cn(
              'py-4 hover:no-underline [&>svg:last-child]:hidden',
              variant === 'faq'
                ? 'text-base font-semibold text-neutral-950 sm:text-lg'
                : 'text-sm font-medium text-neutral-800',
            )}
          >
            <span className="pr-4 text-left">{item.title}</span>
            <span className="relative ml-auto flex h-5 w-5 shrink-0 items-center justify-center text-neutral-950">
              <Plus className="absolute h-4 w-4 transition-opacity group-data-[state=open]:opacity-0" />
              <Minus className="absolute h-4 w-4 opacity-0 transition-opacity group-data-[state=open]:opacity-100" />
            </span>
          </AccordionTrigger>
          <AccordionContent className="text-sm leading-relaxed text-neutral-600">
            {item.content}
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  )
}
