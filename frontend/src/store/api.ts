// url base e headers de autenticação compartilhados entre todos os slices
export const API = 'http://127.0.0.1:8000';

// token fica aqui pra evitar importação circular com o store
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
