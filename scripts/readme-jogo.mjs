// Prints do jogo: palco, formas e roupas, hábitos e meta longa.
// Requer o app web em http://localhost:8082 (npm run mobile:web).
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from '@playwright/test'

const BASE = process.env.BASE_URL ?? 'http://localhost:8082'
const OUT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'docs', 'images', 'app')

function iso(offset)
{
  const date = new Date()
  date.setHours(12, 0, 0, 0)
  date.setDate(date.getDate() + offset)
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

const browser = await chromium.launch({ channel: process.env.PW_CHANNEL ?? 'chrome' })

async function dismissOverlays(page)
{
  const card = page.getByText('Uma carta para você')
  if (await card.waitFor({ timeout: 2500 }).then(() => true).catch(() => false))
  {
    await page.getByRole('button', { name: 'Agora não' }).last().click()
  }
  const invite = page.getByText('Personalize seu Início')
  if (await invite.waitFor({ timeout: 1200 }).then(() => true).catch(() => false))
  {
    await page.getByRole('button', { name: 'Agora não' }).last().click()
  }
  const week = page.getByText('Se quiser ver a sua semana')
  if (await week.waitFor({ timeout: 1200 }).then(() => true).catch(() => false))
  {
    await page.getByRole('button', { name: 'Agora não' }).last().click()
  }
}

for (const scheme of ['light', 'dark'])
{
  const page = await browser.newPage({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    colorScheme: scheme,
  })
  const suffix = scheme === 'dark' ? '-escuro' : ''
  await page.addInitScript((mode) =>
  {
    const today = new Date()
    const isoDate = (offset) =>
    {
      const date = new Date(today.getFullYear(), today.getMonth(), today.getDate() + offset, 12)
      const y = date.getFullYear()
      const m = String(date.getMonth() + 1).padStart(2, '0')
      const d = String(date.getDate()).padStart(2, '0')
      return `${y}-${m}-${d}`
    }
    const prefs = {
      gamification_mode: 'rpg',
      setup_completed_at: '2026-11-02T12:00:00.000Z',
      home_metrics_configured_at: '2026-11-02T12:00:00.000Z',
      color_scheme: mode,
      axel_accessory: 'capa',
    }
    localStorage.setItem('simply-life-mobile-workspace-prefs', JSON.stringify(prefs))
    localStorage.setItem('simply-life-color-scheme', mode)
    localStorage.setItem('simply-life-xp-total', '2000')
    localStorage.setItem('simply-life-gold', '120')
    localStorage.setItem('simply-life-shop-owned', JSON.stringify(['laco', 'cachecol', 'oculos', 'chapeu', 'capa']))
    localStorage.setItem('simply-life-play-card-closed', isoDate(0))
    const weekday = today.getDay()
    const back = weekday === 0 ? 0 : weekday
    const sunday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - back, 12)
    const sun = `${sunday.getFullYear()}-${String(sunday.getMonth() + 1).padStart(2, '0')}-${String(sunday.getDate()).padStart(2, '0')}`
    localStorage.setItem('simply-life-play-week', sun)
    localStorage.setItem('simply-life-life-pledges', JSON.stringify([
      {
        id: 'p-demo',
        title: 'Um ano sem beber',
        startedOn: isoDate(-40),
        targetDays: 365,
        pinned: true,
      },
    ]))
    localStorage.setItem('simply-life-habit-tracks', JSON.stringify([
      { id: 'h-1', title: 'Caminhar', marked: [0, -1, -2, -3, -4].map(isoDate) },
      { id: 'h-2', title: 'Um dia sem bebida', marked: [0, -2, -5].map(isoDate) },
    ]))
  }, scheme)

  try
  {
    await page.goto(`${BASE}/login`, { waitUntil: 'domcontentloaded' })
    await page.getByText('Só quero explorar, sem conta').click({ timeout: 30000 })
    await dismissOverlays(page)
    const stage = page.getByLabel('Palco do AXEL')
    await stage.waitFor({ timeout: 25000 })
    await stage.evaluate((el) => el.scrollIntoView({ block: 'center' }))
    await page.waitForTimeout(500)
    await page.screenshot({ path: path.join(OUT, `rpg${suffix}.png`) })
    console.log('ok', `rpg${suffix}.png`)

    await page.getByLabel('Conta').click()
    await page.getByText('Hábitos', { exact: true }).click()
    await page.getByText('5 dias marcados').waitFor({ timeout: 15000 })
    await page.waitForTimeout(400)
    await page.screenshot({ path: path.join(OUT, `habitos${suffix}.png`) })
    console.log('ok', `habitos${suffix}.png`)

    await page.getByLabel('Voltar').click()
    await dismissOverlays(page)
    await page.getByLabel('Conta').click()
    await page.getByText('Metas importantes', { exact: true }).click()
    await page.getByText('de 365 dias').waitFor({ timeout: 15000 })
    await page.waitForTimeout(400)
    await page.screenshot({ path: path.join(OUT, `meta-longa${suffix}.png`) })
    console.log('ok', `meta-longa${suffix}.png`)

    await page.getByLabel('Voltar').click()
    await dismissOverlays(page)
    await page.getByText('Seu AXEL').first().click()
    const forms = page.getByText('Formas do AXEL')
    await forms.waitFor({ timeout: 15000 })
    await forms.evaluate((el) => el.scrollIntoView({ block: 'start' }))
    await page.waitForTimeout(400)
    await page.screenshot({ path: path.join(OUT, `formas${suffix}.png`) })
    console.log('ok', `formas${suffix}.png`)
  }
  catch (err)
  {
    await page.screenshot({ path: path.join(OUT, `jogo-debug-${scheme}.png`) }).catch(() => {})
    throw err
  }
  await page.close()
}

await browser.close()
console.log('iso sample', iso(0))
