import { describe, expect, it } from 'vitest'
import { markdownHeadings } from './markdownHeadings'

describe('markdownHeadings', () => {
  it('extracts h1 through h5 headings and ignores fenced code', () => {
    const headings = markdownHeadings(
      '# 总章\n\n## 第一节\n\n正文\n\n### 小节\n\n#### 细节\n\n##### 补充\n\n```md\n## 代码里的标题\n```\n\n## 第二节\n',
    )

    expect(headings).toEqual([
      { id: '总章', level: 1, text: '总章' },
      { id: '第一节', level: 2, text: '第一节' },
      { id: '小节', level: 3, text: '小节' },
      { id: '细节', level: 4, text: '细节' },
      { id: '补充', level: 5, text: '补充' },
      { id: '第二节', level: 2, text: '第二节' },
    ])
  })
})
