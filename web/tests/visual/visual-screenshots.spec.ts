import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { expect, test, type Page } from '@playwright/test'
import { compareVisualScreenshots } from './compare'
import { visualFixture } from './fixture'
import {
  visualCases,
  visualOrigins,
  visualViewports,
  type VisualRole,
} from './visual-cases'

const enforce = process.env.VISUAL_ENFORCE === '1'
const tolerance = Number(process.env.VISUAL_TOLERANCE ?? 0)
const artifactRoot = path.join(
  process.cwd(),
  'test-results',
  'ui-revamp',
  process.env.VISUAL_TICKET ?? '01',
)

test.setTimeout(180_000)

async function preparePage(
  page: Page,
  role: VisualRole,
  themeMode: 'light' | 'dark',
) {
  await page.clock.install({ time: new Date(visualFixture.fixedNow) })
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.addInitScript(
    ({ state, key, initialRole, prototypeThemeMode }) => {
      localStorage.setItem(
        key,
        JSON.stringify({
          state: {
            ...state,
            studioAuthed: initialRole !== null,
            studioRole: initialRole,
            currentCollaboratorId:
              initialRole === 'collaborator' ? 'collaborator-1' : null,
            themeMode: prototypeThemeMode,
          },
          version: 7,
        }),
      )
    },
    {
      state: visualFixture.prototypeState,
      key: visualFixture.prototypeStorageKey,
      initialRole: role,
      prototypeThemeMode: themeMode,
    },
  )
}

async function prepareProductionPage(
  page: Page,
  role: VisualRole,
  targetPath: string,
  themeMode: 'light' | 'dark',
) {
  await page.clock.install({ time: new Date(visualFixture.fixedNow) })
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.addInitScript((theme) => {
    localStorage.setItem('zhijian-theme', theme)
    document.documentElement.dataset.theme = theme
    document.documentElement.style.colorScheme = theme
  }, themeMode)
  if (role) {
    const login = await page.request.post(
      `${visualOrigins.production}/api/auth/sign-in/email`,
      {
        headers: { origin: visualOrigins.production },
        data: {
          email:
            role === 'owner' ? 'owner@example.com' : 'zhou@example.com',
          password:
            role === 'owner'
              ? 'owner-test-password'
              : 'collaborator-password',
        },
      },
    )
    expect(login.ok()).toBeTruthy()
  }
  await page.goto(`${visualOrigins.production}${targetPath}`)
}

async function settle(page: Page) {
  await page.waitForLoadState('networkidle')
  await page.evaluate(() => document.fonts.ready)
  await page.addStyleTag({
    content:
      '*,*::before,*::after{animation:none!important;transition:none!important;caret-color:transparent!important}',
  })
}

function masks(page: Page) {
  return visualFixture.maskSelectors.map((selector) => page.locator(selector))
}

for (const visualCase of visualCases) {
  for (const viewport of visualViewports) {
    for (const themeMode of ['light', 'dark'] as const) {
      test(`${visualCase.id} ${viewport.name} ${themeMode}`, async ({
        browser,
      }) => {
        const outputDirectory = path.join(
          artifactRoot,
          visualCase.id,
          viewport.name,
          themeMode,
        )
        await mkdir(outputDirectory, { recursive: true })
        const prototypePath = path.join(
          outputDirectory,
          'prototype.png',
        )
        const productionPath = path.join(
          outputDirectory,
          'production.png',
        )
        const diffPath = path.join(outputDirectory, 'diff.png')
        const reportPath = path.join(outputDirectory, 'report.json')

        const prototypeContext = await browser.newContext({
          viewport: { width: viewport.width, height: viewport.height },
          colorScheme: themeMode,
        })
        const prototypePage = await prototypeContext.newPage()
        await preparePage(prototypePage, visualCase.productionLogin, themeMode)
        await prototypePage.goto(
          `${visualOrigins.prototype}${visualCase.prototypePath}`,
        )
        await settle(prototypePage)
        const prototypePng = await prototypePage.screenshot({
          path: prototypePath,
          fullPage: true,
          animations: 'disabled',
          caret: 'hide',
          mask: masks(prototypePage),
          maskColor: '#d8d8d8',
        })
        await prototypeContext.close()

        const productionContext = await browser.newContext({
          viewport: { width: viewport.width, height: viewport.height },
          colorScheme: themeMode,
          extraHTTPHeaders: { 'x-real-ip': '120.24.78.68' },
        })
        const productionPage = await productionContext.newPage()
        await prepareProductionPage(
          productionPage,
          visualCase.productionLogin,
          visualCase.productionPath,
          themeMode,
        )
        await settle(productionPage)
        const productionPng = await productionPage.screenshot({
          path: productionPath,
          fullPage: true,
          animations: 'disabled',
          caret: 'hide',
          mask: masks(productionPage),
          maskColor: '#d8d8d8',
        })
        await productionContext.close()

        try {
          const comparison = await compareVisualScreenshots(
            prototypePng,
            productionPng,
          )
          await writeFile(diffPath, comparison.diffPng)
          await writeFile(
            reportPath,
            JSON.stringify(
              {
                ticket: process.env.VISUAL_TICKET ?? '01',
                case: visualCase.id,
                viewport,
                themeMode,
                prototypePath,
                productionPath,
                diffPath,
                ...comparison,
                diffPng: undefined,
              },
              null,
              2,
            ),
          )
          if (enforce) {
            expect(comparison.diffRatio).toBeLessThanOrEqual(tolerance)
          }
        } catch (error) {
          await writeFile(
            reportPath,
            JSON.stringify(
              {
                ticket: process.env.VISUAL_TICKET ?? '01',
                case: visualCase.id,
                viewport,
                themeMode,
                prototypePath,
                productionPath,
                error:
                  error instanceof Error ? error.message : String(error),
              },
              null,
              2,
            ),
          )
          if (enforce) throw error
        }
      })
    }
  }
}
