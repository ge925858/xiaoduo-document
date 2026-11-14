import './database-isolation'
import { expect, test } from '@playwright/test'

test('reader applies and owner approves an article-scoped invite', async ({
  page,
}) => {
  await page.goto('/library/attention-and-writing/写作不是归档')
  const applicationTrigger = page.getByRole('button', {
    name: '申请参与编辑',
  })
  await applicationTrigger.click()
  const applicationDialog = page.getByRole('dialog', {
    name: '申请参与编辑',
  })
  await expect(applicationDialog.getByLabel('昵称')).toBeFocused()
  await expect(applicationDialog.getByLabel('昵称')).toHaveAttribute(
    'placeholder',
    '怎么称呼你',
  )
  await expect(applicationDialog.getByLabel('邮箱')).toHaveAttribute(
    'placeholder',
    '用于接收邀请和登录',
  )
  await expect(applicationDialog.getByLabel('申请说明')).toHaveAttribute(
    'placeholder',
    '简单说明你希望补充或修改的内容',
  )
  await expect(
    applicationDialog.getByText(
      '此时不会创建账号，也不需要设置密码。审核通过后，站主会生成一次性邀请链接。',
    ),
  ).toBeVisible()
  await applicationDialog.getByLabel('昵称').fill('协作者甲')
  await applicationDialog.getByLabel('邮箱').fill('collab@example.com')
  await applicationDialog
    .getByLabel('申请说明')
    .fill('希望补充一个案例')
  const [applicationResponse] = await Promise.all([
    page.waitForResponse((response) =>
      response.url().endsWith('/api/collaboration/applications'),
    ),
    applicationDialog.getByRole('button', { name: '提交申请' }).click(),
  ])
  expect(applicationResponse.status()).toBe(201)
  await expect(
    applicationDialog.getByText('申请已提交，等待站主审核。'),
  ).toBeVisible()
  await applicationDialog.getByLabel('昵称').fill('协作者甲')
  await applicationDialog.getByLabel('邮箱').fill('collab@example.com')
  await applicationDialog.getByLabel('申请说明').fill('重复申请')
  const [duplicateResponse] = await Promise.all([
    page.waitForResponse((response) =>
      response.url().endsWith('/api/collaboration/applications'),
    ),
    applicationDialog.getByRole('button', { name: '提交申请' }).click(),
  ])
  expect(duplicateResponse.status()).toBe(409)
  await expect(
    applicationDialog.getByRole('alert'),
  ).toHaveText('这篇章节已有待审核申请。')
  await page.keyboard.press('Escape')
  await expect(applicationTrigger).toBeFocused()

  await page.goto('/studio/login')
  await page.getByLabel('邮箱').fill('owner@example.com')
  await page.getByLabel('密码').fill('owner-test-password')
  await page.getByRole('button', { name: '进入写作台' }).click()
  await expect(page).toHaveURL(/\/studio$/)
  await page.goto('/studio/collaboration')
  await expect(
    page.getByRole('article').filter({ hasText: '协作者甲' }),
  ).toBeVisible()
  await page.getByRole('button', { name: '通过' }).click()
  await expect(
    page.getByRole('textbox', { name: '邀请链接', exact: true }),
  ).toHaveValue(/collaborate\/accept\//)
})
