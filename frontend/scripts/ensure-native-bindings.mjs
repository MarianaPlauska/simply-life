/**
 * O lockfile gerado no Windows às vezes não traz o binário de Linux.
 * Sem ele, o Vite 8 (rolldown) quebra no CI com "Cannot find native binding".
 */
import { createRequire } from 'node:module'
import { execFileSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { join } from 'node:path'

const require = createRequire(import.meta.url)

function libcFamily()
{
  if (process.platform !== 'linux') return null
  try
  {
    const report = process.report.getReport()
    if (report.header && report.header.glibcVersionRuntime) return 'gnu'
  }
  catch
  {
    /* ambiente sem report */
  }
  return 'musl'
}

function archMatches(name, arch)
{
  const n = name.toLowerCase()
  if (arch === 'x64') return n.includes('x64')
  if (arch === 'arm64') return n.includes('arm64')
  if (arch === 'arm') return n.includes('arm') && !n.includes('arm64')
  return n.includes(arch)
}

function bindingMatches(name)
{
  const n = name.toLowerCase()
  const plat = process.platform
  if (plat === 'win32' && !n.includes('win32')) return false
  if (plat === 'darwin' && !n.includes('darwin')) return false
  if (plat === 'linux')
  {
    if (!n.includes('-linux')) return false
    const libc = libcFamily()
    if (libc === 'musl' && !n.includes('musl')) return false
    if (libc === 'gnu' && (n.includes('musl') || !n.includes('gnu'))) return false
  }
  return archMatches(n, process.arch)
}

function missingBindings()
{
  const missing = []
  for (const root of ['rolldown', 'lightningcss'])
  {
    let pkg
    try
    {
      pkg = require(`${root}/package.json`)
    }
    catch
    {
      continue
    }
    const optional = pkg.optionalDependencies || {}
    for (const [name, version] of Object.entries(optional))
    {
      if (!bindingMatches(name)) continue
      const dir = join(process.cwd(), 'node_modules', ...name.split('/'))
      if (!existsSync(dir))
      {
        missing.push(`${name}@${version}`)
      }
    }
  }
  return missing
}

const missing = missingBindings()
if (missing.length === 0)
{
  process.exit(0)
}

execFileSync(
  'npm',
  ['install', '--no-save', '--no-package-lock', '--ignore-scripts', ...missing],
  { stdio: 'inherit', cwd: process.cwd() },
)
