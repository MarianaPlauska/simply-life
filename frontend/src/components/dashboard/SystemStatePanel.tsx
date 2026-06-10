import { useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Activity, ListChecks, Calendar, Droplets, Dumbbell, ArrowRight,
} from 'lucide-react'
import { useTaskStore } from '../../store/useTaskStore'
import {
  ORION_BORDERLESS_PANEL,
  ORION_BTN_PRIMARY,
  ORION_PROGRESS_THICK,
  ORION_ROW_HOVER,
  ORION_SECTION_TITLE,
  ORION_TEXT_PRIMARY,
  ORION_TEXT_SECONDARY,
} from '../../constants/orionSurfaces'

// Carga operacional + resumo rápido — painel lateral enterprise

type Carga = 'baixa' | 'moderada' | 'alta' | 'critica'

interface SystemState
{
  carga: Carga
  podemEsperar: number
  reunioesHoje: number
  proximaReuniao: string | null
  sugestaoFrase: string
}

const CARGA_CLASS: Record<Carga, string> = {
  baixa: 'text-concluido',
  moderada: 'text-atencao',
  alta: 'text-atencao',
  critica: 'text-urgente',
}

const CARGA_BAR: Record<Carga, string> = {
  baixa: 'bg-concluido',
  moderada: 'bg-atencao',
  alta: 'bg-atencao',
  critica: 'bg-urgente',
}

const CARGA_PCT: Record<Carga, number> = {
  baixa: 0.25,
  moderada: 0.5,
  alta: 0.75,
  critica: 0.95,
}

const CARGA_FRASE: Record<Carga, string> = {
  baixa: 'Carga dentro do esperado. Mantenha o ritmo.',
  moderada: 'Volume moderado — priorize o top 3.',
  alta: 'Tensão elevada. Adie o não-crítico.',
  critica: 'Sobrecarga. Comunique atrasos e foque em bloqueios.',
}

function isToday(d: Date): boolean
{
  const now = new Date()
  return d.getFullYear() === now.getFullYear()
    && d.getMonth() === now.getMonth()
    && d.getDate() === now.getDate()
}

function formatHHMM(d: Date): string
{
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

export function SystemStatePanel()
{
  const navigate = useNavigate()
  const tarefas = useTaskStore((s) => s.tarefas)
  const habitos = useTaskStore((s) => s.habitos)
  const fetchHabitos = useTaskStore((s) => s.fetchHabitos)
  const sessoesTreinoHoje = useTaskStore((s) => s.sessoesTreinoHoje)
  const fetchSessoesTreinoHoje = useTaskStore((s) => s.fetchSessoesTreinoHoje)

  useEffect(() =>
  {
    fetchHabitos()
    fetchSessoesTreinoHoje()
  }, [fetchHabitos, fetchSessoesTreinoHoje])

  const state = useMemo<SystemState>(() =>
  {
    const ativas = tarefas.filter((t) => t.status !== 'concluida')
    const criticas = ativas.filter((t) => (t.score_urgencia ?? 0) >= 100 || t.prioridade === 'critica').length

    let carga: Carga = 'baixa'
    if (criticas >= 5) carga = 'critica'
    else if (criticas >= 3) carga = 'alta'
    else if (criticas >= 1 || ativas.length >= 10) carga = 'moderada'

    const podemEsperar = Math.max(0, ativas.length - criticas - 3)

    const reunioes = ativas.filter((t) =>
    {
      const isReuniao = t.origem === 'teams' || /reuni[aã]o/i.test(t.titulo)
      if (!isReuniao || !t.data_vencimento) return false
      return isToday(new Date(t.data_vencimento))
    })

    const proxima = reunioes
      .map((t) => new Date(t.data_vencimento as string))
      .sort((a, b) => a.getTime() - b.getTime())[0]

    return {
      carga,
      podemEsperar,
      reunioesHoje: reunioes.length,
      proximaReuniao: proxima ? formatHHMM(proxima) : null,
      sugestaoFrase: CARGA_FRASE[carga],
    }
  }, [tarefas])

  const agua = habitos.find((h) => h.tipo === 'agua')
  const aguaPct = agua && agua.meta_diaria > 0 ? Math.round((agua.progresso_atual / agua.meta_diaria) * 100) : 0
  const treinosFeitos = sessoesTreinoHoje?.length || 0
  const pct = Math.round(CARGA_PCT[state.carga] * 100)

  return (
    <aside className={`${ORION_BORDERLESS_PANEL} flex flex-col h-full`}>
      <header className="mb-3">
        <p className={ORION_SECTION_TITLE}>Carga operacional</p>
      </header>

      <div className="flex items-end justify-between gap-3 pb-3 border-b border-line">
        <div>
          <p className={`font-mono text-[10px] uppercase ${ORION_TEXT_SECONDARY}`}>Índice</p>
          <p className={`text-3xl font-display capitalize mt-1 ${CARGA_CLASS[state.carga]}`}>
            {state.carga}
          </p>
        </div>
        <div className="text-right">
          <p className={`font-mono text-[10px] ${ORION_TEXT_SECONDARY}`}>Capacidade</p>
          <p className={`font-mono text-lg tabular-nums ${ORION_TEXT_PRIMARY}`}>{pct}%</p>
        </div>
      </div>

      <div className={`${ORION_PROGRESS_THICK} my-3`}>
        <div
          className={`h-full rounded-sl ${CARGA_BAR[state.carga]}`}
          style={{ width: `${pct}%` }}
        />
      </div>

      <p className={`text-[12px] leading-relaxed mb-4 ${ORION_TEXT_SECONDARY}`}>
        {state.sugestaoFrase}
      </p>

      <h4 className={`${ORION_SECTION_TITLE} mb-2`}>Resumo rápido</h4>
      <ul role="list" className="space-y-0 divide-y divide-line border border-line rounded-sl overflow-hidden mb-4">
        <ResumoItem
          Icon={ListChecks}
          primary={`${state.podemEsperar} podem aguardar`}
          secondary="adiável para amanhã"
        />
        <ResumoItem
          Icon={Calendar}
          primary={`${state.reunioesHoje} reunião${state.reunioesHoje !== 1 ? 'ões' : ''}`}
          secondary={state.proximaReuniao ? `Próxima ${state.proximaReuniao}` : 'Sem agenda hoje'}
        />
        <ResumoItem
          Icon={Droplets}
          primary="Hidratação"
          secondary={agua ? `${agua.progresso_atual} copos · ${aguaPct}%` : 'Não rastreado'}
        />
        <ResumoItem
          Icon={Dumbbell}
          primary="Treino"
          secondary={`${treinosFeitos} sessão${treinosFeitos !== 1 ? 'ões' : ''} hoje`}
        />
      </ul>

      <button
        type="button"
        onClick={() => navigate('/saude')}
        className={`w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 text-[12px] font-mono uppercase tracking-wide ${ORION_BTN_PRIMARY}`}
      >
        Saúde completa
        <ArrowRight className="w-3.5 h-3.5" />
      </button>
    </aside>
  )
}

interface ResumoItemProps
{
  Icon: typeof Activity
  primary: string
  secondary?: string
}

function ResumoItem({ Icon, primary, secondary }: ResumoItemProps)
{
  return (
    <li className={`flex items-start gap-2.5 px-3 py-2.5 ${ORION_ROW_HOVER}`}>
      <Icon className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${ORION_TEXT_SECONDARY}`} strokeWidth={1.75} />
      <div className="min-w-0">
        <div className={`text-[12px] font-medium ${ORION_TEXT_PRIMARY}`}>{primary}</div>
        {secondary && (
          <div className={`font-mono text-[10px] mt-0.5 ${ORION_TEXT_SECONDARY}`}>{secondary}</div>
        )}
      </div>
    </li>
  )
}
