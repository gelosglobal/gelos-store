import { escapeHtml, renderEmailLayout, renderPrimaryButton } from '@/lib/email/templates/shared'
import { getAppUrl } from '@/lib/env'

export function buildMarketingCampaignEmail(input: {
  subject: string
  headline: string
  body: string
  ctaLabel?: string
  ctaHref?: string
}) {
  const subject = input.subject.trim() || 'News from Gelos'
  const headline = input.headline.trim() || subject
  const ctaLabel = input.ctaLabel?.trim() || 'Shop Gelos'
  const ctaHref = input.ctaHref?.trim() || getAppUrl()

  const paragraphs = input.body
    .trim()
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map(
      (block) =>
        `<p style="margin:0 0 14px;font-size:15px;line-height:1.75;color:#111827;">${escapeHtml(block).replace(/\n/g, '<br />')}</p>`,
    )
    .join('')

  const bodyHtml = `
    <h1 style="margin:0 0 14px;font-size:22px;line-height:1.25;font-weight:800;color:#111827;">
      ${escapeHtml(headline)}
    </h1>
    ${paragraphs}
    ${renderPrimaryButton(ctaHref, ctaLabel)}
  `

  return {
    subject,
    html: renderEmailLayout({
      title: subject,
      headerEyebrow: 'Gelos',
      bodyHtml,
      footerNote:
        'You received this email because you subscribed to Gelos updates. If you did not request this, you can ignore it.',
    }),
  }
}

