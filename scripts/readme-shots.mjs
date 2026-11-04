// Prints das telas principais do README (entrada, início, tarefas, saúde, carteira), claro e escuro.
// Com o app no navegador: BASE_URL=http://localhost:8082 node scripts/readme-shots.mjs
// SCHEMES=dark para só o escuro.
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from '@playwright/test'

const BASE = process.env.BASE_URL ?? 'http://localhost:8082'
const OUT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'docs', 'images', 'app')
const SCHEMES = (process.env.SCHEMES ?? 'light,dark').split(',')
const TABS = [
  ['tarefas', 'Tarefas'],
  ['saude', 'Saúde'],
  ['financas', 'Carteira'],
]

const browser = await chromium.launch({ channel: process.env.PW_CHANNEL ?? 'chrome' })

async function dismiss(page, text)
{
  if (await page.getByText(text).first().waitFor({ timeout: 2500 }).then(() => true).catch(() => false))
  {
    await page.getByRole('button', { name: 'Agora não' }).last().click().catch(() => {})
    await page.waitForTimeout(500)
  }
}

for (const scheme of SCHEMES)
{
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, colorScheme: scheme })
  await page.addInitScript((mode) => localStorage.setItem('simply-life-color-scheme', mode), scheme)
  const suffix = scheme === 'dark' ? '-escuro' : ''
  const shot = async (name) =>
  {
    await page.screenshot({ path: path.join(OUT, `${name}${suffix}.png`) })
    console.log('ok', `${name}${suffix}.png`)
  }

  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle', timeout: 180000 })
  await page.waitForTimeout(1500)
  await shot('login')
  await page.getByText('Só quero explorar, sem conta').click({ timeout: 30000 })
  const sample = page.getByText('Só explorar com dados de exemplo')
  if (await sample.waitFor({ timeout: 6000 }).then(() => true).catch(() => false))
  {
    await sample.click()
  }
  await page.waitForTimeout(3500)
  await dismiss(page, 'Uma carta para você')
  await dismiss(page, 'Personalize seu Início')
  await shot('inicio')
  // o convidado vive só na memória: a navegação é pelas abas, sem recarregar
  for (const [name, label] of TABS)
  {
    await page.getByText(label, { exact: true }).last().click()
    await page.waitForTimeout(3000)
    await shot(name)
  }
  await page.close()
}

await browser.close()
