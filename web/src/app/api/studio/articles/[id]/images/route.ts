import { NextResponse } from 'next/server'
import { z } from 'zod'
import { authorizeArticleMutation } from '@/lib/studio-request'
import {
  createImageUploadTarget,
  createOssImageUploadConfiguration,
} from '@/server/image-upload'

const schema = z.object({
  contentType: z.string().min(1).max(100),
  size: z.number().int().positive(),
})

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params
  const authorization = await authorizeArticleMutation(request, id)
  if (authorization.error) return authorization.error
  const parsed = schema.safeParse(await request.json())
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'INVALID_IMAGE_UPLOAD' },
      { status: 400 },
    )
  }
  const configuration = createOssImageUploadConfiguration()
  if (!configuration) {
    return NextResponse.json(
      { error: 'OSS_NOT_CONFIGURED' },
      { status: 503 },
    )
  }
  try {
    const upload = await createImageUploadTarget(
      {
        articleId: id,
        ...parsed.data,
      },
      configuration,
    )
    return NextResponse.json({ upload }, { status: 201 })
  } catch (error) {
    const code = error instanceof Error ? error.message : 'UPLOAD_FAILED'
    return NextResponse.json(
      { error: code },
      { status: code === 'IMAGE_TOO_LARGE' ? 413 : 415 },
    )
  }
}
