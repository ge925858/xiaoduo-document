import { expect, test } from '@playwright/test'

test.use({ viewport: { width: 390, height: 844 } })

test('mobile reading, search, themes and studio controls remain usable', async ({
  page,
}) => {
  await page.goto('/library/attention-and-writing/写作不是归档')
  const themeToggle = page.getByRole('button', {
    name: '切换到深色主题',
  })
  await expect(themeToggle).toBeVisible()
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth + 1,
    ),
  ).toBe(true)

  await themeToggle.focus()
  await page.keyboard.press('Enter')
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
  await expect(
    page.getByRole('button', { name: '切换到浅色主题' }),
  ).toBeVisible()
  const contrast = await page.evaluate(() => {
    const parse = (value: string) =>
      value
        .match(/\d+(?:\.\d+)?/g)!
        .slice(0, 3)
        .map(Number)
    const luminance = (rgb: number[]) => {
      const channels = rgb.map((value) => {
        const channel = value / 255
        return channel <= 0.03928
          ? channel / 12.92
          : ((channel + 0.055) / 1.055) ** 2.4
      })
      return (
        0.2126 * channels[0] +
        0.7152 * channels[1] +
        0.0722 * channels[2]
      )
    }
    const style = getComputedStyle(document.body)
    const foreground = luminance(parse(style.color))
    const background = luminance(parse(style.backgroundColor))
    return (
      (Math.max(foreground, background) + 0.05) /
      (Math.min(foreground, background) + 0.05)
    )
  })
  expect(contrast).toBeGreaterThanOrEqual(4.5)
  await page.reload()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')

  await page.getByLabel('搜索公开章节').fill('写作')
  await page.getByLabel('搜索公开章节').press('Enter')
  await expect(page).toHaveURL(/\/search\?q=/)
  await expect(page.getByText('1 条结果')).toBeVisible()

  await page.goto('/library/attention-and-writing/写作不是归档')
  await expect(page.getByLabel('昵称')).toBeVisible()
  await expect(page.getByRole('button', { name: '提交申请' })).toBeVisible()

  await page.goto('/studio/login')
  await page.getByLabel('邮箱').fill('owner@example.com')
  await page.getByLabel('密码').fill('owner-test-password')
  await page.getByLabel('密码').press('Enter')
  await expect(page).toHaveURL(/\/studio$/)
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth + 1,
    ),
  ).toBe(true)
  await page.goto('/studio/notes/article-1')
  await page.getByRole('button', { name: '保存草稿' }).focus()
  await expect(page.getByRole('button', { name: '保存草稿' })).toBeFocused()
  const unnamedControls = await page.evaluate(() =>
    [...document.querySelectorAll('button, a[href], input, select, textarea')]
      .filter((element) => {
        const control = element as HTMLInputElement
        if (control.type === 'hidden') return false
        const label =
          control.getAttribute('aria-label') ??
          control.getAttribute('title') ??
          control.textContent ??
          ''
        if (label.trim()) return false
        return !control.labels?.length && !control.id
      })
      .map((element) => element.outerHTML.slice(0, 80)),
  )
  expect(unnamedControls).toEqual([])
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth + 1,
    ),
  ).toBe(true)
})
