import { NextResponse } from 'next/server'
import { authorizeOwnerMutation } from '@/lib/studio-request'
import { importMarkdownDraft } from '@/server/article-import'

export async function POST(request: Request) {
  const authorization = await authorizeOwnerMutation(request)
  if (authorization.error) return authorization.error
  const form = await request.formData()
  const categoryId = String(form.get('categoryId') ?? '')
  const file = form.get('file')
  if (!categoryId || !(file instanceof File)) {
    return NextResponse.json({ error: 'INVALID_IMPORT' }, { status: 400 })
  }
  try {
    const imported = await importMarkdownDraft({
      categoryId,
      fileName: file.name,
      markdown: await file.text(),
    })
    return NextResponse.json({ article: imported }, { status: 201 })
  } catch (error) {
    const code = error instanceof Error ? error.message : 'UNKNOWN'
    return NextResponse.json(
      { error: code },
      { status: code === 'UNSUPPORTED_FILE' ? 415 : 400 },
    )
  }
}
