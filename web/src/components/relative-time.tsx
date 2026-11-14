'use client'

import { useSyncExternalStore } from 'react'
import { formatRelativeTime } from '@/lib/format-time'

function subscribe() {
  return () => undefined
}

export function RelativeTime({ iso }: { iso: string }) {
  const mounted = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  )
  return <span>{mounted ? formatRelativeTime(iso) : ''}</span>
}
