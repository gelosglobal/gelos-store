import { getAppUrl, getResendFromEmail, isResendConfigured } from '@/lib/env'
import type { DentistAppointmentRecord } from '@/lib/dentist/appointment-types'
import { getResendClient } from '@/lib/email/resend'
import { dentistPartners } from '@/lib/gelos-ai/dentists'

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function buildNewAppointmentEmail(
  appointment: DentistAppointmentRecord,
  clinicName: string,
) {
  const portalUrl = `${getAppUrl()}/dentist`
  const subject = `New appointment request · ${appointment.patientName}`

  const html = `
    <div style="font-family:system-ui,sans-serif;line-height:1.5;color:#171717;max-width:560px">
      <h2 style="margin:0 0 12px;font-size:20px">New booking request</h2>
      <p style="margin:0 0 16px;color:#525252">
        A patient requested an appointment through Gelos for <strong>${escapeHtml(clinicName)}</strong>.
      </p>
      <table style="width:100%;border-collapse:collapse;font-size:14px">
        <tr><td style="padding:6px 0;color:#737373">Reference</td><td style="padding:6px 0"><strong>${escapeHtml(appointment.appointmentId)}</strong></td></tr>
        <tr><td style="padding:6px 0;color:#737373">Patient</td><td style="padding:6px 0">${escapeHtml(appointment.patientName)}</td></tr>
        <tr><td style="padding:6px 0;color:#737373">Email</td><td style="padding:6px 0">${escapeHtml(appointment.patientEmail)}</td></tr>
        <tr><td style="padding:6px 0;color:#737373">Phone</td><td style="padding:6px 0">${escapeHtml(appointment.patientPhone)}</td></tr>
        <tr><td style="padding:6px 0;color:#737373">Preferred</td><td style="padding:6px 0">${escapeHtml(appointment.preferredDate)} at ${escapeHtml(appointment.preferredTime)}</td></tr>
        <tr><td style="padding:6px 0;color:#737373">Reason</td><td style="padding:6px 0">${escapeHtml(appointment.reason || '—')}</td></tr>
      </table>
      <p style="margin:20px 0 0">
        <a href="${portalUrl}" style="display:inline-block;background:#171717;color:#fff;text-decoration:none;padding:10px 18px;border-radius:999px;font-size:14px;font-weight:600">
          Open dentist dashboard
        </a>
      </p>
    </div>
  `

  return { subject, html }
}

export async function notifyDentistNewAppointment(appointment: DentistAppointmentRecord) {
  if (!isResendConfigured()) return { sent: false as const, reason: 'not_configured' as const }

  const partner = dentistPartners[0]
  const to = partner?.emails ?? []
  if (to.length === 0) {
    return { sent: false as const, reason: 'missing_dentist_email' as const }
  }

  const resend = getResendClient()
  if (!resend) return { sent: false as const, reason: 'not_configured' as const }

  const { subject, html } = buildNewAppointmentEmail(
    appointment,
    partner?.clinic ?? 'Partner clinic',
  )

  const { error } = await resend.emails.send({
    from: getResendFromEmail(),
    to,
    subject,
    html,
    replyTo: appointment.patientEmail,
  })

  if (error) {
    console.error('[dentist email]', error)
    return { sent: false as const, reason: 'send_failed' as const }
  }

  return { sent: true as const }
}
