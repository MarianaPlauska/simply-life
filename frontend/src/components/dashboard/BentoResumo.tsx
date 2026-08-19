import { useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Droplets, Pill, Dumbbell, Brain, ChevronRight,
} from 'lucide-react'
import { useTaskStore } from '../../store/useTaskStore'
import { AXEL_PROGRESS, AXEL_SECTION_PAD, AXEL_SECTION_TITLE } from '../../constants/axelSurfaces'

// Pilares — superfície AXEL; Foco expande verticalmente com estado vazio elegante

function useSaudeResumo()
{
  const medicamentos = useTaskStore((s) => s.medicamentos)
  const habitos = useTaskStore((s) => s.habitos)
  const fetchHabitos = useTaskStore((s) => s.fetchHabitos)
  const sessoesTreinoHoje = useTaskStore((s) => s.sessoesTreinoHoje)
  const fetchSessoesTreinoHoje = useTaskStore((s) => s.fetchSessoesTreinoHoje)

  useEffect(() =>
  {
    fetchHabitos()
    fetchSessoesTreinoHoje()
  }, [fetchHabitos, fetchSessoesTreinoHoje])

  return useMemo(() =>
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
    const aguaMeta = agua?.meta_diaria ?? 10
    const aguaPct = aguaMeta > 0 ? Math.round((aguaCopos / aguaMeta) * 100) : 0

    return { atrasados, aguaCopos, aguaMeta, aguaPct, treinos: sessoesTreinoHoje?.length || 0 }
  }, [medicamentos, habitos, sessoesTreinoHoje])
}

interface CardProps
{
  embedded?: boolean
}

/** Seção larga — coluna principal, abaixo da Linha de Execução */
export function SaudeResumoCard({ embedded: _embedded }: CardProps = {})
{
  const navigate = useNavigate()
  const saude = useSaudeResumo()

  return (
    <button
      onClick={() => navigate('/saude#hidratacao')}
      className="group w-full text-left hover:opacity-90 transition-opacity"
    >
      <div className="flex items-end justify-between gap-4 mb-5">
        <div>
          <h3 className="text-[18px] font-semibold tracking-tight text-zinc-100">
            Saúde
          </h3>
          <p className="text-[13px] text-zinc-500 mt-1">Hidratação e hábitos de hoje</p>
        </div>
        <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-zinc-400 transition-colors shrink-0" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-6 items-start">
        <div>
          <div className="flex items-end gap-3">
            <Droplets className="w-4 h-4 text-indigo-400/70 shrink-0 mb-2" />
            <div>
              <div className="text-[40px] font-semibold tabular-nums leading-none tracking-tight text-zinc-100">
                {saude.aguaPct}
                <span className="text-[16px] text-zinc-500 font-medium">%</span>
              </div>
              <p className="text-[13px] text-zinc-500 mt-1">
                {saude.aguaCopos} de {saude.aguaMeta} copos
              </p>
            </div>
          </div>
        </div>

        <div className="flex sm:flex-col gap-4">
          <StatLine
            Icon={Pill}
            label="Medicamentos"
            value={saude.atrasados > 0 ? `${saude.atrasados} atrasado${saude.atrasados !== 1 ? 's' : ''}` : 'Em dia'}
            warn={saude.atrasados > 0}
          />
          <StatLine
            Icon={Dumbbell}
            label="Treino"
            value={`${saude.treinos}/5 sessões`}
          />
        </div>
      </div>

      <div className="mt-6">
        <div className="flex items-center justify-between text-[12px] text-zinc-600 mb-2">
          <span>Meta diária</span>
          <span className="font-mono tabular-nums">{saude.aguaPct}%</span>
        </div>
        <div className="h-2 rounded-full bg-zinc-800/80 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-700 ${AXEL_PROGRESS}`}
            style={{ width: `${Math.min(100, saude.aguaPct)}%` }}
          />
        </div>
      </div>
    </button>
  )
}

/** Bloco lateral — altura total do grid com estado vazio quando sem sessões */
export function FocoResumoCard({ embedded: _embedded = false }: CardProps)
{
  const navigate = useNavigate()
  const focusState = useTaskStore((s) => s.focusState)
  const deepWork = focusState?.sessionsCompleted ?? 0
  const aguardando = deepWork === 0

  return (
    <button
      onClick={() => navigate('/superhuman')}
      className={`group w-full text-left transition-opacity hover:opacity-95 ${AXEL_SECTION_PAD} flex flex-col`}
    >
      <div className="flex items-center justify-between mb-4 shrink-0">
        <h3 className={AXEL_SECTION_TITLE}>
          Foco profundo
        </h3>
        <ChevronRight className="w-3.5 h-3.5 text-zinc-600 group-hover:text-zinc-400 transition-colors" />
      </div>

      <div className="flex items-baseline gap-2 shrink-0">
        <Brain className="w-3.5 h-3.5 text-indigo-400/60 shrink-0" />
        <div className="text-[24px] font-semibold tabular-nums tracking-tighter leading-none text-zinc-100">
          {deepWork}
          <span className="text-zinc-600 text-[14px] font-medium">/3</span>
        </div>
      </div>
      <p className="text-[12px] text-zinc-600 mt-1 mb-5 shrink-0">sessões deep work hoje</p>

      <div className="flex gap-1.5 shrink-0 mb-6">
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex-1 h-1.5 rounded-full bg-zinc-800/60 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                i < deepWork ? AXEL_PROGRESS : 'bg-transparent'
              }`}
              style={{ width: i < deepWork ? '100%' : '0%' }}
            />
          </div>
        ))}
      </div>

      <div className="flex-1 flex flex-col items-center justify-center text-center min-h-[120px]">
        {aguardando ? (
          <>
            <Brain className="w-9 h-9 text-indigo-500/20 mb-4" strokeWidth={1.15} />
            <p className="text-[13px] text-zinc-500 tracking-tight leading-relaxed max-w-[180px]">
              Aguardando sessões de trabalho
            </p>
          </>
        ) : (
          <>
            <Brain className="w-7 h-7 text-indigo-400/35 mb-3" strokeWidth={1.5} />
            <p className="text-[12px] text-zinc-600 tracking-tight">
              {3 - deepWork} sessão{3 - deepWork !== 1 ? 'ões' : ''} restante{3 - deepWork !== 1 ? 's' : ''}
            </p>
          </>
        )}
      </div>
    </button>
  )
}

interface StatLineProps
{
  Icon: typeof Pill
  label: string
  value: string
  warn?: boolean
}

function StatLine({ Icon, label, value, warn }: StatLineProps)
{
  return (
    <div>
      <div className="flex items-center gap-1.5 mb-0.5">
        <Icon className={`w-3 h-3 shrink-0 opacity-50 ${warn ? 'text-rose-400' : 'text-zinc-500'}`} />
        <span className="text-[11px] uppercase tracking-wide text-zinc-600">{label}</span>
      </div>
      <div className={`text-[13px] font-medium tracking-tight ${warn ? 'text-rose-300/90' : 'text-zinc-300'}`}>
        {value}
      </div>
    </div>
  )
}
