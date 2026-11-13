import { expect, test } from '@playwright/test'

test('health check confirms the application can reach MySQL', async ({
  request,
}) => {
  const response = await request.get('/health')

  expect(response.ok()).toBe(true)
  await expect(response.json()).resolves.toEqual({
    status: 'ok',
    database: 'ok',
  })
})
