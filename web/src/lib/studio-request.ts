import { NextResponse } from 'next/server'
import {
  getAccessibleArticle,
  studioActorFromUser,
} from '@/server/article-access'
import { requireOwner, requireStudioSession } from './server-session'

export async function authorizeOwnerMutation(request: Request) {
  const session = await requireOwner()
  if (!session) {
    return {
      error: NextResponse.json({ error: 'forbidden' }, { status: 403 }),
    }
  }
  const origin = request.headers.get('origin')
  if (origin !== (process.env.APP_ORIGIN ?? 'http://127.0.0.1:3100')) {
    return {
      error: NextResponse.json({ error: 'invalid origin' }, { status: 403 }),
    }
  }
  return { session }
}

export async function authorizeArticleMutation(
  request: Request,
  articleId: string,
) {
  const session = await requireStudioSession()
  if (!session) {
    return {
      error: NextResponse.json({ error: 'forbidden' }, { status: 403 }),
    }
  }
  const origin = request.headers.get('origin')
  if (origin !== (process.env.APP_ORIGIN ?? 'http://127.0.0.1:3100')) {
    return {
      error: NextResponse.json({ error: 'invalid origin' }, { status: 403 }),
    }
  }
  const article = await getAccessibleArticle(
    studioActorFromUser(session.user),
    articleId,
  )
  if (!article) {
    return {
      error: NextResponse.json({ error: 'forbidden' }, { status: 403 }),
    }
  }
  return { session, article }
}

export async function authorizeStudioMutation(request: Request) {
  const session = await requireStudioSession()
  if (!session) {
    return {
      error: NextResponse.json({ error: 'forbidden' }, { status: 403 }),
    }
  }
  const origin = request.headers.get('origin')
  if (origin !== (process.env.APP_ORIGIN ?? 'http://127.0.0.1:3100')) {
    return {
      error: NextResponse.json({ error: 'invalid origin' }, { status: 403 }),
    }
  }
  return { session }
}
