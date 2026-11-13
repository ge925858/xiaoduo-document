import '@testing-library/jest-dom/vitest'

process.env.DATABASE_URL =
  process.env.TEST_DATABASE_URL ??
  'mysql://root@127.0.0.1:3307/zhijian_test'
process.env.APP_ORIGIN = 'http://127.0.0.1:3100'
