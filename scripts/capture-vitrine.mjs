// Captura galeria 1400px na mesma SPA — sem page.goto depois do login (convidado local perde sessão no reload).
import { chromium } from '@playwright/test'
import { mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const out = join(root, 'docs', 'images')
mkdirSync(out, { recursive: true })

const base = process.env.E2E_BASE_URL || 'https://simply-life.vercel.app'
const email = process.env.E2E_EMAIL || process.env.VITE_DEMO_EMAIL || 'demo@simply-life.app'
const password = process.env.E2E_PASSWORD || process.env.VITE_DEMO_PASSWORD || process.env.DEMO_PASSWORD || ''

const browser = await chromium.launch({ headless: true })
const page = await browser.newPage({ viewport: { width: 1400, height: 900 } })

await page.goto(`${base}/login`, { waitUntil: 'domcontentloaded' })
await page.waitForTimeout(800)

if (password)
{
  await page.fill('input[type="email"]', email)
  await page.fill('input[type="password"]', password)
  await page.locator('button').filter({ hasText: /^entrar$/i }).last().click()
}
else
{
  await page.getByRole('button', { name: /convidado|guest|ver demo/i }).click()
}

await page.waitForURL((url) => !String(url).includes('/login'), { timeout: 30_000 })
await page.waitForTimeout(800)

const nome = page.getByRole('textbox', { name: /seu nome/i })
if (await nome.first().isVisible().catch(() => false))
{
  await nome.first().fill('Visitante')
}

for (let i = 0; i < 10; i++)
{
  const next = page.getByRole('button', { name: /continuar|concluir|começar|pular|entrar no axel/i }).last()
  if (!(await next.isVisible().catch(() => false))) break
  if (!(await next.isEnabled().catch(() => false))) break
  await next.click()
  await page.waitForTimeout(550)
}

await page.waitForTimeout(1200)

for (let i = 0; i < 12; i++)
{
  const guide = page.getByRole('button', { name: /próximo|pular|fechar|entendi/i })
  if (!(await guide.last().isVisible().catch(() => false))) break
  await guide.last().click()
  await page.waitForTimeout(250)
}

await page.keyboard.press('Escape')
await page.waitForTimeout(400)
await page.evaluate(() =>
{
  document.querySelectorAll('[role="dialog"]').forEach((el) => el.remove())
})
await page.waitForTimeout(300)
await page.screenshot({ path: join(out, 'dashboard.png'), type: 'png' })

const kanbanNav = page.getByRole('button', { name: 'Kanban', exact: true }).first()
await kanbanNav.click({ force: true })
await page.waitForTimeout(1400)
await page.evaluate(() =>
{
  document.querySelectorAll('[role="dialog"]').forEach((el) => el.remove())
})
await page.screenshot({ path: join(out, 'kanban.png'), type: 'png' })

const finNav = page.getByRole('button', { name: 'Finanças', exact: true }).first()
await finNav.click({ force: true })
await page.waitForTimeout(1400)
await page.evaluate(() =>
{
  document.querySelectorAll('[role="dialog"]').forEach((el) => el.remove())
})
await page.screenshot({ path: join(out, 'financas.png'), type: 'png' })

await browser.close()
console.log('ok', out, page.url?.() || '')
