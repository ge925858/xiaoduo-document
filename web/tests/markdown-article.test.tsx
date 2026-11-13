// @vitest-environment jsdom

import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { MarkdownArticle } from '@/components/markdown-article'

describe('MarkdownArticle', () => {
  it('renders canonical Markdown through the public content boundary', () => {
    render(
      <MarkdownArticle markdown={'## 小节标题\n\n一段公开正文。\n\n- [x] 已完成'} />,
    )

    expect(
      screen.getByRole('heading', { level: 2, name: '小节标题' }),
    ).toBeInTheDocument()
    expect(screen.getByText('一段公开正文。')).toBeInTheDocument()
    expect(screen.getByRole('checkbox')).toBeChecked()
  })
})
