import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Pill, Droplets, Dumbbell, HeartPulse, Brain, ChevronRight, ChevronDown,
  TrendingUp, TrendingDown, PiggyBank, Wallet,
} from 'lucide-react'
import { useTaskStore } from '../../store/useTaskStore'
import { mediaHumor } from '../../lib/moodInsights'
import { moodLabel } from '../../lib/moodConstants'

// PilaresDeVida — lista continua densa estilo Notion/Linear
// Sem caixas vazias: hierarquia por tipografia e indentacao, divisores quase invisiveis
// Cada linha eh clicavel e leva para o modulo dedicado

const fmtBRL = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })

export function PilaresDeVida()
{
  const [saudeOpen, setSaudeOpen] = useState(true)
  const [financasOpen, setFinancasOpen] = useState(true)
  const [produtividadeOpen, setProdutividadeOpen] = useState(false)

  return (
    <div className="space-y-1">
      <SecaoPilar
        label="Saúde"
        accent="text-emerald-300"
        open={saudeOpen}
        onToggle={() => setSaudeOpen((v) => !v)}
      >
        <LinhasSaude />
      </SecaoPilar>

      <SecaoPilar
        label="Finanças"
        accent="text-amber-300"
        open={financasOpen}
        onToggle={() => setFinancasOpen((v) => !v)}
      >
        <LinhasFinancas />
      </SecaoPilar>

      <SecaoPilar
        label="Produtividade"
        accent="text-violet-300"
        open={produtividadeOpen}
        onToggle={() => setProdutividadeOpen((v) => !v)}
      >
        <LinhasProdutividade />
      </SecaoPilar>
    </div>
  )
}

// ─── secao colapsavel ─────────────────────────────────────

interface SecaoPilarProps
{
  label: string
  accent: string
  open: boolean
  onToggle: () => void
  children: React.ReactNode
}

function SecaoPilar({ label, accent, open, onToggle, children }: SecaoPilarProps)
{
  return (
    <section>
      <button
        onClick={onToggle}
        className="group w-full flex items-center gap-2 py-2.5 text-left"
      >
        <ChevronDown
          className={`w-3.5 h-3.5 text-zinc-500 group-hover:text-zinc-300 transition-transform ${open ? '' : '-rotate-90'}`}
        />
        <h3 className={`text-[13px] font-semibold tracking-tight ${accent}`}>
          {label}
        </h3>
      </button>

      {open && (
        <div className="pl-5">
          {children}
        </div>
      )}
    </section>
  )
}

// ─── conteudo: SAUDE ──────────────────────────────────────

function LinhasSaude()
{
  const navigate = useNavigate()
  const medicamentos = useTaskStore((s) => s.medicamentos)
  const habitos = useTaskStore((s) => s.habitos)
  const humorHojeLista = useTaskStore((s) => s.humorHojeLista)
  const fetchHabitos = useTaskStore((s) => s.fetchHabitos)
  const fetchHumorHoje = useTaskStore((s) => s.fetchHumorHoje)
  const sessoesTreinoHoje = useTaskStore((s) => s.sessoesTreinoHoje)
  const fetchSessoesTreinoHoje = useTaskStore((s) => s.fetchSessoesTreinoHoje)

  useEffect(() =>
  {
    fetchHabitos()
    fetchSessoesTreinoHoje()
    fetchHumorHoje()
  }, [fetchHabitos, fetchSessoesTreinoHoje, fetchHumorHoje])

  const stats = useMemo(() =>
  {
    const now = new Date()
    const nowMin = now.getHours() * 60 + now.getMinutes()
    const atrasados = (medicamentos || []).filter((m) =>
    {
      if (m.tomado || !m.horario) return false
      const [h, mm] = m.horario.split(':').map(Number)
      if (Number.isNaN(h) || Number.isNaN(mm)) return false
      return (h * 60 + mm) < nowMin
    }).length

    const agua = habitos.find((h) => h.tipo === 'agua')
    const aguaCopos = agua?.progresso_atual ?? 0
    const aguaMeta = agua?.meta_diaria ?? 8
    const aguaPct = aguaMeta > 0 ? Math.round((aguaCopos / aguaMeta) * 100) : 0

    return { atrasados, aguaCopos, aguaMeta, aguaPct, treinos: sessoesTreinoHoje?.length || 0 }
  }, [medicamentos, habitos, sessoesTreinoHoje])

  return (
    <>
      <Linha
        Icon={Pill}
        iconColor="text-rose-400"
        label="Medicamentos"
        value={stats.atrasados > 0 ? `${stats.atrasados} atrasado${stats.atrasados !== 1 ? 's' : ''}` : 'Em dia'}
        valueColor={stats.atrasados > 0 ? 'text-rose-400' : 'text-emerald-400'}
        onClick={() => navigate('/saude#medicamentos')}
      />
      <Linha
        Icon={Droplets}
        iconColor="text-sky-400"
        label="Hidratação"
        value={`${stats.aguaPct}%`}
        sub={`${stats.aguaCopos} de ${stats.aguaMeta} copos`}
        progress={stats.aguaPct}
        progressColor="bg-sky-500"
        onClick={() => navigate('/saude#hidratacao')}
      />
      <Linha
        Icon={Dumbbell}
        iconColor="text-amber-400"
        label="Treino"
        value={`${stats.treinos}/5`}
        sub="sessões esta semana"
        progress={Math.min(100, (stats.treinos / 5) * 100)}
        progressColor="bg-amber-500"
        onClick={() => navigate('/saude#academia')}
      />
      <Linha
        Icon={HeartPulse}
        iconColor="text-pink-400"
        label="Bem-estar"
        value={
          humorHojeLista.length > 0
            ? `${mediaHumor(humorHojeLista)}/5`
            : 'Pendente'
        }
        sub={
          humorHojeLista.length > 0
            ? `${humorHojeLista.length} momento${humorHojeLista.length !== 1 ? 's' : ''} hoje · ${moodLabel(humorHojeLista[humorHojeLista.length - 1].humor)}`
            : 'Registre seu humor — recomendado hoje'
        }
        valueColor={humorHojeLista.length === 0 ? 'text-accent' : undefined}
        onClick={() => navigate('/saude#diario')}
      />
    </>
  )
}

// ─── conteudo: FINANCAS ──────────────────────────────────

function LinhasFinancas()
{
  const navigate = useNavigate()
  const transactions = useTaskStore((s) => s.transactions)
  const fetchTransactions = useTaskStore((s) => s.fetchTransactions)

  useEffect(() =>
  {
    fetchTransactions()
  }, [fetchTransactions])

  const stats = useMemo(() =>
  {
    const now = new Date()
    const m = now.getMonth()
    const y = now.getFullYear()
    let receita = 0
    let despesa = 0
    let investimento = 0

    for (const t of transactions || [])
    {
      if (!t.data) continue
      const d = new Date(t.data + 'T12:00:00')
      if (d.getMonth() !== m || d.getFullYear() !== y) continue
      if (t.tipo === 'receita') receita += t.valor
      else if (t.tipo === 'despesa')
      {
        const cat = (t.categoria || '').toLowerCase()
        if (/investiment|aporte|reserva|cdb|tesouro/i.test(cat)) investimento += t.valor
        else despesa += t.valor
      }
    }

    return { receita, despesa, investimento, saldo: receita - despesa - investimento }
  }, [transactions])

  return (
    <>
      <Linha
        Icon={Wallet}
        iconColor={stats.saldo >= 0 ? 'text-emerald-400' : 'text-rose-400'}
        label="Saldo previsto"
        value={fmtBRL(stats.saldo)}
        valueColor={stats.saldo >= 0 ? 'text-emerald-400' : 'text-rose-400'}
        bold
        onClick={() => navigate('/financeiro')}
      />
      <Linha
        Icon={TrendingUp}
        iconColor="text-emerald-400"
        label="Entradas"
        value={fmtBRL(stats.receita)}
        valueColor="text-zinc-100"
        onClick={() => navigate('/financeiro')}
      />
      <Linha
        Icon={TrendingDown}
        iconColor="text-rose-400"
        label="Saídas"
        value={fmtBRL(stats.despesa)}
        valueColor="text-zinc-100"
        onClick={() => navigate('/financeiro')}
      />
      <Linha
        Icon={PiggyBank}
        iconColor="text-violet-400"
        label="Investimentos"
        value={fmtBRL(stats.investimento)}
        valueColor="text-zinc-100"
        onClick={() => navigate('/financeiro')}
      />
    </>
  )
}

// ─── conteudo: PRODUTIVIDADE ─────────────────────────────

function LinhasProdutividade()
{
  const navigate = useNavigate()
  const focusState = useTaskStore((s) => s.focusState)
  const sessions = focusState?.sessionsCompleted ?? 0

  return (
    <>
      <Linha
        Icon={Brain}
        iconColor="text-violet-400"
        label="Deep work"
        value={`${sessions}/3`}
        sub="sessões pomodoro hoje"
        progress={Math.min(100, (sessions / 3) * 100)}
        progressColor="bg-violet-500"
        onClick={() => navigate('/superhuman')}
      />
    </>
  )
}

// ─── linha generica ──────────────────────────────────────

interface LinhaProps
{
  Icon: typeof Wallet
  iconColor: string
  label: string
  value: string
  valueColor?: string
  sub?: string
  progress?: number
  progressColor?: string
  bold?: boolean
  onClick?: () => void
}

function Linha({
  Icon, iconColor, label, value, valueColor = 'text-zinc-100', sub, progress, progressColor, bold, onClick,
}: LinhaProps)
{
  return (
    <button
      onClick={onClick}
      className="group w-full grid grid-cols-[20px_1fr_auto_14px] items-center gap-3 py-2 text-left rounded-md hover:bg-zinc-900/50 transition-colors px-2 -mx-2"
    >
      <Icon className={`w-3.5 h-3.5 shrink-0 ${iconColor}`} />

      <div className="min-w-0">
        <div className="text-[13px] font-medium text-zinc-100 truncate">
          {label}
        </div>
        {sub && (
          <div className="text-[12px] text-zinc-400 truncate mt-0.5">{sub}</div>
        )}
      </div>

      <div className="flex items-center gap-3">
        {typeof progress === 'number' && (
          <div className="w-20 h-1 rounded-full bg-zinc-800/80 overflow-hidden">
            <div
              className={`h-full ${progressColor || 'bg-zinc-500'} transition-all duration-500`}
              style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
            />
          </div>
        )}
        <span className={`${bold ? 'text-[14px] font-semibold' : 'text-[13px] font-medium'} font-mono tabular-nums ${valueColor}`}>
          {value}
        </span>
      </div>

      <ChevronRight className="w-3.5 h-3.5 text-zinc-600 group-hover:text-zinc-300 group-hover:translate-x-0.5 transition-all" />
    </button>
  )
}
