import './database-isolation'
import { expect, test } from '@playwright/test'
import { appOrigin } from './app-origin'

test('owner deletes a manual version but not a published version', async ({
  page,
}) => {
  await page.goto('/studio/login')
  await page.getByLabel('邮箱').fill('owner@example.com')
  await page.getByLabel('密码').fill('owner-test-password')
  await page.getByRole('button', { name: '进入写作台' }).click()
  await expect(page).toHaveURL(/\/studio$/)

  const created = await page.request.post(
    '/api/studio/articles/article-1/versions',
    {
      headers: { origin: appOrigin },
      data: { label: '待删除版本' },
    },
  )
  expect(created.status()).toBe(201)
  const createdPayload = (await created.json()) as {
    version: { id: string }
  }

  const deleted = await page.request.delete(
    `/api/studio/articles/article-1/versions/${createdPayload.version.id}`,
    { headers: { origin: appOrigin } },
  )
  expect(deleted.status()).toBe(200)

  const published = await page.request.delete(
    '/api/studio/articles/article-1/versions/version-1',
    { headers: { origin: appOrigin } },
  )
  expect(published.status()).toBe(409)
})
