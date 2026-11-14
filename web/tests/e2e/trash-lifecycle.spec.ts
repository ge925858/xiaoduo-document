import './database-isolation'
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
  await expect(
    page.getByText(/\d+ 天后永久删除/).first(),
  ).toBeVisible()
  const firstRow = page.locator('.studio-trash-row').first()
  const restoredTitle = await firstRow.locator('h2').innerText()
  await firstRow.getByRole('button', { name: '恢复章节' }).click()
  await expect(
    page.getByRole('heading', { name: restoredTitle }),
  ).toHaveCount(0)

  await page.goto('/studio')
  await page.getByRole('button', { name: /移入回收站/ }).first().click()
  await page.goto('/studio/trash')
  const deleteRow = page.locator('.studio-trash-row').first()
  const deletedTitle = await deleteRow.locator('h2').innerText()
  await deleteRow
    .getByRole('button', { name: '永久删除章节' })
    .click()
  await page.getByRole('button', { name: '永久删除', exact: true }).click()
  await expect(
    page.getByRole('heading', { name: deletedTitle }),
  ).toHaveCount(0)
})
