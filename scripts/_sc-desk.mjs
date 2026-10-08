import { chromium } from '@playwright/test'
import { join } from 'node:path'
const out = process.env.SHOT_DIR
const tag = process.env.SHOT_TAG ?? 'before'
const W = 1440
const browser = await chromium.launch({ channel: 'msedge' })
const page = await browser.newPage({ viewport: { width: W, height: 900 }, colorScheme: process.env.DARK ? 'dark' : 'light' })
page.on('pageerror', (e) => console.log('pageerror', e.message))
await page.goto('http://localhost:8082/login', { waitUntil: 'networkidle', timeout: 120_000 })
await page.waitForTimeout(1500)
if (process.env.DARK) await page.getByText('Escura', { exact: true }).first().click().catch(() => console.log('no dark toggle'))
await page.getByText(/Só quero explorar|Continuar como convidado/).first().click()
const demo = page.getByText('Só explorar com dados de exemplo')
await demo.first().waitFor({ timeout: 20000 }).then(() => demo.first().click({ force: true })).catch(() => {})
await page.waitForTimeout(4000)

async function full(name)
{
  await page.setViewportSize({ width: W, height: 900 })
  await page.waitForTimeout(500)
  const h = await page.evaluate(() =>
  {
    let best = 0
    for (const el of document.querySelectorAll('*'))
    {
      const s = getComputedStyle(el)
      if (/(auto|scroll)/.test(s.overflowY) && el.scrollHeight > el.clientHeight + 20 && el.clientWidth > 300 && el.offsetParent !== null)
        best = Math.max(best, el.scrollHeight + (innerHeight - el.clientHeight))
    }
    return best
  })
  if (h > 900) await page.setViewportSize({ width: W, height: Math.min(h + 40, 5000) })
  await page.waitForTimeout(900)
  await page.screenshot({ path: join(out, `${tag}-${name}.png`) })
}
async function nav(label)
{
  await page.getByLabel(label, { exact: true }).first().click({ force: true })
  await page.waitForTimeout(2500)
}
await full('inicio')
for (const [l, n] of [['Tarefas', 'tarefas'], ['Saúde', 'saude'], ['Finanças', 'financas']])
{
  try { await nav(l); await full(n) } catch (e) { console.log('fail', l, e.message) }
}
await browser.close()
