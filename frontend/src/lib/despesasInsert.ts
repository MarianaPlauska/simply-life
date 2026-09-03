import type { SupabaseClient } from '@supabase/supabase-js'

/** Campos opcionais - removidos em ordem se o schema remoto ainda não tiver a coluna */
const OPTIONAL_DESPESA_KEYS = [
  'observacao',
  'tipo',
  'forma_pagamento',
  'card_id',
  'fatura_reserva_id',
  'status_pagamento',
  'categoria_id',
] as const

function missingColumnFromError(message?: string | null): string | null
{
  if (!message) return null
  const quoted = message.match(/'(\w+)' column/)
  if (quoted?.[1]) return quoted[1]
  const schema = message.match(/Could not find the '(\w+)' column/)
  return schema?.[1] ?? null
}

/** Insert resiliente - compatível com Supabase sem migrations recentes */
export async function insertDespesaResilient(
  client: SupabaseClient,
  payload: Record<string, unknown>,
)
{
  const working = { ...payload }

  for (let attempt = 0; attempt <= OPTIONAL_DESPESA_KEYS.length + 2; attempt++)
  {
    const { data, error } = await client
      .from('despesas')
      .insert(working)
      .select()
      .single()

    if (!error)
    {
      return { data, error: null as null }
    }

    if (error.code !== 'PGRST204')
    {
      return { data: null, error }
    }

    const missing = missingColumnFromError(error.message)
    if (missing && missing in working)
    {
      delete working[missing]
      continue
    }

    const optional = OPTIONAL_DESPESA_KEYS.find((k) => k in working)
    if (!optional)
    {
      return { data: null, error }
    }
    delete working[optional]
  }

  return {
    data: null,
    error: { code: 'PGRST204', message: 'Não foi possível inserir em despesas após remover colunas opcionais' },
  }
}
