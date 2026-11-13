import { spawnSync } from 'node:child_process'

const result = spawnSync(
  'npx',
  [
    'playwright',
    'test',
    '--config',
    'tests/visual/playwright.visual.config.ts',
  ],
  {
    stdio: 'inherit',
    env: {
      ...process.env,
      VISUAL_ENFORCE: '1',
      VISUAL_TICKET: process.env.VISUAL_TICKET ?? '01',
      VISUAL_TOLERANCE: process.env.VISUAL_TOLERANCE ?? '0',
    },
  },
)

process.exit(result.status ?? 1)
