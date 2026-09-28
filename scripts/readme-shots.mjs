// Tira os prints do README a partir do app web (npm run mobile:web na porta 8082).
import { chromium } from '@playwright/test'

const BASE = process.env.BASE_URL ?? 'http://localhost:8082'
const OUT = 'docs/images/app'
const TABS = [
  ['tarefas', 'Tarefas'],
  ['saude', 'Saúde'],
  ['financas', 'Carteira'],
]

const browser = await chromium.launch({ channel: process.env.PW_CHANNEL ?? 'chrome' })
const scheme = process.env.SCHEME ?? 'light'
const page = await browser.newPage({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
  colorScheme: scheme,
})
await page.goto(`${BASE}/login`, { waitUntil: 'networkidle' })
await page.waitForTimeout(1500)
await page.screenshot({ path: `${OUT}/login.png` })
await page.getByText('Continuar como convidado').click()
await page.waitForTimeout(4000)
await page.screenshot({ path: `${OUT}/inicio.png` })
console.log('ok inicio')
// o convidado vive só na memória, então a navegação é feita pelas abas, sem recarregar
for (const [name, label] of TABS)
{
  await page.getByText(label, { exact: true }).last().click()
  await page.waitForTimeout(3000)
  await page.screenshot({ path: `${OUT}/${name}.png` })
  console.log('ok', name)
}
await browser.close()
