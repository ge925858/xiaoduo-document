import { describe, expect, it } from 'vitest'
import { buildMarkdownDiff } from './markdownDiff'

describe('buildMarkdownDiff', () => {
  it('detects added, removed, and modified content blocks', () => {
    const result = buildMarkdownDiff(
      '## 第一节\n\n原来的正文内容。\n\n## 删除的小节\n\n这一段会被删除。',
      '## 第一节\n\n修改后的正文内容，保留大部分文字。\n\n## 新增的小节\n\n全新的内容。',
    )

    expect(result.changes.map((change) => change.kind)).toEqual([
      'modified',
      'modified',
      'removed',
      'added',
    ])
    expect(result.changes[0].heading).toBe('第一节')
    expect(result.changes[2].before?.text).toContain('这一段会被删除')
    expect(result.changes[3].after?.text).toContain('全新的内容')
  })

  it('returns no changes for identical Markdown', () => {
    const result = buildMarkdownDiff(
      '## 标题\n\n相同内容。',
      '## 标题\n\n相同内容。',
    )
    expect(result.changes).toHaveLength(0)
  })
})
