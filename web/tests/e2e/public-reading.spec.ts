import { expect, test } from '@playwright/test'

test('reader opens a published chapter served from the database', async ({
  page,
}) => {
  await page.goto('/library/attention-and-writing/写作不是归档')

  await expect(
    page.getByRole('heading', { level: 1, name: '写作不是归档' }),
  ).toBeVisible()
  await expect(page.getByText('这是来自 MySQL 的公开章节。')).toBeVisible()
})
