import { deflateRawSync } from 'node:zlib'
import { asc, eq } from 'drizzle-orm'
import { db } from '@/db/client'
import {
  article,
  articleGrant,
  articleVersion,
  category,
  collaborationApplication,
  collaborationInvite,
  collaborationInviteArticle,
  notification,
  siteProfile,
  user,
} from '@/db/schema'

export interface ExportFile {
  path: string
  content: string
}

export interface LibraryExport {
  generatedAt: string
  metadata: {
    siteProfile: Record<string, unknown> | null
    categories: Array<Record<string, unknown>>
    articles: Array<Record<string, unknown>>
    versions: Array<Record<string, unknown>>
    collaborators: Array<Record<string, unknown>>
    grants: Array<Record<string, unknown>>
    applications: Array<Record<string, unknown>>
    invites: Array<Record<string, unknown>>
    notifications: Array<Record<string, unknown>>
    files: Array<{ path: string }>
  }
  files: ExportFile[]
  zip: Buffer
}

function safeSegment(value: string, fallback: string) {
  return (
    value
      .normalize('NFC')
      .replace(/[<>:"/\\|?*\u0000-\u001f]/g, '-')
      .replace(/\s+/g, '-')
      .replace(/-{2,}/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 120) || fallback
  )
}

function position(value: number) {
  return String(value).padStart(2, '0')
}

function markdownFile(
  articleRecord: typeof article.$inferSelect,
  categoryRecord: typeof category.$inferSelect,
) {
  const directory = `${position(categoryRecord.position)}-${safeSegment(
    categoryRecord.slug,
    categoryRecord.id,
  )}`
  const filename = `${position(articleRecord.position)}-${safeSegment(
    articleRecord.title,
    articleRecord.id,
  )}-${articleRecord.id.slice(0, 8)}.md`
  const frontmatter = [
    '---',
    `id: ${JSON.stringify(articleRecord.id)}`,
    `title: ${JSON.stringify(articleRecord.title)}`,
    `category: ${JSON.stringify(categoryRecord.slug)}`,
    `path: ${JSON.stringify(articleRecord.path)}`,
    `publicationState: ${JSON.stringify(articleRecord.publicationState)}`,
    `revision: ${articleRecord.revision}`,
    `trashedAt: ${
      articleRecord.trashedAt ? JSON.stringify(articleRecord.trashedAt) : 'null'
    }`,
    `updatedAt: ${JSON.stringify(articleRecord.updatedAt)}`,
    '---',
    '',
  ].join('\n')
  return {
    path: `markdown/${directory}/${filename}`,
    content: `${frontmatter}${articleRecord.markdown}`,
  }
}

function crc32(buffer: Buffer) {
  let crc = 0xffffffff
  for (const byte of buffer) {
    crc ^= byte
    for (let bit = 0; bit < 8; bit += 1) {
      crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1))
    }
  }
  return (crc ^ 0xffffffff) >>> 0
}

function dosDateTime(date: Date) {
  return {
    time:
      (date.getHours() << 11) |
      (date.getMinutes() << 5) |
      Math.floor(date.getSeconds() / 2),
    date:
      ((date.getFullYear() - 1980) << 9) |
      ((date.getMonth() + 1) << 5) |
      date.getDate(),
  }
}

export function createZip(files: ExportFile[], now = new Date()): Buffer {
  const localParts: Buffer[] = []
  const centralParts: Buffer[] = []
  const dos = dosDateTime(now)
  let offset = 0
  for (const file of files) {
    const name = Buffer.from(file.path, 'utf8')
    const raw = Buffer.from(file.content, 'utf8')
    const compressed = deflateRawSync(raw)
    const checksum = crc32(raw)

    const local = Buffer.alloc(30)
    local.writeUInt32LE(0x04034b50, 0)
    local.writeUInt16LE(20, 4)
    local.writeUInt16LE(0x0800, 6)
    local.writeUInt16LE(8, 8)
    local.writeUInt16LE(dos.time, 10)
    local.writeUInt16LE(dos.date, 12)
    local.writeUInt32LE(checksum, 14)
    local.writeUInt32LE(compressed.length, 18)
    local.writeUInt32LE(raw.length, 22)
    local.writeUInt16LE(name.length, 26)
    local.writeUInt16LE(0, 28)
    localParts.push(local, name, compressed)

    const central = Buffer.alloc(46)
    central.writeUInt32LE(0x02014b50, 0)
    central.writeUInt16LE(20, 4)
    central.writeUInt16LE(20, 6)
    central.writeUInt16LE(0x0800, 8)
    central.writeUInt16LE(8, 10)
    central.writeUInt16LE(dos.time, 12)
    central.writeUInt16LE(dos.date, 14)
    central.writeUInt32LE(checksum, 16)
    central.writeUInt32LE(compressed.length, 20)
    central.writeUInt32LE(raw.length, 24)
    central.writeUInt16LE(name.length, 28)
    central.writeUInt16LE(0, 30)
    central.writeUInt16LE(0, 32)
    central.writeUInt16LE(0, 34)
    central.writeUInt16LE(0, 36)
    central.writeUInt32LE(0, 38)
    central.writeUInt32LE(offset, 42)
    centralParts.push(central, name)
    offset += local.length + name.length + compressed.length
  }
  const centralDirectory = Buffer.concat(centralParts)
  const end = Buffer.alloc(22)
  end.writeUInt32LE(0x06054b50, 0)
  end.writeUInt16LE(0, 4)
  end.writeUInt16LE(0, 6)
  end.writeUInt16LE(files.length, 8)
  end.writeUInt16LE(files.length, 10)
  end.writeUInt32LE(centralDirectory.length, 12)
  end.writeUInt32LE(offset, 16)
  end.writeUInt16LE(0, 20)
  return Buffer.concat([...localParts, centralDirectory, end])
}

export async function createLibraryExport(): Promise<LibraryExport> {
  const generatedAt = new Date()
  const [
    categories,
    articles,
    versions,
    collaborators,
    grants,
    applications,
    invites,
    inviteArticles,
    notifications,
    profiles,
  ] = await Promise.all([
    db.select().from(category).orderBy(asc(category.position), asc(category.id)),
    db
      .select()
      .from(article)
      .orderBy(asc(article.categoryId), asc(article.position), asc(article.id)),
    db
      .select()
      .from(articleVersion)
      .orderBy(asc(articleVersion.articleId), asc(articleVersion.createdAt)),
    db
      .select({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        createdAt: user.createdAt,
      })
      .from(user)
      .where(eq(user.role, 'collaborator'))
      .orderBy(asc(user.name)),
    db
      .select({
        userId: articleGrant.userId,
        articleId: articleGrant.articleId,
      })
      .from(articleGrant)
      .orderBy(asc(articleGrant.userId), asc(articleGrant.articleId)),
    db
      .select({
        id: collaborationApplication.id,
        articleId: collaborationApplication.articleId,
        name: collaborationApplication.name,
        email: collaborationApplication.email,
        note: collaborationApplication.note,
        status: collaborationApplication.status,
        createdAt: collaborationApplication.createdAt,
        reviewedAt: collaborationApplication.reviewedAt,
      })
      .from(collaborationApplication),
    db
      .select({
        id: collaborationInvite.id,
        email: collaborationInvite.email,
        displayName: collaborationInvite.displayName,
        source: collaborationInvite.source,
        applicationId: collaborationInvite.applicationId,
        status: collaborationInvite.status,
        expiresAt: collaborationInvite.expiresAt,
        createdAt: collaborationInvite.createdAt,
      })
      .from(collaborationInvite),
    db.select().from(collaborationInviteArticle),
    db
      .select({
        id: notification.id,
        eventKey: notification.eventKey,
        kind: notification.kind,
        title: notification.title,
        body: notification.body,
        href: notification.href,
        readAt: notification.readAt,
        createdAt: notification.createdAt,
      })
      .from(notification),
    db.select().from(siteProfile).limit(1),
  ])

  const categoryById = new Map(
    categories.map((item) => [item.id, item] as const),
  )
  const markdownFiles = articles.flatMap((articleRecord) => {
    const categoryRecord = categoryById.get(articleRecord.categoryId)
    return categoryRecord ? [markdownFile(articleRecord, categoryRecord)] : []
  })
  const articleMetadata = articles.map((item) => ({
    id: item.id,
    categoryId: item.categoryId,
    title: item.title,
    path: item.path,
    position: item.position,
    publicationState: item.publicationState,
    revision: item.revision,
    trashedAt: item.trashedAt,
    trashedById: item.trashedById,
    trashedByName: item.trashedByName,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  }))
  const versionMetadata = versions.map((item) => ({
    id: item.id,
    articleId: item.articleId,
    kind: item.kind,
    title: item.title,
    categoryId: item.categoryId,
    categorySlug: item.categorySlug,
    path: item.path,
    label: item.label,
    authorId: item.authorId,
    authorName: item.authorName,
    authorRole: item.authorRole,
    createdAt: item.createdAt,
  }))
  const inviteMetadata = invites.map((invite) => ({
    ...invite,
    articleIds: inviteArticles
      .filter((item) => item.inviteId === invite.id)
      .map((item) => item.articleId),
  }))

  const readme = [
    '# 知笺知识库导出',
    '',
    `生成时间：${generatedAt.toISOString()}`,
    '',
    ...categories.flatMap((categoryRecord) => [
      `## ${categoryRecord.title} (${categoryRecord.slug})`,
      '',
      ...articles
        .filter((item) => item.categoryId === categoryRecord.id)
        .map(
          (item) =>
            `- ${item.title} · ${item.publicationState} · /${item.path}`,
        ),
      '',
    ]),
  ].join('\n')

  const baseFiles: ExportFile[] = [
    { path: 'README.md', content: readme },
    ...markdownFiles,
  ]
  const metadata: LibraryExport['metadata'] = {
    siteProfile: profiles[0] ?? null,
    categories,
    articles: articleMetadata,
    versions: versionMetadata,
    collaborators,
    grants,
    applications,
    invites: inviteMetadata,
    notifications,
    files: [
      ...baseFiles.map((file) => ({ path: file.path })),
      { path: 'metadata.json' },
    ],
  }
  const files = [
    ...baseFiles,
    {
      path: 'metadata.json',
      content: JSON.stringify(metadata, null, 2),
    },
  ]
  return {
    generatedAt: generatedAt.toISOString(),
    metadata,
    files,
    zip: createZip(files, generatedAt),
  }
}
