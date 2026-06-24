import { NextResponse } from 'next/server'
import {
  isDentistAuthConfigured,
  isDentistSessionValid,
} from '@/lib/dentist/auth'

export async function GET() {
  return NextResponse.json({
    authenticated: await isDentistSessionValid(),
    configured: isDentistAuthConfigured(),
  })
}
