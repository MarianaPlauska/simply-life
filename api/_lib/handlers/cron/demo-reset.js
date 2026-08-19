// Safety net — reset da conta demo no cron diário (visitantes sujam o seed)

import { getSupabaseAdmin } from '../../supabaseAdmin.js'
import { resetConfiguredDemoAccount } from '../../demoWorkspace.js'

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

  try
  {
    const data = await resetConfiguredDemoAccount(supabase)
    return res.status(200).json({ status: 'ok', data })
  }
  catch (err)
  {
    return res.status(500).json({ error: err?.message || 'demo reset failed' })
  }
}
