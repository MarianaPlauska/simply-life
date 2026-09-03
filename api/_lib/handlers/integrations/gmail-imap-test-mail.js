// GET/POST /api/integrations/gmail/imap-test-mail - envia um e-mail de teste para a própria conta

import { getSupabaseAdmin } from '../../supabaseAdmin.js'
import { corsJson, getUserFromBearer } from '../../supabaseUser.js'
import { sendMailViaImapAccount } from '../../mailer.js'
import { enforceRateLimit, sendRateLimited } from '../../rateLimit.js'

export default async function handler(req, res)
{
  corsJson(res, req)
  if (req.method === 'OPTIONS') return res.status(204).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const user = await getUserFromBearer(req)
  if (!user) return res.status(401).json({ error: 'Não autenticado' })

  const limited = await enforceRateLimit(req, {
    route: 'imap-test-mail',
    limit: 3,
    windowSec: 60,
    key: user.id,
  })
  if (!limited.ok) return sendRateLimited(res, limited.retryAfter)

  const supabase = getSupabaseAdmin()
  if (!supabase) return res.status(500).json({ error: 'Supabase não configurado' })

  const { data: row } = await supabase
    .from('gmail_imap_settings')
    .select('email, app_password, enabled')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!row?.enabled)
  {
    return res.status(400).json({ error: 'Gmail IMAP não configurado' })
  }

  const result = await sendMailViaImapAccount(row, {
    subject: 'Simply-Life · teste de e-mail',
    text: 'SMTP da senha de app funcionou. O resumo semanal usa este mesmo canal.',
  })

  if (!result.ok)
  {
    const status = result.oauthRequired ? 502 : 500
    return res.status(status).json({
      error: result.error,
      oauth_required: Boolean(result.oauthRequired),
    })
  }

  return res.status(200).json({ ok: true })
}
