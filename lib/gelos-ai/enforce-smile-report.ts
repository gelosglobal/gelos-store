import type { SmileScanReport } from '@/lib/gelos-ai/smile-scan-types'

const RETAKE_TIPS = [
  'Stand in bright, natural light and face the light source.',
  'Hold your phone steady, tap to focus on your teeth, then capture.',
  'Fill the frame with your face — teeth and gums clearly visible.',
]

function zeroScores(): SmileScanReport['scores'] {
  return { brightness: 0, freshness: 0, confidence: 0 }
}

function capScores(
  scores: SmileScanReport['scores'],
  maxScore: number,
): SmileScanReport['scores'] {
  const cap = Math.min(10, Math.max(0, Math.round(maxScore)))
  return {
    brightness: Math.min(scores.brightness, cap),
    freshness: Math.min(scores.freshness, cap),
    confidence: Math.min(scores.confidence, cap),
  }
}

export function enforceSmileReportQuality(
  report: SmileScanReport,
  measuredSharpness?: number,
): SmileScanReport {
  const quality = report.imageQuality
  const clarity = quality?.clarity ?? 10
  const issues = [...(quality?.issues ?? [])]

  if (
    measuredSharpness !== undefined &&
    measuredSharpness < 85 &&
    !issues.includes('blurry')
  ) {
    issues.push('blurry')
  }

  const tooBlurry =
    measuredSharpness !== undefined && measuredSharpness < 85
  const notAnalyzable =
    quality?.analyzable === false || clarity <= 4 || tooBlurry

  if (notAnalyzable) {
    const issueText =
      issues.length > 0
        ? issues.join(', ')
        : 'the photo is not clear enough'

    return {
      ...report,
      imageQuality: {
        analyzable: false,
        clarity: tooBlurry ? Math.min(clarity, 3) : clarity,
        issues: issues.length ? issues : ['unclear image'],
      },
      scores: zeroScores(),
      products: [],
      tips: RETAKE_TIPS,
      snapshot:
        report.snapshot &&
        /blurry|unclear|retake|cannot|can't|not able|too dark|not a face/i.test(
          report.snapshot,
        )
          ? report.snapshot
          : `We could not score this photo accurately because ${issueText}. Please retake a sharper, well-lit front-facing smile photo so we can give you an honest analysis.`,
      dentistNote:
        report.dentistNote ||
        'Once you have a clear photo or ongoing concerns, a partner dentist can help with a professional check-up.',
    }
  }

  const cappedScores = capScores(report.scores, clarity)

  return {
    ...report,
    imageQuality: quality ?? { analyzable: true, clarity, issues },
    scores: cappedScores,
  }
}
