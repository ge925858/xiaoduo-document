import { expect, test } from '@playwright/test'

test('owner creates and autosaves a shared chapter draft', async ({ page }) => {
  await page.goto('/studio/login')
  await page.getByLabel('邮箱').fill('owner@example.com')
  await page.getByLabel('密码').fill('owner-test-password')
  await page.getByRole('button', { name: '进入写作台' }).click()
  await expect(page).toHaveURL(/\/studio$/)

  await page.getByRole('button', { name: '新建章节' }).click()
  await expect(page).toHaveURL(/\/studio\/notes\//)

  await page.getByLabel('章节标题').fill('自动保存测试')
  await page.getByRole('textbox', { name: '章节正文' }).fill('## 自动保存\n\n测试内容')
  await expect(page.getByRole('status')).toContainText('草稿已保存')

  await page.getByRole('textbox', { name: '章节正文' }).press(
    'ControlOrMeta+KeyS',
  )
  await expect(page.getByRole('status')).toContainText('草稿已保存')

  await page.reload()
  await expect(page.getByLabel('章节标题')).toHaveValue('自动保存测试')
  await expect(page.getByRole('textbox', { name: '章节正文' })).toContainText(
    '自动保存',
  )
  await expect(page.getByRole('textbox', { name: '章节正文' })).toContainText(
    '测试内容',
  )
})
