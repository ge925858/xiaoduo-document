import { afterEach, describe, expect, it } from 'vitest'
import { Editor } from '@tiptap/core'
import { createEditorExtensions } from '../components/editor/extensions'

let editor: Editor | null = null

afterEach(() => {
  editor?.destroy()
  editor = null
})

describe('Markdown formatting', () => {
  it('round-trips underline, text color, highlight, and H5 headings', () => {
    editor = new Editor({
      extensions: createEditorExtensions({ editable: true }),
      content: '##### 五级标题\n\n颜色文字',
      contentType: 'markdown',
    })

    const lastTextPosition = editor.state.doc.content.size - 3
    editor
      .chain()
      .setTextSelection({ from: lastTextPosition, to: lastTextPosition + 4 })
      .setColor('#2563eb')
      .toggleUnderline()
      .toggleHighlight({ color: '#fde68a' })
      .run()

    const markdown = editor.getMarkdown()
    expect(markdown).toContain('##### 五级标题')
    expect(markdown).toContain('<span style="color: #2563eb">')
    expect(markdown).toContain('<u>')
    expect(markdown).toContain('style="background-color: #fde68a"')

    editor.commands.setContent(markdown, {
      contentType: 'markdown',
      emitUpdate: false,
    })
    const serialized = JSON.stringify(editor.getJSON())
    expect(serialized).toContain('"level":5')
    expect(serialized).toContain('"textStyle"')
    expect(serialized).toContain('"underline"')
    expect(serialized).toContain('"highlight"')
  })
})
