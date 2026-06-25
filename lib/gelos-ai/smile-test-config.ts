import type { LucideIcon } from 'lucide-react'
import {
  Baby,
  Coffee,
  Droplets,
  Flame,
  Heart,
  Moon,
  Shield,
  Smile,
  Sparkles,
  Sun,
  Wind,
} from 'lucide-react'
import type {
  SmileTestConcernId,
  SmileTestGoalId,
  SmileTestLifestyleId,
  SmileTestRoutineId,
} from '@/lib/gelos-ai/smile-test-types'

export type SmileTestStepId = 'goals' | 'routine' | 'concerns' | 'lifestyle' | 'results'

export type SmileTestOption<T extends string> = {
  id: T
  label: string
  description?: string
  icon: LucideIcon
}

export type SmileTestStepConfig<T extends string = string> = {
  id: SmileTestStepId
  title: string
  subtitle: string
  maxSelections: number
  options: SmileTestOption<T>[]
}

export const smileTestSteps: SmileTestStepConfig[] = [
  {
    id: 'goals',
    title: 'What is your main goal?',
    subtitle: 'Choose up to 2',
    maxSelections: 2,
    options: [
      { id: 'whiter-teeth', label: 'Whiter teeth', icon: Sparkles },
      { id: 'fresh-breath', label: 'Fresh breath', icon: Wind },
      { id: 'healthier-gums', label: 'Healthier gums', icon: Heart },
      { id: 'prevent-problems', label: 'Prevent problems', icon: Shield },
      { id: 'better-routine', label: 'Better routine', icon: Sun },
      { id: 'kids-care', label: 'Kids care', icon: Baby },
    ] satisfies SmileTestOption<SmileTestGoalId>[],
  },
  {
    id: 'routine',
    title: 'How do you care for your smile today?',
    subtitle: 'Pick all that apply',
    maxSelections: 3,
    options: [
      { id: 'brush-once', label: 'Brush once a day', icon: Moon },
      { id: 'brush-twice', label: 'Brush twice a day', icon: Sun },
      { id: 'brush-thrice', label: 'Brush after meals', icon: Sparkles },
      { id: 'floss-rarely', label: 'Rarely floss', icon: Droplets },
      { id: 'floss-sometimes', label: 'Floss sometimes', icon: Droplets },
      { id: 'floss-daily', label: 'Floss daily', icon: Droplets },
      { id: 'rinse-rarely', label: 'Rarely use mouthwash', icon: Wind },
      { id: 'rinse-sometimes', label: 'Mouthwash sometimes', icon: Wind },
      { id: 'rinse-daily', label: 'Mouthwash daily', icon: Wind },
    ] satisfies SmileTestOption<SmileTestRoutineId>[],
  },
  {
    id: 'concerns',
    title: 'Any concerns right now?',
    subtitle: 'Choose up to 3',
    maxSelections: 3,
    options: [
      { id: 'staining', label: 'Surface stains', icon: Sparkles },
      { id: 'sensitivity', label: 'Sensitivity', icon: Flame },
      { id: 'bleeding-gums', label: 'Bleeding gums', icon: Heart },
      { id: 'bad-breath', label: 'Bad breath', icon: Wind },
      { id: 'plaque', label: 'Plaque buildup', icon: Shield },
      { id: 'no-major-concerns', label: 'No major concerns', icon: Smile },
    ] satisfies SmileTestOption<SmileTestConcernId>[],
  },
  {
    id: 'lifestyle',
    title: 'What fits your lifestyle?',
    subtitle: 'Choose up to 2',
    maxSelections: 2,
    options: [
      { id: 'coffee-tea', label: 'Coffee or tea daily', icon: Coffee },
      { id: 'smoking', label: 'Smoking or vaping', icon: Flame },
      { id: 'sugary-drinks', label: 'Sugary drinks often', icon: Droplets },
      { id: 'stress-grinding', label: 'Stress or grinding', icon: Moon },
      { id: 'active-lifestyle', label: 'Active lifestyle', icon: Sun },
    ] satisfies SmileTestOption<SmileTestLifestyleId>[],
  },
]

export const smileTestStepLabels: Record<Exclude<SmileTestStepId, 'results'>, string> = {
  goals: 'Goals',
  routine: 'Routine',
  concerns: 'Concerns',
  lifestyle: 'Lifestyle',
}

export const smileTestGoalLabels: Record<SmileTestGoalId, string> = {
  'whiter-teeth': 'Whiter teeth',
  'fresh-breath': 'Fresh breath',
  'healthier-gums': 'Healthier gums',
  'prevent-problems': 'Prevent problems',
  'better-routine': 'Better routine',
  'kids-care': 'Kids care',
}
