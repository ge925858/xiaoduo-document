import './database-isolation'
import { expect, test } from '@playwright/test'
import { seedTestDatabase } from '../seed-test-db'

test.beforeEach(async () => {
  await seedTestDatabase()
})

test('reader navigates the public library and adjacent chapters', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 500 })
  await page.goto('/')
  await page
    .locator('.landing-header')
    .getByRole('link', { name: '进入笔记库' })
    .click()
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
    page.getByRole('navigation', { name: '面包屑' }),
  ).toContainText('注意力与写作')
  await expect(
    page.getByRole('link', { name: '写作不是归档' }),
  ).toHaveAttribute('aria-current', 'page')
  await expect(page.locator('.chapter-byline strong')).toHaveText('小多')
  await expect(page.locator('.chapter-byline')).toContainText(/\d+ 字/)
  await expect(
    page.getByRole('link', { name: /下一章.*长期维护/ }),
  ).toHaveAttribute(
    'href',
    '/library/attention-and-writing/长期维护',
  )

  const chapterToc = page.getByLabel('本章目录')
  const firstSection = chapterToc.getByRole('link', {
    name: '从记录开始',
  })
  const secondSection = chapterToc.getByRole('link', {
    name: '持续修订',
  })
  await firstSection.click()
  await expect(firstSection).toHaveAttribute('aria-current', 'location')
  await page.locator('#library-content').evaluate((element) => {
    element.scrollTo({ top: element.scrollHeight })
  })
  await expect(secondSection).toHaveAttribute('aria-current', 'location')

  await page.goto('/library/tools')
  await expect(
    page.getByText('这个分类暂时没有公开章节。'),
  ).toBeVisible()
})

test('application entry is shown only to signed-out readers', async ({
  page,
}) => {
  await page.goto('/library/attention-and-writing/写作不是归档')
  await expect(
    page.getByText('愿意一起完善这篇笔记？'),
  ).toBeVisible()
  await page
    .getByRole('button', { name: '申请参与编辑' })
    .click()
  await expect(
    page.getByRole('dialog', { name: '申请参与编辑' }),
  ).toContainText('只会获得《写作不是归档》的编辑权限')
  await page.keyboard.press('Escape')

  await page.goto('/studio/login')
  await page.getByLabel('邮箱').fill('owner@example.com')
  await page.getByLabel('密码').fill('owner-test-password')
  await page.getByRole('button', { name: '进入写作台' }).click()
  await expect(page).toHaveURL(/\/studio$/)

  await page.goto('/library/attention-and-writing/写作不是归档')
  await expect(
    page.getByText('愿意一起完善这篇笔记？'),
  ).toHaveCount(0)
})
