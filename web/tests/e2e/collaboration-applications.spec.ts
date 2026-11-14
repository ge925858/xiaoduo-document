import './database-isolation'
import { expect, test } from '@playwright/test'

test('reader applies and owner approves an article-scoped invite', async ({
  page,
}) => {
  await page.goto('/library/attention-and-writing/写作不是归档')
  await page.getByRole('button', { name: '申请参与编辑' }).click()
  const applicationDialog = page.getByRole('dialog', {
    name: '申请参与编辑',
  })
  await applicationDialog.getByLabel('昵称').fill('协作者甲')
  await applicationDialog.getByLabel('邮箱').fill('collab@example.com')
  await applicationDialog
    .getByLabel('申请备注')
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

  await page.goto('/studio/login')
  await page.getByLabel('邮箱').fill('owner@example.com')
  await page.getByLabel('密码').fill('owner-test-password')
  await page.getByRole('button', { name: '进入写作台' }).click()
  await expect(page).toHaveURL(/\/studio$/)
  await page.goto('/studio/collaboration')
  await expect(
    page.getByRole('article').filter({ hasText: '协作者甲' }),
  ).toBeVisible()
  await page.getByRole('button', { name: '批准' }).click()
  await expect(page.getByLabel('邀请链接')).toHaveValue(/collaborate\/accept\//)
})
