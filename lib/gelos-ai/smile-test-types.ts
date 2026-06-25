export type SmileTestGoalId =
  | 'whiter-teeth'
  | 'fresh-breath'
  | 'healthier-gums'
  | 'prevent-problems'
  | 'better-routine'
  | 'kids-care'

export type SmileTestRoutineId =
  | 'brush-once'
  | 'brush-twice'
  | 'brush-thrice'
  | 'floss-rarely'
  | 'floss-sometimes'
  | 'floss-daily'
  | 'rinse-rarely'
  | 'rinse-sometimes'
  | 'rinse-daily'

export type SmileTestConcernId =
  | 'staining'
  | 'sensitivity'
  | 'bleeding-gums'
  | 'bad-breath'
  | 'plaque'
  | 'no-major-concerns'

export type SmileTestLifestyleId =
  | 'coffee-tea'
  | 'smoking'
  | 'sugary-drinks'
  | 'stress-grinding'
  | 'active-lifestyle'

export type SmileTestAnswers = {
  goals: SmileTestGoalId[]
  routine: SmileTestRoutineId[]
  concerns: SmileTestConcernId[]
  lifestyle: SmileTestLifestyleId[]
}

export type SmileTestRoutineStep = {
  productId: string
  label: string
  duration: string
}

export type SmileTestProductMatch = {
  productId: string
  matchPercent: number
  description: string
}

export type SmileTestResults = {
  score: number
  goals: SmileTestGoalId[]
  focusAreas: string[]
  morningRoutine: SmileTestRoutineStep[]
  nightRoutine: SmileTestRoutineStep[]
  bundleProductIds: string[]
  bundleDiscountPercent: number
  productMatches: SmileTestProductMatch[]
}
