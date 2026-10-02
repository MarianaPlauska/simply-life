// Gera favicon, ícones do PWA e og-image da marca SunFy (o Axel girassol).
// Desenho igual ao de src/components/brand/AxelSun.tsx.
// Uso: node scripts/gen-brand-icons.mjs  (precisa do Playwright e do Microsoft Edge instalados)
import { writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'

const OUT = fileURLToPath(new URL('../public/', import.meta.url))
const SOL = '#E8B04B'
const LUZ = '#F6D58E'
const BORDA = '#B9822A'
const CORAL = '#E8734A'
const INK = '#1E1C1A'
const PETROLEO = '#1F3A3D'

function sunShapes()
{
  let p = ''
  for (let i = 0; i < 12; i++)
  {
    p += `<ellipse cx="32" cy="9.5" rx="5.6" ry="9" fill="${SOL}" stroke="${BORDA}" stroke-width="1" transform="rotate(${i * 30} 32 32)"/>`
  }
  p += `<circle cx="32" cy="32" r="18.5" fill="${LUZ}" stroke="${BORDA}" stroke-width="1.4"/>`
  p += `<circle cx="22.5" cy="37" r="3.2" fill="${CORAL}" opacity=".45"/><circle cx="41.5" cy="37" r="3.2" fill="${CORAL}" opacity=".45"/>`
  p += `<circle cx="26.5" cy="30.5" r="2.3" fill="${INK}"/><circle cx="37.5" cy="30.5" r="2.3" fill="${INK}"/>`
  p += `<circle cx="27.3" cy="29.7" r=".7" fill="#fff"/><circle cx="38.3" cy="29.7" r=".7" fill="#fff"/>`
  p += `<path d="M26 37 q6 5.5 12 0" fill="none" stroke="${INK}" stroke-linecap="round" stroke-width="2.4"/>`
  return p
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
  .glow{position:absolute;right:-120px;top:-60px;width:760px;height:760px;border-radius:50%;background:radial-gradient(circle, rgba(232,176,75,.28) 0%, rgba(31,58,61,0) 65%)}
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
${iconSvg(380, 1, { bg: null })}
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

writeFileSync(OUT + 'pwa-192x192.png', await render(bare(iconSvg(192, 0.8, { radius: 14 })), 192, 192))
writeFileSync(OUT + 'pwa-512x512.png', await render(bare(iconSvg(512, 0.8, { radius: 14 })), 512, 512))
// maskable: fundo cheio e girassol dentro da zona segura (80% central)
writeFileSync(OUT + 'pwa-maskable-512.png', await render(bare(iconSvg(512, 0.62)), 512, 512))

const icoPngs = []
for (const size of [16, 32, 48])
{
  icoPngs.push({ size, data: await render(bare(iconSvg(size, 0.9, { radius: 14 })), size, size) })
}
writeFileSync(OUT + 'favicon.ico', pngsToIco(icoPngs))

writeFileSync(OUT + 'favicon.svg', iconSvg(32, 0.88, { radius: 14 }).replace('<svg ', '<svg role="img" aria-label="SunFy" ') + '\n')
writeFileSync(OUT + 'og-image.png', await render(OG_HTML, 1200, 630, false))

await browser.close()
console.log('SunFy: favicon, PWA e og-image gerados em public/')
