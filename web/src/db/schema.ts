import { sql } from 'drizzle-orm'
import {
  boolean,
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

export const user = mysqlTable(
  'auth_user',
  {
    id: varchar('id', { length: 36 }).primaryKey(),
    name: varchar('name', { length: 120 }).notNull(),
    email: varchar('email', { length: 255 }).notNull(),
    emailVerified: boolean('email_verified').notNull().default(false),
    image: varchar('image', { length: 2048 }),
    role: mysqlEnum('role', ['owner', 'collaborator'])
      .notNull()
      .default('collaborator'),
    status: mysqlEnum('status', ['active', 'suspended'])
      .notNull()
      .default('active'),
    createdAt: datetime('created_at', { mode: 'date', fsp: 3 })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP(3)`),
    updatedAt: datetime('updated_at', { mode: 'date', fsp: 3 })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP(3)`),
  },
  (table) => [uniqueIndex('auth_user_email_unique').on(table.email)],
)

export const session = mysqlTable(
  'auth_session',
  {
    id: varchar('id', { length: 36 }).primaryKey(),
    userId: varchar('user_id', { length: 36 })
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    token: varchar('token', { length: 255 }).notNull(),
    expiresAt: datetime('expires_at', { mode: 'date', fsp: 3 }).notNull(),
    ipAddress: varchar('ip_address', { length: 64 }),
    userAgent: varchar('user_agent', { length: 512 }),
    createdAt: datetime('created_at', { mode: 'date', fsp: 3 })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP(3)`),
    updatedAt: datetime('updated_at', { mode: 'date', fsp: 3 })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP(3)`),
  },
  (table) => [
    uniqueIndex('auth_session_token_unique').on(table.token),
    index('auth_session_user_idx').on(table.userId),
  ],
)

export const account = mysqlTable(
  'auth_account',
  {
    id: varchar('id', { length: 36 }).primaryKey(),
    accountId: varchar('account_id', { length: 255 }).notNull(),
    providerId: varchar('provider_id', { length: 64 }).notNull(),
    userId: varchar('user_id', { length: 36 })
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    accessToken: mediumtext('access_token'),
    refreshToken: mediumtext('refresh_token'),
    idToken: mediumtext('id_token'),
    accessTokenExpiresAt: datetime('access_token_expires_at', {
      mode: 'date',
      fsp: 3,
    }),
    refreshTokenExpiresAt: datetime('refresh_token_expires_at', {
      mode: 'date',
      fsp: 3,
    }),
    scope: mediumtext('scope'),
    password: varchar('password', { length: 255 }),
    createdAt: datetime('created_at', { mode: 'date', fsp: 3 })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP(3)`),
    updatedAt: datetime('updated_at', { mode: 'date', fsp: 3 })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP(3)`),
  },
  (table) => [
    index('auth_account_user_idx').on(table.userId),
    uniqueIndex('auth_account_provider_account_unique').on(
      table.providerId,
      table.accountId,
    ),
  ],
)

export const verification = mysqlTable(
  'auth_verification',
  {
    id: varchar('id', { length: 36 }).primaryKey(),
    identifier: varchar('identifier', { length: 255 }).notNull(),
    value: mediumtext('value').notNull(),
    expiresAt: datetime('expires_at', { mode: 'date', fsp: 3 }).notNull(),
    createdAt: datetime('created_at', { mode: 'date', fsp: 3 })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP(3)`),
    updatedAt: datetime('updated_at', { mode: 'date', fsp: 3 })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP(3)`),
  },
  (table) => [
    index('auth_verification_identifier_idx').on(table.identifier),
  ],
)

export const siteProfile = mysqlTable('site_profile', {
  id: varchar('id', { length: 36 }).primaryKey(),
  authorName: varchar('author_name', { length: 120 }).notNull(),
  avatarUrl: varchar('avatar_url', { length: 2048 }),
  roleTitle: varchar('role_title', { length: 120 }).notNull().default('站主'),
  intro: mediumtext('intro').notNull().default(''),
  nowText: mediumtext('now_text').notNull().default(''),
  location: varchar('location', { length: 120 }).notNull().default(''),
  email: varchar('email', { length: 255 }).notNull().default(''),
  updatedAt: datetime('updated_at', { mode: 'date', fsp: 3 })
    .notNull()
    .default(sql`CURRENT_TIMESTAMP(3)`),
})
