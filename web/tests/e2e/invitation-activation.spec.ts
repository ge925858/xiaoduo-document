import './database-isolation'
import { expect, test } from '@playwright/test'
import { eq } from 'drizzle-orm'
import { db } from '../../src/db/client'
import { collaborationInvite } from '../../src/db/schema'
import { createDirectInvite } from '../../src/server/collaboration'

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
  await expect(
    page.getByRole('heading', { level: 1, name: '接受协作邀请' }),
  ).toBeVisible()
  await expect(
    page.getByRole('link', { name: '返回知笺' }),
  ).toBeVisible()
  await expect(page.getByText('invitee@example.com')).toBeVisible()
  await expect(page.getByText('写作不是归档')).toBeVisible()
  await expect(page.getByText(/邀请将在 .* 过期/)).toBeVisible()
  await page.getByLabel('昵称').fill('协作者乙')
  await page.getByLabel('设置密码').fill('collaborator-password')
  await page.getByLabel('确认密码').fill('different-password')
  await page.getByRole('button', { name: '激活协作账号' }).click()
  await expect(
    page.getByText('两次输入的密码不一致。', { exact: true }),
  ).toBeVisible()
  await page.getByLabel('确认密码').fill('collaborator-password')
  await page.getByRole('button', { name: '激活协作账号' }).click()
  await expect(
    page.getByText('账号已激活，现在可以登录写作台。'),
  ).toBeVisible()

  await page.goto(inviteLink)
  await expect(
    page.getByRole('heading', {
      level: 1,
      name: '这个邀请已经激活',
    }),
  ).toBeVisible()
  await expect(
    page.getByText('此邀请已经激活，请直接登录。'),
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

test('invite page explains expired and revoked invitations', async ({
  page,
}) => {
  const expired = await createDirectInvite({
    email: 'expired@example.com',
    articleIds: ['article-1'],
  })
  await db
    .update(collaborationInvite)
    .set({ status: 'expired' })
    .where(eq(collaborationInvite.id, expired.id))

  await page.goto(`/collaborate/accept/${expired.token}`)
  await expect(
    page.getByRole('heading', {
      level: 1,
      name: '邀请链接已过期',
    }),
  ).toBeVisible()
  await expect(
    page.getByText('此邀请已过期，请联系站主重新邀请。'),
  ).toBeVisible()

  const revoked = await createDirectInvite({
    email: 'revoked@example.com',
    articleIds: ['article-1'],
  })
  await db
    .update(collaborationInvite)
    .set({ status: 'revoked' })
    .where(eq(collaborationInvite.id, revoked.id))

  await page.goto(`/collaborate/accept/${revoked.token}`)
  await expect(
    page.getByRole('heading', {
      level: 1,
      name: '邀请已经被撤销',
    }),
  ).toBeVisible()
  await expect(
    page.getByText('此邀请已撤销，请联系站主。'),
  ).toBeVisible()
})
