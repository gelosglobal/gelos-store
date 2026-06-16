import { NextResponse } from 'next/server'
import { z } from 'zod'
import {
  getResendFromEmail,
  isResendConfigured,
} from '@/lib/env'
import { getResendClient } from '@/lib/email/resend'
import { buildMarketingCampaignEmail } from '@/lib/email/templates/marketing-campaign'
import { prisma } from '@/lib/prisma'
import { isAdminDatabaseReady } from '@/lib/db/admin-products'

export const dynamic = 'force-dynamic'

const bodySchema = z.object({
  subject: z.string().trim().min(3).max(120),
  headline: z.string().trim().min(3).max(120),
  body: z.string().trim().min(3).max(5000),
  ctaLabel: z.string().trim().max(40).optional(),
  ctaHref: z.string().trim().max(300).optional(),
  recipientEmail: z.string().trim().email().optional(),
  dryRun: z.boolean().optional(),
})

function chunk<T>(arr: T[], size: number) {
  const out: T[][] = []
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size))
  return out
}

async function mapWithConcurrency<T, R>(
  items: readonly T[],
  concurrency: number,
  fn: (item: T) => Promise<R>,
): Promise<R[]> {
  const results: R[] = new Array(items.length)
  let idx = 0

  const workers = Array.from({ length: Math.max(1, concurrency) }, async () => {
    while (idx < items.length) {
      const current = idx
      idx += 1
      results[current] = await fn(items[current]!)
    }
  })

  await Promise.all(workers)
  return results
}

export async function POST(request: Request) {
  if (!isAdminDatabaseReady()) {
    return NextResponse.json(
      { error: 'Database is not connected.' },
      { status: 503 },
    )
  }

  if (!isResendConfigured()) {
    return NextResponse.json(
      { error: 'Email is not configured (missing RESEND_API_KEY).' },
      { status: 503 },
    )
  }

  const resend = getResendClient()
  if (!resend) {
    return NextResponse.json(
      { error: 'Email is not configured.' },
      { status: 503 },
    )
  }

  try {
    const json = await request.json()
    const parsed = bodySchema.safeParse(json)
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? 'Invalid campaign' },
        { status: 400 },
      )
    }

    const { subject, html } = buildMarketingCampaignEmail(parsed.data)

    if (parsed.data.recipientEmail) {
      if (parsed.data.dryRun) {
        return NextResponse.json({
          ok: true,
          mode: 'broadcast',
          dryRun: true,
          recipients: 1,
        })
      }

      const email = parsed.data.recipientEmail.trim().toLowerCase()
      const { error } = await resend.emails.send({
        from: getResendFromEmail(),
        to: email,
        subject,
        html,
      })

      if (error) {
        console.error('[email-campaign single]', error)
        return NextResponse.json(
          { error: 'Failed to send email' },
          { status: 500 },
        )
      }

      return NextResponse.json({
        ok: true,
        mode: 'broadcast',
        recipients: 1,
        sent: 1,
        failed: 0,
        failures: [],
      })
    }

    // Real send: all subscribed customers (emailSubscription === "Subscribed")
    const recipients = await prisma.customer.findMany({
      where: {
        emailSubscription: 'Subscribed',
        NOT: { email: '' },
      },
      select: {
        email: true,
        name: true,
      },
    })

    const emails = recipients
      .map((r) => r.email.trim().toLowerCase())
      .filter(Boolean)

    const uniqueEmails = Array.from(new Set(emails))

    if (uniqueEmails.length === 0) {
      return NextResponse.json(
        { error: 'No subscribed customers with email addresses found.' },
        { status: 400 },
      )
    }

    if (parsed.data.dryRun) {
      return NextResponse.json({
        ok: true,
        mode: 'broadcast',
        dryRun: true,
        recipients: uniqueEmails.length,
      })
    }

    // Send in small batches with limited concurrency
    const batches = chunk(uniqueEmails, 50)
    let sent = 0
    let failed = 0
    const failures: Array<{ email: string; message: string }> = []

    await mapWithConcurrency(batches, 3, async (batch) => {
      const results = await Promise.all(
        batch.map(async (email) => {
          const { error } = await resend.emails.send({
            from: getResendFromEmail(),
            to: email,
            subject,
            html,
          })
          return { email, ok: !error, error }
        }),
      )

      results.forEach((r) => {
        if (r.ok) sent += 1
        else {
          failed += 1
          failures.push({
            email: r.email,
            message: r.error?.message ?? 'Send failed',
          })
        }
      })
    })

    return NextResponse.json({
      ok: true,
      mode: 'broadcast',
      recipients: uniqueEmails.length,
      sent,
      failed,
      failures: failures.slice(0, 25),
    })
  } catch (error) {
    console.error('[POST /api/admin/email-campaign]', error)
    return NextResponse.json(
      { error: 'Failed to send campaign' },
      { status: 500 },
    )
  }
}

