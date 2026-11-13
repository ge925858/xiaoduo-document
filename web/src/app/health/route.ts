import { sql } from 'drizzle-orm'
import { NextResponse } from 'next/server'
import { db } from '@/db/client'
import { reportError } from '@/lib/observability'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    await db.execute(sql`SELECT 1`)
    return NextResponse.json({ status: 'ok', database: 'ok' })
  } catch (error) {
    await reportError(error, { source: 'health-check' })
    return NextResponse.json(
      { status: 'error', database: 'unavailable' },
      { status: 503 },
    )
  }
}
