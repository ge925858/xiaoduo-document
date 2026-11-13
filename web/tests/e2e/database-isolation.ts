import { test } from '@playwright/test'
import { seedTestDatabase } from '../seed-test-db'

test.beforeAll(async () => {
  await seedTestDatabase()
})
