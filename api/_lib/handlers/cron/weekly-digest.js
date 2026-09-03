// Cron + disparo manual - resumo semanal (e-mail IMAP e/ou web push)

import { getSupabaseAdmin } from '../../supabaseAdmin.js'
import { sendPushToSubscriptions } from '../../sendPushFanout.js'
import { sendMailViaImapAccount } from '../../mailer.js'
import { buildWeeklyDigest, shouldSendDigest } from '../../weeklyDigest.js'

async function deliverDigest(supabase, userId, pref, digest)
{
  const channel = pref.channel || 'both'
  const result = { push: 0, email: false, error: null }

  if (channel === 'push' || channel === 'both')
  {
    const { data: subs } = await supabase
      .from('push_subscriptions')
      .select('id, endpoint, p256dh, auth_key, provider')
      .eq('user_id', userId)

    const { sent } = await sendPushToSubscriptions(supabase, subs || [], {
      title: digest.title,
      body: digest.body.slice(0, 180),
      url: '/axel/historico',
      tag: 'simply-life-weekly',
    })
    result.push = sent
  }

  if (channel === 'email' || channel === 'both')
  {
    const { data: imap } = await supabase
      .from('gmail_imap_settings')
      .select('email, app_password, enabled')
      .eq('user_id', userId)
      .maybeSingle()

    if (imap?.enabled)
    {
      const mail = await sendMailViaImapAccount(imap, {
        subject: digest.title,
        text: digest.body,
      })
      result.email = mail.ok
      if (!mail.ok) result.error = mail.error
    }
  }

  await supabase.from('user_weekly_digest_prefs').upsert({
    user_id: userId,
    enabled: pref.enabled !== false,
    weekday: pref.weekday ?? 1,
    channel: pref.channel || 'both',
    last_sent_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  })

  return result
}

export async function runWeeklyDigests(supabase, { forceUserId = null } = {})
{
  if (forceUserId)
  {
    const { data: pref } = await supabase
      .from('user_weekly_digest_prefs')
      .select('*')
      .eq('user_id', forceUserId)
      .maybeSingle()

    const resolved = pref || { enabled: true, weekday: 1, channel: 'both' }
    const digest = await buildWeeklyDigest(supabase, forceUserId)
    const delivery = await deliverDigest(supabase, forceUserId, resolved, digest)
    return { sent: 1, results: [{ user_id: forceUserId, ...delivery }] }
  }

  const { data: prefs, error } = await supabase
    .from('user_weekly_digest_prefs')
    .select('*')
    .eq('enabled', true)

  if (error)
  {
    return { sent: 0, error: error.message }
  }

  const results = []
  for (const pref of prefs || [])
  {
    if (!shouldSendDigest(pref)) continue
    try
    {
      const digest = await buildWeeklyDigest(supabase, pref.user_id)
      const delivery = await deliverDigest(supabase, pref.user_id, pref, digest)
      results.push({ user_id: pref.user_id, ...delivery })
    }
    catch (err)
    {
      results.push({ user_id: pref.user_id, error: err?.message || 'falha' })
    }
  }

  return { sent: results.length, results }
}

export default async function handler(req, res)
{
  if (req.method !== 'GET' && req.method !== 'POST')
  {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const cronSecret = process.env.CRON_SECRET
  const auth = req.headers.authorization || ''
  if (cronSecret && auth !== `Bearer ${cronSecret}`)
  {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const supabase = getSupabaseAdmin()
  if (!supabase)
  {
    return res.status(200).json({ status: 'skipped', reason: 'Supabase não configurado' })
  }

  const data = await runWeeklyDigests(supabase)
  return res.status(200).json({ status: 'ok', ...data })
}
