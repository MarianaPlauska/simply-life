// Gera favicon, ícones do PWA e og-image da marca SunFy (símbolo "tudo se volta pra você").
// Desenho igual ao de src/components/brand/SunFyMark.tsx.
// Também gera os ícones do app (apps/mobile/assets): ícone, Android, abertura e favicon.
// Uso: node scripts/gen-brand-icons.mjs  (precisa do Playwright e do Microsoft Edge instalados)
import { mkdirSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'

const OUT = fileURLToPath(new URL('../public/', import.meta.url))
const MOBILE = fileURLToPath(new URL('../../apps/mobile/assets/', import.meta.url))
// site na Vercel = build web do app (apps/mobile/public vai junto no export)
const WEB = fileURLToPath(new URL('../../apps/mobile/public/', import.meta.url))
/** Mesmo girassol do ícone do app em todo lugar (favicon incluso) */
const ICON_SCALE = 0.66
// só cores do app: pétalas creme e menta, centro coral
const CREME = '#EEF2F0'
const CORAL = '#E8734A'
const PETROLEO = '#1F3A3D'

const MENTA = '#B9CFCA'
const PETAL = 'M32 24 C24.5 18.5 24.5 6 32 6 C39.5 6 39.5 18.5 32 24 Z'

/** Símbolo "tudo se volta pra você": oito pétalas viradas para o centro coral */
function sunShapes()
{
  let p = ''
  for (let i = 0; i < 8; i++)
  {
    p += `<path d="${PETAL}" fill="${i % 2 ? MENTA : CREME}" transform="rotate(${i * 45} 32 32)"/>`
  }
  return p + `<circle cx="32" cy="32" r="6.5" fill="${CORAL}"/>`
}

/** Ícone: girassol ocupando `scale` do quadro; fundo petróleo opcional com cantos `radius` (em unidades de 64) */
function iconSvg(size, scale, { bg = PETROLEO, radius = 0 } = {})
{
  const off = (1 - scale) * 32
  const rect = bg ? `<rect width="64" height="64" rx="${radius}" fill="${bg}"/>` : ''
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 64 64">${rect}<g transform="translate(${off} ${off}) scale(${scale})">${sunShapes()}</g></svg>`
}

const OG_HTML = `<!doctype html><html><head>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,600&family=Lexend:wght@400;500&display=block" rel="stylesheet">
<style>
  body{margin:0;width:1200px;height:630px;background:${PETROLEO};display:flex;align-items:center;justify-content:space-between;padding:0 96px;box-sizing:border-box;font-family:Lexend,sans-serif;overflow:hidden;position:relative}
  .glow{position:absolute;right:-120px;top:-60px;width:760px;height:760px;border-radius:50%;background:radial-gradient(circle, rgba(232,115,74,.22) 0%, rgba(31,58,61,0) 65%)}
  .txt{position:relative;max-width:620px}
  .name{font-family:Fraunces,serif;font-weight:600;font-size:112px;line-height:1;color:#EEF2F0;letter-spacing:-3px}
  .name span{color:${CORAL}}
  .tag{margin-top:20px;font-size:34px;color:#B9CFCA}
  .sub{margin-top:28px;font-size:24px;color:#EEF2F0;opacity:.85}
  svg{position:relative}
</style></head><body>
<div class="glow"></div>
<div class="txt">
  <div class="name">S<span>u</span>nFy</div>
  <div class="tag">Um girassol pra você</div>
  <div class="sub">Passos pequenos. Sem pressa. Nunca sozinho.</div>
</div>
${iconSvg(360, 1, { bg: null })}
</body></html>`

/** ICO com imagens PNG dentro (aceito por todos os navegadores atuais) */
function pngsToIco(pngs)
{
  const header = Buffer.alloc(6)
  header.writeUInt16LE(0, 0)
  header.writeUInt16LE(1, 2)
  header.writeUInt16LE(pngs.length, 4)
  const dir = Buffer.alloc(16 * pngs.length)
  let offset = 6 + dir.length
  pngs.forEach(({ size, data }, i) =>
  {
    const e = i * 16
    dir.writeUInt8(size >= 256 ? 0 : size, e)
    dir.writeUInt8(size >= 256 ? 0 : size, e + 1)
    dir.writeUInt16LE(1, e + 4)
    dir.writeUInt16LE(32, e + 6)
    dir.writeUInt32LE(data.length, e + 8)
    dir.writeUInt32LE(offset, e + 12)
    offset += data.length
  })
  return Buffer.concat([header, dir, ...pngs.map((p) => p.data)])
}

const browser = await chromium.launch({ channel: 'msedge' })

async function render(html, width, height, transparent = true)
{
  const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 })
  await page.setContent(html, { waitUntil: 'networkidle' })
  await page.evaluate(() => document.fonts.ready)
  const buf = await page.screenshot({ omitBackground: transparent, clip: { x: 0, y: 0, width, height } })
  await page.close()
  return buf
}

const bare = (svg) => `<html><body style="margin:0;background:transparent">${svg}</body></html>`

// favicon, PWA e ícone do iPhone = o ícone do app (quadro petróleo, girassol creme e menta, centro coral)
const pwa192 = await render(bare(iconSvg(192, ICON_SCALE, { radius: 14 })), 192, 192)
const pwa512 = await render(bare(iconSvg(512, ICON_SCALE, { radius: 14 })), 512, 512)
// maskable: fundo cheio e girassol dentro da zona segura (80% central)
const maskable = await render(bare(iconSvg(512, 0.6)), 512, 512)
// iPhone arredonda sozinho e não aceita transparência
const apple = await render(bare(iconSvg(180, ICON_SCALE)), 180, 180, false)
const icoPngs = []
for (const size of [16, 32, 48])
{
  icoPngs.push({ size, data: await render(bare(iconSvg(size, ICON_SCALE, { radius: 14 })), size, size) })
}
const ico = pngsToIco(icoPngs)
const favSvg = iconSvg(32, ICON_SCALE, { radius: 14 }).replace('<svg ', '<svg role="img" aria-label="SunFy" ') + '\n'
const og = await render(OG_HTML, 1200, 630, false)

for (const dir of [OUT, WEB])
{
  mkdirSync(dir, { recursive: true })
  writeFileSync(dir + 'pwa-192x192.png', pwa192)
  writeFileSync(dir + 'pwa-512x512.png', pwa512)
  writeFileSync(dir + 'pwa-maskable-512.png', maskable)
  writeFileSync(dir + 'apple-touch-icon.png', apple)
  writeFileSync(dir + 'favicon.ico', ico)
  writeFileSync(dir + 'favicon.svg', favSvg)
  writeFileSync(dir + 'og-image.png', og)
}

// app (Expo): ícone cheio sem cantos (o sistema arredonda); Android e abertura sem fundo, sobre o petróleo do app.json
writeFileSync(MOBILE + 'icon.png', await render(bare(iconSvg(1024, ICON_SCALE)), 1024, 1024, false))
writeFileSync(MOBILE + 'adaptive-icon.png', await render(bare(iconSvg(1024, 0.52, { bg: null })), 1024, 1024))
writeFileSync(MOBILE + 'splash-icon.png', await render(bare(iconSvg(1024, 0.8, { bg: null })), 1024, 1024))
writeFileSync(MOBILE + 'favicon.png', await render(bare(iconSvg(48, ICON_SCALE, { radius: 14 })), 48, 48))

await browser.close()
console.log('SunFy: ícones em frontend/public, apps/mobile/public e apps/mobile/assets')
