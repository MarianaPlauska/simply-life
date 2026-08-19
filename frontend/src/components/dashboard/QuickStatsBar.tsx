import { useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Pill, Droplets, Moon, Wallet, PieChart } from 'lucide-react'
import { useTaskStore } from '../../store/useTaskStore'
import {
  AXEL_ROW_HOVER,
  AXEL_TEXT_PRIMARY,
  AXEL_TEXT_SECONDARY,
} from '../../constants/axelSurfaces'

// Indicadores operacionais — faixa densa abaixo da execução

interface MiniCardProps
{
  title: string
  Icon: typeof Pill
  iconClass: string
  primary: string
  secondary?: string
  valueClass?: string
  onClick?: () => void
  children?: React.ReactNode
}

function MiniCard({
  title, Icon, iconClass, primary, secondary, valueClass, onClick, children,
}: MiniCardProps)
{
  return (
    <button
      type="button"
      onClick={onClick}
      className={`text-left border border-line rounded-sl bg-card p-3 min-h-[88px] flex flex-col ${AXEL_ROW_HOVER}`}
    >
      <div className="flex items-center gap-1.5 mb-2">
        <Icon className={`w-3.5 h-3.5 ${iconClass}`} strokeWidth={1.75} />
        <span className={`font-mono text-[10px] uppercase tracking-[0.12em] ${AXEL_TEXT_SECONDARY}`}>
          {title}
        </span>
      </div>
      <div className={`text-[15px] font-display tabular-nums leading-tight ${valueClass ?? AXEL_TEXT_PRIMARY}`}>
        {primary}
      </div>
      {secondary && (
        <div className={`font-mono text-[11px] mt-1 ${AXEL_TEXT_SECONDARY}`}>{secondary}</div>
      )}
      {children}
    </button>
  )
}

function formatHHMM(hours: number): string
{
  const h = Math.floor(hours)
  const m = Math.round((hours - h) * 60)
  return `${h}h${String(m).padStart(2, '0')}m`
}

function atrasoFmt(horario: string): string
{
  const [h, m] = horario.split(':').map(Number)
  const ref = new Date()
  ref.setHours(h || 0, m || 0, 0, 0)
  const diff = Date.now() - ref.getTime()
  if (diff <= 0) return `às ${horario}`
  const absMin = Math.round(diff / 60000)
  const hh = Math.floor(absMin / 60)
  const mm = absMin % 60
  if (hh === 0) return `Atrasado ${mm}min`
  return `Atrasado ${hh}h${String(mm).padStart(2, '0')}`
}

export function QuickStatsBar()
{
  const navigate = useNavigate()
  const medicamentos = useTaskStore((s) => s.medicamentos)
  const habitos = useTaskStore((s) => s.habitos)
  const fetchMedicamentos = useTaskStore((s) => s.fetchMedicamentos)
  const fetchHabitos = useTaskStore((s) => s.fetchHabitos)
  const resumo = useTaskStore((s) => s.dashboardResumo)
  const fetchDashboard = useTaskStore((s) => s.fetchDashboard)

  useEffect(() =>
  {
    fetchMedicamentos()
    fetchHabitos()
    if (!resumo) fetchDashboard()
  }, [fetchMedicamentos, fetchHabitos, fetchDashboard, resumo])

  const proxMed = useMemo(() =>
    medicamentos.find((m) => !m.tomado) || medicamentos[0],
  [medicamentos])

  const agua = useMemo(() => habitos.find((h) => h.tipo === 'agua'), [habitos])
  const sono = useMemo(() => habitos.find((h) => h.tipo === 'sono'), [habitos])
  const aguaPct = agua && agua.meta_diaria > 0 ? Math.round((agua.progresso_atual / agua.meta_diaria) * 100) : 0
  const sonoMeta = sono?.meta_diaria || 7.5
  const sonoAtual = sono?.progresso_atual || 0
  const saidasMes = Math.abs(resumo?.despesas_mes ?? 0)

  return (
    <section
      aria-label="Indicadores operacionais"
      className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-2"
    >
      <MiniCard
        title="Medicamento"
        Icon={Pill}
        iconClass="text-urgente"
        primary={proxMed?.nome || '—'}
        secondary={proxMed ? atrasoFmt(proxMed.horario) : 'Cadastre em Saúde'}
        valueClass={proxMed && !proxMed.tomado ? 'text-urgente' : undefined}
        onClick={() => navigate('/saude#medicamentos')}
      />
      <MiniCard
        title="Hidratação"
        Icon={Droplets}
        iconClass="text-sky-400"
        primary={`${agua?.progresso_atual ?? 0}/${agua?.meta_diaria ?? 8} copos`}
        secondary={aguaPct >= 100 ? 'Meta do dia ✓' : `${aguaPct}% · card com ondas no topo`}
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      />
      <MiniCard
        title="Sono"
        Icon={Moon}
        iconClass="text-ink-muted"
        primary={formatHHMM(sonoAtual)}
        secondary={`Meta ${formatHHMM(sonoMeta)}`}
        onClick={() => navigate('/saude')}
      />
      <MiniCard
        title="Saldo"
        Icon={Wallet}
        iconClass="text-concluido"
        primary={`R$ ${(resumo?.saldo_mes ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 0 })}`}
        secondary="Posição mensal"
        valueClass="text-concluido"
        onClick={() => navigate('/financeiro')}
      />
      <MiniCard
        title="50-30-20"
        Icon={PieChart}
        iconClass="text-atencao"
        primary={saidasMes > 0 ? `R$ ${saidasMes.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}` : '—'}
        secondary="Saídas do mês"
        onClick={() => navigate('/financeiro')}
      >
        <div className="flex h-1 mt-2 rounded-sl overflow-hidden border border-line">
          <div className="bg-accent" style={{ width: '50%' }} />
          <div className="bg-atencao" style={{ width: '30%' }} />
          <div className="bg-concluido" style={{ width: '20%' }} />
        </div>
      </MiniCard>
    </section>
  )
}
