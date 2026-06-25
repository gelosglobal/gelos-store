import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft, CalendarCheck, Mail, ShieldCheck } from 'lucide-react'
import { BookDentistPanel } from '@/components/gelos-ai/book-dentist-panel'
import { SiteFooter } from '@/components/site-footer'

export const metadata: Metadata = {
  title: 'Book a Dentist | Gelos',
  description:
    "Request an appointment with Mark's Dental Clinic in Ridge, Accra through Gelos.",
}

const bookingSteps = [
  { step: '1', label: 'Choose a slot' },
  { step: '2', label: 'Share your details' },
  { step: '3', label: 'Get confirmation' },
] as const

const trustPoints = [
  { icon: CalendarCheck, label: 'Free appointment request' },
  { icon: Mail, label: 'Email confirmation sent' },
  { icon: ShieldCheck, label: 'Trusted Gelos partner' },
] as const

export default function BookDentistPage() {
  return (
    <div className="min-h-screen bg-white text-foreground">
      <section className="border-b border-neutral-100 bg-[radial-gradient(ellipse_at_top,#f0fdf4_0%,#ffffff_60%)]">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 md:py-12">
          <Link
            href="/ai"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-neutral-500 transition-colors hover:text-neutral-950"
          >
            <ArrowLeft className="size-4" />
            Gelos AI
          </Link>

          <div className="mt-6 flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <span className="inline-flex items-center gap-2 rounded-full border border-[#BBF7D0] bg-[#F0FDF4] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#15803D]">
                <span className="size-1.5 rounded-full bg-[#84CC16]" aria-hidden />
                Partner clinic · Ridge, Accra
              </span>
              <h1 className="mt-4 text-3xl font-bold tracking-tight text-neutral-950 sm:text-4xl lg:text-[2.75rem] lg:leading-[1.08]">
                Book a dentist near you
              </h1>
              <p className="mt-3 max-w-xl text-base leading-relaxed text-neutral-600 sm:text-lg">
                Request a visit with Mark&apos;s Dental Clinic — a Gelos partner for
                check-ups, whitening consults, sensitivity, and everyday smile care.
              </p>
            </div>

            <ol className="flex flex-wrap gap-2 sm:gap-3 lg:max-w-md lg:justify-end">
              {bookingSteps.map(({ step, label }) => (
                <li
                  key={step}
                  className="flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-3 py-2 text-xs font-medium text-neutral-700 shadow-sm sm:text-sm"
                >
                  <span className="flex size-6 items-center justify-center rounded-full bg-[#84CC16] text-[11px] font-bold text-neutral-950">
                    {step}
                  </span>
                  {label}
                </li>
              ))}
            </ol>
          </div>

          <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-3 border-t border-neutral-100 pt-6">
            {trustPoints.map(({ icon: Icon, label }) => (
              <li
                key={label}
                className="flex items-center gap-2 text-sm text-neutral-600"
              >
                <Icon className="size-4 shrink-0 text-[#84CC16]" aria-hidden />
                {label}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 md:py-14">
        <BookDentistPanel />
      </section>

      <SiteFooter />
    </div>
  )
}
