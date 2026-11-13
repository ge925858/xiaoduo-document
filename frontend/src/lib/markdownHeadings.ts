import GithubSlugger from 'github-slugger'

function plainHeadingText(value: string): string {
  return value
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/[*_~`]/g, '')
    .trim()
}

export function markdownHeadings(markdown: string): Array<{
  id: string
  level: number
  text: string
}> {
  const slugger = new GithubSlugger()
  const headings: Array<{ id: string; level: number; text: string }> = []
  let fenced = false

  for (const line of markdown.split(/\r?\n/)) {
    if (/^\s*```/.test(line)) {
      fenced = !fenced
      continue
    }
    if (fenced) continue
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
