'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  Check,
  CheckCircle2,
  Clock3,
  Hash,
  Link2,
  Loader2,
  Mail,
  Phone,
  Share2,
  Sparkles,
  User,
  Wallet,
} from 'lucide-react'
import { toast } from 'sonner'
import { SiteFooter } from '@/components/site-footer'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { Textarea } from '@/components/ui/textarea'
import {
  DEFAULT_AFFILIATE_COMMISSION_PERCENT,
  suggestAffiliateCodeFromName,
} from '@/lib/affiliate-registration'
import { normalizeAffiliateCode } from '@/lib/affiliates'
import { trackCompleteRegistration } from '@/lib/meta-pixel'
import { cn } from '@/lib/utils'

const STEPS = [
  { id: 'contact', title: 'About you', description: 'How we reach you' },
  { id: 'code', title: 'Your code', description: 'Pick a referral link' },
  { id: 'review', title: 'Review', description: 'Confirm & apply' },
] as const

type CodeCheckState = 'idle' | 'checking' | 'available' | 'taken' | 'invalid' | 'too_short'

const BENEFITS = [
  {
    icon: Wallet,
    title: `${DEFAULT_AFFILIATE_COMMISSION_PERCENT}% commission`,
    description: 'Earn on every order placed through your unique referral link.',
  },
  {
    icon: Share2,
    title: 'Share anywhere',
    description: 'Use your link on social, WhatsApp, email, or in your clinic.',
  },
  {
    icon: BarChart3,
    title: 'Partner dashboard',
    description: 'Track orders, revenue, and payouts in one place.',
  },
] as const

const FAQ_ITEMS = [
  {
    question: 'How long does approval take?',
    answer:
      'Most applications are reviewed within 2–3 business days. We email you as soon as your account is activated.',
  },
  {
    question: 'When do I get paid?',
    answer:
      'Commission accrues on referred orders. Payouts are handled by the Gelos team once your balance is ready.',
  },
  {
    question: 'Can I change my referral code later?',
    answer:
      'Codes are set at registration. Contact us if you need a change after approval.',
  },
] as const

function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delayMs)
    return () => window.clearTimeout(timer)
  }, [value, delayMs])

  return debounced
}

export default function AffiliateRegisterPage() {
  const [step, setStep] = useState(0)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [code, setCode] = useState('')
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submittedCode, setSubmittedCode] = useState<string | null>(null)
  const [codeCheck, setCodeCheck] = useState<CodeCheckState>('idle')

  const normalizedCode = useMemo(() => normalizeAffiliateCode(code), [code])
  const debouncedCode = useDebouncedValue(normalizedCode, 400)

  const progress = ((step + 1) / STEPS.length) * 100
  const referralPreview = useMemo(() => {
    if (typeof window === 'undefined' || !normalizedCode) return ''
    return `${window.location.origin}/?ref=${encodeURIComponent(normalizedCode)}`
  }, [normalizedCode])

  const suggestCode = useCallback(() => {
    const suggestion = suggestAffiliateCodeFromName(name)
    if (suggestion) setCode(suggestion)
  }, [name])

  useEffect(() => {
    if (!debouncedCode) {
      setCodeCheck('idle')
      return
    }

    if (debouncedCode.length < 3) {
      setCodeCheck('too_short')
      return
    }

    if (!/^[A-Z0-9_-]+$/.test(debouncedCode)) {
      setCodeCheck('invalid')
      return
    }

    let cancelled = false
    setCodeCheck('checking')

    void (async () => {
      try {
        const res = await fetch(
          `/api/store/affiliate/register?code=${encodeURIComponent(debouncedCode)}`,
          { cache: 'no-store' },
        )
        const data = (await res.json()) as {
          available?: boolean
          reason?: string
        }
        if (cancelled) return

        if (!res.ok) {
          setCodeCheck('invalid')
          return
        }

        if (data.available) setCodeCheck('available')
        else if (data.reason === 'taken') setCodeCheck('taken')
        else setCodeCheck('invalid')
      } catch {
        if (!cancelled) setCodeCheck('invalid')
      }
    })()

    return () => {
      cancelled = true
    }
  }, [debouncedCode])

  const canContinueStep0 =
    name.trim().length >= 2 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())

  const canContinueStep1 =
    normalizedCode.length >= 3 &&
    /^[A-Z0-9_-]+$/.test(normalizedCode) &&
    codeCheck === 'available'

  const goNext = () => {
    if (step === 0 && !canContinueStep0) {
      toast.error('Enter your name and a valid email to continue')
      return
    }
    if (step === 1 && !canContinueStep1) {
      toast.error('Choose an available referral code to continue')
      return
    }
    setStep((current) => Math.min(current + 1, STEPS.length - 1))
  }

  const goBack = () => setStep((current) => Math.max(current - 1, 0))

  const submit = async () => {
    if (submitting || !canContinueStep0 || !canContinueStep1) return

    setSubmitting(true)
    try {
      const res = await fetch('/api/store/affiliate/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          phone: phone.trim() || undefined,
          code,
          message: message.trim() || undefined,
        }),
      })
      const data = (await res.json()) as {
        ok?: boolean
        code?: string
        error?: string
      }
      if (!res.ok) throw new Error(data.error ?? 'Failed to submit application')

      trackCompleteRegistration('Affiliate application')

      setSubmittedCode(data.code ?? normalizedCode)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to submit application',
      )
    } finally {
      setSubmitting(false)
    }
  }

  if (submittedCode) {
    return (
      <div className="min-h-screen bg-neutral-50 text-foreground">
        <section className="border-b border-neutral-800 bg-neutral-950 px-4 py-14 text-white sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/30">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <h1 className="mt-6 text-3xl font-bold tracking-tight sm:text-4xl">
              You&apos;re on the list
            </h1>
            <p className="mx-auto mt-3 max-w-lg text-sm text-neutral-300 sm:text-base">
              Thanks for applying, {name.split(' ')[0] || 'partner'}. We&apos;ll email{' '}
              <span className="font-medium text-white">{email}</span> when your account
              is approved.
            </p>
          </div>
        </section>

        <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
          <Card className="rounded-3xl border-neutral-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">What happens next</CardTitle>
              <CardDescription>Your application is in review.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4">
                <div className="flex flex-col items-center">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                    <Check className="h-4 w-4" />
                  </span>
                  <span className="mt-2 h-full w-px bg-neutral-200" />
                </div>
                <div className="pb-6">
                  <p className="font-semibold text-neutral-950">Application submitted</p>
                  <p className="mt-1 text-sm text-neutral-600">
                    We received your details and requested code.
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex flex-col items-center">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-100 text-neutral-600">
                    <Clock3 className="h-4 w-4" />
                  </span>
                  <span className="mt-2 h-full w-px bg-neutral-200" />
                </div>
                <div className="pb-6">
                  <p className="font-semibold text-neutral-950">Team review</p>
                  <p className="mt-1 text-sm text-neutral-600">
                    Usually within 2–3 business days.
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex flex-col items-center">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-100 text-neutral-600">
                    <Sparkles className="h-4 w-4" />
                  </span>
                </div>
                <div>
                  <p className="font-semibold text-neutral-950">Start earning</p>
                  <p className="mt-1 text-sm text-neutral-600">
                    Use your dashboard and referral link once activated.
                  </p>
                </div>
              </div>

              <div className="rounded-2xl bg-neutral-50 p-4 ring-1 ring-neutral-200">
                <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                  Reserved referral code
                </p>
                <p className="mt-1 font-mono text-lg font-bold text-neutral-950">
                  {submittedCode}
                </p>
                <p className="mt-2 break-all text-sm text-neutral-600">
                  {typeof window !== 'undefined'
                    ? `${window.location.origin}/?ref=${encodeURIComponent(submittedCode)}`
                    : `/?ref=${submittedCode}`}
                </p>
              </div>

              <div className="flex flex-col gap-3 pt-2 sm:flex-row">
                <Button asChild className="h-11 flex-1 rounded-full">
                  <Link href="/affiliate">Affiliate dashboard</Link>
                </Button>
                <Button asChild variant="outline" className="h-11 flex-1 rounded-full">
                  <Link href="/shop">Browse products</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <SiteFooter />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-neutral-50 text-foreground">
      <section className="relative overflow-hidden border-b border-neutral-800 bg-neutral-950 text-white">
        <div
          className="pointer-events-none absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              'radial-gradient(circle at 20% 20%, rgba(255,255,255,0.12), transparent 40%), radial-gradient(circle at 80% 0%, rgba(255,255,255,0.08), transparent 35%)',
          }}
        />
        <div className="relative mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <Badge className="rounded-full bg-white/10 text-white hover:bg-white/10">
                Gelos partner program
              </Badge>
              <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
                Share smiles.{' '}
                <span className="text-neutral-300">Earn commission.</span>
              </h1>
              <p className="mt-4 text-sm leading-relaxed text-neutral-300 sm:text-base">
                Join creators, clinics, and communities promoting Gelos oral care.
                Apply in minutes — we&apos;ll review and activate your referral link.
              </p>
            </div>
            <div className="flex flex-wrap gap-3 text-sm">
              <Link
                href="/affiliate"
                className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-4 py-2 font-semibold text-white transition-colors hover:bg-white/10"
              >
                Already approved?
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/shop"
                className="inline-flex items-center rounded-full px-4 py-2 font-semibold text-neutral-300 transition-colors hover:text-white"
              >
                Back to shop
              </Link>
            </div>
          </div>

          <div className="mt-10 grid gap-3 sm:grid-cols-3">
            {BENEFITS.map((benefit) => (
              <div
                key={benefit.title}
                className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm"
              >
                <benefit.icon className="h-5 w-5 text-neutral-200" />
                <p className="mt-3 font-semibold">{benefit.title}</p>
                <p className="mt-1 text-sm text-neutral-400">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
          <Card className="rounded-3xl border-neutral-200 shadow-sm">
            <CardHeader className="space-y-4 border-b border-neutral-100 pb-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-xl">Apply to become a partner</CardTitle>
                  <CardDescription className="mt-1">
                    Step {step + 1} of {STEPS.length} · {STEPS[step].description}
                  </CardDescription>
                </div>
                <span className="hidden text-sm font-medium text-neutral-500 sm:inline">
                  {Math.round(progress)}%
                </span>
              </div>
              <Progress value={progress} className="h-1.5 bg-neutral-100" />
              <ol className="grid grid-cols-3 gap-2">
                {STEPS.map((item, index) => {
                  const isComplete = index < step
                  const isCurrent = index === step
                  return (
                    <li
                      key={item.id}
                      className={cn(
                        'rounded-xl px-3 py-2 text-left transition-colors',
                        isCurrent && 'bg-neutral-950 text-white',
                        isComplete && !isCurrent && 'bg-neutral-100 text-neutral-700',
                        !isCurrent && !isComplete && 'text-neutral-400',
                      )}
                    >
                      <p className="text-[11px] font-bold uppercase tracking-wide opacity-80">
                        {index + 1}
                      </p>
                      <p className="text-sm font-semibold">{item.title}</p>
                    </li>
                  )
                })}
              </ol>
            </CardHeader>

            <CardContent className="pt-6">
              {step === 0 ? (
                <div className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="affiliate-name">Full name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                      <Input
                        id="affiliate-name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        onBlur={() => {
                          if (!code.trim()) suggestCode()
                        }}
                        placeholder="Ada Mensah"
                        className="h-11 pl-10"
                        autoFocus
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="affiliate-email">Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                        <Input
                          id="affiliate-email"
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="you@example.com"
                          className="h-11 pl-10"
                        />
                      </div>
                      <p className="text-xs text-neutral-500">
                        We&apos;ll notify you here when approved.
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="affiliate-phone">
                        Phone <span className="font-normal text-neutral-400">(optional)</span>
                      </Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                        <Input
                          id="affiliate-phone"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="+233…"
                          className="h-11 pl-10"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}

              {step === 1 ? (
                <div className="space-y-5">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <Label htmlFor="affiliate-code">Preferred referral code</Label>
                      <button
                        type="button"
                        onClick={suggestCode}
                        disabled={!name.trim()}
                        className="text-xs font-semibold text-neutral-600 underline-offset-4 hover:text-neutral-950 hover:underline disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        Suggest from name
                      </button>
                    </div>
                    <div className="relative">
                      <Hash className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                      <Input
                        id="affiliate-code"
                        value={code}
                        onChange={(e) => setCode(e.target.value.toUpperCase())}
                        placeholder="ADA10"
                        className={cn(
                          'h-11 pl-10 pr-10 font-mono uppercase',
                          codeCheck === 'available' && 'border-emerald-500 ring-1 ring-emerald-500/30',
                          (codeCheck === 'taken' || codeCheck === 'invalid') &&
                            'border-red-400 ring-1 ring-red-400/30',
                        )}
                        maxLength={24}
                        autoFocus
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2">
                        {codeCheck === 'checking' ? (
                          <Loader2 className="h-4 w-4 animate-spin text-neutral-400" />
                        ) : codeCheck === 'available' ? (
                          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                        ) : null}
                      </span>
                    </div>
                    <p
                      className={cn(
                        'text-xs',
                        codeCheck === 'available' && 'text-emerald-700',
                        codeCheck === 'taken' && 'text-red-600',
                        codeCheck === 'invalid' && 'text-red-600',
                        codeCheck === 'too_short' && 'text-neutral-500',
                        codeCheck === 'idle' && 'text-neutral-500',
                        codeCheck === 'checking' && 'text-neutral-500',
                      )}
                    >
                      {codeCheck === 'idle' &&
                        'Letters, numbers, hyphens, and underscores only.'}
                      {codeCheck === 'checking' && 'Checking availability…'}
                      {codeCheck === 'available' && 'This code is available.'}
                      {codeCheck === 'taken' && 'That code is taken — try another.'}
                      {codeCheck === 'invalid' && 'Use letters, numbers, hyphens, or underscores.'}
                      {codeCheck === 'too_short' && 'At least 3 characters required.'}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-neutral-950 p-4 text-white">
                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-neutral-400">
                      <Link2 className="h-3.5 w-3.5" />
                      Link preview
                    </div>
                    <p className="mt-2 break-all font-mono text-sm text-neutral-100">
                      {referralPreview || 'your-link/?ref=CODE'}
                    </p>
                    <p className="mt-3 text-xs text-neutral-400">
                      Share this after approval. Purchases through it count toward your
                      commission.
                    </p>
                  </div>
                </div>
              ) : null}

              {step === 2 ? (
                <div className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="affiliate-message">
                      How will you promote Gelos?{' '}
                      <span className="font-normal text-neutral-400">(optional)</span>
                    </Label>
                    <Textarea
                      id="affiliate-message"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Instagram, dental practice, blog, WhatsApp community…"
                      className="min-h-[120px] resize-y"
                      autoFocus
                    />
                    <p className="text-xs text-neutral-500">
                      Helps us understand your audience — not required to apply.
                    </p>
                  </div>

                  <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                      Application summary
                    </p>
                    <dl className="mt-3 space-y-2 text-sm">
                      <div className="flex justify-between gap-4">
                        <dt className="text-neutral-500">Name</dt>
                        <dd className="font-medium text-neutral-950">{name}</dd>
                      </div>
                      <div className="flex justify-between gap-4">
                        <dt className="text-neutral-500">Email</dt>
                        <dd className="font-medium text-neutral-950">{email}</dd>
                      </div>
                      {phone.trim() ? (
                        <div className="flex justify-between gap-4">
                          <dt className="text-neutral-500">Phone</dt>
                          <dd className="font-medium text-neutral-950">{phone}</dd>
                        </div>
                      ) : null}
                      <div className="flex justify-between gap-4">
                        <dt className="text-neutral-500">Referral code</dt>
                        <dd className="font-mono font-semibold text-neutral-950">
                          {normalizedCode}
                        </dd>
                      </div>
                    </dl>
                  </div>
                </div>
              ) : null}

              <div className="mt-8 flex flex-col-reverse gap-3 border-t border-neutral-100 pt-6 sm:flex-row sm:justify-between">
                <Button
                  type="button"
                  variant="outline"
                  className="h-11 rounded-full"
                  onClick={goBack}
                  disabled={step === 0 || submitting}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>

                {step < STEPS.length - 1 ? (
                  <Button
                    type="button"
                    className="h-11 rounded-full bg-neutral-950 hover:bg-neutral-800"
                    onClick={goNext}
                    disabled={
                      (step === 0 && !canContinueStep0) ||
                      (step === 1 && !canContinueStep1)
                    }
                  >
                    Continue
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                ) : (
                  <Button
                    type="button"
                    className="h-11 rounded-full bg-neutral-950 hover:bg-neutral-800"
                    onClick={submit}
                    disabled={submitting || !canContinueStep0 || !canContinueStep1}
                  >
                    {submitting ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Sparkles className="mr-2 h-4 w-4" />
                    )}
                    {submitting ? 'Submitting…' : 'Submit application'}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          <aside className="space-y-4 lg:sticky lg:top-8">
            <Card className="rounded-3xl border-neutral-200 shadow-sm">
              <CardHeader>
                <CardTitle className="text-base">How it works</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                {[
                  'Apply with your details and pick a referral code.',
                  'We review your application (usually 2–3 days).',
                  'Share your link and track earnings in the dashboard.',
                ].map((text, index) => (
                  <div key={text} className="flex gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-neutral-950 text-xs font-bold text-white">
                      {index + 1}
                    </span>
                    <p className="text-neutral-600">{text}</p>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="rounded-3xl border-neutral-200 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Common questions</CardTitle>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="w-full">
                  {FAQ_ITEMS.map((item) => (
                    <AccordionItem key={item.question} value={item.question}>
                      <AccordionTrigger className="text-left text-sm font-medium">
                        {item.question}
                      </AccordionTrigger>
                      <AccordionContent className="text-sm text-neutral-600">
                        {item.answer}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </CardContent>
            </Card>

            <p className="px-1 text-center text-xs text-neutral-500">
              Questions?{' '}
              <Link href="/contact" className="font-semibold text-neutral-700 underline-offset-4 hover:underline">
                Contact us
              </Link>
            </p>
          </aside>
        </div>
      </div>

      <SiteFooter />
    </div>
  )
}
