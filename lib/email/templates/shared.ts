import { formatOrderTotal } from '@/lib/admin/order-format'
import type { CheckoutLineItem } from '@/lib/checkout'
import { getAppUrl } from '@/lib/env'

export const EMAIL_BRAND = {
  lime: '#D4FF59',
  limeMuted: '#e8ffb0',
  limeDark: '#1a2e05',
  dark: '#0a0a0a',
  text: '#171717',
  muted: '#737373',
  subtle: '#a3a3a3',
  border: '#e5e5e5',
  surface: '#fafafa',
  white: '#ffffff',
  success: '#15803d',
  successBg: '#f0fdf4',
  warning: '#b45309',
  warningBg: '#fffbeb',
} as const

export function getLogoUrl(): string {
  return `${getAppUrl()}/gelos/gelos-logo.png`
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export function formatMoney(currency: string, amount: number): string {
  return formatOrderTotal(currency, amount)
}

export function renderPreheader(text: string): string {
  return `
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;mso-hide:all;">
      ${escapeHtml(text)}&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;
    </div>
  `
}

export function renderEmailHeader(options?: { eyebrow?: string }) {
  const logoUrl = getLogoUrl()
  const eyebrow = options?.eyebrow

  return `
    <tr>
      <td style="background:${EMAIL_BRAND.dark};padding:28px 32px 24px;text-align:center;">
        <a href="${escapeHtml(getAppUrl())}" style="text-decoration:none;display:inline-block;">
          <img
            src="${escapeHtml(logoUrl)}"
            alt="Gelos"
            width="148"
            height="38"
            style="display:block;margin:0 auto;border:0;outline:none;height:auto;max-width:148px;"
          />
        </a>
        ${
          eyebrow
            ? `
        <p style="margin:14px 0 0;font-size:11px;font-weight:600;letter-spacing:0.14em;text-transform:uppercase;color:${EMAIL_BRAND.lime};">
          ${escapeHtml(eyebrow)}
        </p>
        `
            : ''
        }
      </td>
    </tr>
  `
}

export function renderHeroBlock(input: {
  title: string
  description: string
  orderNumber?: string
  highlight?: string
}) {
  const orderBadge = input.orderNumber
    ? `
      <div style="margin:0 0 16px;">
        <span style="display:inline-block;background:${EMAIL_BRAND.limeMuted};color:${EMAIL_BRAND.limeDark};font-size:12px;font-weight:700;letter-spacing:0.04em;padding:6px 14px;border-radius:999px;">
          ${escapeHtml(input.orderNumber)}
        </span>
      </div>
    `
    : ''

  const highlight = input.highlight
    ? `
      <div style="margin-top:20px;background:${EMAIL_BRAND.surface};border:1px solid ${EMAIL_BRAND.border};border-radius:12px;padding:14px 16px;">
        <p style="margin:0;font-size:14px;line-height:1.55;color:${EMAIL_BRAND.muted};">
          ${escapeHtml(input.highlight)}
        </p>
      </div>
    `
    : ''

  return `
    ${orderBadge}
    <h1 style="margin:0 0 10px;font-size:26px;font-weight:700;letter-spacing:-0.03em;line-height:1.2;color:${EMAIL_BRAND.text};">
      ${escapeHtml(input.title)}
    </h1>
    <p style="margin:0;font-size:15px;line-height:1.65;color:${EMAIL_BRAND.muted};">
      ${escapeHtml(input.description)}
    </p>
    ${highlight}
  `
}

export function renderStatusPills(paymentStatus: string, channel: string) {
  const normalized = paymentStatus.toLowerCase()
  const isPaid = normalized === 'paid'
  const isRefunded = normalized === 'refunded'
  const isVoided = normalized === 'voided'
  const isPartial = normalized === 'partially paid'

  let statusBg = EMAIL_BRAND.warningBg
  let statusColor = EMAIL_BRAND.warning
  if (isPaid) {
    statusBg = EMAIL_BRAND.successBg
    statusColor = EMAIL_BRAND.success
  } else if (isRefunded || isVoided) {
    statusBg = '#fff1f2'
    statusColor = '#be123c'
  } else if (isPartial) {
    statusBg = '#eff6ff'
    statusColor = '#1d4ed8'
  }

  const statusLabel = paymentStatus.trim() || 'Payment pending'

  return `
    <table cellpadding="0" cellspacing="0" style="margin:24px 0 0;">
      <tr>
        <td style="padding-right:8px;">
          <span style="display:inline-block;background:${statusBg};color:${statusColor};font-size:12px;font-weight:600;padding:6px 12px;border-radius:999px;">
            ${escapeHtml(statusLabel)}
          </span>
        </td>
        <td>
          <span style="display:inline-block;background:${EMAIL_BRAND.surface};color:${EMAIL_BRAND.muted};font-size:12px;font-weight:600;padding:6px 12px;border-radius:999px;border:1px solid ${EMAIL_BRAND.border};">
            ${escapeHtml(channel)}
          </span>
        </td>
      </tr>
    </table>
  `
}

type DetailRow = {
  label: string
  value: string
  multiline?: boolean
}

export function renderDetailCard(title: string, rows: DetailRow[]) {
  if (rows.length === 0) return ''

  const rowHtml = rows
    .map(
      (row, index) => `
      <tr>
        <td style="padding:${index === 0 ? '0' : '10px'} 0 ${index === rows.length - 1 ? '0' : '10px'};border-bottom:${index === rows.length - 1 ? 'none' : `1px solid ${EMAIL_BRAND.border}`};vertical-align:${row.multiline ? 'top' : 'middle'};">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="width:38%;font-size:13px;font-weight:500;color:${EMAIL_BRAND.subtle};padding-right:12px;">
                ${escapeHtml(row.label)}
              </td>
              <td style="font-size:14px;font-weight:600;color:${EMAIL_BRAND.text};text-align:right;line-height:1.5;">
                ${escapeHtml(row.value)}
              </td>
            </tr>
          </table>
        </td>
      </tr>
    `,
    )
    .join('')

  return `
    <div style="margin-top:28px;">
      <p style="margin:0 0 10px;font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:${EMAIL_BRAND.subtle};">
        ${escapeHtml(title)}
      </p>
      <table width="100%" cellpadding="0" cellspacing="0" style="background:${EMAIL_BRAND.surface};border:1px solid ${EMAIL_BRAND.border};border-radius:14px;padding:4px 18px;">
        ${rowHtml}
      </table>
    </div>
  `
}

export function renderSectionTitle(title: string) {
  return `
    <p style="margin:32px 0 12px;font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:${EMAIL_BRAND.subtle};">
      ${escapeHtml(title)}
    </p>
  `
}

function renderLineItemImage(item: CheckoutLineItem) {
  const src = item.variantImage?.trim()
  if (!src) return ''

  return `
    <td style="width:56px;padding-right:14px;vertical-align:top;">
      <img
        src="${escapeHtml(src)}"
        alt=""
        width="56"
        height="56"
        style="display:block;width:56px;height:56px;border-radius:10px;border:1px solid ${EMAIL_BRAND.border};object-fit:cover;background:${EMAIL_BRAND.white};"
      />
    </td>
  `
}

export function renderLineItemsCard(items: CheckoutLineItem[], currency: string) {
  const rows = items
    .map((item, index) => {
      const lineTotal = item.price * item.quantity
      const hasImage = Boolean(item.variantImage?.trim())

      return `
        <tr>
          <td style="padding:${index === 0 ? '16px' : '0'} 18px ${index === items.length - 1 ? '16px' : '14px'};${index < items.length - 1 ? `border-bottom:1px solid ${EMAIL_BRAND.border};` : ''}">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                ${hasImage ? renderLineItemImage(item) : ''}
                <td style="vertical-align:top;">
                  <div style="font-size:15px;font-weight:600;line-height:1.35;color:${EMAIL_BRAND.text};">
                    ${escapeHtml(item.name)}
                  </div>
                  <div style="margin-top:6px;font-size:13px;color:${EMAIL_BRAND.muted};">
                    Qty ${item.quantity} · ${formatMoney(currency, item.price)} each
                  </div>
                </td>
                <td style="width:90px;vertical-align:top;text-align:right;white-space:nowrap;font-size:15px;font-weight:600;color:${EMAIL_BRAND.text};">
                  ${formatMoney(currency, lineTotal)}
                </td>
              </tr>
            </table>
          </td>
        </tr>
      `
    })
    .join('')

  return `
    <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid ${EMAIL_BRAND.border};border-radius:14px;overflow:hidden;background:${EMAIL_BRAND.white};">
      ${rows}
    </table>
  `
}

export function renderOrderTotalsCard(
  currency: string,
  subtotal: number,
  discount: number,
  shipping: number,
  total: number,
) {
  const discountRow =
    discount > 0
      ? `
        <tr>
          <td style="padding:5px 0;font-size:14px;color:${EMAIL_BRAND.muted};">Discount</td>
          <td style="padding:5px 0;font-size:14px;text-align:right;color:${EMAIL_BRAND.success};font-weight:600;">−${formatMoney(currency, discount)}</td>
        </tr>
      `
      : ''

  return `
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:12px;background:${EMAIL_BRAND.surface};border:1px solid ${EMAIL_BRAND.border};border-radius:14px;">
      <tr>
        <td style="padding:18px 20px;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="padding:5px 0;font-size:14px;color:${EMAIL_BRAND.muted};">Subtotal</td>
              <td style="padding:5px 0;font-size:14px;text-align:right;color:${EMAIL_BRAND.text};">${formatMoney(currency, subtotal)}</td>
            </tr>
            ${discountRow}
            <tr>
              <td style="padding:5px 0;font-size:14px;color:${EMAIL_BRAND.muted};">Shipping</td>
              <td style="padding:5px 0;font-size:14px;text-align:right;color:${EMAIL_BRAND.text};">${shipping <= 0 ? 'Free' : formatMoney(currency, shipping)}</td>
            </tr>
            <tr>
              <td colspan="2" style="padding:12px 0 8px;">
                <div style="height:1px;background:${EMAIL_BRAND.border};"></div>
              </td>
            </tr>
            <tr>
              <td style="padding:4px 0;font-size:16px;font-weight:700;color:${EMAIL_BRAND.text};">Total</td>
              <td style="padding:4px 0;font-size:18px;font-weight:700;text-align:right;color:${EMAIL_BRAND.text};">${formatMoney(currency, total)}</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  `
}

export function renderPrimaryButton(href: string, label: string) {
  return `
    <table cellpadding="0" cellspacing="0" style="margin-top:28px;">
      <tr>
        <td align="center" style="border-radius:999px;background:${EMAIL_BRAND.lime};">
          <a
            href="${escapeHtml(href)}"
            style="display:inline-block;padding:14px 28px;font-size:14px;font-weight:700;letter-spacing:-0.01em;color:${EMAIL_BRAND.limeDark};text-decoration:none;border-radius:999px;"
          >
            ${escapeHtml(label)}
          </a>
        </td>
      </tr>
    </table>
  `
}

export function renderSupportFooter() {
  return `
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:32px;padding-top:24px;border-top:1px solid ${EMAIL_BRAND.border};">
      <tr>
        <td style="text-align:center;">
          <p style="margin:0 0 8px;font-size:14px;font-weight:600;color:${EMAIL_BRAND.text};">Need help with your order?</p>
          <p style="margin:0;font-size:13px;line-height:1.6;color:${EMAIL_BRAND.muted};">
            Reply to this email or contact
            <a href="mailto:hello@gelosglobal.com" style="color:${EMAIL_BRAND.limeDark};font-weight:600;text-decoration:underline;">hello@gelosglobal.com</a>
          </p>
        </td>
      </tr>
    </table>
  `
}

export function renderEmailLayout(input: {
  title: string
  preheader?: string
  headerEyebrow?: string
  bodyHtml: string
  footerNote?: string
}) {
  const { title, preheader, headerEyebrow, bodyHtml, footerNote } = input

  return `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="color-scheme" content="light" />
    <meta name="supported-color-schemes" content="light" />
    <title>${escapeHtml(title)}</title>
  </head>
  <body style="margin:0;padding:0;background:#f0f0f0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:${EMAIL_BRAND.text};-webkit-font-smoothing:antialiased;">
    ${preheader ? renderPreheader(preheader) : ''}
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#f0f0f0;padding:40px 16px;">
      <tr>
        <td align="center">
          <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="max-width:600px;background:${EMAIL_BRAND.white};border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.06);">
            ${renderEmailHeader({ eyebrow: headerEyebrow })}
            <tr>
              <td style="padding:32px 32px 36px;">
                ${bodyHtml}
              </td>
            </tr>
            ${
              footerNote
                ? `
            <tr>
              <td style="padding:0 32px 28px;">
                <p style="margin:0;font-size:12px;line-height:1.6;color:${EMAIL_BRAND.subtle};text-align:center;">
                  ${footerNote}
                </p>
              </td>
            </tr>
            `
                : ''
            }
          </table>
          <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="max-width:600px;margin-top:20px;">
            <tr>
              <td align="center" style="font-size:12px;line-height:1.6;color:${EMAIL_BRAND.subtle};">
                <a href="${escapeHtml(getAppUrl())}" style="color:${EMAIL_BRAND.muted};text-decoration:none;font-weight:600;">gelosglobal.com</a>
                <span style="color:#d4d4d4;"> · </span>
                © ${new Date().getFullYear()} Gelos
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
  `.trim()
}
