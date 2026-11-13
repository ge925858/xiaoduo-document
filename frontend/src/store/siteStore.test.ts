import { beforeEach, describe, expect, it } from 'vitest'
import {
  articleViewCount,
  categoryNotes,
  chapterPublicPath,
  hasUnpublishedChanges,
  publicNotes,
  resolveRedirect,
  useSiteStore,
} from './siteStore'

const initialState = useSiteStore.getState()
const baseline = {
  author: structuredClone(initialState.author),
  categories: structuredClone(initialState.categories),
  notes: structuredClone(initialState.notes),
  redirects: structuredClone(initialState.redirects),
  collaborationApplications: [],
  collaborationInvites: [],
  collaborators: [],
  articleViewEvents: structuredClone(initialState.articleViewEvents),
  studioAuthed: false,
  studioRole: null,
  currentCollaboratorId: null,
  themeMode: 'light' as const,
}

function getNote(id: string) {
  return useSiteStore.getState().notes.find((note) => note.id === id)
}

function getCategory(id: string) {
  return useSiteStore.getState().categories.find((category) => category.id === id)
}

describe('siteStore', () => {
  beforeEach(() => {
    useSiteStore.setState(structuredClone(baseline))
  })

  it('authenticates the single studio author', async () => {
    expect(await useSiteStore.getState().loginStudio('wrong')).toBe(false)
    expect(await useSiteStore.getState().loginStudio('zhijian')).toBe(true)
    expect(useSiteStore.getState().studioAuthed).toBe(true)
    expect(useSiteStore.getState().studioRole).toBe('owner')
  })

  it('creates an article-scoped application and converts it into an invite', () => {
    const state = useSiteStore.getState()
    const result = state.submitCollaborationApplication({
      noteId: 'note-keep-thinking',
      name: '协作者甲',
      email: 'collab@example.com',
      note: '希望补充一个案例',
    })
    expect(result).toBe('created')
    expect(
      state.submitCollaborationApplication({
        noteId: 'note-keep-thinking',
        name: '协作者甲',
        email: 'collab@example.com',
        note: '重复申请',
      }),
    ).toBe('duplicate')

    const application = useSiteStore.getState().collaborationApplications[0]
    const inviteId = useSiteStore
      .getState()
      .reviewCollaborationApplication(application.id, 'approved')
    expect(inviteId).toBeTruthy()
    const invite = useSiteStore
      .getState()
      .collaborationInvites.find((item) => item.id === inviteId)
    expect(invite?.noteIds).toEqual(['note-keep-thinking'])
    expect(invite?.email).toBe('collab@example.com')
  })

  it('activates a collaborator invitation and allows email login', async () => {
    const inviteId = useSiteStore.getState().createCollaborationInvite({
      email: 'writer@example.com',
      displayName: '写作者',
      noteIds: ['note-keep-thinking', 'note-quiet-editor'],
      source: 'direct',
    })
    expect(inviteId).toBeTruthy()
    const invite = useSiteStore
      .getState()
      .collaborationInvites.find((item) => item.id === inviteId)
    expect(invite).toBeTruthy()
    if (!invite) return

    expect(
      await useSiteStore
        .getState()
        .acceptCollaborationInvite(invite.token, '写作者', 'secret123'),
    ).toBe('created')
    const collaborator = useSiteStore.getState().collaborators[0]
    expect(collaborator.email).toBe('writer@example.com')
    expect(collaborator.noteIds).toEqual([
      'note-keep-thinking',
      'note-quiet-editor',
    ])
    expect(useSiteStore.getState().studioRole).toBe('collaborator')

    useSiteStore.getState().logoutStudio()
    expect(
      await useSiteStore
        .getState()
        .loginCollaborator('writer@example.com', 'secret123'),
    ).toBe(true)
    expect(useSiteStore.getState().currentCollaboratorId).toBe(collaborator.id)

    useSiteStore.getState().setCollaboratorStatus(collaborator.id, 'suspended')
    expect(useSiteStore.getState().studioAuthed).toBe(false)
    expect(
      await useSiteStore
        .getState()
        .loginCollaborator('writer@example.com', 'secret123'),
    ).toBe(false)
  })

  it('updates collaborator article grants', async () => {
    const inviteId = useSiteStore.getState().createCollaborationInvite({
      email: 'grant@example.com',
      noteIds: ['note-keep-thinking'],
      source: 'direct',
    })
    const invite = useSiteStore
      .getState()
      .collaborationInvites.find((item) => item.id === inviteId)
    expect(invite).toBeTruthy()
    if (!invite) return
    await useSiteStore
      .getState()
      .acceptCollaborationInvite(invite.token, '授权测试', 'secret123')
    const collaborator = useSiteStore.getState().collaborators[0]

    expect(
      useSiteStore
        .getState()
        .updateCollaboratorGrants(collaborator.id, ['note-quiet-editor']),
    ).toBe(true)
    expect(
      useSiteStore
        .getState()
        .collaborators.find((item) => item.id === collaborator.id)?.noteIds,
    ).toEqual(['note-quiet-editor'])
  })

  it('rejects an expired invitation without affecting an existing account', async () => {
    const inviteId = useSiteStore.getState().createCollaborationInvite({
      email: 'expired@example.com',
      noteIds: ['note-keep-thinking'],
      source: 'direct',
    })
    const invite = useSiteStore
      .getState()
      .collaborationInvites.find((item) => item.id === inviteId)
    expect(invite).toBeTruthy()
    if (!invite) return
    useSiteStore.setState((state) => ({
      collaborationInvites: state.collaborationInvites.map((item) =>
        item.id === invite.id
          ? {
              ...item,
              expiresAt: new Date(Date.now() - 1000).toISOString(),
            }
          : item,
      ),
    }))

    expect(
      await useSiteStore
        .getState()
        .acceptCollaborationInvite(invite.token, '过期邀请', 'secret123'),
    ).toBe('expired')
    expect(
      useSiteStore
        .getState()
        .collaborationInvites.find((item) => item.id === invite.id)?.status,
    ).toBe('expired')
  })

  it('records collaborator identity for saved and published versions', async () => {
    const inviteId = useSiteStore.getState().createCollaborationInvite({
      email: 'author@example.com',
      displayName: '协作作者',
      noteIds: ['note-keep-thinking'],
      source: 'direct',
    })
    const invite = useSiteStore
      .getState()
      .collaborationInvites.find((item) => item.id === inviteId)
    expect(invite).toBeTruthy()
    if (!invite) return
    await useSiteStore
      .getState()
      .acceptCollaborationInvite(invite.token, '协作作者', 'secret123')

    const note = getNote('note-keep-thinking')
    expect(note).toBeTruthy()
    if (!note) return
    useSiteStore.getState().updateNoteDraft(note.id, {
      title: note.title,
      categoryId: note.categoryId,
      markdown: `${note.markdown}\n\n协作者新增的段落。\n`,
      plainText: `${note.plainText} 协作者新增的段落。`,
      expectedRevision: note.revision,
    })
    useSiteStore.getState().saveManualVersion(note.id, '协作保存')
    const manual = getNote(note.id)?.versions[0]
    expect(manual?.author).toMatchObject({
      name: '协作作者',
      role: 'collaborator',
    })

    expect(useSiteStore.getState().publishNote(note.id)).toBe(true)
    const published = getNote(note.id)?.versions[0]
    expect(published?.kind).toBe('published')
    expect(published?.author).toMatchObject({
      name: '协作作者',
      role: 'collaborator',
    })
  })

  it('excludes the owner from views while deduplicating collaborator visits', async () => {
    await useSiteStore.getState().loginStudio('zhijian')
    expect(
      useSiteStore.getState().recordArticleView({
        noteId: 'note-keep-thinking',
        ip: '127.0.0.1',
        referrerDomain: '直接访问',
      }),
    ).toBe(false)

    useSiteStore.getState().logoutStudio()
    const inviteId = useSiteStore.getState().createCollaborationInvite({
      email: 'reader@example.com',
      noteIds: ['note-keep-thinking'],
      source: 'direct',
    })
    const invite = useSiteStore
      .getState()
      .collaborationInvites.find((item) => item.id === inviteId)
    expect(invite).toBeTruthy()
    if (!invite) return
    await useSiteStore
      .getState()
      .acceptCollaborationInvite(invite.token, '协作访客', 'secret123')

    const before = articleViewCount(
      useSiteStore.getState().articleViewEvents,
      'note-keep-thinking',
    )
    expect(
      useSiteStore.getState().recordArticleView({
        noteId: 'note-keep-thinking',
        ip: '127.0.0.1',
        referrerDomain: 'google.com',
      }),
    ).toBe(true)
    expect(
      useSiteStore.getState().recordArticleView({
        noteId: 'note-keep-thinking',
        ip: '127.0.0.1',
        referrerDomain: 'google.com',
      }),
    ).toBe(false)
    expect(
      articleViewCount(
        useSiteStore.getState().articleViewEvents,
        'note-keep-thinking',
      ),
    ).toBe(before + 1)
    expect(
      useSiteStore
        .getState()
        .articleViewEvents.find(
          (event) =>
            event.noteId === 'note-keep-thinking' &&
            event.ip === '127.0.0.1',
        )?.location,
    ).toBe('本地网络')
  })

  it('records which collaborator moved a chapter to trash', async () => {
    const inviteId = useSiteStore.getState().createCollaborationInvite({
      email: 'trash@example.com',
      displayName: '回收站协作者',
      noteIds: ['note-keep-thinking'],
      source: 'direct',
    })
    const invite = useSiteStore
      .getState()
      .collaborationInvites.find((item) => item.id === inviteId)
    expect(invite).toBeTruthy()
    if (!invite) return
    await useSiteStore
      .getState()
      .acceptCollaborationInvite(invite.token, '回收站协作者', 'secret123')
    const collaboratorId = useSiteStore.getState().currentCollaboratorId

    useSiteStore.getState().trashNote('note-keep-thinking')
    expect(getNote('note-keep-thinking')).toMatchObject({
      trashedBy: collaboratorId,
      trashedByName: '回收站协作者',
    })

    useSiteStore.getState().restoreTrashedNote('note-keep-thinking')
    expect(getNote('note-keep-thinking')).toMatchObject({
      trashedAt: null,
      trashedBy: null,
      trashedByName: null,
    })
  })

  it('updates the author nickname and avatar', () => {
    useSiteStore.getState().updateAuthor({
      name: '新的昵称',
      avatarUrl: 'data:image/webp;base64,avatar',
    })
    expect(useSiteStore.getState().author.name).toBe('新的昵称')
    expect(useSiteStore.getState().author.avatarUrl).toBe(
      'data:image/webp;base64,avatar',
    )
  })

  it('creates an unpublished chapter and appends it to the category order', () => {
    const before = getCategory('theme-attention')
    const id = useSiteStore.getState().createNote('theme-attention')

    expect(id).toBeTruthy()
    if (!id || !before) return

    const created = getNote(id)
    const after = getCategory('theme-attention')
    expect(created?.publicationState).toBe('draft')
    expect(created?.published).toBeNull()
    expect(after?.noteOrder.at(-1)).toBe(id)
    expect(publicNotes(useSiteStore.getState().notes)).not.toContainEqual(created)

    expect(useSiteStore.getState().publishNote(id)).toBe(true)
    expect(getNote(id)?.publicationState).toBe('published')
    expect(getNote(id)?.versions[0]?.kind).toBe('published')
    expect(
      publicNotes(useSiteStore.getState().notes).some((note) => note.id === id),
    ).toBe(true)

    useSiteStore.getState().unpublishNote(id)
    expect(getNote(id)?.publicationState).toBe('unpublished')
    expect(
      publicNotes(useSiteStore.getState().notes).some((note) => note.id === id),
    ).toBe(false)
  })

  it('saves drafts without changing manual order and rejects stale revisions', () => {
    const note = getNote('note-keep-thinking')
    const category = getCategory('theme-attention')
    expect(note).toBeTruthy()
    expect(category).toBeTruthy()
    if (!note || !category) return

    const originalIndex = category.noteOrder.indexOf(note.id)
    const result = useSiteStore.getState().updateNoteDraft(note.id, {
      title: '把想法留在纸上',
      categoryId: note.categoryId,
      markdown: `${note.markdown}\n\n补充一段新的草稿。\n`,
      plainText: `${note.plainText} 补充一段新的草稿。`,
      expectedRevision: note.revision,
    })

    const saved = getNote(note.id)
    expect(result).toBe('saved')
    expect(saved?.revision).toBe(note.revision + 1)
    expect(saved?.plainText).toContain('补充一段新的草稿')
    expect(getCategory(note.categoryId)?.noteOrder[originalIndex]).toBe(note.id)
    expect(hasUnpublishedChanges(saved!)).toBe(true)

    const stale = useSiteStore.getState().updateNoteDraft(note.id, {
      title: '过期版本',
      categoryId: note.categoryId,
      markdown: note.markdown,
      plainText: note.plainText,
      expectedRevision: note.revision,
    })
    expect(stale).toBe('conflict')
  })

  it('appends a chapter to the destination when its category changes', () => {
    const note = getNote('note-keep-thinking')
    const destination = getCategory('theme-tools')
    expect(note).toBeTruthy()
    expect(destination).toBeTruthy()
    if (!note || !destination) return

    const result = useSiteStore.getState().updateNoteDraft(note.id, {
      title: note.title,
      categoryId: destination.id,
      markdown: note.markdown,
      plainText: note.plainText,
      expectedRevision: note.revision,
    })

    expect(result).toBe('saved')
    expect(getCategory('theme-attention')?.noteOrder).not.toContain(note.id)
    expect(getCategory(destination.id)?.noteOrder.at(-1)).toBe(note.id)
  })

  it('creates categories and protects a category while any chapter still exists', () => {
    const emptyId = useSiteStore
      .getState()
      .createCategory('临时分类', 'temporary-category')
    expect(emptyId).toBeTruthy()
    if (!emptyId) return

    expect(
      useSiteStore.getState().createCategory('重复标识', 'temporary-category'),
    ).toBeNull()
    expect(
      useSiteStore.getState().updateCategory(emptyId, {
        title: '整理后的分类',
        slug: 'organized-category',
      }),
    ).toBe(true)
    expect(getCategory(emptyId)?.slug).toBe('organized-category')
    expect(useSiteStore.getState().deleteCategory(emptyId)).toBe(true)

    const protectedId = useSiteStore
      .getState()
      .createCategory('有章节的分类', 'protected-category')
    expect(protectedId).toBeTruthy()
    if (!protectedId) return
    const noteId = useSiteStore.getState().createNote(protectedId)
    expect(noteId).toBeTruthy()
    if (!noteId) return

    useSiteStore.getState().trashNote(noteId)
    expect(useSiteStore.getState().deleteCategory(protectedId)).toBe(false)
  })

  it('moves categories and chapters in manual order', () => {
    expect(useSiteStore.getState().moveCategory('theme-tools', -1)).toBe(true)
    expect(
      useSiteStore
        .getState()
        .categories.slice()
        .sort((a, b) => a.order - b.order)
        .map((category) => category.id)
        .slice(0, 2),
    ).toEqual(['theme-tools', 'theme-attention'])

    const category = getCategory('theme-attention')
    expect(category).toBeTruthy()
    if (!category) return
    const [first, second] = category.noteOrder
    expect(useSiteStore.getState().moveChapter(first, 1)).toBe(true)
    expect(getCategory(category.id)?.noteOrder.slice(0, 2)).toEqual([
      second,
      first,
    ])
  })

  it('saves, restores, and deletes manual versions without touching published versions', () => {
    const note = getNote('note-quiet-editor')
    expect(note).toBeTruthy()
    if (!note) return

    useSiteStore.getState().updateNoteDraft(note.id, {
      title: note.title,
      categoryId: note.categoryId,
      markdown: '## 手动版本\n\n这是版本快照。\n',
      plainText: '手动版本 这是版本快照。',
      expectedRevision: note.revision,
    })
    const versionId = useSiteStore
      .getState()
      .saveManualVersion(note.id, '整理后的快照')
    expect(versionId).toBeTruthy()
    if (!versionId) return

    const afterSnapshot = getNote(note.id)
    expect(afterSnapshot?.versions[0]?.label).toBe('整理后的快照')
    expect(afterSnapshot?.versions[0]?.kind).toBe('manual')

    useSiteStore.getState().updateNoteDraft(note.id, {
      title: '被覆盖的标题',
      categoryId: note.categoryId,
      markdown: '被覆盖的正文',
      plainText: '被覆盖的正文',
      expectedRevision: afterSnapshot!.revision,
    })
    expect(useSiteStore.getState().restoreVersion(note.id, versionId)).toBe(
      'saved',
    )
    expect(getNote(note.id)?.markdown).toContain('这是版本快照')
    expect(getNote(note.id)?.title).toBe(note.title)
    expect(useSiteStore.getState().deleteVersion(note.id, versionId)).toBe(true)

    const publishedVersion = getNote(note.id)?.versions.find(
      (version) => version.kind === 'published',
    )
    expect(publishedVersion).toBeTruthy()
    if (publishedVersion) {
      expect(
        useSiteStore.getState().deleteVersion(note.id, publishedVersion.id),
      ).toBe(false)
    }
  })

  it('updates a published chapter and keeps the old title URL as a redirect', () => {
    const original = getNote('note-keep-thinking')
    expect(original).toBeTruthy()
    if (!original) return

    const oldPath = chapterPublicPath(original, useSiteStore.getState().categories)
    expect(oldPath).toBeTruthy()

    const saved = useSiteStore.getState().updateNoteDraft(original.id, {
      title: '新的章节标题',
      categoryId: original.categoryId,
      markdown: '## 新内容\n\n更新后的正文。\n',
      plainText: '新内容 更新后的正文。',
      expectedRevision: original.revision,
    })
    expect(saved).toBe('saved')
    expect(useSiteStore.getState().publishNote(original.id)).toBe(true)

    const updated = getNote(original.id)
    const newPath = updated
      ? chapterPublicPath(updated, useSiteStore.getState().categories)
      : null
    expect(updated?.published?.title).toBe('新的章节标题')
    expect(hasUnpublishedChanges(updated!)).toBe(false)
    expect(newPath).toBeTruthy()
    expect(
      resolveRedirect(useSiteStore.getState().redirects, oldPath!),
    ).toBe(newPath)
  })

  it('trashes, restores, and permanently deletes a chapter', () => {
    const note = getNote('note-dark-time')
    expect(note).toBeTruthy()
    if (!note) return

    useSiteStore.getState().trashNote(note.id)
    const trashed = getNote(note.id)
    expect(trashed?.trashedAt).toBeTruthy()
    expect(trashed?.publicationState).toBe('unpublished')
    expect(
      publicNotes(useSiteStore.getState().notes).some(
        (item) => item.id === note.id,
      ),
    ).toBe(false)

    useSiteStore.getState().restoreTrashedNote(note.id)
    const restored = getNote(note.id)
    expect(restored?.trashedAt).toBeNull()
    expect(restored?.publicationState).toBe('unpublished')
    expect(restored?.published).toBeTruthy()

    useSiteStore.getState().publishNote(note.id)
    expect(
      categoryNotes(
        getCategory(note.categoryId)!,
        useSiteStore.getState().notes,
      ).some((item) => item.id === note.id),
    ).toBe(true)

    useSiteStore.getState().trashNote(note.id)
    useSiteStore.getState().deleteNoteForever(note.id)
    expect(getNote(note.id)).toBeUndefined()
  })

  it('imports Markdown as a draft with source information', () => {
    const id = useSiteStore.getState().importMarkdown({
      title: '导入测试',
      markdown: '## 导入测试\n\n一段 Markdown 内容。\n',
      plainText: '导入测试 一段 Markdown 内容。',
      sourceFileName: 'import-test.md',
      categoryId: 'theme-tools',
    })
    expect(id).toBeTruthy()
    if (!id) return

    const imported = getNote(id)
    expect(imported?.publicationState).toBe('draft')
    expect(imported?.sourceFileName).toBe('import-test.md')
    expect(imported?.plainText).toContain('一段 Markdown 内容')
    expect(imported?.markdown).toContain('## 导入测试')
    expect(getCategory('theme-tools')?.noteOrder.at(-1)).toBe(id)
  })
})
