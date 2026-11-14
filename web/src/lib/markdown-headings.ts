import GithubSlugger from 'github-slugger'

export interface MarkdownHeading {
  id: string
  level: number
  text: string
}

function plainHeadingText(value: string): string {
  return value
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/[*_~`]/g, '')
    .trim()
}

export function markdownHeadings(markdown: string): MarkdownHeading[] {
  const slugger = new GithubSlugger()
  const headings: MarkdownHeading[] = []
  let inCodeBlock = false
  for (const line of markdown.split(/\r?\n/)) {
    if (line.trimStart().startsWith('```')) {
      inCodeBlock = !inCodeBlock
      continue
    }
    if (inCodeBlock) continue
    const match = /^(#{1,5})\s+(.+?)\s*#*\s*$/.exec(line)
    if (!match) continue
    const text = plainHeadingText(match[2])
    if (!text) continue
    headings.push({
      id: slugger.slug(text),
      level: match[1].length,
      text,
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
