'use client'

import { PublicSearchError } from '@/components/public-search-state'

export default function SearchError({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return <PublicSearchError onRetry={reset} />
}
