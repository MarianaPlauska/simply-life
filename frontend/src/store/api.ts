// url base e headers de autenticação compartilhados entre todos os slices
// Sprint B: cookies httpOnly em vez de Bearer header
export const API = 'http://127.0.0.1:8000';

// token mantido apenas como fallback para compatibilidade (swagger, testes)
let _authToken = '';

export function setAuthToken(token: string)
{
  _authToken = token;
}

export function getAuthToken(): string
{
  return _authToken;
}

export function authHeaders(): HeadersInit
{
  return {
    'Content-Type': 'application/json',
    ...(_authToken ? { Authorization: `Bearer ${_authToken}` } : {}),
  };
}

/**
 * B1: fetch com credentials: 'include' para enviar cookies httpOnly.
 * B2: intercepta 401 e tenta refresh automático antes de falhar.
 */
export async function apiFetch(path: string, init: RequestInit = {}): Promise<Response>
{
  const url = `${API}${path}`;
  const opts: RequestInit = {
    ...init,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(_authToken ? { Authorization: `Bearer ${_authToken}` } : {}),
      ...(init.headers || {}),
    },
  };

  let res = await fetch(url, opts);

  // se 401 e não é a própria rota de refresh, tenta renovar
  if ( res.status === 401 && !path.startsWith('/auth/refresh') && !path.startsWith('/auth/login') )
  {
    const refreshRes = await fetch(`${API}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
    });

    if ( refreshRes.ok )
    {
      // retry com novos cookies
      res = await fetch(url, opts);
    }
  }

  return res;
}
