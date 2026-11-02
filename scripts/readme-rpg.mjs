// Print do modo aventura como convidado (npm run mobile:web na porta 8082).
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from '@playwright/test'

const BASE = process.env.BASE_URL ?? 'http://localhost:8082'
const OUT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'docs', 'images', 'app')

const browser = await chromium.launch({ channel: process.env.PW_CHANNEL ?? 'chrome' })

for (const scheme of ['light', 'dark'])
{
  const page = await browser.newPage({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    colorScheme: scheme,
  })
  await page.addInitScript((mode) =>
  {
    const prefs = {
      gamification_mode: 'rpg',
      setup_completed_at: '2026-11-02T12:00:00.000Z',
      home_metrics_configured_at: '2026-11-02T12:00:00.000Z',
      color_scheme: mode,
    }
    localStorage.setItem('simply-life-mobile-workspace-prefs', JSON.stringify(prefs))
    localStorage.setItem('simply-life-color-scheme', mode)
    const now = new Date()
    const iso = (date) =>
    {
      const y = date.getFullYear()
      const m = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      return `${y}-${m}-${day}`
    }
    localStorage.setItem('simply-life-play-card-closed', iso(now))
    const weekday = now.getDay()
    const back = weekday === 0 ? 0 : weekday === 1 ? 1 : -1
    if (back >= 0)
    {
      const sunday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - back)
      localStorage.setItem('simply-life-play-week', iso(sunday))
    }
  }, scheme)
  const name = scheme === 'dark' ? 'rpg-escuro.png' : 'rpg.png'
  try
  {
    await page.goto(`${BASE}/login`, { waitUntil: 'domcontentloaded' })
    await page.getByText('Só quero explorar, sem conta').click({ timeout: 30000 })
    const card = page.getByText('Uma carta para você')
    if (await card.waitFor({ timeout: 4000 }).then(() => true).catch(() => false))
    {
      await page.getByRole('button', { name: 'Agora não' }).last().click()
    }
    const pathCaption = page.getByText(/Cada registro anda um passo|O AXEL está cansado/).first()
    await pathCaption.waitFor({ timeout: 25000 })
    await pathCaption.scrollIntoViewIfNeeded()
    await page.waitForTimeout(600)
    await page.screenshot({ path: path.join(OUT, name) })
    console.log('ok', name)
  }
  catch (err)
  {
    await page.screenshot({ path: path.join(OUT, `rpg-debug-${scheme}.png`) }).catch(() => {})
    throw err
  }
  await page.close()
}

await browser.close()
