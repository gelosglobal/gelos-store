import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { isAdminUser } from '@/lib/auth/admin'
import { isAffiliateUser } from '@/lib/auth/affiliate'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (pathname.startsWith('/admin') && !pathname.startsWith('/admin/login')) {
    const session = await auth.api.getSession({
      headers: await headers(),
    })

    if (!session || !isAdminUser(session.user)) {
      const loginUrl = new URL('/admin/login', request.url)
      loginUrl.searchParams.set('next', pathname)
      return NextResponse.redirect(loginUrl)
    }
  }

  if (pathname.startsWith('/api/admin')) {
    const session = await auth.api.getSession({
      headers: await headers(),
    })

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!isAdminUser(session.user)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
  }

  if (
    pathname.startsWith('/affiliate/dashboard') ||
    pathname === '/affiliate/dashboard'
  ) {
    const session = await auth.api.getSession({
      headers: await headers(),
    })

    if (!session || !isAffiliateUser(session.user)) {
      const loginUrl = new URL('/affiliate/login', request.url)
      loginUrl.searchParams.set('next', pathname)
      return NextResponse.redirect(loginUrl)
    }
  }

  if (pathname.startsWith('/api/affiliate/')) {
    if (pathname.startsWith('/api/affiliate/auth/signup')) {
      return NextResponse.next()
    }

    const session = await auth.api.getSession({
      headers: await headers(),
    })

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!isAffiliateUser(session.user)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
  }

  return NextResponse.next()
}

export const config = {
  runtime: 'nodejs',
  matcher: [
    '/admin/:path*',
    '/api/admin/:path*',
    '/affiliate/dashboard',
    '/affiliate/dashboard/:path*',
    '/api/affiliate/:path*',
  ],
}
