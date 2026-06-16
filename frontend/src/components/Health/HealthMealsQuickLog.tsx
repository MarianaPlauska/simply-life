import { useTaskStore } from '../../store/useTaskStore'
import { upsertHabitHistorico } from '../../lib/habitHistorico'
import { AXEL_FILTER_PILL_IDLE, AXEL_TEXT_PRIMARY } from '../../constants/axelSurfaces'

const REFEICOES = [
  { id: 'cafe', label: 'Café', emoji: '☕' },
  { id: 'almoco', label: 'Almoço', emoji: '🍽️' },
  { id: 'jantar', label: 'Jantar', emoji: '🌙' },
] as const

// MVP refeições — registro rápido na aba Alimentação

export function HealthMealsQuickLog()
{
  const habitos = useTaskStore((s) => s.habitos)
  const ensureHealthHabit = useTaskStore((s) => s.ensureHealthHabit)
  const incrementHabito = useTaskStore((s) => s.incrementHabito)

  const handleLog = async (tipo: string, label: string) =>
  {
    let hab = habitos.find((h) => h.tipo === `refeicao_${tipo}`)
    if (!hab)
    {
      const created = await ensureHealthHabit({
        tipo: `refeicao_${tipo}`,
        nome_exibicao: label,
        meta_diaria: 1,
        unidade: 'refeição',
      })
      hab = created ?? undefined
    }
    if (hab)
    {
      await incrementHabito(hab.id)
      await upsertHabitHistorico(hab.id, true)
    }
  }

  return (
    <section className="rounded-sl border border-line bg-card p-4 space-y-3">
      <p className={`text-[12px] font-medium ${AXEL_TEXT_PRIMARY}`}>Refeições de hoje</p>
      <div className="grid grid-cols-3 gap-2">
        {REFEICOES.map((r) => (
          <button
            key={r.id}
            type="button"
            onClick={() => void handleLog(r.id, r.label)}
            className={`flex flex-col items-center gap-1 py-3 rounded-sl ${AXEL_FILTER_PILL_IDLE} hover:bg-chrome`}
          >
            <span className="text-xl">{r.emoji}</span>
            <span className="font-mono text-[9px] uppercase">{r.label}</span>
          </button>
        ))}
      </div>
    </section>
  )
}
