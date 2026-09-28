// POST /api/axel/shared-goal-cheer - avisa por push quem está na meta que chegou apoio
//
// O apoio já foi gravado pela RPC send_shared_goal_cheer (presets, limite de
// 3 por dia, só membro). Aqui só entregamos o aviso, uma vez por apoio:
// - nunca para quem silenciou a meta ou silenciou quem mandou (friend_mutes)
// - notify_cadence "off": sem push
// - 22h às 8h (horário de Brasília): sem push; o apoio espera na meta
// - texto sempre gentil, sem cobrança

import { applyCors } from '../../cors.js'
import { getUserFromBearer } from '../../supabaseUser.js'
import { getSupabaseAdmin } from '../../supabaseAdmin.js'
import { enforceRateLimit, sendRateLimited } from '../../rateLimit.js'
import { prefsNotifyCadence } from '../../notifyCadence.js'
import { sendPushToSubscriptions } from '../../sendPushFanout.js'

const TZ = 'America/Sao_Paulo'
const QUIET_START = 22
const QUIET_END = 8

const CHEER_LABELS = {
  to_contigo: 'Tô contigo',
  bora_juntos: 'Bora juntos',
  orgulho: 'Orgulho de você',
  um_passo: 'Um passo de cada vez',
  descansa: 'Descansa hoje, amanhã tem mais',
}

function brazilHour(now = new Date())
{
  const h = new Intl.DateTimeFormat('en-US', { timeZone: TZ, hour: 'numeric', hour12: false }).format(now)
  return Number(h) % 24
}

export function isQuietCheerHour(now = new Date())
{
  const h = brazilHour(now)
  return h >= QUIET_START || h < QUIET_END
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
    route: 'shared-goal-cheer',
    limit: 30,
    windowSec: 86400,
    key: user.id,
  })
  if (!limited.ok) return sendRateLimited(res, limited.retryAfter)

  const cheerId = Number(req.body?.cheer_id)
  if (!Number.isFinite(cheerId) || cheerId <= 0)
  {
    return res.status(400).json({ error: 'cheer_id inválido' })
  }

  const admin = getSupabaseAdmin()
  if (!admin) return res.status(503).json({ error: 'Serviço indisponível' })

  const { data: cheer } = await admin
    .from('shared_goal_cheers')
    .select('id, goal_id, from_user, preset_key, created_at, notified_at')
    .eq('id', cheerId)
    .maybeSingle()

  // Só quem mandou dispara, uma vez, logo depois de mandar
  if (!cheer || cheer.from_user !== user.id || cheer.notified_at)
  {
    return res.status(200).json({ ok: true, sent: 0 })
  }
  if (Date.now() - new Date(cheer.created_at).getTime() > 10 * 60 * 1000)
  {
    return res.status(200).json({ ok: true, sent: 0 })
  }

  // Marca antes de enviar: repetir a chamada nunca manda duas vezes
  const { data: claimed } = await admin
    .from('shared_goal_cheers')
    .update({ notified_at: new Date().toISOString() })
    .eq('id', cheer.id)
    .is('notified_at', null)
    .select('id')

  if (!claimed?.length) return res.status(200).json({ ok: true, sent: 0 })

  if (isQuietCheerHour())
  {
    return res.status(200).json({ ok: true, sent: 0, quiet: true })
  }

  const [{ data: goal }, { data: members }, { data: card }] = await Promise.all([
    admin.from('shared_goals').select('id, titulo, status').eq('id', cheer.goal_id).maybeSingle(),
    admin
      .from('shared_goal_members')
      .select('user_id, muted')
      .eq('goal_id', cheer.goal_id)
      .is('left_at', null),
    admin
      .from('user_public_cards')
      .select('display_name, axel_calls_you')
      .eq('user_id', user.id)
      .maybeSingle(),
  ])

  if (!goal || goal.status !== 'ativa') return res.status(200).json({ ok: true, sent: 0 })

  let recipients = (members || [])
    .filter((m) => m.user_id !== user.id && !m.muted)
    .map((m) => m.user_id)

  if (recipients.length === 0) return res.status(200).json({ ok: true, sent: 0 })

  const [{ data: mutes }, { data: prefsRows }, { data: subs }] = await Promise.all([
    admin.from('friend_mutes').select('user_id').eq('friend_id', user.id).in('user_id', recipients),
    admin.from('user_workspace_prefs').select('user_id, prefs').in('user_id', recipients),
    admin
      .from('push_subscriptions')
      .select('id, user_id, endpoint, p256dh, auth_key, provider')
      .in('user_id', recipients),
  ])

  const mutedBy = new Set((mutes || []).map((m) => m.user_id))
  const cadenceOff = new Set(
    (prefsRows || []).filter((r) => prefsNotifyCadence(r.prefs) === 'off').map((r) => r.user_id),
  )
  recipients = recipients.filter((id) => !mutedBy.has(id) && !cadenceOff.has(id))

  const name = String(card?.axel_calls_you || card?.display_name || '').trim() || 'Alguém'
  const label = CHEER_LABELS[cheer.preset_key] || 'Tô contigo'
  const payload = {
    title: goal.titulo,
    body: `${name} mandou: ${label}`,
    url: `/metas/${goal.id}`,
    tag: `cheer-${goal.id}`,
  }

  let sent = 0
  for (const uid of recipients)
  {
    const rows = (subs || []).filter((s) => s.user_id === uid)
    if (rows.length === 0) continue
    const out = await sendPushToSubscriptions(admin, rows, payload)
    sent += out.sent
  }

  return res.status(200).json({ ok: true, sent })
}
