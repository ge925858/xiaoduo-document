import './database-isolation'
import { hashPassword } from 'better-auth/crypto'
import { expect, test } from '@playwright/test'
import { createTestConnection } from '../test-db'
import { appOrigin } from './app-origin'

test.beforeAll(async () => {
  const connection = await createTestConnection()
  try {
    await connection.query(
      `INSERT INTO auth_user (
        id, name, email, email_verified, role, status, created_at, updated_at
      ) VALUES
        ('collaborator-18a', '协作者 18A', 'trash-a@example.com', true,
         'collaborator', 'active', NOW(3), NOW(3)),
        ('collaborator-18b', '协作者 18B', 'trash-b@example.com', true,
         'collaborator', 'active', NOW(3), NOW(3))`,
    )
    for (const suffix of ['a', 'b']) {
      await connection.query(
        `INSERT INTO auth_account (
          id, account_id, provider_id, user_id, password, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, NOW(3), NOW(3))`,
        [
          `account-collaborator-18${suffix}`,
          `collaborator-18${suffix}`,
          'credential',
          `collaborator-18${suffix}`,
          await hashPassword('collaborator-password'),
        ],
      )
    }
    await connection.query(
      `INSERT INTO article_grant (user_id, article_id, created_at) VALUES
        ('collaborator-18a', 'article-1', NOW(3)),
        ('collaborator-18b', 'article-2', NOW(3))`,
    )
  } finally {
    await connection.end()
  }
})

async function login(page: import('@playwright/test').Page, email: string) {
  await page.goto('/studio/login')
  await page.getByLabel('邮箱').fill(email)
  await page.getByLabel('密码').fill('collaborator-password')
  await page.getByRole('button', { name: '进入写作台' }).click()
  await expect(page).toHaveURL(/\/studio$/)
}

test('collaborators only see and restore their own trash actor items', async ({
  browser,
}) => {
  const firstContext = await browser.newContext()
  const firstPage = await firstContext.newPage()
  await login(firstPage, 'trash-a@example.com')
  await firstPage
    .getByRole('button', { name: '移入回收站 写作不是归档' })
    .click()
  await firstPage.getByRole('link', { name: '回收站' }).click()
  await expect(firstPage).toHaveURL(/\/studio\/trash$/)
  await expect(
    firstPage.getByRole('heading', { name: '写作不是归档' }),
  ).toBeVisible()
  await expect(firstPage.getByText('长期维护')).toHaveCount(0)
  await expect(
    firstPage.getByRole('button', { name: '永久删除' }),
  ).toHaveCount(0)

  const secondContext = await browser.newContext()
  const secondPage = await secondContext.newPage()
  await login(secondPage, 'trash-b@example.com')
  await secondPage
    .getByRole('button', { name: '移入回收站 长期维护' })
    .click()
  await secondPage.getByRole('link', { name: '回收站' }).click()
  await expect(secondPage).toHaveURL(/\/studio\/trash$/)
  await expect(
    secondPage.getByRole('heading', { name: '长期维护' }),
  ).toBeVisible()
  await expect(secondPage.getByText('写作不是归档')).toHaveCount(0)
  expect(
    (
      await secondPage.request.post(
        '/api/studio/articles/article-1/restore',
        { headers: { origin: appOrigin } },
      )
    ).status(),
  ).toBe(404)
  expect(
    (
      await secondPage.request.delete(
        '/api/studio/articles/article-2',
        { headers: { origin: appOrigin } },
      )
    ).status(),
  ).toBe(403)

  await secondPage.getByRole('button', { name: '恢复章节' }).click()
  await expect(secondPage.getByText('回收站是空的')).toBeVisible()

  await firstPage.getByRole('button', { name: '恢复章节' }).click()
  await expect(firstPage.getByText('回收站是空的')).toBeVisible()

  const ownerContext = await browser.newContext()
  const ownerPage = await ownerContext.newPage()
  await ownerPage.goto('/studio/login')
  await ownerPage.getByLabel('邮箱').fill('owner@example.com')
  await ownerPage.getByLabel('密码').fill('owner-test-password')
  await ownerPage.getByRole('button', { name: '进入写作台' }).click()
  await expect(ownerPage).toHaveURL(/\/studio$/)
  await ownerPage.getByRole('button', { name: /移入回收站/ }).first().click()
  await ownerPage.getByRole('link', { name: '回收站' }).click()
  await expect(ownerPage).toHaveURL(/\/studio\/trash$/)
  await expect(ownerPage.getByRole('button', { name: '永久删除' })).toBeVisible()

  await ownerContext.close()
  await secondContext.close()
  await firstContext.close()
})
