/**
 * CORS restrito em produção — lista em ALLOWED_ORIGINS (vírgula).
 * Ex.: https://seu-app.vercel.app,http://localhost:5173
 */
export function applyCors(req, res, options = {})
{
  const {
    methods = 'GET, POST, OPTIONS',
    headers = 'Content-Type, Authorization, X-Webhook-Signature, X-Webhook-Secret',
  } = options

  const origin = req.headers.origin
  const allowed = (process.env.ALLOWED_ORIGINS || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)

  const isProd = process.env.VERCEL_ENV === 'production'
    || (process.env.NODE_ENV === 'production' && !process.env.VERCEL_ENV)

  if (!isProd || allowed.length === 0)
  {
    if (origin)
    {
      res.setHeader('Access-Control-Allow-Origin', origin)
      res.setHeader('Vary', 'Origin')
    }
    else
    {
      res.setHeader('Access-Control-Allow-Origin', '*')
    }
  }
  else if (origin && allowed.includes(origin))
  {
    res.setHeader('Access-Control-Allow-Origin', origin)
    res.setHeader('Vary', 'Origin')
  }

  res.setHeader('Access-Control-Allow-Methods', methods)
  res.setHeader('Access-Control-Allow-Headers', headers)
}
