import type { Notificacao } from '../store/storeTypes'
import { isNotificacaoLida, isNotificacaoRuido } from './notificacaoUtils'
import { supabase } from './supabase'

/** Marca como lidas notificações financeiras de rotina já persistidas */
export async function dismissNotificacoesRuido(notificacoes: Notificacao[]): Promise<number>
{
  const ruido = notificacoes.filter((n) => !isNotificacaoLida(n.lida) && isNotificacaoRuido(n))
  if (ruido.length === 0) return 0

  const uid = (await supabase.auth.getUser()).data.user?.id
  if (!uid) return 0

  const ids = ruido.map((n) => n.id)
  const { error } = await supabase
    .from('notificacoes')
    .update({ lida: 1 })
    .in('id', ids)
    .eq('user_id', uid)

  if (error) return 0
  return ruido.length
}
