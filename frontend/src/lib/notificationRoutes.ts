import type { Notificacao } from '../store/storeTypes'

export interface NotificationAction
{
  path: string
  hash?: string
  label: string
}

/** Rota para resolver cada notificação no app */
export function resolveNotificationAction(n: Notificacao): NotificationAction
{
  const titulo = n.titulo.toLowerCase()
  const msg = (n.mensagem ?? '').toLowerCase()

  if (n.tipo === 'tarefa' || titulo.includes('tarefa') || titulo.includes('kanban') || titulo.includes('prazo'))
  {
    return { path: '/kanban', label: 'Abrir Kanban' }
  }

  if (n.tipo === 'saude' || titulo.includes('medicamento') || titulo.includes('hidrata') || titulo.includes('humor'))
  {
    const hash = titulo.includes('medicamento') ? 'medicamentos' : titulo.includes('água') || titulo.includes('agua') ? 'hidratacao' : 'bem_estar'
    return { path: '/saude', hash, label: 'Abrir Saúde' }
  }

  if (
    n.tipo === 'financeiro'
    || titulo.includes('fatura')
    || titulo.includes('livre')
    || titulo.includes('caixa')
    || titulo.includes('boleto')
    || titulo.includes('axel ·')
    || msg.includes('fatura')
  )
  {
    const hash = titulo.includes('fatura') || msg.includes('fatura') ? undefined : undefined
    const path = titulo.includes('fatura') ? '/financeiro?aba=faturas' : '/financeiro'
    return { path, hash, label: 'Abrir Finanças' }
  }

  if (titulo.includes('inbox') || titulo.includes('ingest') || titulo.includes('triagem'))
  {
    return { path: '/inteligencia', label: 'Abrir Inbox IA' }
  }

  return { path: '/', label: 'Abrir início' }
}
