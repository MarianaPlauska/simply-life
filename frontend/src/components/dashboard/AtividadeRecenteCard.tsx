import { useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, Check, Pill, Wallet } from 'lucide-react'
import { useTaskStore } from '../../store/useTaskStore'
import {
  ORION_BORDERLESS_PANEL,
  ORION_LINE,
  ORION_LINK,
  ORION_ROW_HOVER,
  ORION_SECTION_TITLE,
  ORION_TEXT_PRIMARY,
  ORION_TEXT_SECONDARY,
} from '../../constants/orionSurfaces'

interface Atividade
{
  id: string
  Icon: typeof Check
  iconClass: string
  primary: string
  secondary: string
  xpGain: string
  when: string
}

function timeAgo(iso: string | null | undefined): string
{
  if (!iso) return ''
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'agora'
  if (m < 60) return `${m}m`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h`
  return `${Math.floor(h / 24)}d`
}

export function AtividadeRecenteCard()
{
  const navigate = useNavigate()
  const tarefas = useTaskStore((s) => s.tarefas)
  const medicamentos = useTaskStore((s) => s.medicamentos)
  const transactions = useTaskStore((s) => s.transactions)
  const fetchTransactions = useTaskStore((s) => s.fetchTransactions)

  useEffect(() =>
  {
    fetchTransactions()
  }, [fetchTransactions])

  const items = useMemo<Atividade[]>(() =>
  {
    const list: Atividade[] = []

    tarefas
      .filter((t) => t.status === 'concluida' && t.created_at)
      .slice(0, 3)
      .forEach((t) =>
      {
        list.push({
          id: `t-${t.id}`,
          Icon: Check,
          iconClass: 'text-concluido',
          primary: 'Tarefa concluída',
          secondary: t.titulo,
          xpGain: '+15 foco',
          when: timeAgo(t.created_at),
        })
      })

    ;(medicamentos || [])
      .filter((m) => m.tomado)
      .slice(0, 2)
      .forEach((m) =>
      {
        list.push({
          id: `m-${m.id}`,
          Icon: Pill,
          iconClass: 'text-accent',
          primary: 'Medicamento',
          secondary: `${m.nome} · ${m.horario}`,
          xpGain: '+20 vit.',
          when: 'hoje',
        })
      })

    ;(transactions || [])
      .slice(0, 2)
      .forEach((t) =>
      {
        list.push({
          id: `f-${t.id}`,
          Icon: Wallet,
          iconClass: 'text-atencao',
          primary: 'Transação',
          secondary: t.descricao || t.categoria || 'Sem descrição',
          xpGain: '+10 est.',
          when: timeAgo(t.data),
        })
      })

    return list.slice(0, 5)
  }, [tarefas, medicamentos, transactions])

  return (
    <section className={`${ORION_BORDERLESS_PANEL} flex flex-col h-full p-0 overflow-hidden`}>
      <header className="px-4 pt-4 pb-3 border-b border-line">
        <p className={ORION_SECTION_TITLE}>Auditoria</p>
        <p className={`font-mono text-[10px] mt-1 ${ORION_TEXT_SECONDARY}`}>Atividade recente</p>
      </header>

      <ul role="list" className="flex-1 divide-y divide-line min-h-[140px]">
        {items.length === 0 && (
          <li className={`px-4 py-8 text-center font-mono text-[11px] ${ORION_TEXT_SECONDARY}`}>
            Nenhum evento registrado hoje
          </li>
        )}
        {items.map((a) => (
          <li key={a.id} className={`px-4 py-2.5 flex items-center gap-2.5 ${ORION_ROW_HOVER}`}>
            <a.Icon className={`w-3.5 h-3.5 shrink-0 ${a.iconClass}`} strokeWidth={1.75} />
            <div className="flex-1 min-w-0">
              <div className={`text-[12px] font-medium truncate ${ORION_TEXT_PRIMARY}`}>{a.primary}</div>
              <div className={`font-mono text-[10px] truncate ${ORION_TEXT_SECONDARY}`}>{a.secondary}</div>
            </div>
            <span className={`font-mono text-[9px] text-accent shrink-0`}>{a.xpGain}</span>
            <span className={`font-mono text-[9px] w-6 text-right shrink-0 ${ORION_TEXT_SECONDARY}`}>{a.when}</span>
          </li>
        ))}
      </ul>

      <div className={`px-4 py-2.5 ${ORION_LINE} border-t flex justify-center`}>
        <button
          type="button"
          onClick={() => navigate('/relatorios')}
          className={`inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-wide ${ORION_LINK}`}
        >
          Relatório completo
          <ArrowRight className="w-3 h-3" />
        </button>
      </div>
    </section>
  )
}
