import { NextResponse } from 'next/server'
import { adminAffiliateInputSchema } from '@/lib/admin/affiliate-input'
import { getAdminAffiliateDetail } from '@/lib/db/admin-affiliates'
import {
  deleteStoredAffiliate,
  findStoredAffiliateById,
  markAffiliateCommissionPaid,
  updateStoredAffiliate,
} from '@/lib/db/affiliates'
import { isAdminDatabaseReady } from '@/lib/db/admin-products'
import { sendAffiliateWelcomeEmail } from '@/lib/email/send-affiliate-welcome-email'

export const dynamic = 'force-dynamic'

type RouteContext = { params: Promise<{ id: string }> }

export async function GET(_request: Request, context: RouteContext) {
  if (!isAdminDatabaseReady()) {
    return NextResponse.json(
      { error: 'Database is not connected.' },
      { status: 503 },
    )
  }

  try {
    const { id } = await context.params
    const affiliate = await getAdminAffiliateDetail(id)
    if (!affiliate) {
      return NextResponse.json({ error: 'Affiliate not found.' }, { status: 404 })
    }

    return NextResponse.json({ affiliate })
  } catch (error) {
    console.error('[GET /api/admin/affiliates/[id]]', error)
    return NextResponse.json(
      { error: 'Failed to load affiliate' },
      { status: 500 },
    )
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  if (!isAdminDatabaseReady()) {
    return NextResponse.json(
      { error: 'Database is not connected.' },
      { status: 503 },
    )
  }

  try {
    const { id } = await context.params
    const json = await request.json()
    const parsed = adminAffiliateInputSchema.partial().safeParse(json)

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? 'Invalid affiliate' },
        { status: 400 },
      )
    }

    const previous = await findStoredAffiliateById(id)
    const affiliate = await updateStoredAffiliate(id, parsed.data)

    const wasApproved =
      previous &&
      !previous.enabled &&
      affiliate.enabled &&
      affiliate.email.trim()

    if (wasApproved) {
      void sendAffiliateWelcomeEmail({
        name: affiliate.name,
        email: affiliate.email,
        code: affiliate.code,
        commissionPercent: affiliate.commissionPercent,
      })
    }

    return NextResponse.json({ affiliate })
  } catch (error) {
    if (error instanceof Error && error.message === 'AFFILIATE_CODE_EXISTS') {
      return NextResponse.json(
        { error: 'An affiliate with this code already exists.' },
        { status: 409 },
      )
    }

    console.error('[PATCH /api/admin/affiliates/[id]]', error)
    return NextResponse.json(
      { error: 'Failed to update affiliate' },
      { status: 500 },
    )
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  if (!isAdminDatabaseReady()) {
    return NextResponse.json(
      { error: 'Database is not connected.' },
      { status: 503 },
    )
  }

  try {
    const { id } = await context.params
    await deleteStoredAffiliate(id)
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('[DELETE /api/admin/affiliates/[id]]', error)
    return NextResponse.json(
      { error: 'Failed to delete affiliate' },
      { status: 500 },
    )
  }
}

export async function POST(request: Request, context: RouteContext) {
  if (!isAdminDatabaseReady()) {
    return NextResponse.json(
      { error: 'Database is not connected.' },
      { status: 503 },
    )
  }

  try {
    const { id } = await context.params
    const json = (await request.json().catch(() => ({}))) as {
      action?: string
    }

    if (json.action !== 'payout') {
      return NextResponse.json({ error: 'Unsupported action' }, { status: 400 })
    }

    const affiliate = await markAffiliateCommissionPaid(id)
    return NextResponse.json({ affiliate })
  } catch (error) {
    if (error instanceof Error && error.message === 'NO_PENDING_COMMISSION') {
      return NextResponse.json(
        { error: 'This affiliate has no pending commission to pay out.' },
        { status: 400 },
      )
    }

    console.error('[POST /api/admin/affiliates/[id]]', error)
    return NextResponse.json(
      { error: 'Failed to process payout' },
      { status: 500 },
    )
  }
}
