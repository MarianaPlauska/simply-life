// Roteador demo (Hobby: soma nas ~12 funções)

import loginReset from '../_lib/handlers/demo/login-reset.js'

const ROUTES = {
  'login-reset': loginReset,
}

function pickQuery(value)
{
  if (Array.isArray(value)) return value[0]
  return value
}

export default async function handler(req, res)
{
  const action = pickQuery(req.query.action)
  const route = ROUTES[action]

  if (!route)
  {
    return res.status(404).json({ error: 'Rota demo não encontrada' })
  }

  return route(req, res)
}
