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
        'collaborator-20', '协作者二十', 'notify-20@example.com', true,
        'collaborator', 'active', NOW(3), NOW(3)
      )`,
    )
    await connection.query(
      `INSERT INTO auth_account (
        id, account_id, provider_id, user_id, password, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, NOW(3), NOW(3))`,
      [
        'account-collaborator-20',
        'collaborator-20',
        'credential',
        'collaborator-20',
        await hashPassword('collaborator-password'),
      ],
    )
  } finally {
    await connection.end()
  }
})

test('owner reviews applications through notifications only', async ({
  page,
  browser,
}) => {
  await page.goto('/library/attention-and-writing/写作不是归档')
  await page.getByLabel('昵称').fill('申请通知测试')
  await page.getByLabel('邮箱').fill('notify-application@example.com')
  await page.getByLabel('申请备注').fill('希望参与修订')
  await page.getByRole('button', { name: '提交申请' }).click()
  await expect(page.getByText('申请已提交，等待站主审核。')).toBeVisible()

  await page.goto('/studio/login')
  await page.getByLabel('邮箱').fill('owner@example.com')
  await page.getByLabel('密码').fill('owner-test-password')
  await page.getByRole('button', { name: '进入写作台' }).click()
  await expect(page).toHaveURL(/\/studio$/)
  await page.getByRole('link', { name: '通知' }).click()
  await expect(
    page.getByRole('heading', { name: '通知中心' }),
  ).toBeVisible()
  await expect(page.getByText('新的协作申请')).toBeVisible()
  await page
    .getByRole('button', { name: '标记已读 新的协作申请' })
    .click()
  await expect(
    page
      .getByRole('listitem')
      .filter({ hasText: '新的协作申请' })
      .getByText('已读', { exact: true }),
  ).toBeVisible()

  const collaboratorContext = await browser.newContext()
  const collaboratorPage = await collaboratorContext.newPage()
  await collaboratorPage.goto('/studio/login')
  await collaboratorPage
    .getByLabel('邮箱')
    .fill('notify-20@example.com')
  await collaboratorPage
    .getByLabel('密码')
    .fill('collaborator-password')
  await collaboratorPage.getByRole('button', { name: '进入写作台' }).click()
  await expect(collaboratorPage).toHaveURL(/\/studio$/)
  expect(
    (
      await collaboratorPage.request.get('/api/studio/notifications', {
        headers: { origin: 'http://127.0.0.1:3100' },
      })
    ).status(),
  ).toBe(403)
  await collaboratorPage.goto('/studio/notifications')
  await expect(collaboratorPage).toHaveURL(/\/studio$/)

  await collaboratorContext.close()
})
