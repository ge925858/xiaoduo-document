import type { JSONContent } from '@tiptap/core'

export function extractPlainText(node?: JSONContent | null): string {
  if (!node) return ''

  const ownText = typeof node.text === 'string' ? node.text : ''
  const childText = node.content?.map(extractPlainText).join(' ') ?? ''
  const lineBreak = node.type === 'paragraph' || node.type === 'heading' ? '\n' : ' '

  return `${ownText}${childText ? `${lineBreak}${childText}` : ''}`
    .replace(/\s+/g, ' ')
    .trim()
}

export function excerpt(text: string, length = 86): string {
  const normalized = text.replace(/\s+/g, ' ').trim()
  return normalized.length > length
    ? `${normalized.slice(0, length).trim()}…`
    : normalized
}

export function formatRelativeTime(iso: string): string {
  const timestamp = new Date(iso).getTime()
  const diff = Date.now() - timestamp
  const minute = 60_000
  const hour = 60 * minute
  const day = 24 * hour

  if (diff < minute) return '刚刚'
  if (diff < hour) return `${Math.floor(diff / minute)} 分钟前`
  if (diff < day) return `${Math.floor(diff / hour)} 小时前`
  if (diff < 7 * day) return `${Math.floor(diff / day)} 天前`

  return new Intl.DateTimeFormat('zh-CN', {
    month: 'short',
    day: 'numeric',
  }).format(new Date(iso))
}

export function formatClock(iso: string): string {
  return new Intl.DateTimeFormat('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso))
}

export function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'Asia/Shanghai',
  }).format(new Date(iso))
}

export function todayLabel(): string {
  return new Intl.DateTimeFormat('zh-CN', {
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  }).format(new Date())
}
