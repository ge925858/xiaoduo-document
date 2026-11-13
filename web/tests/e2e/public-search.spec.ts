import { expect, test } from '@playwright/test'

test('reader searches only public chapters', async ({ page }) => {
  await page.goto('/library')
  const search = page.getByRole('search')
  await search.getByLabel('搜索公开章节').fill('持续修订')
  await search.press('Enter')

  await expect(page).toHaveURL(/\/search\?q=/)
  await expect(page.getByRole('link', { name: /长期维护/ })).toBeVisible()
  await expect(page.getByText('未发布草稿')).toHaveCount(0)
})
