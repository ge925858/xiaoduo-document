import { describe, expect, it, vi } from 'vitest'
import {
  parseSentryDsn,
  reportError,
} from '@/lib/observability'

describe('observability', () => {
  it('parses a Sentry DSN and posts a structured error event', async () => {
    expect(
      parseSentryDsn('https://public-key@o123.ingest.sentry.io/456'),
    ).toEqual({
      endpoint: 'https://o123.ingest.sentry.io/api/456/store/',
      publicKey: 'public-key',
      projectId: '456',
    })

    const fetchImpl = vi.fn().mockResolvedValue(new Response('', { status: 200 }))
    await reportError(
      new Error('route failed'),
      { routePath: '/api/test' },
      {
        dsn: 'https://public-key@o123.ingest.sentry.io/456',
        fetchImpl,
      },
    )
    expect(fetchImpl).toHaveBeenCalledWith(
      'https://o123.ingest.sentry.io/api/456/store/',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'x-sentry-auth': expect.stringContaining('sentry_key=public-key'),
        }),
      }),
    )
  })
})
