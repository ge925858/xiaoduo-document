import './database-isolation'
import { expect, test } from '@playwright/test'

test('editor navigates Markdown changes without auto-opening the list', async ({
  page,
}) => {
  await page.goto('/studio/login')
  await page.getByLabel('邮箱').fill('owner@example.com')
  await page.getByLabel('密码').fill('owner-test-password')
  await page.getByRole('button', { name: '进入写作台' }).click()
  await expect(page).toHaveURL(/\/studio$/)
  await page.goto('/studio/notes/article-1')

  await page
    .getByRole('textbox', { name: '章节正文' })
    .fill('## 第一节\n\n第一版正文。')
  await page.keyboard.press('ControlOrMeta+KeyS')
  await expect(page.getByRole('status').first()).toContainText('草稿已保存')
  await page.getByRole('button', { name: '版本历史' }).click()
  const history = page.getByRole('dialog', { name: '版本历史' })
  await history.getByLabel('版本说明').fill('差异第一版')
  await history.getByRole('button', { name: '保存版本' }).click()
  await expect(page.getByText('差异第一版')).toBeVisible()
  await history.getByRole('button', { name: '关闭' }).click()

  await page
    .getByRole('textbox', { name: '章节正文' })
    .fill('## 第一节\n\n第二版正文，增加了新结论。')
  await page.keyboard.press('ControlOrMeta+KeyS')
  await expect(page.getByRole('status').first()).toContainText('草稿已保存')
  await page.getByRole('button', { name: '版本历史' }).click()
  await history.getByLabel('版本说明').fill('差异第二版')
  await history.getByRole('button', { name: '保存版本' }).click()
  await expect(page.getByText('差异第二版')).toBeVisible()

  await page
    .getByRole('button', { name: '与 差异第二版 对比上一版本' })
    .click()
  await expect(page.getByRole('heading', { name: '版本差异' })).toBeVisible()
  await expect(page.getByText(/共 \d+ 处变化/)).toBeVisible()
  await expect(page.getByText(/新增 \d+ · 删除 \d+ · 修改 \d+/)).toBeVisible()
  await expect(page.getByRole('list', { name: '变更列表' })).toHaveCount(0)

  await page.getByRole('button', { name: '下一处' }).click()
  await expect(page.getByRole('list', { name: '变更列表' })).toHaveCount(0)
  await expect(page.locator('.markdown-diff-block.is-active')).toHaveCount(2)
  await page.getByRole('button', { name: '变更列表' }).click()
  await expect(page.getByRole('list', { name: '变更列表' })).toBeVisible()

  await page.getByRole('button', { name: '关闭对照' }).click()
  await page
    .getByRole('textbox', { name: '章节正文' })
    .fill('## 第一节\n\n第三版当前草稿，保留新增结论。')
  await page.keyboard.press('ControlOrMeta+KeyS')
  await expect(page.getByRole('status').first()).toContainText('草稿已保存')
  await page.getByRole('button', { name: '对照当前草稿' }).click()
  await page.getByRole('button', { name: '下一处' }).click()
  await page.getByRole('button', { name: '下一处' }).click()
  await expect(page.getByText('已定位到当前草稿')).toBeVisible()
})
