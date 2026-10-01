// POST /api/axel/league-pot - avisa por push a liga quando o pote enche ou a liga sobe
//
// O app chama ao ver o pote cheio (faixa 4) ou a semana passada com "subiu".
// Aqui conferimos no banco (nunca confiamos no app) e mandamos cada aviso
// uma vez só por liga e semana (tabela liga_avisos, migração 074):
// - "cheio": o pote da semana atual encheu, a liga sobe na segunda
// - "subiu": a semana passada fechou com pote cheio e a liga subiu
// Regras iguais às dos apoios das Metas juntos:
// - notify_cadence "off": sem push
// - 22h às 8h (horário de Brasília): não manda nem marca; o próximo que abrir
//   a liga de manhã dispara o aviso
// - texto sobre o grupo, nunca sobre quem fez mais ou menos

import { applyCors } from '../../cors.js'
import { getUserFromBearer } from '../../supabaseUser.js'
import { getSupabaseAdmin } from '../../supabaseAdmin.js'
import { enforceRateLimit, sendRateLimited } from '../../rateLimit.js'
import { prefsNotifyCadence } from '../../notifyCadence.js'
import { sendPushToSubscriptions } from '../../sendPushFanout.js'
import { isQuietCheerHour } from './shared-goal-cheer.js'

const TZ = 'America/Sao_Paulo'
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// Espelha LEAGUE_DIVISIONS (packages/shared/src/leagues.ts)
const DIVISIONS = ['Trilha', 'Riacho', 'Vale', 'Colina', 'Serra', 'Planalto', 'Pico', 'Cordilheira', 'Horizonte', 'Céu aberto']

function divisionName(d)
{
  const i = Math.max(0, Math.min(DIVISIONS.length - 1, d))
  const extra = d - (DIVISIONS.length - 1)
  return extra > 0 ? `${DIVISIONS[i]} ${extra + 1}` : DIVISIONS[i]
}

/** Segunda-feira (AAAA-MM-DD) da semana atual em Brasília. */
export function brazilWeekStart(now = new Date())
{
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).format(now)
  const d = new Date(`${parts}T12:00:00Z`)
  const dow = (d.getUTCDay() + 6) % 7
  d.setUTCDate(d.getUTCDate() - dow)
  return d.toISOString().slice(0, 10)
}

function addDays(iso, n)
{
  const d = new Date(`${iso}T12:00:00Z`)
  d.setUTCDate(d.getUTCDate() + n)
  return d.toISOString().slice(0, 10)
}

// Espelha public.liga_alvo (migração 073)
export function leagueTarget(members, divisao)
{
  return Math.max(1, Math.round(Math.max(members, 1) * 150 * (1 + 0.08 * Math.max(divisao, 0))))
}

/** Marca o aviso; devolve true só para quem marcou primeiro. */
async function claim(admin, ligaId, semana, tipo)
{
  const { data, error } = await admin
    .from('liga_avisos')
    .upsert({ liga_id: ligaId, semana, tipo }, { onConflict: 'liga_id,semana,tipo', ignoreDuplicates: true })
    .select('liga_id')
  return !error && Array.isArray(data) && data.length > 0
}

async function pushToMembers(admin, memberIds, payload)
{
  if (memberIds.length === 0) return 0
  const [{ data: prefsRows }, { data: subs }] = await Promise.all([
    admin.from('user_workspace_prefs').select('user_id, prefs').in('user_id', memberIds),
    admin
      .from('push_subscriptions')
      .select('id, user_id, endpoint, p256dh, auth_key, provider')
      .in('user_id', memberIds),
  ])
  const cadenceOff = new Set(
    (prefsRows || []).filter((r) => prefsNotifyCadence(r.prefs) === 'off').map((r) => r.user_id),
  )
  let sent = 0
  for (const uid of memberIds)
  {
    if (cadenceOff.has(uid)) continue
    const rows = (subs || []).filter((s) => s.user_id === uid)
    if (rows.length === 0) continue
    const out = await sendPushToSubscriptions(admin, rows, payload)
    sent += out.sent
  }
  return sent
}

export default async function handler(req, res)
{
  applyCors(req, res, {
    methods: 'POST, OPTIONS',
    headers: 'Content-Type, Authorization',
  })
  res.setHeader('Cache-Control', 'no-store')

  if (req.method === 'OPTIONS') return res.status(204).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const user = await getUserFromBearer(req)
  if (!user) return res.status(401).json({ error: 'Não autenticado' })

  const limited = await enforceRateLimit(req, {
    route: 'league-pot',
    limit: 60,
    windowSec: 86400,
    key: user.id,
  })
  if (!limited.ok) return sendRateLimited(res, limited.retryAfter)

  const ligaId = String(req.body?.liga_id || '')
  if (!UUID_RE.test(ligaId)) return res.status(400).json({ error: 'liga_id inválido' })

  const admin = getSupabaseAdmin()
  if (!admin) return res.status(503).json({ error: 'Serviço indisponível' })

  const [{ data: liga }, { data: members }] = await Promise.all([
    admin.from('ligas').select('id, nome, divisao, status').eq('id', ligaId).maybeSingle(),
    admin.from('liga_membros').select('user_id').eq('liga_id', ligaId).is('left_at', null),
  ])

  const memberIds = (members || []).map((m) => m.user_id)
  if (!liga || liga.status !== 'ativa' || !memberIds.includes(user.id))
  {
    return res.status(200).json({ ok: true, sent: 0 })
  }
  if (memberIds.length < 2) return res.status(200).json({ ok: true, sent: 0 })

  // De madrugada não marca: quem abrir a liga de manhã dispara o aviso
  if (isQuietCheerHour()) return res.status(200).json({ ok: true, sent: 0, quiet: true })

  const week = brazilWeekStart()
  const others = memberIds.filter((id) => id !== user.id)
  let sent = 0

  // 1) pote da semana atual cheio
  const { data: soma, error: somaErr } = await admin.rpc('liga_soma', { p_liga_id: ligaId, p_semana: week })
  const target = leagueTarget(memberIds.length, Number(liga.divisao) || 0)
  if (!somaErr && Number(soma) >= target && (await claim(admin, ligaId, week, 'cheio')))
  {
    sent += await pushToMembers(admin, others, {
      title: liga.nome,
      body: `O pote da semana encheu. A liga sobe para ${divisionName((Number(liga.divisao) || 0) + 1)} na segunda.`,
      url: `/ligas/${ligaId}`,
      tag: `liga-${ligaId}`,
    })
  }

  // 2) semana passada fechou e a liga subiu
  const lastWeek = addDays(week, -7)
  const { data: closed } = await admin
    .from('liga_semanas')
    .select('semana, subiu, divisao')
    .eq('liga_id', ligaId)
    .eq('semana', lastWeek)
    .maybeSingle()
  if (closed?.subiu && (await claim(admin, ligaId, lastWeek, 'subiu')))
  {
    sent += await pushToMembers(admin, others, {
      title: liga.nome,
      body: `A liga subiu para ${divisionName(Number(closed.divisao) || 0)}. Cada parte de vocês somou.`,
      url: `/ligas/${ligaId}`,
      tag: `liga-${ligaId}`,
    })
  }

  return res.status(200).json({ ok: true, sent })
}
