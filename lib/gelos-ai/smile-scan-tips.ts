import type { SmileScanReport } from '@/lib/gelos-ai/smile-scan-types'

export const RETAKE_TIPS = [
  'Stand in bright, natural light and face the light source.',
  'Hold your phone steady, tap to focus on your teeth, then capture.',
  'Fill the frame with your face — teeth and gums clearly visible.',
]

const PHOTO_TIP_PATTERN =
  /\b(light|lighting|photo|camera|phone|frame|focus|retake|capture|steady|window|blur|selfie|upload|picture|image|shot)\b/i

const TEETH_TIP_POOL = [
  'Brush twice daily for two minutes, angling the bristles toward the gum line.',
  'Floss once daily to clean between teeth where brushing alone cannot reach.',
  'Use a fluoride toothpaste morning and night to help strengthen enamel.',
  'Rinse with mouthwash after brushing to support fresher breath through the day.',
  'Limit sugary snacks and rinse with water after eating to reduce plaque buildup.',
  'Replace your toothbrush every three months or sooner if bristles look worn.',
  'Brush your tongue gently to reduce bacteria that can affect breath freshness.',
  'Drink water throughout the day to help wash away food particles and acids.',
]

function isPhotoOrEnvironmentTip(tip: string): boolean {
  return PHOTO_TIP_PATTERN.test(tip)
}

function teethTipsForScores(scores: SmileScanReport['scores']): string[] {
  const picks: string[] = []

  if (scores.brightness <= 6) {
    picks.push(
      'Brush twice daily with a whitening toothpaste to gradually lift surface stains.',
    )
  }
  if (scores.freshness <= 6) {
    picks.push(
      'Use mouthwash after brushing and flossing to help keep breath fresher for longer.',
    )
  }
  if (scores.confidence <= 6) {
    picks.push(
      'Practice a consistent brush-and-floss routine — healthy gums support a more confident smile.',
    )
  }

  for (const tip of TEETH_TIP_POOL) {
    if (picks.length >= 3) break
    if (!picks.includes(tip)) picks.push(tip)
  }

  return picks.slice(0, 3)
}

export function sanitizeAnalyzableTips(
  tips: string[],
  scores: SmileScanReport['scores'],
): string[] {
  const teethTips = tips
    .map((tip) => tip.trim())
    .filter(Boolean)
    .filter((tip) => !isPhotoOrEnvironmentTip(tip))

  const unique = [...new Set(teethTips)]

  if (unique.length >= 3) {
    return unique.slice(0, 3)
  }

  for (const tip of teethTipsForScores(scores)) {
    if (unique.length >= 3) break
    if (!unique.includes(tip)) unique.push(tip)
  }

  return unique.slice(0, 3)
}
