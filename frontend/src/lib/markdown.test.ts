import { describe, expect, it } from 'vitest'
import type { JSONContent } from '@tiptap/core'
import { noteToMarkdown } from './markdown'

describe('noteToMarkdown', () => {
  it('exports headings, tasks, and images', () => {
    const content: JSONContent = {
      type: 'doc',
      content: [
        {
          type: 'heading',
          attrs: { level: 2 },
          content: [{ type: 'text', text: '今日' }],
        },
        {
          type: 'taskList',
          content: [
            {
              type: 'taskItem',
              attrs: { checked: true },
              content: [
                {
                  type: 'paragraph',
                  content: [{ type: 'text', text: '完成原型' }],
                },
              ],
            },
          ],
        },
        {
          type: 'image',
          attrs: { src: 'https://example.com/a.jpg', alt: '桌面' },
        },
      ],
    }

    const markdown = noteToMarkdown('工作记录', content)
    expect(markdown).toContain('# 工作记录')
    expect(markdown).toContain('## 今日')
    expect(markdown).toContain('- [x] 完成原型')
    expect(markdown).toContain('![桌面](https://example.com/a.jpg)')
  })
})
