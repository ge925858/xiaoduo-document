import { expect, test } from '@playwright/test'

test('invitee activates an account, logs in, and revokes the session', async ({
  page,
}) => {
  await page.goto('/studio/login')
  await page.getByLabel('邮箱').fill('owner@example.com')
  await page.getByLabel('密码').fill('owner-test-password')
  await page.getByRole('button', { name: '进入写作台' }).click()
  await expect(page).toHaveURL(/\/studio$/)

  await page.goto('/studio/collaboration')
  await page.getByLabel('邮箱').fill('invitee@example.com')
  await page.getByLabel('昵称').fill('受邀协作者')
  await page.getByLabel('授权文章').selectOption('article-1')
  await page.getByRole('button', { name: '生成邀请链接' }).click()
  const inviteLink = await page.getByLabel('邀请链接').inputValue()

  await page.getByRole('button', { name: '退出写作台' }).click()
  await page.goto(inviteLink)
  await page.getByLabel('显示名称').fill('协作者乙')
  await page.getByLabel('设置密码').fill('collaborator-password')
  await page.getByLabel('确认密码').fill('collaborator-password')
  await page.getByRole('button', { name: '激活协作者账号' }).click()
  await expect(
    page.getByText('账号已激活，现在可以登录写作台。'),
  ).toBeVisible()

  await page.getByRole('link', { name: '前往登录' }).click()
  await page.getByLabel('邮箱').fill('invitee@example.com')
  await page.getByLabel('密码').fill('collaborator-password')
  await page.getByRole('button', { name: '进入写作台' }).click()
  await expect(page).toHaveURL(/\/studio$/)

  const sessionCookie = (await page.context().cookies()).find((cookie) =>
    cookie.name.includes('session_token'),
  )
  expect(sessionCookie?.httpOnly).toBe(true)

  await page.getByRole('button', { name: '退出写作台' }).click()
  await page.goto('/studio')
  await expect(page).toHaveURL(/\/studio\/login/)
})
