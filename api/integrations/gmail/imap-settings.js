// POST /api/integrations/gmail/imap-settings — salva e-mail + senha de app (gratuito)

import { getSupabaseAdmin } from '../../_lib/supabaseAdmin.js'
import { corsJson, getUserFromBearer } from '../../_lib/supabaseUser.js'

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

  const { email, app_password } = req.body || {}
  if (!email || !app_password)
  {
    return res.status(400).json({ error: 'email e app_password são obrigatórios' })
  }

  const supabase = getSupabaseAdmin()
  if (!supabase)
  {
    return res.status(500).json({ error: 'Supabase não configurado' })
  }

  const { error } = await supabase
    .from('gmail_imap_settings')
    .upsert({
      user_id: user.id,
      email: String(email).trim().toLowerCase(),
      app_password: String(app_password).replace(/\s/g, ''),
      enabled: true,
      updated_at: new Date().toISOString(),
    })

  if (error)
  {
    return res.status(500).json({ error: error.message })
  }

  return res.status(200).json({ saved: true, email })
}
