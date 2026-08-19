import { test, expect } from '@playwright/test'
import { mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const EMAIL = process.env.E2E_EMAIL || process.env.VITE_DEMO_EMAIL || 'demo@simply-life.app'
const SENHA = process.env.E2E_PASSWORD || process.env.VITE_DEMO_PASSWORD || process.env.DEMO_PASSWORD || ''
const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const outDir = join(root, 'docs', 'images')

test.describe('Vitrine — screenshots 1400px', () =>
{
  test.skip(!SENHA, 'Defina E2E_PASSWORD ou VITE_DEMO_PASSWORD para capturar a galeria')

  test('dashboard, kanban e finanças', async ({ page }) =>
  {
    mkdirSync(outDir, { recursive: true })
    await page.setViewportSize({ width: 1400, height: 900 })

    await page.goto('/login')
    await page.fill('input[name="email"], input[type="email"]', EMAIL)
    await page.fill('input[name="password"], input[type="password"]', SENHA)
    await page.getByRole('button', { name: /entrar|ver demo|sign in/i }).first().click()
    await expect(page).not.toHaveURL(/login/, { timeout: 25_000 })

    await page.goto('/')
    await page.waitForTimeout(1200)
    await page.screenshot({ path: join(outDir, 'dashboard.png'), fullPage: false })

    await page.goto('/kanban')
    await page.waitForTimeout(1200)
    await page.screenshot({ path: join(outDir, 'kanban.png'), fullPage: false })

    await page.goto('/financeiro')
    await page.waitForTimeout(1200)
    await page.screenshot({ path: join(outDir, 'financas.png'), fullPage: false })
  })
})
