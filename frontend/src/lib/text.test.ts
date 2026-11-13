import { describe, expect, it } from 'vitest'
import type { JSONContent } from '@tiptap/core'
import { countWords } from './utils'
import { excerpt, extractPlainText, formatDateTime } from './text'

describe('text helpers', () => {
  const document: JSONContent = {
    type: 'doc',
    content: [
      {
        type: 'heading',
        attrs: { level: 2 },
        content: [{ type: 'text', text: '安静地写' }],
      },
      {
        type: 'paragraph',
        content: [{ type: 'text', text: '把想法留在纸上。' }],
      },
    ],
  }

  it('extracts searchable plain text from editor JSON', () => {
    expect(extractPlainText(document)).toContain('安静地写')
    expect(extractPlainText(document)).toContain('把想法留在纸上。')
  })

  it('creates a bounded excerpt', () => {
    expect(excerpt('一二三四五六七八九十', 5)).toBe('一二三四五…')
  })

  it('formats an exact local date and time', () => {
    expect(formatDateTime('2026-11-12T15:08:00.000Z')).toBe(
      '2026/11/12 23:08',
    )
  })

  it('counts Chinese characters and Latin words', () => {
    expect(countWords('知笺 notes app')).toBe(4)
  })
})
