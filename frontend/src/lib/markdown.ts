import type { JSONContent } from '@tiptap/core'

function inlineText(node?: JSONContent): string {
  if (!node) return ''
  if (node.type === 'text') {
    let value = node.text ?? ''
    const marks = new Set(node.marks?.map((mark) => mark.type))
    if (marks.has('bold')) value = `**${value}**`
    if (marks.has('italic')) value = `*${value}*`
    if (marks.has('strike')) value = `~~${value}~~`
    if (marks.has('code')) value = `\`${value}\``
    return value
  }
  return node.content?.map(inlineText).join('') ?? ''
}

export function blocksToMarkdown(content: JSONContent): string {
  const lines: string[] = []
  for (const node of content.content ?? []) {
    switch (node.type) {
      case 'heading':
        lines.push(
          `${'#'.repeat(Number(node.attrs?.level ?? 2))} ${inlineText(node)}`,
          '',
        )
        break
      case 'paragraph':
        lines.push(inlineText(node), '')
        break
      case 'blockquote':
        lines.push(
          ...(node.content ?? []).map((child) => `> ${inlineText(child)}`),
          '',
        )
        break
      case 'codeBlock':
        lines.push(
          `\`\`\`${String(node.attrs?.language ?? '')}`,
          inlineText(node),
          '```',
          '',
        )
        break
      case 'horizontalRule':
        lines.push('---', '')
        break
      case 'image':
        lines.push(
          `![${String(node.attrs?.alt ?? '图片')}](${String(node.attrs?.src ?? '')})`,
          '',
        )
        break
      case 'bulletList':
      case 'orderedList': {
        const ordered = node.type === 'orderedList'
        ;(node.content ?? []).forEach((item, index) => {
          const children = item.content ?? []
          lines.push(
            `${ordered ? `${index + 1}.` : '-'} ${children.map(inlineText).join(' ')}`,
          )
        })
        lines.push('')
        break
      }
      case 'taskList':
        ;(node.content ?? []).forEach((item) => {
          lines.push(
            `- [${item.attrs?.checked ? 'x' : ' '}] ${(item.content ?? [])
              .map(inlineText)
              .join(' ')}`,
          )
        })
        lines.push('')
        break
      case 'table':
        ;(node.content ?? []).forEach((row, rowIndex) => {
          lines.push(
            `| ${(row.content ?? []).map(inlineText).join(' | ')} |`,
          )
          if (rowIndex === 0) {
            lines.push(
              `| ${(row.content ?? []).map(() => '---').join(' | ')} |`,
            )
          }
        })
        lines.push('')
        break
      default:
        if (node.content) lines.push(inlineText(node), '')
    }
  }

  return `${lines.join('\n').replace(/\n{3,}/g, '\n\n').trim()}\n`
}

export function noteToMarkdown(title: string, content: JSONContent): string {
  return `# ${title}\n\n${blocksToMarkdown(content)}`
}
