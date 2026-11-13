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

  it('removes executable raw HTML while keeping safe markup', () => {
    const { container } = render(
      <MarkdownArticle
        markdown={'<script>alert("x")</script>\n\n<u>安全强调</u>'}
      />,
    )

    expect(container.querySelector('script')).toBeNull()
    expect(container.querySelector('u')).toHaveTextContent('安全强调')
  })
})
