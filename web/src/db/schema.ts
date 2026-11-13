import { sql } from 'drizzle-orm'
import {
  datetime,
  index,
  int,
  mediumtext,
  mysqlEnum,
  mysqlTable,
  uniqueIndex,
  varchar,
} from 'drizzle-orm/mysql-core'

export const category = mysqlTable(
  'category',
  {
    id: varchar('id', { length: 36 }).primaryKey(),
    title: varchar('title', { length: 200 }).notNull(),
    slug: varchar('slug', { length: 120 }).notNull(),
    position: int('position').notNull().default(0),
  },
  (table) => [uniqueIndex('category_slug_unique').on(table.slug)],
)

export const article = mysqlTable(
  'article',
  {
    id: varchar('id', { length: 36 }).primaryKey(),
    categoryId: varchar('category_id', { length: 36 })
      .notNull()
      .references(() => category.id, { onDelete: 'restrict' }),
    title: varchar('title', { length: 300 }).notNull(),
    path: varchar('path', { length: 300 }).notNull(),
    position: int('position').notNull().default(0),
    markdown: mediumtext('markdown').notNull().default(''),
    plainText: mediumtext('plain_text').notNull().default(''),
    contentJson: mediumtext('content_json'),
    revision: int('revision').notNull().default(1),
    publicationState: mysqlEnum('publication_state', [
      'draft',
      'published',
      'unpublished',
    ])
      .notNull()
      .default('draft'),
    trashedAt: datetime('trashed_at', { mode: 'string', fsp: 3 }),
    createdAt: datetime('created_at', { mode: 'string', fsp: 3 })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP(3)`),
    updatedAt: datetime('updated_at', { mode: 'string', fsp: 3 })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP(3)`),
  },
  (table) => [
    index('article_category_idx').on(table.categoryId, table.position),
    uniqueIndex('article_category_path_unique').on(
      table.categoryId,
      table.path,
    ),
  ],
)

export const articleVersion = mysqlTable(
  'article_version',
  {
    id: varchar('id', { length: 36 }).primaryKey(),
    articleId: varchar('article_id', { length: 36 })
      .notNull()
      .references(() => article.id, { onDelete: 'cascade' }),
    kind: mysqlEnum('kind', ['manual', 'published']).notNull(),
    title: varchar('title', { length: 300 }).notNull(),
    path: varchar('path', { length: 300 }).notNull(),
    markdown: mediumtext('markdown').notNull(),
    plainText: mediumtext('plain_text').notNull(),
    contentJson: mediumtext('content_json'),
    authorId: varchar('author_id', { length: 36 }).notNull(),
    authorName: varchar('author_name', { length: 120 }).notNull(),
    authorRole: mysqlEnum('author_role', ['owner', 'collaborator']).notNull(),
    createdAt: datetime('created_at', { mode: 'string', fsp: 3 })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP(3)`),
  },
  (table) => [
    index('article_version_article_idx').on(table.articleId, table.createdAt),
  ],
)
