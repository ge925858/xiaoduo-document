import './database-isolation'
import { hashPassword } from 'better-auth/crypto'
import { expect, test } from '@playwright/test'
import { createTestConnection } from '../test-db'
import { seedTestDatabase } from '../seed-test-db'
import { appOrigin } from './app-origin'

test.beforeEach(async () => {
  await seedTestDatabase()
  const connection = await createTestConnection()
  try {
    await connection.query(
      `INSERT INTO auth_user (
        id, name, email, email_verified, role, status, created_at, updated_at
      ) VALUES (
        'collaborator-19', '协作者十九', 'managed-19@example.com', true,
        'collaborator', 'active', NOW(3), NOW(3)
      )`,
    )
    await connection.query(
      `INSERT INTO auth_account (
        id, account_id, provider_id, user_id, password, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, NOW(3), NOW(3))`,
      [
        'account-collaborator-19',
        'collaborator-19',
        'credential',
        'collaborator-19',
        await hashPassword('old-collaborator-password'),
      ],
    )
    await connection.query(
      `INSERT INTO article_grant (user_id, article_id, created_at)
       VALUES ('collaborator-19', 'article-1', NOW(3))`,
    )
  } finally {
    await connection.end()
  }
})

test('owner suspends, restores, and resets a collaborator account', async ({
  browser,
}) => {
  const collaboratorContext = await browser.newContext()
  const collaboratorPage = await collaboratorContext.newPage()
  await collaboratorPage.goto('/studio/login')
  await collaboratorPage
    .getByLabel('邮箱')
    .fill('managed-19@example.com')
  await collaboratorPage
    .getByLabel('密码')
    .fill('old-collaborator-password')
  await collaboratorPage.getByRole('button', { name: '进入写作台' }).click()
  await expect(collaboratorPage).toHaveURL(/\/studio$/)

  const ownerContext = await browser.newContext()
  const ownerPage = await ownerContext.newPage()
  await ownerPage.goto('/studio/login')
  await ownerPage.getByLabel('邮箱').fill('owner@example.com')
  await ownerPage.getByLabel('密码').fill('owner-test-password')
  await ownerPage.getByRole('button', { name: '进入写作台' }).click()
  await expect(ownerPage).toHaveURL(/\/studio$/)
  await ownerPage.goto('/studio/collaboration')
  await ownerPage
    .getByRole('button', { name: '暂停账号 协作者十九' })
    .click()
  await expect(ownerPage.getByText('账号已暂停')).toBeVisible()

  await collaboratorPage.goto('/studio')
  await expect(collaboratorPage).toHaveURL(/\/studio\/login/)

  await ownerPage
    .getByRole('button', { name: '恢复账号 协作者十九' })
    .click()
  await expect(ownerPage.getByText('账号已恢复')).toBeVisible()

  await collaboratorPage.getByLabel('邮箱').fill('managed-19@example.com')
  await collaboratorPage
    .getByLabel('密码')
    .fill('old-collaborator-password')
  await collaboratorPage.getByRole('button', { name: '进入写作台' }).click()
  await expect(collaboratorPage).toHaveURL(/\/studio$/)
  await expect(
    collaboratorPage.getByRole('link', { name: '写作不是归档' }),
  ).toBeVisible()

  await ownerPage
    .getByRole('button', { name: '生成重置链接 协作者十九' })
    .click()
  const resetLink = await ownerPage.getByLabel('密码重置链接').inputValue()

  const resetContext = await browser.newContext()
  const resetPage = await resetContext.newPage()
  await resetPage.goto(resetLink)
  await expect(
    resetPage.getByRole('heading', { level: 1, name: '设置新密码' }),
  ).toBeVisible()
  await expect(
    resetPage.getByRole('link', { name: '返回知笺' }),
  ).toBeVisible()
  await expect(
    resetPage.getByText('managed-19@example.com'),
  ).toBeVisible()
  await expect(
    resetPage.getByText(/重置链接将在 .* 过期/),
  ).toBeVisible()
  await resetPage
    .getByLabel('新密码', { exact: true })
    .fill('new-collaborator-password')
  await resetPage
    .getByLabel('确认新密码')
    .fill('different-password')
  await resetPage.getByRole('button', { name: '设置新密码' }).click()
  await expect(
    resetPage.getByText('两次输入的密码不一致。', { exact: true }),
  ).toBeVisible()
  await resetPage
    .getByLabel('确认新密码')
    .fill('new-collaborator-password')
  await resetPage.getByRole('button', { name: '设置新密码' }).click()
  await expect(resetPage.getByText('密码已更新，可以重新登录。')).toBeVisible()

  await resetPage.goto(resetLink)
  await expect(resetPage.getByText('此重置链接已使用。')).toBeVisible()

  const renewedContext = await browser.newContext()
  const renewedPage = await renewedContext.newPage()
  await renewedPage.goto('/studio/login')
  await renewedPage.getByLabel('邮箱').fill('managed-19@example.com')
  await renewedPage
    .getByLabel('密码')
    .fill('new-collaborator-password')
  const [renewedLogin] = await Promise.all([
    renewedPage.waitForResponse((response) =>
      response.url().endsWith('/api/auth/sign-in/email'),
    ),
    renewedPage.getByRole('button', { name: '进入写作台' }).click(),
  ])
  expect(renewedLogin.status()).toBe(200)
  await expect(renewedPage).toHaveURL(/\/studio$/)

  expect(
    (
      await renewedPage.request.post(
        '/api/studio/collaboration/collaborators/collaborator-19/password-reset',
        { headers: { origin: appOrigin } },
      )
    ).status(),
  ).toBe(403)

  await renewedContext.close()
  await resetContext.close()
  await ownerContext.close()
  await collaboratorContext.close()
})
