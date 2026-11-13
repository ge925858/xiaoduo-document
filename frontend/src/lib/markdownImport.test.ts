import { afterEach, describe, expect, it } from 'vitest'
import { Editor } from '@tiptap/core'
import StarterKit from '@tiptap/starter-kit'
import { Markdown } from '@tiptap/markdown'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'

let editor: Editor | null = null

afterEach(() => {
  editor?.destroy()
  editor = null
})

describe('Markdown import', () => {
  it('parses headings, lists, tasks, and inline marks into editor JSON', () => {
    editor = new Editor({
      extensions: [
        StarterKit,
        TaskList,
        TaskItem,
        Markdown.configure({
          indentation: { style: 'space', size: 2 },
        }),
      ],
      content: '',
    })

    const parsed = editor.storage.markdown.manager.parse(
      '# 标题\n\n这是一段 **重点** 内容。\n\n- [x] 已完成\n- [ ] 待处理\n',
    )
    const serialized = JSON.stringify(parsed)

    expect(serialized).toContain('heading')
    expect(serialized).toContain('bold')
    expect(serialized).toContain('taskItem')
    expect(serialized).toContain('已完成')
  })
})
