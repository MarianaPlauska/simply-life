import { chromium } from '@playwright/test'
import { join } from 'node:path'
const out = process.env.SHOT_DIR
const tag = process.env.SHOT_TAG ?? 'before'
const only = process.env.SHOT_ONLY // saude | carteira | tarefas
const browser = await chromium.launch({ channel: 'chrome' })
const page = await browser.newPage({ viewport: { width: 390, height: 844 } })
page.on('pageerror', (e) => console.log('pageerror', e.message))
await page.goto('http://localhost:8082/login', { waitUntil: 'networkidle', timeout: 90_000 })
await page.waitForTimeout(1500)
const t = page.getByLabel('Usar tema claro')
if (await t.count()) await t.first().click()
await page.waitForTimeout(400)
await page.getByText('Continuar como convidado').first().click()
// convidado agora passa pelas boas-vindas: para os prints, entra com os dados de exemplo
const demo = page.getByText('Só explorar com dados de exemplo')
await demo.first().waitFor({ timeout: 15000 }).then(() => demo.first().click({ force: true })).catch(() => {})
await page.getByText(/Bom/).first().waitFor({ timeout: 30000 })
await page.waitForTimeout(1500)

async function full(name)
{
  await page.setViewportSize({ width: 390, height: 844 })
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
  if (h > 844) await page.setViewportSize({ width: 390, height: Math.min(h + 40, 12000) })
  await page.waitForTimeout(900)
  await page.screenshot({ path: join(out, `${tag}-${name}.png`) })
  await page.setViewportSize({ width: 390, height: 844 })
  await page.waitForTimeout(400)
}
async function clickTab(label, which = 'first')
{
  const ex = typeof label === 'string'; const loc = page.getByRole('tab', { name: label, exact: ex })
  let l = (await loc.count()) ? loc : page.getByRole('button', { name: label, exact: ex })
  if (!(await l.count())) l = page.getByText(label, { exact: ex })
  await (which === 'last' ? l.last() : l.first()).click({ force: true })
  await page.waitForTimeout(1500)
}
async function bar(label)
{
  await page.getByRole('button', { name: label, exact: true }).last().click().catch(async () => page.getByText(label, { exact: true }).last().click())
  await page.waitForTimeout(1800)
}
if (only === 'tarefas')
{
  await page.getByLabel(/^Conta/).first().click({ force: true })
  await page.waitForTimeout(1200)
  await page.screenshot({ path: join(out, `${tag}-menu.png`) })
  await page.getByText(/Usar tema/).first().click({ force: true })
  await page.waitForTimeout(1200)
  await page.screenshot({ path: join(out, `${tag}-menu-tema.png`) })
  await page.getByText(/Usar tema/).first().click({ force: true })
  await page.getByText('Fechar', { exact: true }).last().click({ force: true })
  await page.waitForTimeout(800)
  await bar('Tarefas')
  for (const [l, n] of [['Lista', 'lista'], [/^Feitas/, 'feitas'], ['Rotina', 'rotina'], ['Pastas', 'pastas'], [/^Prazos/, 'prazos'], ['Gantt', 'gantt'], ['Relatórios', 'relatorios']])
  { await clickTab(l); await full(`tarefas-${n}`) }
  for (const [l, n] of [['Visão geral', 'visao'], ['Calendário', 'calendario'], ['Timeline', 'timeline'], ['Ritmo', 'ritmo']])
  { await clickTab(l, 'last'); await full(`tarefas-rel-${n}`) }
}
if (only !== 'carteira' && only !== 'tarefas')
{
  await bar('Saúde')
  for (const [l, n] of [['Diário', 'diario'], ['Hoje', 'hoje'], ['Apoio', 'apoio']])
  { await clickTab(l); await full(`saude-${n}`) }
  await clickTab('Cuidados')
  for (const [l, n] of [['Hidratação', 'agua'], ['Alimentação', 'comida'], ['Sono', 'sono'], ['Academia', 'academia'], ['Medicamentos', 'remedios']])
  { await clickTab(l); await full(`saude-cuidados-${n}`) }
}
if (only !== 'saude' && only !== 'tarefas')
{
  await bar('Carteira')
  await full('carteira-carteira')
  await clickTab(/^Extrato/); await full('carteira-extrato')
  await clickTab('Contas')
  for (const [l, n] of [['Conta', 'conta'], ['Salário', 'salario'], [/^Cartões/, 'cartoes'], [/^A pagar/, 'apagar'], [/^Fixas/, 'fixas']])
  { await clickTab(l, 'last'); await full(`carteira-contas-${n}`) }
  await clickTab('Análise')
  for (const [l, n] of [['Visão', 'visao'], ['Orçamentos', 'orcamentos'], ['Metas', 'metas'], ['Coach', 'coach']])
  { await clickTab(l, 'last'); await full(`carteira-analise-${n}`) }
}
await browser.close()
