import type { JSONContent } from '@tiptap/core'
import type {
  ArticleViewEvent,
  AuthorProfile,
  Note,
  Category,
} from '../types'
import { extractPlainText } from '../lib/text'
import { blocksToMarkdown } from '../lib/markdown'

const now = Date.now()
const isoAgo = (minutes: number) => new Date(now - minutes * 60_000).toISOString()

const text = (value: string): JSONContent => ({ type: 'text', text: value })
const doc = (...content: JSONContent[]): JSONContent => ({ type: 'doc', content })
const paragraph = (...content: JSONContent[]): JSONContent => ({
  type: 'paragraph',
  content,
})
const heading = (level: 2 | 3, value: string): JSONContent => ({
  type: 'heading',
  attrs: { level },
  content: [text(value)],
})
const bulletList = (...items: string[]): JSONContent => ({
  type: 'bulletList',
  content: items.map((item) => ({
    type: 'listItem',
    content: [paragraph(text(item))],
  })),
})
const orderedList = (...items: string[]): JSONContent => ({
  type: 'orderedList',
  attrs: { start: 1, type: null },
  content: items.map((item) => ({
    type: 'listItem',
    content: [paragraph(text(item))],
  })),
})
const blockquote = (value: string): JSONContent => ({
  type: 'blockquote',
  content: [paragraph(text(value))],
})
const taskList = (...items: Array<[string, boolean]>): JSONContent => ({
  type: 'taskList',
  content: items.map(([label, checked]) => ({
    type: 'taskItem',
    attrs: { checked },
    content: [paragraph(text(label))],
  })),
})
const horizontalRule = (): JSONContent => ({ type: 'horizontalRule' })

function reference(id: string, title: string, url: string) {
  return { id, title, url }
}

function makeNote(input: {
  id: string
  title: string
  slug: string
  summary?: string
  content: JSONContent
  categoryId: string
  maturity?: string
  minutesAgo: number
  state?: 'draft' | 'published' | 'unpublished'
  openQuestions?: string[]
  references?: Array<{ id: string; title: string; url: string }>
  relatedNoteIds?: string[]
  sourceFileName?: string
}): Note {
  const updatedAt = isoAgo(input.minutesAgo)
  const markdown = blocksToMarkdown(input.content)
  const plainText = extractPlainText(input.content)
  const publicationState = input.state ?? 'published'
  const published =
    publicationState === 'published'
      ? {
          versionId: `published-${input.id}-1`,
          title: input.title,
          categoryId: input.categoryId,
          slug: input.slug,
          markdown,
          plainText,
          publishedAt: isoAgo(input.minutesAgo + 120),
        }
      : null

  return {
    id: input.id,
    title: input.title,
    slug: input.slug,
    markdown,
    content: input.content,
    plainText,
    categoryId: input.categoryId,
    publicationState,
    published,
    revision: 1,
    createdAt: isoAgo(input.minutesAgo + 60 * 24 * 20),
    updatedAt,
    versions:
      published === null
        ? []
        : [
            {
              id: published.versionId,
              kind: 'published' as const,
              title: published.title,
              categoryId: published.categoryId,
              slug: published.slug,
              markdown: published.markdown,
              plainText: published.plainText,
              createdAt: published.publishedAt,
            },
          ],
    trashedAt: null,
    trashedBy: null,
    trashedByName: null,
    sourceFileName: input.sourceFileName,
  }
}

export const seedAuthor: AuthorProfile = {
  name: '林默',
  role: '独立开发与产品设计',
  intro:
    '我在广州写代码，也整理关于工具、注意力和阅读的长期笔记。这里不是归档箱，而是一张持续修订的思考地图。',
  now: '最近在整理“工具如何减少选择，同时保留人的判断”这个问题。',
  location: '广州',
  email: 'hello@zhijian.site',
}

export const seedCategories: Category[] = [
  {
    id: 'theme-attention',
    title: '注意力与写作',
    slug: 'attention-and-writing',
    order: 0,
    noteOrder: ['note-keep-thinking', 'note-writing-not-archive', 'note-question-first'],
    publishedNoteOrder: [
      'note-keep-thinking',
      'note-writing-not-archive',
      'note-question-first',
    ],
  },
  {
    id: 'theme-tools',
    title: '工具的边界',
    slug: 'tools-and-interfaces',
    order: 1,
    noteOrder: ['note-quiet-editor', 'note-whitespace', 'note-product-skeleton'],
    publishedNoteOrder: ['note-quiet-editor', 'note-whitespace'],
  },
  {
    id: 'theme-reading',
    title: '阅读与内化',
    slug: 'reading-and-digesting',
    order: 2,
    noteOrder: ['note-dark-time', 'note-effective-notes'],
    publishedNoteOrder: ['note-dark-time', 'note-effective-notes'],
  },
  {
    id: 'theme-life',
    title: '生活观察',
    slug: 'observing-life',
    order: 3,
    noteOrder: ['note-walk-route', 'note-unfinished-draft'],
    publishedNoteOrder: ['note-walk-route'],
  },
]

export const seedNotes: Note[] = [
  makeNote({
    id: 'note-keep-thinking',
    title: '把想法留在纸上',
    slug: 'keep-thinking-on-paper',
    summary:
      '记录不是归档动作，而是一种让思考继续生长的方式。先写清楚，再慢慢想明白。',
    categoryId: 'theme-attention',
    maturity: 'evergreen',
    minutesAgo: 35,
    openQuestions: [
      '怎样区分值得继续追问的想法和只是一次性的情绪？',
      '长期笔记会不会因为整理过度而失去最初的锋利？',
    ],
    references: [
      reference('ref-dark-time', '《暗时间》', 'https://book.douban.com/subject/6709809/'),
    ],
    content: doc(
      paragraph(
        text('有些想法诞生时并不完整。与其让它们在脑中反复回响，不如先放在纸上，给它们一点生长的时间。'),
      ),
      heading(2, '记录先于理解'),
      paragraph(
        text('写下来的第一句话往往并不准确。它的作用不是宣布结论，而是给尚未成型的东西一个可以继续修改的位置。'),
      ),
      blockquote('先写清楚，再想明白。'),
      heading(2, '让笔记拥有时间'),
      paragraph(
        text('我更愿意把笔记看成一份持续修订的记录，而不是一次发布完成的作品。真正有价值的变化，通常发生在两次更新之间。'),
      ),
      taskList(
        ['为重要想法保留问题，而不是只留下答案', true],
        ['每隔一段时间重读并补充上下文', false],
        ['允许未完成的内容暂时保持未完成', false],
      ),
      horizontalRule(),
      paragraph(text('好的笔记工具不应该催促你产出。它需要足够安静，也足够顺手。')),
    ),
  }),
  makeNote({
    id: 'note-writing-not-archive',
    title: '写作不是归档',
    slug: 'writing-is-not-archiving',
    summary:
      '把零散记录成体系的关键，不是分类得更细，而是不断重写它们之间的关系。',
    categoryId: 'theme-attention',
    maturity: 'growing',
    minutesAgo: 60 * 4,
    openQuestions: ['什么频率的重读既能保持连续，又不会变成负担？'],
    content: doc(
      paragraph(
        text('如果一篇笔记写完后再也没有被打开，它更接近仓库，而不是思考的一部分。'),
      ),
      heading(2, '用改写代替收集'),
      paragraph(
        text('每次重读时，不必保留原来的完整表述。试着把它压缩成一句更准确的判断，再补上它与当前问题的关系。'),
      ),
      bulletList('删掉已经不再成立的判断', '把新材料连接到旧问题', '记录变化发生的原因'),
    ),
  }),
  makeNote({
    id: 'note-question-first',
    title: '从问题开始，而不是从分类开始',
    slug: 'start-with-questions',
    summary:
      '问题比分类更能保存思考的方向。分类解决存放，问题推动下一次打开笔记。',
    categoryId: 'theme-attention',
    maturity: 'growing',
    minutesAgo: 60 * 9,
    openQuestions: ['如何避免问题越积越多，却没有一个被真正回答？'],
    content: doc(
      paragraph(
        text('我不知道这篇笔记最后会属于哪个分类，但我知道它正在回答一个问题：怎样的记录方式能够推动下一次思考？'),
      ),
      heading(2, '问题作为入口'),
      paragraph(
        text('分类帮助我们在事后找到内容，问题则在事前给予方向。个人知识库更需要后者，因为没有人会替我们规定应该研究什么。'),
      ),
      blockquote('先保存问题，再保存答案。'),
    ),
  }),
  makeNote({
    id: 'note-quiet-editor',
    title: '一块安静的编辑界面',
    slug: 'a-quiet-editor',
    summary:
      '编辑界面最重要的能力，不是提供更多按钮，而是让人知道什么时候不需要按钮。',
    categoryId: 'theme-tools',
    maturity: 'evergreen',
    minutesAgo: 60 * 22,
    openQuestions: ['工具栏应该在什么时刻出现，才不会打断写作？'],
    content: doc(
      paragraph(
        text('写作时最需要的不是功能，而是一种不会不断提醒你“这里还有很多功能”的环境。'),
      ),
      heading(2, '功能退到需要时'),
      paragraph(
        text('文字应该是界面里最稳定的元素。工具栏、状态和操作提示可以短暂出现，但不应该永久占据视线。'),
      ),
      orderedList(
        '正文保持舒适的行宽和行距',
        '常用格式在选中文本时出现',
        '不常用的结构通过斜杠菜单进入',
      ),
    ),
  }),
  makeNote({
    id: 'note-whitespace',
    title: '工具应该保留多少空白',
    slug: 'how-much-whitespace',
    summary:
      '留白不是没有内容，而是让内容之间拥有可被感知的关系。',
    categoryId: 'theme-tools',
    maturity: 'seedling',
    minutesAgo: 60 * 35,
    openQuestions: [
      '信息密度高的工具是否一定意味着更专业？',
      '移动端如何保留空白，而不是简单缩小间距？',
    ],
    content: doc(
      paragraph(text('留白不是没有内容，而是让内容有呼吸的位置。')),
      heading(2, '界面里的留白'),
      bulletList('标题周围需要更大的空间', '列表项之间保持稳定节奏', '正文宽度不要超过舒适阅读距离'),
      blockquote('先决定什么不该出现，再决定什么应该被看见。'),
    ),
  }),
  makeNote({
    id: 'note-product-skeleton',
    title: '知笺的产品骨架',
    slug: 'product-skeleton',
    summary:
      '一份还在修订中的产品边界记录：公开知识库、私人写作台，以及尽量少的系统复杂度。',
    categoryId: 'theme-tools',
    maturity: 'growing',
    minutesAgo: 60 * 24 * 2,
    state: 'draft',
    openQuestions: ['公开阅读与私人写作如何保持同一套内容模型？'],
    content: doc(
      paragraph(
        text('知笺不是多人笔记平台，而是一个人的公开知识网站和私人写作后台。'),
      ),
      heading(2, '只保留两种体验'),
      bulletList(
        '读者浏览分类、章节与搜索',
        '作者在写作台创建草稿、导入 Markdown、发布与撤回',
      ),
      heading(2, '明确不做'),
      paragraph(text('注册、成员、评论、点赞、关注、多人协作和双向文件同步都不进入第一版。')),
    ),
  }),
  makeNote({
    id: 'note-dark-time',
    title: '重读《暗时间》',
    slug: 'rereading-dark-time',
    summary:
      '真正稀缺的不是时间，而是完整、不被打断的注意力。一次重读留下的几个判断。',
    categoryId: 'theme-reading',
    maturity: 'growing',
    minutesAgo: 60 * 8,
    openQuestions: ['如何在不牺牲响应速度的情况下保护连续工作时间？'],
    references: [
      reference('ref-dark-time', '《暗时间》', 'https://book.douban.com/subject/6709809/'),
    ],
    content: doc(
      paragraph(text('真正稀缺的不是时间，而是完整、不被打断的注意力。')),
      blockquote('我们以为自己在节省时间，其实只是把注意力切成了更小的碎片。'),
      heading(2, '留下的句子'),
      bulletList('困难的问题需要连续的时间窗口', '切换任务的代价通常被低估', '记录可以让思考在中断后继续'),
      paragraph(text('下周尝试把每天上午九点到十一点留给没有消息提醒的深度工作。')),
    ),
  }),
  makeNote({
    id: 'note-effective-notes',
    title: '怎样做有效的阅读摘记',
    slug: 'effective-reading-notes',
    summary:
      '摘录原文只是开始。有效摘记需要解释为什么保留，以及它改变了什么问题。',
    categoryId: 'theme-reading',
    maturity: 'evergreen',
    minutesAgo: 60 * 26,
    content: doc(
      paragraph(
        text('如果一条摘录只保留了原句，没有保留当时的判断，过一段时间再看时通常只剩下漂亮，而不再有作用。'),
      ),
      heading(2, '一条有效的摘记'),
      orderedList(
        '原文中最关键的一句话',
        '为什么它值得保留',
        '它与我正在研究的问题有什么关系',
      ),
      paragraph(text('摘录的目的不是完整，而是让下一次阅读能够从更远的地方开始。')),
    ),
  }),
  makeNote({
    id: 'note-walk-route',
    title: '周末散步路线',
    slug: 'weekend-walk',
    summary:
      '从旧码头沿河向北的一条短路线，也是整理一周零散想法的时间。',
    categoryId: 'theme-life',
    maturity: 'seedling',
    minutesAgo: 60 * 32,
    content: doc(
      paragraph(
        text('从旧码头沿河向北，过两座桥，再从梧桐路绕回来。天气好的时候，整条路大约四十分钟。'),
      ),
      bulletList('旧书店：周三闭店', '桥头咖啡：下午人少', '河岸长椅：适合读两页书'),
      paragraph(text('下次带相机，把入冬后的树影拍下来。')),
    ),
  }),
  makeNote({
    id: 'note-unfinished-draft',
    title: '一段没有写完的冬天记录',
    slug: 'unfinished-winter',
    summary: '一段暂时没有结论的生活记录，保留天气、声音和某次没有完成的对话。',
    categoryId: 'theme-life',
    maturity: 'seedling',
    minutesAgo: 60 * 4,
    state: 'draft',
    content: doc(
      paragraph(text('十二月的风从河面吹过来，带着一点潮湿的铁锈味。')),
      paragraph(text('那天我们聊到很晚，却没有把最后那句话说完。')),
    ),
  }),
]

const analyticsNotePool = [
  'note-keep-thinking',
  'note-keep-thinking',
  'note-writing-not-archive',
  'note-quiet-editor',
  'note-quiet-editor',
  'note-dark-time',
  'note-effective-notes',
  'note-question-first',
  'note-whitespace',
  'note-walk-route',
]

const analyticsIps = [
  '113.65.18.42',
  '120.229.77.16',
  '183.6.44.91',
  '14.120.56.203',
  '223.104.67.18',
  '58.60.112.9',
  '2408:8207:78a1:2b30::1',
  '119.123.201.77',
]

const analyticsReferrers = [
  '直接访问',
  'google.com',
  'baidu.com',
  'github.com',
  'weixin.qq.com',
]

const analyticsLocations = [
  '广东广州',
  '广东深圳',
  '广东广州',
  '广东东莞',
  '江苏南京',
  '广东深圳',
  '中国北京',
  '广东深圳',
]

export const seedArticleViewEvents: ArticleViewEvent[] = Array.from(
  { length: 168 },
  (_, index) => {
    const ip = analyticsIps[index % analyticsIps.length]
    return {
      id: `seed-view-${index + 1}`,
      noteId: analyticsNotePool[index % analyticsNotePool.length],
      visitedAt: isoAgo((index * 173 + 8) % (38 * 24 * 60)),
      ip,
      location: analyticsLocations[index % analyticsLocations.length],
      referrerDomain: analyticsReferrers[index % analyticsReferrers.length],
      visitorKey: `${ip}-${index % 17}`,
    }
  },
)
