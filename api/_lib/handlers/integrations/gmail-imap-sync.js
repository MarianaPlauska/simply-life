// POST /api/integrations/gmail/imap-sync — sync gratuito via IMAP (senha de app)

import { getSupabaseAdmin } from '../../supabaseAdmin.js'
import { fetchUnreadViaImap } from '../../gmailImap.js'
import { ingestGmailBatch } from '../../gmailIngestRunner.js'
import { corsJson, getUserFromBearer } from '../../supabaseUser.js'

export default async function handler(req, res)
{
  corsJson(res)
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const user = await getUserFromBearer(req)
  if (!user)
  {
    return res.status(401).json({ error: 'Não autenticado' })
  }

  const supabase = getSupabaseAdmin()
  if (!supabase)
  {
    return res.status(500).json({ error: 'Supabase não configurado' })
  }

  const { data: settings, error: settingsErr } = await supabase
    .from('gmail_imap_settings')
    .select('email, app_password, enabled')
    .eq('user_id', user.id)
    .maybeSingle()

  if (settingsErr || !settings?.enabled)
  {
    return res.status(400).json({
      error: 'Gmail não configurado. Adicione e-mail e senha de app em Configurações.',
    })
  }

  try
  {
    const emails = await fetchUnreadViaImap(
      settings.email,
      settings.app_password,
      30,
    )

    const { data: keywords } = await supabase
      .from('palavras_chave')
      .select('termo')
      .eq('user_id', user.id)

    const result = await ingestGmailBatch(
      supabase,
      user.id,
      emails,
      null,
      (keywords || []).map((k) => k.termo),
    )

    await supabase
      .from('gmail_imap_settings')
      .update({ last_sync_at: new Date().toISOString() })
      .eq('user_id', user.id)

    return res.status(200).json({
      emails_lidos: result.processed,
      tarefas_geradas: result.succeeded,
      mode: 'imap',
    })
  }
  catch (err)
  {
    console.error('[imap-sync]', err)
    const msg = err?.message || 'Erro no sync IMAP'
    if (msg.toLowerCase().includes('auth'))
    {
      return res.status(401).json({
        error: 'Senha de app inválida. Gere uma nova em Google → Segurança → Senhas de app.',
      })
    }
    return res.status(500).json({ error: msg })
  }
}
