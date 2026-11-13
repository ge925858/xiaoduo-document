import { expect, test } from '@playwright/test'

test('owner saves and restores a manual version', async ({ page }) => {
  await page.goto('/studio/login')
  await page.getByLabel('邮箱').fill('owner@example.com')
  await page.getByLabel('密码').fill('owner-test-password')
  await page.getByRole('button', { name: '进入写作台' }).click()
  await expect(page).toHaveURL(/\/studio$/)

  await page.goto('/studio/notes/article-1')
  await page.getByLabel('章节标题').fill('版本测试标题')
  await page.getByRole('textbox', { name: '章节正文' }).fill('版本测试内容')
  await expect(page.getByRole('status').first()).toContainText('草稿已保存')

  await page.getByLabel('版本说明').fill('测试快照')
  await page.getByRole('button', { name: '保存版本' }).click()
  await expect(page.getByText('测试快照')).toBeVisible()
  await expect(
    page.getByRole('listitem').filter({ hasText: '测试快照' }),
  ).toContainText('小多 · 站主')

  await page.getByLabel('章节标题').fill('被恢复覆盖的标题')
  await page.getByRole('textbox', { name: '章节正文' }).fill('被恢复覆盖的内容')
  await expect(page.getByRole('status').first()).toContainText('草稿已保存')

  await page.getByRole('button', { name: '恢复为当前草稿' }).first().click()
  await expect(page.getByLabel('章节标题')).toHaveValue('版本测试标题')
  await expect(page.getByRole('textbox', { name: '章节正文' })).toContainText(
    '版本测试内容',
  )
})
