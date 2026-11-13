import { expect, test } from '@playwright/test'

const origin = 'http://127.0.0.1:3100'

test('stale editor compares both versions and adopts the saved draft', async ({
  page,
}) => {
  await page.goto('/studio/login')
  await page.getByLabel('邮箱').fill('owner@example.com')
  await page.getByLabel('密码').fill('owner-test-password')
  await page.getByRole('button', { name: '进入写作台' }).click()
  await expect(page).toHaveURL(/\/studio$/)
  await page.goto('/studio/notes/article-1')

  const savedResponse = await page.request.put(
    '/api/studio/articles/article-1/draft',
    {
      headers: { origin },
      data: {
        title: '另一位编辑者的标题',
        categoryId: 'category-1',
        contentJson: {
          type: 'doc',
          content: [
            {
              type: 'paragraph',
              content: [
                { type: 'text', text: '另一位编辑者已经保存的正文' },
              ],
            },
          ],
        },
        markdown: '另一位编辑者已经保存的正文',
        plainText: '另一位编辑者已经保存的正文',
        expectedRevision: 1,
      },
    },
  )
  expect(savedResponse.status()).toBe(200)

  await page.getByLabel('章节标题').fill('我的冲突编辑')
  await page
    .getByRole('textbox', { name: '章节正文' })
    .fill('我的尚未保存正文')
  const [conflictResponse] = await Promise.all([
    page.waitForResponse((response) =>
      response.url().endsWith('/api/studio/articles/article-1/draft'),
    ),
    page.getByRole('button', { name: '保存草稿' }).click(),
  ])
  expect(conflictResponse.status()).toBe(409)

  await expect(
    page.getByRole('heading', { name: '协作者冲突' }),
  ).toBeVisible()
  await expect(
    page.locator('.conflict-compare').getByText('另一位编辑者已经保存的正文'),
  ).toBeVisible()
  await expect(
    page.locator('.conflict-compare').getByText('我的尚未保存正文'),
  ).toBeVisible()

  await page.getByRole('button', { name: '采用已保存版本' }).click()
  await expect(page.getByLabel('章节标题')).toHaveValue('另一位编辑者的标题')
  await expect(
    page.getByRole('textbox', { name: '章节正文' }),
  ).toContainText('另一位编辑者已经保存的正文')
  await expect(
    page.getByRole('heading', { name: '协作者冲突' }),
  ).toHaveCount(0)

  const thirdSave = await page.request.put(
    '/api/studio/articles/article-1/draft',
    {
      headers: { origin },
      data: {
        title: '第三个已保存版本',
        categoryId: 'category-1',
        contentJson: {
          type: 'doc',
          content: [
            {
              type: 'paragraph',
              content: [{ type: 'text', text: '第三次服务端保存' }],
            },
          ],
        },
        markdown: '第三次服务端保存',
        plainText: '第三次服务端保存',
        expectedRevision: 2,
      },
    },
  )
  expect(thirdSave.status()).toBe(200)

  await page.getByLabel('章节标题').fill('我的覆盖编辑')
  await page
    .getByRole('textbox', { name: '章节正文' })
    .fill('我的覆盖正文')
  const [secondConflict] = await Promise.all([
    page.waitForResponse((response) =>
      response.url().endsWith('/api/studio/articles/article-1/draft'),
    ),
    page.getByRole('button', { name: '保存草稿' }).click(),
  ])
  expect(secondConflict.status()).toBe(409)
  const [keptResponse] = await Promise.all([
    page.waitForResponse((response) =>
      response.url().endsWith('/api/studio/articles/article-1/draft'),
    ),
    page.getByRole('button', { name: '保留我的编辑并覆盖' }).click(),
  ])
  expect(keptResponse.status()).toBe(200)
  await expect(page.getByRole('status')).toContainText('草稿已保存')

  await page.reload()
  await expect(page.getByLabel('章节标题')).toHaveValue('我的覆盖编辑')
  await expect(
    page.getByRole('textbox', { name: '章节正文' }),
  ).toContainText('我的覆盖正文')
})
