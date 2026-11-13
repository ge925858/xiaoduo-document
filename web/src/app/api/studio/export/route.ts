import { NextResponse } from 'next/server'
import { requireOwner } from '@/lib/server-session'
import { createLibraryExport } from '@/server/library-export'

export async function GET() {
  const session = await requireOwner()
  if (!session) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  }
  const result = await createLibraryExport()
  const date = result.generatedAt.slice(0, 10)
  return new Response(new Uint8Array(result.zip), {
    headers: {
      'content-type': 'application/zip',
      'content-disposition': `attachment; filename="zhijian-export-${date}.zip"`,
      'cache-control': 'private, no-store',
    },
  })
}
