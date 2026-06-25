import type { SmileTestAnswers } from '@/lib/gelos-ai/smile-test-types'

const KEY = 'gelos-ai:smile-test'

const emptyAnswers = (): SmileTestAnswers => ({
  goals: [],
  routine: [],
  concerns: [],
  lifestyle: [],
})

function canUseSessionStorage(): boolean {
  return typeof window !== 'undefined' && typeof window.sessionStorage !== 'undefined'
}

export function loadSmileTestAnswers(): SmileTestAnswers {
  if (!canUseSessionStorage()) return emptyAnswers()

  try {
    const raw = window.sessionStorage.getItem(KEY)
    if (!raw) return emptyAnswers()
    const parsed = JSON.parse(raw) as Partial<SmileTestAnswers>
    return {
      goals: Array.isArray(parsed.goals) ? parsed.goals : [],
      routine: Array.isArray(parsed.routine) ? parsed.routine : [],
      concerns: Array.isArray(parsed.concerns) ? parsed.concerns : [],
      lifestyle: Array.isArray(parsed.lifestyle) ? parsed.lifestyle : [],
    }
  } catch {
    return emptyAnswers()
  }
}

export function saveSmileTestAnswers(answers: SmileTestAnswers): void {
  if (!canUseSessionStorage()) return
  try {
    window.sessionStorage.setItem(KEY, JSON.stringify(answers))
  } catch {
    // ignore quota errors
  }
}

export function clearSmileTestAnswers(): void {
  if (!canUseSessionStorage()) return
  window.sessionStorage.removeItem(KEY)
}
