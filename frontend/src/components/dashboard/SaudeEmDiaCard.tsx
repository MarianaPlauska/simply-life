import { useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Pill, Droplets, Beef, Dumbbell, ArrowRight } from 'lucide-react'
import { useTaskStore } from '../../store/useTaskStore'

// SAUDE EM DIA — 4 metricas-chave (medicamentos atrasados, agua, proteina, treino)
// Visual estilo "tabela" leve com icone redondo + label + valor a direita

export function SaudeEmDiaCard()
{
  const navigate = useNavigate()
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

  const stats = useMemo(() =>
  {
    // medicamento "atrasado" = nao tomado + horario HH:MM ja passou hoje
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
    const proteina = habitos.find((h) => h.tipo === 'proteina')

    return {
      atrasados,
      aguaCopos: agua?.progresso_atual ?? 0,
      aguaPct: agua && agua.meta_diaria > 0 ? Math.round((agua.progresso_atual / agua.meta_diaria) * 100) : 0,
      proteinaG: proteina?.progresso_atual ?? 0,
      proteinaMeta: proteina?.meta_diaria ?? 0,
      treinos: sessoesTreinoHoje?.length || 0,
    }
  }, [medicamentos, habitos, sessoesTreinoHoje])

  return (
    <section className="bg-card border border-zinc-800 rounded-xl overflow-hidden flex flex-col">
      <header className="px-3 py-2 border-b border-zinc-900 flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_6px_currentColor]" />
        <h3 className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-200">
          Saúde em Dia
        </h3>
      </header>

      <ul role="list" className="flex-1 divide-y divide-zinc-900/60">
        <SaudeLine
          icon={Pill}
          label="Medicamentos"
          value={stats.atrasados > 0 ? `${stats.atrasados} atrasado${stats.atrasados !== 1 ? 's' : ''}` : 'Em dia'}
          valueColor={stats.atrasados > 0 ? 'text-rose-400' : 'text-emerald-400'}
        />
        <SaudeLine
          icon={Droplets}
          label="Água"
          value={`${stats.aguaCopos} copos · ${stats.aguaPct}%`}
          valueColor="text-sky-300"
        />
        <SaudeLine
          icon={Beef}
          label="Proteína"
          value={stats.proteinaMeta > 0 ? `${stats.proteinaG}g de ${stats.proteinaMeta}g` : '-'}
          valueColor="text-amber-300"
        />
        <SaudeLine
          icon={Dumbbell}
          label="Treino"
          value={`${stats.treinos}/5 sessões`}
          valueColor="text-violet-300"
        />
      </ul>

      <div className="px-3 py-2 border-t border-zinc-900 flex justify-center">
        <button
          onClick={() => navigate('/saude')}
          className="inline-flex items-center gap-1 text-[11px] text-violet-300 hover:text-violet-200 transition-colors"
        >
          Ver saúde completa <ArrowRight className="w-3 h-3" />
        </button>
      </div>
    </section>
  )
}

interface SaudeLineProps
{
  icon: typeof Pill
  label: string
  value: string
  valueColor: string
}

function SaudeLine({ icon: Icon, label, value, valueColor }: SaudeLineProps)
{
  return (
    <li className="px-3 py-2 flex items-center gap-3">
      <Icon className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
      <span className="flex-1 text-[12.5px] text-zinc-300">{label}</span>
      <span className={`text-[12px] font-medium tabular-nums ${valueColor}`}>{value}</span>
    </li>
  )
}
