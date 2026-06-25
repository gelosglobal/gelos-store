'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Share2,
  Sparkles,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { SmileTestBundleBuilder } from '@/components/smile-test/smile-test-bundle-builder'
import { SmileTestProductMatchSection } from '@/components/smile-test/smile-test-product-match'
import { useProducts } from '@/components/products-provider'
import {
  smileTestGoalLabels,
  smileTestStepLabels,
  smileTestSteps,
  type SmileTestStepId,
} from '@/lib/gelos-ai/smile-test-config'
import { buildSmileTestResults } from '@/lib/gelos-ai/smile-test-results'
import {
  loadSmileTestAnswers,
  saveSmileTestAnswers,
} from '@/lib/gelos-ai/smile-test-session'
import type { SmileTestAnswers } from '@/lib/gelos-ai/smile-test-types'
import { SmileScoreGauge } from '@/components/smile-results/smile-score-gauge'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

const questionSteps = smileTestSteps.filter((step) => step.id !== 'results')
const stepOrder: SmileTestStepId[] = ['goals', 'routine', 'concerns', 'lifestyle', 'results']

function emptyAnswers(): SmileTestAnswers {
  return { goals: [], routine: [], concerns: [], lifestyle: [] }
}

function getStepIndex(stepId: SmileTestStepId): number {
  return stepOrder.indexOf(stepId)
}

function getSelectionsForStep(answers: SmileTestAnswers, stepId: SmileTestStepId): string[] {
  if (stepId === 'goals') return answers.goals
  if (stepId === 'routine') return answers.routine
  if (stepId === 'concerns') return answers.concerns
  if (stepId === 'lifestyle') return answers.lifestyle
  return []
}

function setSelectionsForStep(
  answers: SmileTestAnswers,
  stepId: SmileTestStepId,
  selections: string[],
): SmileTestAnswers {
  if (stepId === 'goals') return { ...answers, goals: selections as SmileTestAnswers['goals'] }
  if (stepId === 'routine') return { ...answers, routine: selections as SmileTestAnswers['routine'] }
  if (stepId === 'concerns') return { ...answers, concerns: selections as SmileTestAnswers['concerns'] }
  if (stepId === 'lifestyle') return { ...answers, lifestyle: selections as SmileTestAnswers['lifestyle'] }
  return answers
}

export function SmileTestPage() {
  const router = useRouter()
  const { products } = useProducts()
  const [answers, setAnswers] = useState<SmileTestAnswers>(emptyAnswers)
  const [currentStep, setCurrentStep] = useState<SmileTestStepId>('goals')
  const [routineTab, setRoutineTab] = useState<'morning' | 'night'>('morning')

  useEffect(() => {
    setAnswers(loadSmileTestAnswers())
  }, [])

  useEffect(() => {
    saveSmileTestAnswers(answers)
  }, [answers])

  const currentConfig = questionSteps.find((step) => step.id === currentStep)
  const currentSelections = getSelectionsForStep(answers, currentStep)
  const stepIndex = getStepIndex(currentStep)
  const questionIndex = questionSteps.findIndex((step) => step.id === currentStep)
  const canContinue = currentStep === 'results' || currentSelections.length > 0

  const results = useMemo(() => {
    if (currentStep !== 'results') return null
    return buildSmileTestResults(answers, products)
  }, [answers, currentStep, products])

  const toggleSelection = (optionId: string) => {
    if (!currentConfig || currentStep === 'results') return

    setAnswers((prev) => {
      const existing = getSelectionsForStep(prev, currentStep)
      const isSelected = existing.includes(optionId)
      let next = existing

      if (isSelected) {
        next = existing.filter((id) => id !== optionId)
      } else if (existing.length < currentConfig.maxSelections) {
        next = [...existing, optionId]
      } else if (currentConfig.maxSelections === 1) {
        next = [optionId]
      }

      return setSelectionsForStep(prev, currentStep, next)
    })
  }

  const goBack = () => {
    if (currentStep === 'results') {
      setCurrentStep('lifestyle')
      return
    }
    const prevStep = stepOrder[stepIndex - 1]
    if (prevStep && prevStep !== 'results') setCurrentStep(prevStep)
    else router.push('/ai')
  }

  const goNext = () => {
    if (!canContinue) return
    if (currentStep === 'lifestyle') {
      setCurrentStep('results')
      return
    }
    const nextStep = stepOrder[stepIndex + 1]
    if (nextStep) setCurrentStep(nextStep)
  }

  const shareResults = async () => {
    const text = 'I just took the Gelos Smile Test and got my personalized routine.'
    try {
      if (navigator.share) {
        await navigator.share({ title: 'Gelos Smile Test', text, url: window.location.href })
      } else {
        await navigator.clipboard.writeText(`${text} ${window.location.href}`)
        toast.success('Results link copied')
      }
    } catch {
      // user cancelled share
    }
  }

  const activeRoutine =
    routineTab === 'morning' ? results?.morningRoutine ?? [] : results?.nightRoutine ?? []

  return (
    <div className="min-h-screen bg-white text-neutral-950">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-[radial-gradient(ellipse_at_top,#f0fdf4_0%,#ffffff_70%)]" />

      <div className="relative mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        <div className="mb-8 flex items-center justify-between gap-4">
          <Link
            href="/ai"
            className="inline-flex items-center gap-2 text-sm font-medium text-neutral-500 transition-colors hover:text-neutral-950"
          >
            <ArrowLeft className="size-4" />
            Gelos AI
          </Link>
          <span className="inline-flex items-center gap-2 rounded-full border border-[#BBF7D0] bg-[#F0FDF4] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#15803D]">
            <Sparkles className="size-3.5 text-[#84CC16]" />
            Smile test
          </span>
        </div>

        {currentStep !== 'results' ? (
          <div className="mx-auto mb-10 max-w-3xl">
            <div className="flex items-center justify-between gap-4 text-sm text-neutral-500">
              <span>
                Step {questionIndex + 1} of {questionSteps.length}
              </span>
              <span className="font-medium text-neutral-700">
                {smileTestStepLabels[currentStep as keyof typeof smileTestStepLabels]}
              </span>
            </div>
            <div className="mt-3 h-1 overflow-hidden rounded-full bg-neutral-100">
              <div
                className="h-full rounded-full bg-[#84CC16] transition-all duration-300"
                style={{
                  width: `${((questionIndex + 1) / questionSteps.length) * 100}%`,
                }}
              />
            </div>
          </div>
        ) : null}

        {currentStep !== 'results' && currentConfig ? (
          <div className="mx-auto max-w-3xl">
            <div className="text-center">
              <h1 className="text-2xl font-bold tracking-tight text-neutral-950 sm:text-3xl">
                {currentConfig.title}
              </h1>
              <p className="mt-2 text-sm text-neutral-500">{currentConfig.subtitle}</p>
            </div>

            <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {currentConfig.options.map((option) => {
                const Icon = option.icon
                const selected = currentSelections.includes(option.id)
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => toggleSelection(option.id)}
                    className={cn(
                      'flex items-center gap-4 rounded-2xl border p-4 text-left transition-all sm:p-5',
                      selected
                        ? 'border-[#84CC16] bg-[#F0FDF4]'
                        : 'border-neutral-200 bg-white hover:border-neutral-300',
                    )}
                  >
                    <span
                      className={cn(
                        'flex size-11 shrink-0 items-center justify-center rounded-xl',
                        selected ? 'bg-[#84CC16] text-neutral-950' : 'bg-neutral-100 text-neutral-600',
                      )}
                    >
                      <Icon className="size-5" />
                    </span>
                    <span>
                      <span className="block text-sm font-semibold text-neutral-950 sm:text-base">
                        {option.label}
                      </span>
                      {option.description ? (
                        <span className="mt-0.5 block text-xs text-neutral-500">
                          {option.description}
                        </span>
                      ) : null}
                    </span>
                  </button>
                )
              })}
            </div>

            <div className="mt-10 flex items-center justify-between gap-4">
              <button
                type="button"
                onClick={goBack}
                className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-5 py-3 text-sm font-medium text-neutral-600 transition-colors hover:bg-neutral-50"
              >
                <ArrowLeft className="size-4" />
                Back
              </button>

              <button
                type="button"
                onClick={goNext}
                disabled={!canContinue}
                className={cn(
                  'inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold transition-colors',
                  canContinue
                    ? 'bg-[#84CC16] text-neutral-950 hover:bg-[#73b512]'
                    : 'cursor-not-allowed bg-neutral-100 text-neutral-400',
                )}
              >
                {currentStep === 'lifestyle' ? 'See results' : 'Next'}
                <ArrowRight className="size-4" />
              </button>
            </div>
          </div>
        ) : results ? (
          <div className="mx-auto max-w-6xl space-y-8 lg:space-y-10">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#65A30D]">
                  Your results
                </p>
                <h1 className="mt-1 text-2xl font-bold tracking-tight text-neutral-950 sm:text-3xl">
                  Your personalized smile plan
                </h1>
                <p className="mt-2 text-sm text-neutral-600">
                  Routine, product picks, and a bundle built from your answers.
                </p>
              </div>
              <button
                type="button"
                onClick={() => void shareResults()}
                className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-4 py-2.5 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50"
              >
                <Share2 className="size-4" />
                Share
              </button>
            </div>

            <div className="grid gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
              <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-neutral-500">
                  Smile score
                </p>
                <SmileScoreGauge score={results.score} />

                <div className="mt-6">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-neutral-500">
                    Your goals
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {results.goals.map((goal) => (
                      <span
                        key={goal}
                        className="rounded-full bg-neutral-950 px-3 py-1.5 text-xs font-semibold text-white"
                      >
                        {smileTestGoalLabels[goal]}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mt-6">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500">
                    Focus areas
                  </p>
                  <ul className="mt-3 space-y-2">
                    {results.focusAreas.map((area) => (
                      <li key={area} className="flex items-start gap-2 text-sm text-neutral-700">
                        <Check className="mt-0.5 size-4 shrink-0 text-[#84CC16]" />
                        {area}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
                <div className="flex gap-2 rounded-full bg-neutral-100 p-1">
                  {(['morning', 'night'] as const).map((tab) => (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => setRoutineTab(tab)}
                      className={cn(
                        'flex-1 rounded-full px-4 py-2 text-sm font-semibold capitalize transition-colors',
                        routineTab === tab
                          ? 'bg-white text-neutral-950 shadow-sm'
                          : 'text-neutral-500 hover:text-neutral-800',
                      )}
                    >
                      {tab}
                    </button>
                  ))}
                </div>

                <ol className="mt-5 space-y-3">
                  {activeRoutine.map((step, index) => {
                    const product = products.find((item) => item.id === step.productId)
                    return (
                      <li
                        key={`${step.productId}-${index}`}
                        className="flex items-center gap-3 rounded-2xl border border-neutral-100 bg-neutral-50 p-3"
                      >
                        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#84CC16] text-sm font-bold text-neutral-950">
                          {index + 1}
                        </span>
                        <div className="relative size-12 shrink-0 overflow-hidden rounded-xl bg-white">
                          {product?.image ? (
                            <Image
                              src={product.image}
                              alt={step.label}
                              fill
                              className="object-cover"
                              sizes="48px"
                            />
                          ) : null}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-neutral-950">
                            {product?.name ?? step.label}
                          </p>
                          <p className="text-xs text-neutral-500">{step.duration}</p>
                        </div>
                      </li>
                    )
                  })}
                </ol>
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-2 lg:gap-8">
              <SmileTestProductMatchSection matches={results.productMatches} />
              <SmileTestBundleBuilder
                bundleProductIds={results.bundleProductIds}
                goals={results.goals}
                discountPercent={results.bundleDiscountPercent}
              />
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link
                href="/shop"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-[#84CC16] px-5 py-3 text-sm font-semibold text-neutral-950 transition-colors hover:bg-[#73b512]"
              >
                Shop matched products
              </Link>
              <Link
                href="/ai?tab=scan"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-neutral-200 bg-white px-5 py-3 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50"
              >
                Try smile scan
              </Link>
              <button
                type="button"
                onClick={() => {
                  setAnswers(emptyAnswers())
                  setCurrentStep('goals')
                }}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-neutral-200 bg-white px-5 py-3 text-sm font-medium text-neutral-600 transition-colors hover:bg-neutral-50"
              >
                Retake test
              </button>
            </div>
          </div>
        ) : null}
      </div>

    </div>
  )
}
