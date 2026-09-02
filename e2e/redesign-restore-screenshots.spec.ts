import { test, expect, type Page } from '@playwright/test'
import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const outDir = join(root, 'docs', 'screenshots', 'redesign-restore')
const MOBILE = process.env.MOBILE_E2E_URL || 'http://localhost:8082'

test.use({
  baseURL: MOBILE,
  viewport: { width: 390, height: 844 },
})

async function shot(page: Page, name: string): Promise<void>
{
  await page.waitForTimeout(450)
  await page.screenshot({ path: join(outDir, name), fullPage: false })
}

async function gotoApp(page: Page, path: string): Promise<void>
{
  await page.goto(path, { waitUntil: 'domcontentloaded', timeout: 60_000 })
  await page.waitForTimeout(1400)
}

async function enterGuest(page: Page): Promise<void>
{
  await gotoApp(page, '/login')
  const guest = page.getByRole('button', { name: 'Continuar como convidado' })
  if (await guest.count())
  {
    await guest.first().click()
    await page.waitForTimeout(1200)
  }
}

async function captureShell(page: Page, suffix: string): Promise<void>
{
  await gotoApp(page, '/tokens-preview')
  await expect(page.getByText('Tokens AXEL')).toBeVisible({ timeout: 30_000 })
  await shot(page, `fase-A-after-${suffix}.png`)

  await gotoApp(page, '/login')
  const guest = page.getByRole('button', { name: 'Continuar como convidado' })
  if (await guest.count())
  {
    await expect(page.getByText('Humor, água, tarefas e finanças', { exact: false })).toBeVisible()
    await shot(page, `fase-B-welcome-${suffix}.png`)
    await page.getByRole('button', { name: 'Entrar' }).first().click()
    await expect(page.getByText('Bem-vindo de volta')).toBeVisible()
    await shot(page, `fase-B-form-${suffix}.png`)
    await guest.first().click()
    await page.waitForTimeout(1000)
  }
  else
  {
    await enterGuest(page)
  }

  await expect(page.getByText('Prioridade de hoje').or(page.getByText('Nada na fila'))).toBeVisible({
    timeout: 20_000,
  })
  await shot(page, `fase-B-tabbar-${suffix}.png`)
  await shot(page, `fase-D-inicio-${suffix}.png`)

  await page.getByText('Saúde', { exact: true }).last().click()
  await expect(page.getByText('Vitalidade')).toBeVisible()
  await shot(page, `fase-C-saude-humor-${suffix}.png`)
  await page.getByRole('button', { name: 'Água' }).click()
  await expect(page.getByRole('button', { name: '+ 1 copo' })).toBeVisible()
  await shot(page, `fase-C-saude-agua-${suffix}.png`)
  if (suffix === 'light')
  {
    await page.getByRole('button', { name: 'Comida' }).click()
    await expect(page.getByText('Proteína', { exact: true }).first()).toBeVisible()
    await shot(page, 'fase-C-saude-comida-light.png')
    await page.getByRole('button', { name: 'Humor' }).click()
    await page.getByLabel('Ótimo').click()
    await expect(page.getByText('AXEL').first()).toBeVisible()
    await shot(page, 'fase-C-saude-axel-light.png')
    await page.getByRole('button', { name: 'Meds' }).click()
    await shot(page, 'fase-C-saude-meds-light.png')
    await page.getByRole('button', { name: 'Treino' }).click()
    await shot(page, 'fase-C-saude-treino-light.png')
  }

  await page.getByText('Finanças', { exact: true }).last().click()
  await expect(page.getByText('Finanças').first()).toBeVisible()
  await shot(page, `fase-D-financas-${suffix}.png`)

  await page.getByText('Tarefas', { exact: true }).last().click()
  await expect(page.getByText('Timeline ·', { exact: false }).first()).toBeVisible()
  await shot(page, `fase-D-tarefas-${suffix}.png`)
}

test.describe('Redesign restore — prova visual Expo', () =>
{
  test('fases A–E light/dark 390×844', async ({ page }) =>
  {
    test.setTimeout(180_000)
    mkdirSync(outDir, { recursive: true })

    const probe = await page.request.get(MOBILE, { timeout: 8_000 }).catch(() => null)
    test.skip(!probe || !probe.ok(), `Expo web não está em ${MOBILE}`)

    await page.emulateMedia({ colorScheme: 'light' })
    await captureShell(page, 'light')

    await page.emulateMedia({ colorScheme: 'dark' })
    await captureShell(page, 'dark')

    const collageNames = [
      'fase-A-after-light.png',
      'fase-A-after-dark.png',
      'fase-B-welcome-light.png',
      'fase-B-welcome-dark.png',
      'fase-B-form-light.png',
      'fase-B-form-dark.png',
      'fase-B-tabbar-light.png',
      'fase-B-tabbar-dark.png',
      'fase-C-saude-axel-light.png',
      'fase-C-saude-agua-dark.png',
      'fase-D-inicio-light.png',
      'fase-D-inicio-dark.png',
      'fase-D-financas-light.png',
      'fase-D-financas-dark.png',
      'fase-D-tarefas-light.png',
      'fase-D-tarefas-dark.png',
    ]
    const imgs = collageNames
      .filter((n) => existsSync(join(outDir, n)))
      .map((n) => `<figure><img src="${n}" width="390" alt="${n}"/><figcaption>${n}</figcaption></figure>`)
      .join('')
    writeFileSync(
      join(outDir, 'collage.html'),
      `<!doctype html><html><head><meta charset="utf-8"><style>
        body{margin:0;background:#1A1816;color:#F2EDE6;font-family:sans-serif}
        main{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;padding:16px}
        figure{margin:0} img{width:100%;height:auto;border-radius:12px}
        figcaption{font-size:11px;margin-top:6px;opacity:.7}
      </style></head><body><main>${imgs}</main></body></html>`,
    )
    await page.setViewportSize({ width: 1600, height: 2200 })
    await page.goto(pathToFileURL(join(outDir, 'collage.html')).href)
    await page.waitForTimeout(400)
    await page.screenshot({ path: join(outDir, 'fase-E-collage-light-dark.png'), fullPage: true })
  })
})
