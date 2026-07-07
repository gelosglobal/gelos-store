import {
  buildAffiliateLoginUrl,
  buildAffiliateReferralUrl,
  buildAffiliateSignupUrl,
} from '@/lib/affiliates'
import {
  escapeHtml,
  renderDetailCard,
  renderEmailLayout,
  renderHeroBlock,
  renderPrimaryButton,
} from '@/lib/email/templates/shared'
import { getEmailAppUrl } from '@/lib/env'

export type AffiliateWelcomeEmailInput = {
  name: string
  email: string
  code: string
  commissionPercent: number
}

export function buildAffiliateWelcomeEmail(input: AffiliateWelcomeEmailInput) {
  const appUrl = getEmailAppUrl()
  const signupUrl = buildAffiliateSignupUrl(input.email, appUrl)
  const loginUrl = buildAffiliateLoginUrl(appUrl)
  const referralUrl = buildAffiliateReferralUrl(input.code, appUrl)
  const subject = 'Welcome to the Gelos affiliate program'

  const bodyHtml = `
    ${renderHeroBlock({
      title: `Welcome, ${input.name}`,
      description:
        'Your affiliate account is ready. Create your secure login to access your personal dashboard, track commissions, and copy your referral link.',
      highlight: `Your affiliate code is ${input.code}. Use the invited email address when creating your account.`,
    })}
    ${renderDetailCard('Your account', [
      { label: 'Affiliate code', value: input.code },
      { label: 'Commission', value: `${input.commissionPercent}%` },
      { label: 'Referral link', value: referralUrl, multiline: true },
    ])}
    ${renderPrimaryButton(signupUrl, 'Create your account')}
    <p style="margin:18px 0 0;font-size:14px;line-height:1.65;color:#737373;text-align:center;">
      Already set up your account?
      <a href="${escapeHtml(loginUrl)}" style="color:#1a2e05;font-weight:600;text-decoration:underline;">
        Sign in to your dashboard
      </a>
    </p>
  `

  return {
    subject,
    html: renderEmailLayout({
      title: subject,
      preheader: `Create your Gelos affiliate account. Code: ${input.code}`,
      headerEyebrow: 'Gelos Affiliate partners',
      bodyHtml,
      footerNote:
        'You received this email because you were added as a Gelos affiliate partner.',
    }),
  }
}
