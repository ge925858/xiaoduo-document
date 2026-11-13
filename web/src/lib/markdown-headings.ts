export interface MarkdownHeading {
  id: string
  level: number
  text: string
}

function headingId(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, '')
    .replace(/\s+/g, '-')
}

export function markdownHeadings(markdown: string): MarkdownHeading[] {
  const headings: MarkdownHeading[] = []
  let inCodeBlock = false
  for (const line of markdown.split(/\r?\n/)) {
    if (line.trimStart().startsWith('```')) {
      inCodeBlock = !inCodeBlock
      continue
    }
    if (inCodeBlock) continue
    const match = /^(#{1,5})\s+(.+?)\s*$/.exec(line)
    if (!match) continue
    headings.push({
      id: headingId(match[2]),
      level: match[1].length,
      text: match[2],
    })
  }
  return headings
}

export function countWords(text: string): number {
  const normalized = text.trim()
  if (!normalized) return 0
  const chinese = normalized.match(/[\u3400-\u9fff]/g)?.length ?? 0
  const latin = normalized
    .replace(/[\u3400-\u9fff]/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean).length
  return chinese + latin
}
