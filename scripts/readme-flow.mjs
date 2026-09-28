// Passo a passo de uso para o README: humor, captura rápida, Axel organizando o dia e o gasto no extrato.
import { chromium } from '@playwright/test'

const BASE = process.env.BASE_URL ?? 'http://localhost:8082'
const OUT = 'docs/images/app/fluxo'
const browser = await chromium.launch({ channel: process.env.PW_CHANNEL ?? 'chrome' })
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })
const shot = async (name) => { await page.waitForTimeout(1800); await page.screenshot({ path: `${OUT}/${name}.png` }); console.log('ok', name) }

await page.goto(`${BASE}/login`, { waitUntil: 'networkidle' })
await page.getByText('Continuar como convidado').click()
await page.waitForTimeout(4000)
// 1. Como você está: um toque no humor
await page.getByText('Bom', { exact: true }).first().waitFor({ timeout: 60000 })
await page.getByText('Bom', { exact: true }).first().click()
await shot('passo-1')
await page.getByText(/^Registrar/).first().click()
await page.waitForTimeout(1500)

// 2. Despejar o que está na cabeça, uma coisa por linha
await page.getByLabel('Nova tarefa').or(page.getByLabel('Capturar')).first().click()
await page.waitForTimeout(1200)
await page.getByPlaceholder(/Uma linha por item/).fill(['Marcar dentista', 'Comprar remédio da pressão', 'café 12,50'].join(String.fromCharCode(10)))
await shot('passo-2')

// 3. Salvar: as linhas viram tarefas, o Axel encaixa no dia e o "café 12,50" vira gasto
await page.getByText('Salvar', { exact: true }).last().click()
await page.waitForTimeout(1500)
// fecha o aviso de conquista
await page.getByText('Continuar', { exact: true }).last().click().catch(() => {})
await shot('passo-3')

// 4. A despesa já está no extrato
await page.getByText('Carteira', { exact: true }).last().click()
await page.waitForTimeout(1500)
await page.getByText(/^Extrato/).first().click()
await shot('passo-4')
await browser.close()
