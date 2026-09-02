import { chromium } from '@playwright/test'
import { join, dirname } from 'node:path'
import { mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const out = join(root, 'docs', 'screenshots', 'redesign-restore')
mkdirSync(out, { recursive: true })

const widths = [390, 768, 1440]
const browser = await chromium.launch()
const page = await browser.newPage()
await page.emulateMedia({ colorScheme: 'light' })

for (const w of widths)
{
  await page.setViewportSize({ width: w, height: 844 })
  await page.goto('http://localhost:8082/login', { waitUntil: 'networkidle', timeout: 60_000 })
  await page.waitForTimeout(1400)
  await page.screenshot({ path: join(out, `login-welcome-${w}.png`), fullPage: false })
  await page.getByRole('button', { name: 'Entrar' }).first().click()
  await page.waitForTimeout(500)
  await page.screenshot({ path: join(out, `login-form-${w}.png`), fullPage: false })
  const overflow = await page.evaluate(() =>
  {
    const doc = document.documentElement
    const body = document.body
    const scrollWidth = Math.max(doc.scrollWidth, body.scrollWidth)
    return {
      scrollWidth,
      clientWidth: doc.clientWidth,
      overflowX: scrollWidth > doc.clientWidth + 1,
    }
  })
  console.log(w, overflow)
}

await browser.close()
