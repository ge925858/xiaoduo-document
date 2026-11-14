import './database-isolation'
import { expect, test } from '@playwright/test'

test('reader searches only public chapters', async ({ page }) => {
  await page.goto('/library')
  await page.getByRole('button', { name: '搜索' }).click()
  const search = page
    .getByRole('dialog', { name: '搜索知笺' })
    .getByLabel('搜索公开章节')
  await search.fill('持续修订')
  await search.press('Enter')

  await expect(page).toHaveURL(/\/search\?q=/)
  await expect(
    page
      .locator('.search-results-page')
      .getByRole('link', { name: /长期维护/ }),
  ).toBeVisible()
  await expect(page.getByText('未发布草稿')).toHaveCount(0)
})
