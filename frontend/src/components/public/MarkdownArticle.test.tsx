import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { MarkdownArticle } from './MarkdownArticle'

describe('MarkdownArticle', () => {
  it('renders safe text color, underline, and highlight marks', () => {
    const { container } = render(
      <MarkdownArticle
        markdown={'<span style="color: #2563eb"><u><mark>重点</mark></u></span>'}
      />,
    )

    expect(container.querySelector('span')?.getAttribute('style')).toMatch(
      /color:\s*(#2563eb|rgb\(37,\s*99,\s*235\))/,
    )
    expect(container.querySelector('u')?.textContent).toBe('重点')
    expect(container.querySelector('mark')?.textContent).toBe('重点')
  })

  it('removes unsafe raw HTML', () => {
    const { container } = render(
      <MarkdownArticle markdown={'正文<script>alert(1)</script>'} />,
    )

    expect(container.querySelector('script')).toBeNull()
    expect(container.textContent).toContain('正文')
  })
})
