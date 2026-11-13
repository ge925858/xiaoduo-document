import { fileURLToPath } from 'node:url'
import { defineConfig, devices } from '@playwright/test'

const webRoot = fileURLToPath(new URL('../..', import.meta.url))
const frontendRoot = fileURLToPath(
  new URL('../../../frontend', import.meta.url),
)

export default defineConfig({
  testDir: '.',
  testMatch: 'visual-screenshots.spec.ts',
  fullyParallel: false,
  workers: 1,
  reporter: 'list',
  outputDir: '../../test-results/ui-revamp/playwright',
  use: {
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        channel: 'chrome',
      },
    },
  ],
  webServer: [
    {
      command:
        'npm run test:visual:db && npm run build && npm run start -- --hostname 127.0.0.1 --port 3200',
      cwd: webRoot,
      url: 'http://127.0.0.1:3200/health',
      reuseExistingServer: false,
      timeout: 180_000,
      env: {
        DATABASE_URL: 'mysql://root@127.0.0.1:3307/zhijian_test',
        APP_ORIGIN: 'http://127.0.0.1:3200',
        BETTER_AUTH_RATE_LIMIT_MAX: '1000',
        OSS_BUCKET: 'test-bucket',
        OSS_REGION: 'oss-cn-hangzhou',
        OSS_ENDPOINT: 'oss-cn-hangzhou.aliyuncs.com',
        OSS_ACCESS_KEY_ID: 'test-access-key',
        OSS_ACCESS_KEY_SECRET: 'test-access-secret',
        OSS_PUBLIC_BASE_URL: 'https://cdn.example.com',
        TRUST_PROXY: 'true',
        ANALYTICS_HASH_SECRET: 'playwright-analytics-secret',
        ENABLE_VISUAL_FIXTURES: '1',
      },
    },
    {
      command: 'npm run dev -- --host 127.0.0.1 --port 4273',
      cwd: frontendRoot,
      url: 'http://127.0.0.1:4273',
      reuseExistingServer: false,
      timeout: 120_000,
    },
  ],
})
