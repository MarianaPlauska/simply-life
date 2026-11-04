// POST /api/axel/signup - cria a conta já confirmada, sem e-mail de código.
// Provisório: o envio de e-mail do Supabase não chegava. Para voltar a confirmar,
// tire esta rota do roteador e o app usa o cadastro normal do Supabase.

import { applyCors } from '../../cors.js'
import { getSupabaseAdmin } from '../../supabaseAdmin.js'
import { enforceRateLimit, sendRateLimited } from '../../rateLimit.js'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

export default async function handler(req, res)
{
  applyCors(req, res, { methods: 'POST, OPTIONS', headers: 'Content-Type' })
  res.setHeader('Cache-Control', 'no-store')
  if (req.method === 'OPTIONS') return res.status(204).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  // sem confirmação por e-mail, o freio contra contas em massa é o limite por IP
  const limited = await enforceRateLimit(req, { route: 'signup', limit: 5, windowSec: 3600 })
  if (!limited.ok) return sendRateLimited(res, limited.retryAfter)

  const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {}
  const email = String(body.email || '').trim().toLowerCase()
  const password = String(body.password || '')
  const nome = String(body.nome || '').trim().slice(0, 80)
  if (!EMAIL_RE.test(email) || email.length > 200) return res.status(400).json({ error: 'E-mail inválido.' })
  if (password.length < 8 || password.length > 72) return res.status(400).json({ error: 'A senha precisa ter de 8 a 72 caracteres.' })

  const supabase = getSupabaseAdmin()
  if (!supabase || !process.env.SUPABASE_SERVICE_ROLE_KEY)
  {
    return res.status(503).json({ error: 'Cadastro indisponível no momento.', fallback: true })
  }

  const { error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: nome ? { full_name: nome } : undefined,
  })
  if (error)
  {
    if (/already|registered|exists/i.test(error.message))
    {
      return res.status(409).json({ error: 'Esse e-mail já tem conta. Entre com a sua senha.' })
    }
    console.warn('[signup]', error.message)
    return res.status(400).json({ error: 'Não foi possível criar a conta. Confira os dados e tente de novo.' })
  }
  return res.status(200).json({ ok: true })
}
