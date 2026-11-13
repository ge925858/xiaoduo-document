'use client'

import { useEffect, useRef } from 'react'

export function ArticleViewBeacon({ articleId }: { articleId: string }) {
  const sentRef = useRef(false)

  useEffect(() => {
    if (sentRef.current || document.visibilityState !== 'visible') return
    sentRef.current = true
    void fetch(`/api/public/articles/${articleId}/view`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ referrer: document.referrer }),
    })
  }, [articleId])

  return null
}
