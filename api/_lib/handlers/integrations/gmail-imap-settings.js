// POST /api/integrations/gmail/imap-settings — salva e-mail + senha de app cifrada

import { getSupabaseAdmin } from '../../supabaseAdmin.js'
import { corsJson, getUserFromBearer } from '../../supabaseUser.js'
import { encryptSecret, isEncryptionConfigured } from '../../cryptoSecret.js'

export default async function handler(req, res)
{
  corsJson(res, req)
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const user = await getUserFromBearer(req)
  if (!user)
  {
    return res.status(401).json({ error: 'Não autenticado' })
  }

  if (!isEncryptionConfigured())
  {
    return res.status(503).json({
      error: 'ENCRYPTION_KEY ausente no servidor. Não gravo senha em texto puro.',
    })
  }

  const { email, app_password, mailbox_folder } = req.body || {}
  if (!email || !app_password)
  {
    return res.status(400).json({ error: 'email e app_password são obrigatórios' })
  }

  const supabase = getSupabaseAdmin()
  if (!supabase)
  {
    return res.status(500).json({ error: 'Supabase não configurado' })
  }

  let cipher
  try
  {
    cipher = encryptSecret(String(app_password).replace(/\s/g, ''))
  }
  catch (err)
  {
    return res.status(500).json({ error: err?.message || 'Falha ao cifrar senha' })
  }

  const folder = String(mailbox_folder || 'INBOX').trim() || 'INBOX'

  const { error } = await supabase
    .from('gmail_imap_settings')
    .upsert({
      user_id: user.id,
      email: String(email).trim().toLowerCase(),
      app_password: cipher,
      mailbox_folder: folder,
      enabled: true,
      updated_at: new Date().toISOString(),
    })

  if (error)
  {
    return res.status(500).json({ error: error.message })
  }

  return res.status(200).json({ saved: true, email, mailbox_folder: folder })
}
