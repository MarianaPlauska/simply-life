// Prints do Meu Mundo (semana em grade e dia) como convidado, claro e escuro.
// Com o app no navegador: BASE_URL=http://localhost:8082 node scripts/readme-mundo.mjs
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from '@playwright/test'

const BASE = process.env.BASE_URL ?? 'http://localhost:8082'
const OUT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'docs', 'images', 'app')

const BLOCOS = [
  { fala: 'academia seg qua sex 7h', cor: 0 },
  { fala: 'trabalho dias úteis 9h por 8h', cor: 2 },
  { fala: 'inglês às terças e quintas 19h', cor: 4 },
  { fala: 'yoga fim de semana 9h', cor: 3 },
]

const browser = await chromium.launch({ channel: process.env.PW_CHANNEL ?? 'chrome' })

for (const scheme of ['light', 'dark'])
{
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, colorScheme: scheme })
  await page.addInitScript((mode) => localStorage.setItem('simply-life-color-scheme', mode), scheme)
  const suffix = scheme === 'dark' ? '-escuro' : ''
  const tap = async (text) =>
  {
    const byLabel = page.getByLabel(text, { exact: true })
    const target = (await byLabel.count()) ? byLabel.last() : page.getByText(text, { exact: true }).last()
    await target.click({ timeout: 10000 })
    await page.waitForTimeout(700)
  }
  try
  {
    await page.goto(`${BASE}/login`, { waitUntil: 'domcontentloaded' })
    await page.getByText('Só quero explorar, sem conta').click({ timeout: 60000 })
    const sample = page.getByText('Só explorar com dados de exemplo')
    if (await sample.waitFor({ timeout: 6000 }).then(() => true).catch(() => false))
    {
      await sample.click()
      await page.waitForTimeout(3000)
    }
    const card = page.getByText('Uma carta para você')
    if (await card.waitFor({ timeout: 4000 }).then(() => true).catch(() => false))
    {
      await page.getByRole('button', { name: 'Agora não' }).last().click()
    }
    await tap('Tarefas')
    await tap('Meu Mundo')

    for (const b of BLOCOS)
    {
      await tap('Novo bloco')
      await page.getByPlaceholder('academia seg qua sex 7h').last().fill(b.fala)
      await tap('Preencher')
      await page.mouse.move(195, 600)
      await page.mouse.wheel(0, 2000)
      await page.waitForTimeout(300)
      await tap(`Cor ${['0', '2', '4', '5', '3', '6'][b.cor]}`)
      await tap('Salvar')
      // sem conflito o editor fecha; se houver, mantém as duas
      if (await page.getByText('Manter as duas').count()) await tap('Manter as duas')
    }

    await page.mouse.wheel(0, -3000)
    // os blocos começam hoje; a semana que vem aparece cheia
    await tap('Próximo')
    await page.waitForTimeout(500)
    await page.screenshot({ path: path.join(OUT, `meu-mundo${suffix}.png`) })
    console.log('ok', `meu-mundo${suffix}.png`)

    await tap('Voltar para hoje')
    await tap('Dia')
    await page.waitForTimeout(500)
    await page.screenshot({ path: path.join(OUT, `meu-mundo-dia${suffix}.png`) })
    console.log('ok', `meu-mundo-dia${suffix}.png`)
  }
  catch (err)
  {
    await page.screenshot({ path: path.join(OUT, `mundo-debug-${scheme}.png`) }).catch(() => {})
    throw err
  }
  await page.close()
}

await browser.close()
