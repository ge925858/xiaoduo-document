'use client'

import { Button } from '@/components/ui/button'

export function PublicSearchLoading() {
  return (
    <div className="page-loader">
      <span />
      正在搜索公开章节
    </div>
  )
}

export function PublicSearchError({
  onRetry,
}: {
  onRetry?: () => void
}) {
  return (
    <div className="search-results-empty">
      <p className="font-display text-xl text-[var(--ink)]">
        搜索暂时不可用
      </p>
      <p>请稍后重试。</p>
      <Button type="button" onClick={onRetry}>
        重新搜索
      </Button>
    </div>
  )
}
