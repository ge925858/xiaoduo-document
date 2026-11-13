type LogContext = Record<string, unknown>

function writeLog(
  level: 'info' | 'error',
  event: string,
  context: LogContext,
) {
  const line = JSON.stringify({
    level,
    event,
    at: new Date().toISOString(),
    ...context,
  })
  if (level === 'error') console.error(line)
  else console.log(line)
}

export function logInfo(event: string, context: LogContext = {}) {
  writeLog('info', event, context)
}

export function parseSentryDsn(dsn: string) {
  try {
    const url = new URL(dsn)
    const projectId = url.pathname.split('/').filter(Boolean).at(-1)
    const publicKey = url.username
    if (!projectId || !publicKey) return null
    return {
      endpoint: `${url.protocol}//${url.host}/api/${projectId}/store/`,
      publicKey,
      projectId,
    }
  } catch {
    return null
  }
}

export async function reportError(
  error: unknown,
  context: LogContext = {},
  options: {
    dsn?: string
    fetchImpl?: typeof fetch
  } = {},
) {
  const message = error instanceof Error ? error.message : String(error)
  writeLog('error', 'application_error', { message, ...context })
  const dsn = options.dsn ?? process.env.SENTRY_DSN
  if (!dsn) return
  const sentry = parseSentryDsn(dsn)
  if (!sentry) {
    writeLog('error', 'sentry_dsn_invalid', {})
    return
  }
  const request = options.fetchImpl ?? fetch
  try {
    await request(sentry.endpoint, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-sentry-auth': `Sentry sentry_version=7, sentry_key=${sentry.publicKey}, sentry_client=zhijian/1.0`,
      },
      body: JSON.stringify({
        event_id: crypto.randomUUID().replaceAll('-', ''),
        timestamp: new Date().toISOString(),
        platform: 'node',
        level: 'error',
        message,
        extra: context,
        tags: { service: 'zhijian-web' },
      }),
    })
  } catch (reportingError) {
    writeLog('error', 'sentry_report_failed', {
      message:
        reportingError instanceof Error
          ? reportingError.message
          : String(reportingError),
    })
  }
}
