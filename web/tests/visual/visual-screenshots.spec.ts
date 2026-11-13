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
  '..',
  '.scratch',
  'ui-revamp',
  'screenshots',
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

async function applyDesignTokenSample(page: Page) {
  await page.evaluate(() => {
    document.body.innerHTML = `
      <main class="token-specimen">
        <header>
          <span class="section-kicker">Design tokens</span>
          <h1 class="font-display">把零散的知识整理成书</h1>
          <p>同一组颜色、字体、间距、圆角、边框与焦点规则。</p>
        </header>
        <section class="swatches" aria-label="颜色">
          <span class="canvas"></span>
          <span class="panel"></span>
          <span class="field"></span>
          <span class="ink"></span>
          <span class="muted"></span>
          <span class="line"></span>
          <span class="accent"></span>
          <span class="rust"></span>
          <span class="gold"></span>
        </section>
        <section class="surfaces">
          <article>
            <strong class="font-display">Panel</strong>
            <p>正文使用稳定行高和舒展留白。</p>
            <button type="button">主要操作</button>
          </article>
          <label>
            输入字段
            <input value="专注写作" />
          </label>
        </section>
      </main>
    `
    const style = document.createElement('style')
    style.textContent = `
      html,body { margin:0; min-height:100%; background:var(--canvas); color:var(--ink); }
      .token-specimen { width:min(960px, calc(100% - 48px)); margin:0 auto; padding:48px 0; }
      .token-specimen header { display:grid; gap:14px; }
      .token-specimen h1 { margin:0; font-size:48px; line-height:1.12; }
      .token-specimen p { margin:0; color:var(--muted); line-height:1.7; }
      .swatches { display:grid; grid-template-columns:repeat(9, minmax(0, 1fr)); gap:10px; margin-top:32px; }
      .swatches span { aspect-ratio:1; border:1px solid var(--line); border-radius:6px; }
      .swatches .canvas { background:var(--canvas); }
      .swatches .panel { background:var(--panel); }
      .swatches .field { background:var(--field); }
      .swatches .ink { background:var(--ink); }
      .swatches .muted { background:var(--muted); }
      .swatches .line { background:var(--line-strong); }
      .swatches .accent { background:var(--accent); }
      .swatches .rust { background:var(--rust); }
      .swatches .gold { background:var(--gold); }
      .surfaces { display:grid; grid-template-columns:2fr 1fr; gap:16px; margin-top:24px; }
      .surfaces article, .surfaces label { display:grid; gap:12px; border:1px solid var(--line); border-radius:8px; padding:20px; background:var(--panel); }
      .surfaces strong { font-size:26px; }
      .surfaces button, .surfaces input { border:1px solid var(--line-strong); border-radius:5px; padding:10px 12px; font:inherit; }
      .surfaces button { width:max-content; background:var(--ink); color:var(--canvas); }
      @media (max-width:700px) {
        .token-specimen { width:calc(100% - 32px); padding:32px 0; }
        .token-specimen h1 { font-size:36px; }
        .swatches { grid-template-columns:repeat(3, minmax(0, 1fr)); }
        .surfaces { grid-template-columns:1fr; }
      }
    `
    document.head.append(style)
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
        if (visualCase.overlay === 'design-tokens') {
          await applyDesignTokenSample(prototypePage)
        }
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
        if (visualCase.overlay === 'design-tokens') {
          await applyDesignTokenSample(productionPage)
        }
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
