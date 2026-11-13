import './database-isolation'
import { hashPassword } from 'better-auth/crypto'
import { expect, test } from '@playwright/test'
import { createTestConnection } from '../test-db'

test.beforeAll(async () => {
  const connection = await createTestConnection()
  try {
    await connection.query(
      `INSERT INTO auth_user (
        id, name, email, email_verified, role, status, created_at, updated_at
      ) VALUES (
        'collaborator-16', '协作者乙', 'publisher@example.com', true,
        'collaborator', 'active', NOW(3), NOW(3)
      )`,
    )
    await connection.query(
      `INSERT INTO auth_account (
        id, account_id, provider_id, user_id, password, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, NOW(3), NOW(3))`,
      [
        'account-collaborator-16',
        'collaborator-16',
        'credential',
        'collaborator-16',
        await hashPassword('collaborator-password'),
      ],
    )
    await connection.query(
      `INSERT INTO article_grant (user_id, article_id, created_at)
       VALUES ('collaborator-16', 'article-1', NOW(3))`,
    )
  } finally {
    await connection.end()
  }
})

test('collaborator saves a shared version and publishes as a contributor', async ({
  page,
}) => {
  await page.goto('/studio/login')
  await page.getByLabel('邮箱').fill('publisher@example.com')
  await page.getByLabel('密码').fill('collaborator-password')
  await page.getByRole('button', { name: '进入写作台' }).click()
  await expect(page).toHaveURL(/\/studio$/)

  await page.goto('/studio/notes/article-1')
  await expect(page.getByRole('heading', { name: '版本历史' })).toBeVisible()
  await expect(
    page
      .getByRole('listitem')
      .filter({ hasText: '小多 · 站主' })
      .first(),
  ).toBeVisible()
  await page.getByLabel('章节标题').fill('协作者公开发布')
  await page
    .getByRole('textbox', { name: '章节正文' })
    .fill('## 协作者修订\n\n这段内容由协作者发布。')
  await expect(page.getByRole('status').first()).toContainText('草稿已保存')

  await page.getByLabel('版本说明').fill('协作者手动快照')
  await page.getByRole('button', { name: '保存版本' }).click()
  await expect(page.getByText('协作者手动快照')).toBeVisible()
  await expect(
    page.getByRole('listitem').filter({ hasText: '协作者手动快照' }),
  ).toContainText('协作者乙 · 协作者')

  await page.getByRole('button', { name: '更新发布' }).click()
  await expect(page.getByRole('button', { name: '更新发布' })).toBeEnabled()

  await page.goto('/library/attention-and-writing/协作者公开发布')
  await expect(
    page.getByRole('heading', { level: 1, name: '协作者公开发布' }),
  ).toBeVisible()
  await expect(page.getByText('这段内容由协作者发布。')).toBeVisible()
  await expect(page.getByText('协作者乙')).toBeVisible()
  await expect(
    page.locator('.chapter-contributors').getByText('协作者乙'),
  ).toHaveCount(1)

  await page.goto('/library/attention-and-writing/写作不是归档')
  await expect(
    page.getByRole('heading', { level: 1, name: '协作者公开发布' }),
  ).toBeVisible()
})
