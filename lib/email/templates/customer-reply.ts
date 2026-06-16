import { escapeHtml, renderEmailLayout, renderPrimaryButton } from '@/lib/email/templates/shared'
import { getAppUrl } from '@/lib/env'

export function buildCustomerSupportReplyEmail(input: {
  customerName: string
  subject: string
  message: string
  threadId: string
}) {
  const subject = input.subject.trim() || 'Message from Gelos support'
  const greetingName = input.customerName.trim() || 'there'
  const body = `
    <p style="margin:0 0 14px;font-size:15px;line-height:1.7;color:#111827;">
      Hi ${escapeHtml(greetingName)},
    </p>
    <p style="margin:0 0 18px;font-size:15px;line-height:1.7;color:#111827;">
      ${escapeHtml(input.message).replace(/\n/g, '<br />')}
    </p>
    <p style="margin:18px 0 0;font-size:13px;line-height:1.7;color:#6b7280;">
      If you need to follow up, reply to this email and include reference:
      <span style="font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,'Liberation Mono','Courier New',monospace;">
        ${escapeHtml(input.threadId)}
      </span>
    </p>
    ${renderPrimaryButton(getAppUrl(), 'Visit Gelos')}
  `

  return {
    subject,
    html: renderEmailLayout({
      title: subject,
      headerEyebrow: 'Support',
      bodyHtml: body,
    }),
  }
}

