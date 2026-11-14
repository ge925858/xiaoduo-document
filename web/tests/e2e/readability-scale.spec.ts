import './database-isolation'
import { expect, type Locator, test } from '@playwright/test'

async function cssPixels(locator: Locator, property: string) {
  return locator.evaluate(
    (element, name) =>
      Number.parseFloat(
        window.getComputedStyle(element).getPropertyValue(name),
      ),
    property,
  )
}

async function iconWidth(locator: Locator) {
  const box = await locator.locator('svg').first().boundingBox()
  return box?.width ?? 0
}

test('public reading surfaces use the larger type and icon scale', async ({
  page,
}) => {
  await page.goto('/library/attention-and-writing/写作不是归档')

  const prose = page.getByText('这是来自 MySQL 的公开章节。')
  const chapterLink = page
    .getByRole('navigation', { name: '笔记目录' })
    .getByRole('link', { name: '写作不是归档' })
  const searchButton = page.getByRole('button', { name: '搜索' })

  expect(await cssPixels(prose, 'font-size')).toBeGreaterThanOrEqual(19)
  expect(await cssPixels(chapterLink, 'font-size')).toBeGreaterThanOrEqual(14)
  expect(await iconWidth(searchButton)).toBeGreaterThanOrEqual(18)
})

test('studio navigation and actions use the larger type and icon scale', async ({
  page,
}) => {
  await page.goto('/studio/login')
  await page.getByLabel('邮箱').fill('owner@example.com')
  await page.getByLabel('密码').fill('owner-test-password')
  await page.getByRole('button', { name: '进入写作台' }).click()

  const navigation = page.getByRole('navigation', {
    name: '写作台导航',
  })
  const contentLink = navigation.getByRole('link', { name: '内容' })
  const importButton = page.getByRole('button', {
    name: '导入 Markdown',
  })

  expect(await cssPixels(contentLink, 'font-size')).toBeGreaterThanOrEqual(14)
  expect(await iconWidth(contentLink)).toBeGreaterThanOrEqual(18)
  expect(await cssPixels(importButton, 'font-size')).toBeGreaterThanOrEqual(14)
  expect(await iconWidth(importButton)).toBeGreaterThanOrEqual(18)
})
