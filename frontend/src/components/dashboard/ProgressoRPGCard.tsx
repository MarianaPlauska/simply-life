import { useNavigate } from 'react-router-dom'
import { ArrowRight, Brain, Activity, Anchor } from 'lucide-react'
import { useTaskStore } from '../../store/useTaskStore'
import { XP_PER_LEVEL } from '../../lib/gamificationProfile'

// PROGRESSO RPG — 3 atributos com barras XP (Foco / Vitalidade / Estabilidade)
// Layout: icone + nome + nivel + barra + xp/proximo

interface Atributo
{
  key: 'foco' | 'vitalidade' | 'estabilidade'
  label: string
  Icon: typeof Brain
  color: string
}

const ATRIBUTOS: Atributo[] = [
  { key: 'foco',         label: 'Foco',         Icon: Brain,    color: '#8b5cf6' },
  { key: 'vitalidade',   label: 'Vitalidade',   Icon: Activity, color: '#10b981' },
  { key: 'estabilidade', label: 'Estabilidade', Icon: Anchor,   color: '#f59e0b' },
]

export function ProgressoRPGCard()
{
  const navigate = useNavigate()
  const userStats = useTaskStore((s) => s.userStats)

  // Cada 100 XP = 1 nivel; barra mostra progresso no nivel atual
  function unpack(totalXp: number): { level: number; xp: number; xpNext: number }
  {
    const level = Math.floor(totalXp / XP_PER_LEVEL) + 1
    const xp = totalXp % XP_PER_LEVEL
    return { level, xp, xpNext: XP_PER_LEVEL }
  }

  const values: Record<string, { level: number; xp: number; xpNext: number }> = {
    foco:         unpack(userStats?.xp_foco ?? 0),
    vitalidade:   unpack(userStats?.xp_vitalidade ?? 0),
    estabilidade: unpack(userStats?.xp_estabilidade ?? 0),
  }

  return (
    <section className="bg-card border border-zinc-800 rounded-xl overflow-hidden flex flex-col">
      <header className="px-3 py-2 border-b border-zinc-900 flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-violet-500 shadow-[0_0_6px_currentColor]" />
        <h3 className="text-[11px] font-bold uppercase tracking-[0.18em] text-zinc-200">
          Progresso RPG
        </h3>
      </header>

      <ul role="list" className="flex-1 px-3 py-3 space-y-3">
        {ATRIBUTOS.map((a) =>
        {
          const v = values[a.key]
          const pct = Math.min(100, Math.round((v.xp / Math.max(1, v.xpNext)) * 100))
          return (
            <li key={a.key} className="space-y-1">
              <div className="flex items-center gap-2">
                <a.Icon className="w-3.5 h-3.5 shrink-0" style={{ color: a.color }} />
                <span className="text-[12.5px] font-medium text-zinc-200 flex-1">{a.label}</span>
                <span className="text-[11px] text-zinc-500">Nível {v.level}</span>
                <span className="text-[11px] font-mono tabular-nums text-zinc-500 w-16 text-right">
                  {v.xp}/{v.xpNext} XP
                </span>
              </div>
              <div className="h-1.5 rounded-full bg-zinc-900 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${pct}%`,
                    background: `linear-gradient(to right, ${a.color}, ${a.color}cc)`,
                    boxShadow: `0 0 6px ${a.color}66`,
                  }}
                />
              </div>
            </li>
          )
        })}
      </ul>

      <div className="px-3 py-2 border-t border-zinc-900 flex justify-center">
        <button
          onClick={() => navigate('/perfil')}
          className="inline-flex items-center gap-1 text-[12px] text-violet-300 hover:text-violet-200 transition-colors"
        >
          Ver conquistas <ArrowRight className="w-3 h-3" />
        </button>
      </div>
    </section>
  )
}
