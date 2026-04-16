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
 * Lê o cookie csrf_token (não httpOnly) para enviar no header X-CSRF-Token.
 */
function getCsrfToken(): string
{
  const match = document.cookie.match(/(?:^|;\s*)csrf_token=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : '';
}

/**
 * B1: fetch com credentials: 'include' para enviar cookies httpOnly.
 * B2: intercepta 401 e tenta refresh automático antes de falhar.
 * Security: envia X-CSRF-Token em métodos mutantes (double-submit cookie).
 */
export async function apiFetch(path: string, init: RequestInit = {}): Promise<Response>
{
  const url = `${API}${path}`;
  const method = (init.method || 'GET').toUpperCase();
  const csrfHeaders: Record<string, string> = {};
  if (method !== 'GET' && method !== 'HEAD' && method !== 'OPTIONS')
  {
    const csrf = getCsrfToken();
    if (csrf) csrfHeaders['X-CSRF-Token'] = csrf;
  }

  const opts: RequestInit = {
    ...init,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...csrfHeaders,
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
      headers: { ...csrfHeaders },
    });

    if ( refreshRes.ok )
    {
      // retry com novos cookies
      res = await fetch(url, opts);
    }
  }

  return res;
}
