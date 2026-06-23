import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { useTaskStore } from '../../store/useTaskStore'
import { PROTEINA_PRESET } from '../../constants/healthPresets'
import {
  ALIMENTOS_PROTEINA,
  REFEICOES_PROTEINA,
  type RefeicaoId,
} from '../../constants/proteinFoods'
import { AXEL_TEXT_PRIMARY, AXEL_TEXT_SECONDARY } from '../../constants/axelSurfaces'

export function ProteinMealLog()
{
  const habitos = useTaskStore((s) => s.habitos)
  const ensureHealthHabit = useTaskStore((s) => s.ensureHealthHabit)
  const updateHabitoConfig = useTaskStore((s) => s.setHabitoProgress)
  const patchHabitoConfig = useTaskStore((s) => s.updateHabitoConfig)

  const [refeicao, setRefeicao] = useState<RefeicaoId>('almoco')
  const [customG, setCustomG] = useState('')

  const proteina = useMemo(() => habitos.find((h) => h.tipo === 'proteina'), [habitos])
  const porRefeicao = (proteina?.config?.proteina_por_refeicao ?? {}) as Record<string, number>
  const current = proteina?.progresso_atual ?? 0

  const ensureProteina = async () =>
  {
    return proteina ?? await ensureHealthHabit(PROTEINA_PRESET)
  }

  const salvarRefeicoes = async (next: Record<string, number>, total: number) =>
  {
    const h = await ensureProteina()
    if (!h) return
    await patchHabitoConfig(h.id, { proteina_por_refeicao: next })
    await updateHabitoConfig(h.id, total)
  }

  const adicionarGramas = async (gramas: number, label: string) =>
  {
    if (gramas <= 0) return
    const h = await ensureProteina()
    if (!h) return
    const nextRefeicao = (porRefeicao[refeicao] ?? 0) + gramas
    const nextMap = { ...porRefeicao, [refeicao]: nextRefeicao }
    const total = Math.min(h.meta_diaria + 200, current + gramas)
    await salvarRefeicoes(nextMap, total)
    toast.success(`+${gramas}g · ${label}`, { duration: 1500 })
  }

  const handleCustom = async () =>
  {
    const g = parseInt(customG, 10)
    if (!g || g <= 0) return
    await adicionarGramas(g, 'porção manual')
    setCustomG('')
  }

  const alimentos = ALIMENTOS_PROTEINA[refeicao]

  return (
    <section className="rounded-sl border border-line bg-card p-4 space-y-4">
      <div>
        <p className={`text-[12px] font-medium ${AXEL_TEXT_PRIMARY}`}>Por refeição</p>
        <p className={`text-[11px] mt-0.5 ${AXEL_TEXT_SECONDARY}`}>
          Toque nos alimentos para somar proteína ao dia.
        </p>
      </div>

      <div className="grid grid-cols-4 gap-1.5">
        {REFEICOES_PROTEINA.map((r) =>
        {
          const ativo = r.id === refeicao
          const sub = porRefeicao[r.id] ?? 0
          return (
            <button
              key={r.id}
              type="button"
              onClick={() => setRefeicao(r.id)}
              className={`flex flex-col items-center gap-0.5 py-2 rounded-sl border text-center transition-colors ${
                ativo
                  ? 'border-amber-500/35 bg-amber-500/10'
                  : 'border-line hover:bg-chrome/60'
              }`}
            >
              <span className="text-lg">{r.emoji}</span>
              <span className="font-mono text-[8px] uppercase text-ink-muted">{r.label}</span>
              {sub > 0 && (
                <span className="font-mono text-[9px] text-amber-300 tabular-nums">{sub}g</span>
              )}
            </button>
          )
        })}
      </div>

      <div className="flex flex-wrap gap-1.5">
        {alimentos.map((a) => (
          <button
            key={a.id}
            type="button"
            onClick={() => void adicionarGramas(a.gramas, a.nome)}
            className="px-2.5 py-1.5 rounded-sl border border-line bg-chrome/40 text-[11px] text-ink hover:border-amber-500/30 hover:bg-amber-500/10 transition-colors text-left"
          >
            <span className="block">{a.nome}</span>
            <span className="font-mono text-[9px] text-ink-muted">+{a.gramas}g</span>
          </button>
        ))}
      </div>

      <div className="flex gap-2 items-center">
        <input
          type="number"
          min={1}
          max={120}
          placeholder="Outros (g)"
          value={customG}
          onChange={(e) => setCustomG(e.target.value)}
          className="flex-1 px-3 py-2 rounded-sl border border-line bg-chrome text-[12px] text-ink outline-none focus:border-amber-500/40"
        />
        <button
          type="button"
          onClick={() => void handleCustom()}
          disabled={!customG}
          className="px-3 py-2 rounded-sl border border-amber-500/30 bg-amber-500/10 text-[11px] font-mono uppercase text-amber-200 disabled:opacity-40"
        >
          Adicionar
        </button>
      </div>
    </section>
  )
}
