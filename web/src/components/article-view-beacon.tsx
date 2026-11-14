'use client'

import { useEffect, useRef } from 'react'

export function ArticleViewBeacon({
  articleId,
  disabled = false,
}: {
  articleId: string
  disabled?: boolean
}) {
  const sentRef = useRef(false)

  useEffect(() => {
    if (
      disabled ||
      sentRef.current ||
      document.visibilityState !== 'visible'
    ) {
      return
    }
    sentRef.current = true
    void fetch(`/api/public/articles/${articleId}/view`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ referrer: document.referrer }),
    })
  }, [articleId, disabled])

  return null
}
