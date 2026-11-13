import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  workers: 1,
  reporter: 'list',
  use: {
    baseURL: 'http://127.0.0.1:3100',
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
  webServer: {
    command:
      'npm run test:db:prepare && npm run build && npm run start -- --hostname 127.0.0.1 --port 3100',
    url: 'http://127.0.0.1:3100/health',
    reuseExistingServer: false,
    timeout: 120_000,
    env: {
      DATABASE_URL: 'mysql://root@127.0.0.1:3307/zhijian_test',
      APP_ORIGIN: 'http://127.0.0.1:3100',
      BETTER_AUTH_RATE_LIMIT_MAX: '1000',
      OSS_BUCKET: 'test-bucket',
      OSS_REGION: 'oss-cn-hangzhou',
      OSS_ENDPOINT: 'oss-cn-hangzhou.aliyuncs.com',
      OSS_ACCESS_KEY_ID: 'test-access-key',
      OSS_ACCESS_KEY_SECRET: 'test-access-secret',
      OSS_PUBLIC_BASE_URL: 'https://cdn.example.com',
      TRUST_PROXY: 'true',
      ANALYTICS_HASH_SECRET: 'playwright-analytics-secret',
    },
  },
})
