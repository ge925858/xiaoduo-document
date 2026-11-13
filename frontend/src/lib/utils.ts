import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function makeId(prefix: string): string {
  return `${prefix}-${crypto.randomUUID()}`
}

export async function hashPassword(password: string): Promise<string> {
  const encoded = new TextEncoder().encode(password)
  const digest = await crypto.subtle.digest('SHA-256', encoded)
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
}

export function initials(name: string): string {
  return name.trim().slice(0, 2).toUpperCase()
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
