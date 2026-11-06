/**
 * Erro do banco em português para a pessoa. A mensagem técnica fica no console
 * (para quem mantém o app saber qual migração falta).
 */
export function friendlyError(e: unknown, fallback = 'Não foi possível salvar. Tente de novo.'): string
{
  const raw = e instanceof Error ? e.message : typeof e === 'string' ? e : ''
  if (!raw) return fallback
  if (/schema cache|does not exist|Could not find the/i.test(raw))
  {
    console.warn('[banco] estrutura faltando:', raw)
    return 'O app foi atualizado, mas o banco ainda não. Não deu para salvar isso agora.'
  }
  if (/row-level security|permission denied|42501/i.test(raw))
  {
    console.warn('[banco] sem permissão:', raw)
    return 'Sua sessão expirou. Saia e entre de novo para salvar.'
  }
  if (/network|fetch|Failed to fetch|timeout/i.test(raw)) return 'Sem conexão. Confira a internet e tente de novo.'
  if (/duplicate key|23505/i.test(raw)) return 'Isso já está salvo.'
  if (/violates check constraint|invalid input/i.test(raw))
  {
    console.warn('[banco] valor recusado:', raw)
    return 'Algum campo ficou com um valor que não vale. Confira e tente de novo.'
  }
  if (/não autenticado|jwt|session/i.test(raw)) return 'Sua sessão expirou. Saia e entre de novo.'
  if (/too many|rate limit|\b429\b/i.test(raw)) return 'Muitas tentativas seguidas. Aguarde um minuto e tente de novo.'
  // código, inglês ou nome de serviço não aparecem para a pessoa; ficam no log
  if (/supabase|PGRST|\bHTTP\b|\b[45]\d\d\b|error|failed|invalid|unexpected|undefined|cannot|could not|\bthe\b/i.test(raw))
  {
    console.warn('[erro]', raw)
    return fallback
  }
  return raw
}
