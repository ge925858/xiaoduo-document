import { expect, test } from '@playwright/test'

test('owner manages categories and manual order', async ({ page }) => {
  await page.goto('/studio/login')
  await page.getByLabel('邮箱').fill('owner@example.com')
  await page.getByLabel('密码').fill('owner-test-password')
  await page.getByRole('button', { name: '进入写作台' }).click()
  await expect(page).toHaveURL(/\/studio$/)

  await page.goto('/studio/categories')
  await page.getByLabel('新分类名称').fill('阅读测试')
  await page.getByLabel('新分类网址标识').fill('reading-test')
  await page.getByRole('button', { name: '创建分类' }).click()
  await expect(page.getByLabel('分类名称 阅读测试')).toBeVisible()

  await page.getByLabel('分类名称 阅读测试').fill('阅读与测试')
  await page.getByLabel('分类网址标识 阅读测试').fill('reading-and-test')
  await page
    .getByRole('button', { name: '保存分类' })
    .last()
    .click()
  await expect(page.getByLabel('分类名称 阅读与测试')).toBeVisible()

  await page.getByRole('button', { name: '下移 注意力与写作' }).click()
  await expect(
    page.locator('.category-list li').first().locator('input').first(),
  ).toHaveValue('阅读与测试')

  await page.getByRole('button', { name: '删除 阅读与测试' }).click()
  await expect(page.getByLabel('分类名称 阅读与测试')).toHaveCount(0)
})
