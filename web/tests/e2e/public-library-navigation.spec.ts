import './database-isolation'
import { expect, test } from '@playwright/test'
import { seedTestDatabase } from '../seed-test-db'

test.beforeEach(async () => {
  await seedTestDatabase()
})

test('reader navigates the public library and adjacent chapters', async ({
  page,
}) => {
  await page.goto('/')
  await page.getByRole('link', { name: '进入笔记库' }).click()
  await expect(page).toHaveURL(/\/library$/)
  await expect(
    page.getByRole('navigation', { name: '笔记目录' }),
  ).toBeVisible()
  await expect(page.getByRole('link', { name: '工具与方法' })).toHaveCount(0)

  await page
    .getByRole('navigation', { name: '笔记目录' })
    .getByRole('link', { name: '写作不是归档' })
    .click()
  await expect(
    page.getByRole('heading', { level: 1, name: '写作不是归档' }),
  ).toBeVisible()
  await expect(
    page.getByRole('link', { name: '写作不是归档' }),
  ).toHaveAttribute('aria-current', 'page')
  await expect(
    page.getByRole('link', { name: '下一章 · 长期维护' }),
  ).toBeVisible()
  await expect(page.locator('.chapter-byline strong')).toHaveText('小多')
})
