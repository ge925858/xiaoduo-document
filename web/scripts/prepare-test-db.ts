import { createTestConnection, prepareTestDatabase } from '../tests/test-db'

await prepareTestDatabase()

const connection = await createTestConnection()
try {
  await connection.query(
    `INSERT INTO category (id, title, slug, position) VALUES (?, ?, ?, ?)`,
    ['category-1', '注意力与写作', 'attention-and-writing', 1],
  )
  await connection.query(
    `INSERT INTO article (
      id, category_id, title, path, position, markdown, plain_text, revision,
      publication_state, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(3), NOW(3))`,
    [
      'article-1',
      'category-1',
      '写作不是归档',
      '写作不是归档',
      1,
      '## 从记录开始\n\n这是来自 MySQL 的公开章节。\n',
      '写作不是归档 这是来自 MySQL 的公开章节。',
      1,
      'published',
    ],
  )
  await connection.query(
    `INSERT INTO article_version (
      id, article_id, kind, title, path, markdown, plain_text,
      author_id, author_name, author_role, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(3))`,
    [
      'version-1',
      'article-1',
      'published',
      '写作不是归档',
      '写作不是归档',
      '## 从记录开始\n\n这是来自 MySQL 的公开章节。\n',
      '写作不是归档 这是来自 MySQL 的公开章节。',
      'owner-1',
      '小多',
      'owner',
    ],
  )
} finally {
  await connection.end()
}
