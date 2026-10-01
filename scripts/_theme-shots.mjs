import { chromium } from '@playwright/test'
import { join } from 'node:path'
import { mkdirSync } from 'node:fs'

const out = process.env.SHOT_DIR
const tag = process.env.SHOT_TAG ?? 'before'
const modes = (process.env.SHOT_MODES ?? 'light,dark').split(',')
const desktop = process.env.SHOT_DESKTOP === '1'
const tabs = (process.env.SHOT_TABS ?? 'Tarefas:tarefas,Saúde:saude,Carteira:carteira').split(',').filter(Boolean).map((s) => s.split(':'))
const perfil = process.env.SHOT_PERFIL !== '0'
mkdirSync(out, { recursive: true })

const browser = await chromium.launch({ channel: 'chrome' })

async function enter(page, mode)
{
  await page.goto('http://localhost:8082/login', { waitUntil: 'networkidle', timeout: 90_000 })
  await page.waitForTimeout(1500)
  const want = mode === 'light' ? 'Usar tema escuro' : 'Usar tema claro'
  const cur = await page.getByLabel(/Usar tema/).first().getAttribute('aria-label')
  if (cur !== want) await page.getByLabel(/Usar tema/).first().click()
  await page.waitForTimeout(400)
  await page.getByText('Continuar como convidado').first().click()
  await page.waitForTimeout(2500)
}

async function scrolled(page, file, by = 720)
{
  await page.evaluate((dy) =>
  {
    let el = document.elementFromPoint(innerWidth / 2, innerHeight * 0.45)
    while (el && !(el.scrollHeight > el.clientHeight + 40 && /(auto|scroll)/.test(getComputedStyle(el).overflowY))) el = el.parentElement
    if (el) el.scrollTop += dy
  }, by)
  await page.waitForTimeout(600)
  await page.screenshot({ path: file })
}

async function go(page, path)
{
  await page.evaluate((p) => { history.pushState({}, '', p); dispatchEvent(new PopStateEvent('popstate')) }, path)
  await page.waitForTimeout(1500)
}

for (const mode of modes)
{
  const page = await browser.newPage({ viewport: desktop ? { width: 1440, height: 900 } : { width: 390, height: 844 } })
  page.on('pageerror', (e) => console.log('pageerror', e.message))
  await enter(page, mode)
  const suffix = desktop ? '-desktop' : ''
  await page.screenshot({ path: join(out, `${tag}-${mode}${suffix}-inicio.png`) })
  if (desktop)
  {
    await scrolled(page, join(out, `${tag}-${mode}${suffix}-inicio-s2.png`), 700)
  }
  else
  {
    await scrolled(page, join(out, `${tag}-${mode}-inicio-s2.png`))
    for (const [label, name] of tabs)
    {
      await page.getByRole('button', { name: label, exact: true }).last().click()
      await page.waitForTimeout(1500)
      await page.screenshot({ path: join(out, `${tag}-${mode}-${name}.png`) })
      await scrolled(page, join(out, `${tag}-${mode}-${name}-s2.png`))
    }
    if (perfil)
    {
      await go(page, '/perfil')
      await page.screenshot({ path: join(out, `${tag}-${mode}-perfil.png`) })
      await scrolled(page, join(out, `${tag}-${mode}-perfil-s2.png`))
    }
    for (const extra of (process.env.SHOT_EXTRA ?? '').split(',').filter(Boolean))
    {
      await go(page, '/' + extra)
      await page.screenshot({ path: join(out, `${tag}-${mode}-${extra.replace(/\W/g, '_')}.png`) })
    }
  }
  await page.close()
}
await browser.close()
