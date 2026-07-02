import type { MouseEvent } from 'react'
import { useMemo } from 'react'
import { Check, CheckCheck, Clock, Info, Heart, ListTodo, Wallet2, AlertTriangle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useTaskStore } from '../../store/useTaskStore'
import type { Notificacao } from '../../store/storeTypes'
import { resolveNotificationAction } from '../../lib/notificationRoutes'
import { isNotificacaoLida, listNotificacoesAcionaveis, listPrazosUrgentes, listTarefasAtrasadas, filterNotificacoesSemPrazoDuplicado } from '../../lib/notificacaoUtils'
import { formatDueMeta } from '../../lib/temporalHorizon'
import {
  AXEL_TEXT_PRIMARY,
  AXEL_TEXT_SECONDARY,
} from '../../constants/axelSurfaces'

interface NotificationDropdownProps
{
  onClose: () => void
}

function tipoIcon(n: Notificacao)
{
  if (n.tipo === 'saude') return Heart
  if (n.tipo === 'tarefa') return ListTodo
  if (n.tipo === 'financeiro') return Wallet2
  return Info
}

function urgencyBar(n: Notificacao): string
{
  if (n.urgencia === 'critica') return 'bg-urgente'
  if (n.urgencia === 'alta') return 'bg-atencao'
  return 'bg-ink-muted/40'
}

export function NotificationDropdown({ onClose }: NotificationDropdownProps)
{
  const navigate = useNavigate()
  const notificacoes = useTaskStore((s) => s.notificacoes)
  const tarefas = useTaskStore((s) => s.tarefas)
  const billSettlements = useTaskStore((s) => s.billSettlements)
  const transactions = useTaskStore((s) => s.transactions)
  const markNotificacaoRead = useTaskStore((s) => s.markNotificacaoRead)
  const markAllNotificacoesRead = useTaskStore((s) => s.markAllNotificacoesRead)

  const alertCtx = useMemo(
    () => ({ settlements: billSettlements, transactions }),
    [billSettlements, transactions],
  )

  const tarefasAtrasadas = listTarefasAtrasadas(tarefas, alertCtx)
  const prazosUrgentes = listPrazosUrgentes(tarefas)
  const notificacoesPendentes = filterNotificacoesSemPrazoDuplicado(
    listNotificacoesAcionaveis(notificacoes, tarefas),
    prazosUrgentes,
  )
  const unreadCount = notificacoesPendentes.length
  const hasDismissible = unreadCount > 0

  const goOverdueTask = (taskId: number) =>
  {
    onClose()
    navigate(`/kanban?bucket=vencido&task=${taskId}`)
  }

  const goResolve = (n: Notificacao) =>
  {
    const action = resolveNotificationAction(n)
    if (!isNotificacaoLida(n.lida)) void markNotificacaoRead(n.id)
    onClose()
    const url = action.hash ? `${action.path}#${action.hash}` : action.path
    navigate(url)
  }

  const openUrgentTask = (taskId: number) =>
  {
    onClose()
    navigate(`/kanban?task=${taskId}`)
  }

  const markResolvedOnly = (e: MouseEvent, id: number) =>
  {
    e.stopPropagation()
    void markNotificacaoRead(id)
  }

  const empty = tarefasAtrasadas.length === 0 && prazosUrgentes.length === 0 && notificacoesPendentes.length === 0

  return (
    <div
      className={[
        'z-[200] rounded-sl border border-line bg-card shadow-lg overflow-hidden',
        'fixed left-3 right-3 top-[calc(env(safe-area-inset-top,0px)+3.5rem)]',
        'sm:absolute sm:left-auto sm:right-0 sm:top-10 sm:w-80 sm:max-w-[min(100vw-1.5rem,20rem)]',
      ].join(' ')}
    >
      <div className="flex items-center justify-between gap-2 px-3 py-2.5 border-b border-line bg-chrome/40">
        <span className={`text-[12px] font-semibold ${AXEL_TEXT_PRIMARY}`}>Notificações</span>
        {hasDismissible && (
          <button
            type="button"
            onClick={() => void markAllNotificacoesRead()}
            className="flex items-center gap-1 text-[11px] text-accent hover:underline transition-colors shrink-0"
            title="Marca como lidas as notificações que podem ser removidas"
          >
            <CheckCheck className="w-3 h-3" /> Limpar todas
          </button>
        )}
      </div>
      <div className="max-h-[min(70dvh,24rem)] sm:max-h-72 overflow-y-auto custom-scrollbar">
        {empty ? (
          <div className={`px-4 py-6 text-center text-[12px] ${AXEL_TEXT_SECONDARY}`}>
            Nenhuma notificação
          </div>
        ) : (
          <>
            {tarefasAtrasadas.map(({ task }) =>
            {
              const due = formatDueMeta(task.data_vencimento)
              return (
                <div
                  key={`atraso-${task.id}`}
                  className="flex items-stretch border-b border-line bg-urgente/10"
                >
                  <button
                    type="button"
                    onClick={() => goOverdueTask(task.id)}
                    className="flex-1 min-w-0 flex items-start text-left hover:bg-chrome/50 transition-colors"
                    title="Abrir tarefa atrasada"
                  >
                    <div className="w-[3px] self-stretch shrink-0 bg-urgente" />
                    <div className="flex items-start gap-2.5 px-3 py-2.5 flex-1 min-w-0">
                      <AlertTriangle className="w-3.5 h-3.5 text-urgente mt-0.5 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className={`text-[12px] truncate font-medium ${AXEL_TEXT_PRIMARY}`}>
                          Atrasada · {task.titulo}
                        </div>
                        <div className={`text-[11px] truncate ${AXEL_TEXT_SECONDARY}`}>
                          {due ? `Venceu ${due}` : 'Prazo passou'}
                        </div>
                        <span className="font-mono text-[9px] text-urgente mt-0.5 inline-block">
                          Resolver no Kanban →
                        </span>
                      </div>
                    </div>
                  </button>
                </div>
              )
            })}

            {prazosUrgentes.map(({ task }) =>
            {
              const due = formatDueMeta(task.data_vencimento)
              return (
                <div
                  key={`prazo-${task.id}`}
                  className="flex items-stretch border-b border-line bg-atencao/10"
                >
                  <button
                    type="button"
                    onClick={() => openUrgentTask(task.id)}
                    className="flex-1 min-w-0 flex items-start text-left hover:bg-chrome/50 transition-colors"
                    title="Abrir tarefa — some ao concluir"
                  >
                    <div className="w-[3px] self-stretch shrink-0 bg-atencao" />
                    <div className="flex items-start gap-2.5 px-3 py-2.5 flex-1 min-w-0">
                      <Clock className="w-3.5 h-3.5 text-atencao mt-0.5 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className={`text-[12px] truncate font-medium ${AXEL_TEXT_PRIMARY}`}>
                          Prazo em 24h · {task.titulo}
                        </div>
                        <div className={`text-[11px] truncate ${AXEL_TEXT_SECONDARY}`}>
                          {due ? `Vence ${due}` : 'Defina o prazo no painel da tarefa'}
                        </div>
                        <span className="font-mono text-[9px] text-atencao mt-0.5 inline-block">
                          Conclua para remover →
                        </span>
                      </div>
                    </div>
                  </button>
                </div>
              )
            })}

            {notificacoesPendentes.slice(0, 12).map((n) =>
            {
              const lida = isNotificacaoLida(n.lida)
              const TipoIcon = tipoIcon(n)
              const action = resolveNotificationAction(n)
              return (
                <div
                  key={n.id}
                  className={`flex items-stretch border-b border-line last:border-0 ${
                    !lida ? 'bg-accent-muted/30' : ''
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => goResolve(n)}
                    className="flex-1 min-w-0 flex items-start text-left hover:bg-chrome/50 transition-colors"
                    title={action.label}
                  >
                    <div className={`w-[3px] self-stretch shrink-0 ${urgencyBar(n)}`} />
                    <div className="flex items-start gap-2.5 px-3 py-2.5 flex-1 min-w-0">
                      <TipoIcon className="w-3.5 h-3.5 text-ink-muted mt-0.5 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className={`text-[12px] truncate ${!lida ? `font-medium ${AXEL_TEXT_PRIMARY}` : AXEL_TEXT_SECONDARY}`}>
                          {n.titulo}
                        </div>
                        {n.mensagem && (
                          <div className={`text-[11px] truncate ${AXEL_TEXT_SECONDARY}`}>{n.mensagem}</div>
                        )}
                        <span className="font-mono text-[9px] text-accent mt-0.5 inline-block">
                          {action.label} →
                        </span>
                      </div>
                    </div>
                  </button>
                  {!lida && (
                    <button
                      type="button"
                      onClick={(e) => markResolvedOnly(e, n.id)}
                      className="shrink-0 px-2.5 flex items-center text-ink-muted hover:text-concluido hover:bg-chrome/50 border-l border-line transition-colors"
                      aria-label="Marcar como lida"
                      title="Marcar como lida"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              )
            })}
          </>
        )}
      </div>
      {(tarefasAtrasadas.length > 0 || prazosUrgentes.length > 0) && (
        <p className="px-3 py-2 border-t border-line font-mono text-[9px] text-ink-muted">
          Alertas de prazo ficam até você concluir a tarefa.
        </p>
      )}
    </div>
  )
}
