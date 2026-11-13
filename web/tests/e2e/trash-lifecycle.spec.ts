import { expect, test } from '@playwright/test'

test('owner restores and permanently deletes trash items', async ({ page }) => {
  await page.goto('/studio/login')
  await page.getByLabel('邮箱').fill('owner@example.com')
  await page.getByLabel('密码').fill('owner-test-password')
  await page.getByRole('button', { name: '进入写作台' }).click()
  await expect(page).toHaveURL(/\/studio$/)

  await page.getByRole('button', { name: /移入回收站/ }).first().click()
  await page.getByRole('link', { name: '回收站' }).click()
  await expect(page.getByRole('heading', { name: '回收站' })).toBeVisible()
  await expect(page.getByRole('button', { name: '恢复章节' })).toBeVisible()
  await page.getByRole('button', { name: '恢复章节' }).first().click()
  await expect(page.getByText('回收站为空。')).toBeVisible()

  await page.goto('/studio')
  await page.getByRole('button', { name: /移入回收站/ }).first().click()
  await page.goto('/studio/trash')
  await page.getByRole('button', { name: '永久删除' }).first().click()
  await expect(page.getByText('回收站为空。')).toBeVisible()
})
