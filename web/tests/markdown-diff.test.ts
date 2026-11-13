import { describe, expect, it } from 'vitest'
import {
  buildInlineMarkdownDiff,
  buildMarkdownDiff,
  summarizeMarkdownDiff,
} from '@/lib/markdown-diff'

describe('Markdown content diff', () => {
  it('recognizes headings, paragraphs, lists, tasks, quotes, code, tables and images', () => {
    const markdown = `# 指南

普通段落。

- 第一项
- 第二项

- [ ] 待办

> 引用内容

\`\`\`ts
const value = 1
\`\`\`

| 名称 | 数值 |
| --- | --- |
| 示例 | 1 |

![示意图](https://example.com/image.png)`

    expect(
      buildMarkdownDiff(markdown, markdown).oldBlocks.map(
        (block) => block.kind,
      ),
    ).toEqual([
      'heading',
      'paragraph',
      'list',
      'task',
      'quote',
      'code',
      'table',
      'image',
    ])
  })

  it('pairs similar blocks as modified and keeps unrelated blocks removed', () => {
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
    const removed = result.changes.find((change) => change.kind === 'removed')
    const added = result.changes.find((change) => change.kind === 'added')
    expect(removed).toBeTruthy()
    expect(added).toBeTruthy()
    expect(result.oldChangeIds[removed!.oldIndex!]).toBe(removed!.id)
    expect(result.newChangeIds[added!.newIndex!]).toBe(added!.id)
  })

  it('marks inline added and removed text independently of the UI', () => {
    const result = buildInlineMarkdownDiff(
      '原来的正文内容，保留大部分文字。',
      '修改后的正文内容，保留大部分文字，并新增结论。',
    )

    expect(
      result.filter((part) => part.kind === 'removed').map((part) => part.text),
    ).toContain('原来')
    expect(
      result.filter((part) => part.kind === 'added').map((part) => part.text),
    ).toContain('修改后')
    expect(result.some((part) => part.kind === 'added' && part.text.includes('并新增结论'))).toBe(true)
  })

  it('summarizes total, added, removed and modified blocks', () => {
    const result = buildMarkdownDiff(
      '## 标题\n\n旧段落。\n\n## 删除\n\n删除内容。',
      '## 标题\n\n新段落内容。\n\n## 新增\n\n新增内容。',
    )
    expect(summarizeMarkdownDiff(result)).toMatchObject({
      total: result.changes.length,
    })
    expect(
      summarizeMarkdownDiff(result).total,
    ).toBe(
      summarizeMarkdownDiff(result).added +
        summarizeMarkdownDiff(result).removed +
        summarizeMarkdownDiff(result).modified,
    )
  })

  it('returns no changes for identical Markdown', () => {
    const result = buildMarkdownDiff(
      '## 标题\n\n相同内容。',
      '## 标题\n\n相同内容。',
    )
    expect(result.changes).toEqual([])
  })
})
