#!/usr/bin/env node
/**
 * Deploy de produção na Vercel (CI).
 * Só precisa de VERCEL_TOKEN — acha o projeto simply-life pelo nome.
 */
import { execSync } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'

const TOKEN = process.env.VERCEL_TOKEN?.trim()
const PROJECT_NAME = (process.env.VERCEL_PROJECT_NAME || 'simply-life').trim().toLowerCase()
const GITHUB_ORG = process.env.VERCEL_GITHUB_ORG || 'MarianaPlauska'
const GITHUB_REPO = process.env.VERCEL_GITHUB_REPO || 'simply-life'
const GIT_REF = process.env.VERCEL_GIT_REF || 'main'

async function vercelFetch(path, options = {})
{
  const res = await fetch(`https://api.vercel.com${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  })

  const text = await res.text()
  let json = null
  try
  {
    json = text ? JSON.parse(text) : null
  }
  catch
  {
    json = { raw: text }
  }

  return { res, json }
}

async function listTeams()
{
  const { res, json } = await vercelFetch('/v2/teams')
  if (!res.ok)
  {
    throw new Error(`Falha ao listar times (HTTP ${res.status}): ${JSON.stringify(json)}`)
  }
  return json?.teams || []
}

async function listProjects(teamId)
{
  const projects = []
  let until = null

  for (let page = 0; page < 10; page++)
  {
    const qs = new URLSearchParams({ limit: '100' })
    if (teamId) qs.set('teamId', teamId)
    if (until) qs.set('until', String(until))

    const { res, json } = await vercelFetch(`/v9/projects?${qs}`)
    if (!res.ok)
    {
      throw new Error(`Falha ao listar projetos (HTTP ${res.status}): ${JSON.stringify(json)}`)
    }

    const batch = json?.projects || []
    projects.push(...batch)

    if (batch.length < 100) break
    until = batch[batch.length - 1]?.createdAt
    if (!until) break
  }

  return projects
}

async function getGithubRepoId()
{
  const res = await fetch(`https://api.github.com/repos/${GITHUB_ORG}/${GITHUB_REPO}`)
  if (!res.ok)
  {
    console.warn(`::warning::Não foi possível obter repoId do GitHub (HTTP ${res.status}). Deploy via Git pode falhar.`)
    return null
  }
  const json = await res.json()
  return json.id
}

async function findSimplyLifeProject(teams)
{
  const all = []

  for (const team of teams)
  {
    const projects = await listProjects(team.id)
    for (const p of projects)
    {
      all.push({ team, project: p })
    }
  }

  const hintId = process.env.VERCEL_PROJECT_ID?.trim()
  if (hintId)
  {
    const byId = all.find((x) => x.project.id === hintId)
    if (byId)
    {
      console.log(`Projeto encontrado pelo ID informado: ${hintId}`)
      return byId
    }
    console.warn(`::warning::VERCEL_PROJECT_ID (${hintId}) não existe nesta conta. Buscando por nome...`)
  }

  const byName = all.find((x) => (x.project.name || '').toLowerCase() === PROJECT_NAME)
  if (byName)
  {
    console.log(`Projeto encontrado pelo nome "${PROJECT_NAME}": ${byName.project.id}`)
    return byName
  }

  console.error('::error::Projeto simply-life não encontrado nesta conta Vercel.')
  console.error('Projetos visíveis com este token:')
  for (const { team, project } of all)
  {
    console.error(`  - ${project.name} (${project.id}) · time ${team.slug}`)
  }
  console.error('')
  console.error('O token pode ser de outra conta. Crie em vercel.com/account/tokens logada como marianaplauskac@gmail.com (conta Hobby).')
  process.exit(1)
}

/** Pasta api/ só sobe se o Root Directory da Vercel for a raiz do repo */
async function ensureRepoRootDirectory(teamId, projectId)
{
  const { res, json } = await vercelFetch(`/v9/projects/${projectId}?teamId=${teamId}`, {
    method: 'PATCH',
    body: JSON.stringify({
      rootDirectory: null,
      framework: 'vite',
      buildCommand: 'cd frontend && npm run build',
      outputDirectory: 'frontend/dist',
      installCommand: 'npm install --no-audit --no-fund && cd frontend && npm install --no-audit --no-fund',
    }),
  })

  if (!res.ok)
  {
    console.warn(`::warning::Não foi possível ajustar Root Directory (HTTP ${res.status}): ${JSON.stringify(json)}`)
    return
  }

  console.log('Root Directory do projeto: raiz do repositório (api/ + frontend/).')
}

async function deployFromGit(teamId, projectId, repoId)
{
  const body = {
    name: PROJECT_NAME,
    project: projectId,
    target: 'production',
    gitSource: {
      type: 'github',
      ref: GIT_REF,
      repoId,
    },
  }

  const { res, json } = await vercelFetch(`/v13/deployments?teamId=${teamId}`, {
    method: 'POST',
    body: JSON.stringify(body),
  })

  if (!res.ok)
  {
    console.warn(`::warning::Deploy via Git falhou (HTTP ${res.status}): ${JSON.stringify(json)}`)
    return false
  }

  const url = json?.url || json?.alias?.[0] || json?.inspectorUrl
  console.log(`Deploy via Git iniciado: ${json?.id || 'ok'}`)
  if (url) console.log(`URL: ${url}`)
  return true
}

function deployFromCli(team, projectId)
{
  console.log('Deploy via Vercel CLI (upload do código deste commit)...')
  mkdirSync('.vercel', { recursive: true })
  writeFileSync('.vercel/project.json', JSON.stringify({
    orgId: team.id,
    projectId,
  }))

  execSync('npm install --global vercel@latest', { stdio: 'inherit' })

  const scope = team.slug ? ` --scope ${team.slug}` : ''
  execSync(
    `vercel deploy --prod --yes --token="${TOKEN}"${scope}`,
    { stdio: 'inherit', env: { ...process.env, VERCEL_ORG_ID: team.id, VERCEL_PROJECT_ID: projectId } },
  )
}

async function main()
{
  if (!TOKEN)
  {
    console.error('::error::Defina VERCEL_TOKEN nos secrets do GitHub.')
    process.exit(1)
  }

  console.log('Simply-Life · deploy Vercel\n')
  console.log(`Buscando projeto "${PROJECT_NAME}"...\n`)

  const teams = await listTeams()
  if (!teams.length)
  {
    console.error('::error::Nenhum time/conta encontrado. Token inválido ou sem scope Full Account.')
    process.exit(1)
  }

  for (const t of teams)
  {
    console.log(`  Time: ${t.slug} → ${t.id}`)
  }
  console.log('')

  const match = await findSimplyLifeProject(teams)
  const { team, project } = match

  console.log(`\nDeploying: ${project.name}`)
  console.log(`  Project ID: ${project.id}`)
  console.log(`  Team: ${team.slug} (${team.id})\n`)

  await ensureRepoRootDirectory(team.id, project.id)

  const repoId = await getGithubRepoId()
  if (repoId)
  {
    const gitOk = await deployFromGit(team.id, project.id, repoId)
    if (gitOk)
    {
      console.log('\nDeploy disparado na Vercel. Aguarde 2–5 min em https://simply-life.vercel.app')
      return
    }
  }

  deployFromCli(team, project.id)
  console.log('\nDeploy concluído via CLI.')
}

main().catch((err) =>
{
  console.error('::error::', err.message || err)
  process.exit(1)
})
