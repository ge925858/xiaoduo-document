'use client'

import { Button } from '@/components/ui/button'

export default function SearchError({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="search-results-empty">
      <p className="font-display text-xl text-[var(--ink)]">
        搜索暂时不可用
      </p>
      <p>请稍后重试。</p>
      <Button type="button" onClick={reset}>
        重新搜索
      </Button>
    </div>
  )
}
