#!/usr/bin/env node
// Testa se GROQ_API_KEY está configurada e a API de orquestração responde

import { readFileSync, existsSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')

function loadEnvLocal()
{
  const path = resolve(root, '.env.local')
  if (!existsSync(path)) return

  const text = readFileSync(path, 'utf8')
  for (const line of text.split('\n'))
  {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq === -1) continue
    const key = trimmed.slice(0, eq).trim()
    const val = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, '')
    if (!process.env[key]) process.env[key] = val
  }
}

loadEnvLocal()

const groqKey = process.env.GROQ_API_KEY
const baseUrl = process.env.ORCHESTRATE_TEST_URL || 'http://localhost:3000'

async function main()
{
  console.log('Simply-Life · teste Groq / orquestração\n')

  if (!groqKey)
  {
    console.error('❌ GROQ_API_KEY não encontrada.')
    console.error('   1. Copie .env.example → .env.local na raiz do projeto')
    console.error('   2. Cole a chave de https://console.groq.com/keys')
    console.error('   3. Rode: npm run dev   (vercel dev) em outro terminal')
    process.exit(1)
  }

  console.log('✓ GROQ_API_KEY carregada (', groqKey.slice(0, 8), '… )\n')

  try
  {
    const statusRes = await fetch(`${baseUrl}/api/orchestrate-tasks`)
    if (!statusRes.ok)
    {
      throw new Error(`GET /api/orchestrate-tasks → HTTP ${statusRes.status}`)
    }
    const status = await statusRes.json()
    console.log('Status da inteligência:', status)

    const postRes = await fetch(`${baseUrl}/api/orchestrate-tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tasks: [{
          task_id: 1,
          titulo: '[URGENTE] Cliente bloqueado — resposta pendente',
          descricao: 'E-mail do cliente pedindo retorno hoje sobre proposta.',
          prioridade: 'alta',
          origem: 'email',
          remetente: 'cliente@empresa.com',
          tags: ['AXEL'],
          data_vencimento: new Date().toISOString().slice(0, 10),
          status: 'pendente',
        }],
      }),
    })

    if (!postRes.ok)
    {
      const err = await postRes.text()
      throw new Error(`POST falhou HTTP ${postRes.status}: ${err}`)
    }

    const result = await postRes.json()
    const row = result.scores?.[0]
    console.log('\n✓ Orquestração OK')
    console.log('  Fonte:', result.source)
    console.log('  Score:', row?.score)
    console.log('  Razão:', row?.rationale)
  }
  catch (err)
  {
    console.error('\n❌', err.message)
    console.error('\nDica: em outro terminal, na raiz do projeto:')
    console.error('  npm run dev')
    console.error('(sobe frontend + /api com .env.local)')
    process.exit(1)
  }
}

main()
