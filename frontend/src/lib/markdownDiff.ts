import { diffArrays } from 'diff'

export type MarkdownBlockKind =
  | 'heading'
  | 'paragraph'
  | 'list'
  | 'task'
  | 'quote'
  | 'code'
  | 'table'
  | 'image'
  | 'rule'

export interface MarkdownDiffBlock {
  index: number
  markdown: string
  text: string
  heading: string
  kind: MarkdownBlockKind
}

export interface MarkdownDiffChange {
  id: string
  kind: 'added' | 'removed' | 'modified'
  heading: string
  oldIndex: number | null
  newIndex: number | null
  before: MarkdownDiffBlock | null
  after: MarkdownDiffBlock | null
}

export interface MarkdownDiffResult {
  oldBlocks: MarkdownDiffBlock[]
  newBlocks: MarkdownDiffBlock[]
  changes: MarkdownDiffChange[]
  oldChangeIds: Array<string | null>
  newChangeIds: Array<string | null>
}

function blockKind(block: string): MarkdownBlockKind {
  if (/^#{1,5}\s/m.test(block)) return 'heading'
  if (/^\s*```/.test(block)) return 'code'
  if (/^\s*[-*+]\s+\[[ xX]\]\s/m.test(block)) return 'task'
  if (/^\s*([-*+]|\d+\.)\s/m.test(block)) return 'list'
  if (/^\s*>\s/m.test(block)) return 'quote'
  if (/^\s*\|.+\|\s*$/m.test(block)) return 'table'
  if (/^\s*!\[[^\]]*\]\([^)]+\)\s*$/m.test(block)) return 'image'
  if (/^\s*(---+|\*\*\*+)\s*$/.test(block)) return 'rule'
  return 'paragraph'
}

function blockText(markdown: string): string {
  return markdown
    .replace(/<[^>]+>/g, '')
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/^\s*#{1,5}\s+/gm, '')
    .replace(/^\s*([-*+]|\d+\.)\s+/gm, '')
    .replace(/^\s*>\s?/gm, '')
    .replace(/[*_~`=|]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function splitMarkdownBlocks(markdown: string): string[] {
  const blocks: string[] = []
  let current: string[] = []
  let fenced = false

  const flush = () => {
    const block = current.join('\n').trim()
    if (block) blocks.push(block)
    current = []
  }

  for (const line of markdown.replace(/\r\n/g, '\n').split('\n')) {
    if (/^\s*```/.test(line)) fenced = !fenced
    if (!fenced && !line.trim()) {
      flush()
      continue
    }
    current.push(line)
  }
  flush()
  return blocks
}

function describeBlocks(markdown: string): MarkdownDiffBlock[] {
  let heading = '正文'
  return splitMarkdownBlocks(markdown).map((block, index) => {
    const kind = blockKind(block)
    const text = blockText(block)
    if (kind === 'heading') heading = text || heading
    return {
      index,
      markdown: block,
      text,
      heading,
      kind,
    }
  })
}

function bigrams(value: string): Map<string, number> {
  const normalized = value.toLowerCase().replace(/\s+/g, '')
  const result = new Map<string, number>()
  if (normalized.length < 2) {
    if (normalized) result.set(normalized, 1)
    return result
  }
  for (let index = 0; index < normalized.length - 1; index += 1) {
    const gram = normalized.slice(index, index + 2)
    result.set(gram, (result.get(gram) ?? 0) + 1)
  }
  return result
}

function blockSimilarity(left: MarkdownDiffBlock, right: MarkdownDiffBlock) {
  if (left.kind !== right.kind) return 0
  if (left.text === right.text) return 1
  const leftGrams = bigrams(left.text)
  const rightGrams = bigrams(right.text)
  let overlap = 0
  let leftSize = 0
  let rightSize = 0
  leftGrams.forEach((count) => {
    leftSize += count
  })
  rightGrams.forEach((count) => {
    rightSize += count
  })
  leftGrams.forEach((count, gram) => {
    overlap += Math.min(count, rightGrams.get(gram) ?? 0)
  })
  return (2 * overlap) / Math.max(1, leftSize + rightSize)
}

export function buildMarkdownDiff(
  oldMarkdown: string,
  newMarkdown: string,
): MarkdownDiffResult {
  const oldBlocks = describeBlocks(oldMarkdown)
  const newBlocks = describeBlocks(newMarkdown)
  const changes: MarkdownDiffChange[] = []
  const oldChangeIds: Array<string | null> = Array(oldBlocks.length).fill(null)
  const newChangeIds: Array<string | null> = Array(newBlocks.length).fill(null)

  const addChange = (
    kind: MarkdownDiffChange['kind'],
    before: MarkdownDiffBlock | null,
    after: MarkdownDiffBlock | null,
  ) => {
    const id = `diff-${changes.length}-${before?.index ?? 'x'}-${
      after?.index ?? 'x'
    }`
    const change: MarkdownDiffChange = {
      id,
      kind,
      heading: after?.heading ?? before?.heading ?? '正文',
      oldIndex: before?.index ?? null,
      newIndex: after?.index ?? null,
      before,
      after,
    }
    changes.push(change)
    if (before) oldChangeIds[before.index] = id
    if (after) newChangeIds[after.index] = id
  }

  const pairChangedGroup = (
    removed: MarkdownDiffBlock[],
    added: MarkdownDiffBlock[],
  ) => {
    const matchedOld = new Set<number>()
    const matchedNew = new Set<number>()
    const pairs: Array<[MarkdownDiffBlock, MarkdownDiffBlock]> = []

    removed.forEach((oldBlock) => {
      let bestIndex = -1
      let bestScore = 0
      added.forEach((newBlock, index) => {
        if (matchedNew.has(index)) return
        const score = blockSimilarity(oldBlock, newBlock)
        if (score > bestScore) {
          bestScore = score
          bestIndex = index
        }
      })
      if (bestIndex >= 0 && bestScore >= 0.2) {
        matchedOld.add(oldBlock.index)
        matchedNew.add(bestIndex)
        pairs.push([oldBlock, added[bestIndex]])
      }
    })

    const operations: Array<{
      oldIndex: number
      newIndex: number
      render: () => void
    }> = []
    pairs.forEach(([before, after]) => {
      operations.push({
        oldIndex: before.index,
        newIndex: after.index,
        render: () => addChange('modified', before, after),
      })
    })
    removed.forEach((before) => {
      if (!matchedOld.has(before.index)) {
        operations.push({
          oldIndex: before.index,
          newIndex: Number.MAX_SAFE_INTEGER,
          render: () => addChange('removed', before, null),
        })
      }
    })
    added.forEach((after, index) => {
      if (!matchedNew.has(index)) {
        operations.push({
          oldIndex: Number.MAX_SAFE_INTEGER,
          newIndex: after.index,
          render: () => addChange('added', null, after),
        })
      }
    })
    operations
      .sort(
        (left, right) =>
          left.oldIndex - right.oldIndex || left.newIndex - right.newIndex,
      )
      .forEach((operation) => operation.render())
  }

  const parts = diffArrays(
    oldBlocks.map((block) => block.markdown),
    newBlocks.map((block) => block.markdown),
  )
  let oldCursor = 0
  let newCursor = 0

  for (let index = 0; index < parts.length; index += 1) {
    const part = parts[index]
    if (!part.added && !part.removed) {
      oldCursor += part.value.length
      newCursor += part.value.length
      continue
    }

    if (part.removed) {
      const removed = oldBlocks.slice(oldCursor, oldCursor + part.value.length)
      oldCursor += part.value.length
      const next = parts[index + 1]
      if (next?.added) {
        const added = newBlocks.slice(newCursor, newCursor + next.value.length)
        newCursor += next.value.length
        pairChangedGroup(removed, added)
        index += 1
      } else {
        removed.forEach((block) => addChange('removed', block, null))
      }
      continue
    }

    if (part.added) {
      const added = newBlocks.slice(newCursor, newCursor + part.value.length)
      newCursor += part.value.length
      added.forEach((block) => addChange('added', null, block))
    }
  }

  changes.sort(
    (left, right) =>
      (left.newIndex ?? left.oldIndex ?? 0) -
      (right.newIndex ?? right.oldIndex ?? 0),
  )
  return { oldBlocks, newBlocks, changes, oldChangeIds, newChangeIds }
}

export function changeLabel(change: MarkdownDiffChange): string {
  if (change.kind === 'added') return '新增'
  if (change.kind === 'removed') return '删除'
  return '修改'
}

export function changeExcerpt(change: MarkdownDiffChange): string {
  const text =
    change.after?.text ||
    change.before?.text ||
    change.after?.markdown ||
    change.before?.markdown ||
    ''
  return text.length > 72 ? `${text.slice(0, 72)}…` : text
}

export function blockTypeLabel(kind: MarkdownBlockKind): string {
  const labels: Record<MarkdownBlockKind, string> = {
    heading: '标题',
    paragraph: '段落',
    list: '列表',
    task: '待办',
    quote: '引用',
    code: '代码块',
    table: '表格',
    image: '图片',
    rule: '分割线',
  }
  return labels[kind]
}
