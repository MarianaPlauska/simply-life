import { useMemo, useState } from 'react'
import { Loader2, PenLine } from 'lucide-react'
import { toast } from 'sonner'
import { useTaskStore } from '../../store/useTaskStore'
import { PROTEINA_PRESET } from '../../constants/healthPresets'
import {
  REFEICOES_PROTEINA,
  type ProteinFood,
  type RefeicaoId,
} from '../../constants/proteinFoods'
import { fetchProteinEstimate } from '../../lib/estimateProteinApi'
import { kcalFromProteinGrams } from '../../lib/healthNutrition'
import { AXEL_TEXT_PRIMARY, AXEL_TEXT_SECONDARY } from '../../constants/axelSurfaces'
import { ProteinFoodQuickAdd } from './ProteinFoodQuickAdd'

export function ProteinMealLog()
{
  const habitos = useTaskStore((s) => s.habitos)
  const ensureHealthHabit = useTaskStore((s) => s.ensureHealthHabit)
  const setHabitoProgress = useTaskStore((s) => s.setHabitoProgress)
  const patchHabitoConfig = useTaskStore((s) => s.updateHabitoConfig)

  const [refeicao, setRefeicao] = useState<RefeicaoId>('almoco')
  const [journalText, setJournalText] = useState('')
  const [savingJournal, setSavingJournal] = useState(false)

  const proteina = useMemo(() => habitos.find((h) => h.tipo === 'proteina'), [habitos])
  const porRefeicao = (proteina?.config?.proteina_por_refeicao ?? {}) as Record<string, number>
  const textoLog = proteina?.config?.refeicoes_texto_log ?? []
  const customByMeal = (proteina?.config?.alimentos_custom ?? {}) as Partial<Record<RefeicaoId, ProteinFood[]>>
  const current = proteina?.progresso_atual ?? 0

  const customFoods = Array.isArray(customByMeal[refeicao]) ? customByMeal[refeicao]! : []

  const ensureProteina = async () =>
  {
    return proteina ?? await ensureHealthHabit(PROTEINA_PRESET)
  }

  const salvarRefeicoes = async (
    nextMap: Record<string, number>,
    total: number,
    opts?: { logPatch?: typeof textoLog; kcalAdd?: number; kcalRemove?: number },
  ) =>
  {
    const h = await ensureProteina()
    if (!h) return
    const kcalBase = typeof h.config?.kcal_hoje === 'number' ? h.config.kcal_hoje : 0
    const kcalDelta = (opts?.kcalAdd ?? 0) - (opts?.kcalRemove ?? 0)
    const patch: Record<string, unknown> = {
      proteina_por_refeicao: nextMap,
      kcal_hoje: Math.max(0, kcalBase + kcalDelta),
    }
    if (opts?.logPatch)
    {
      patch.refeicoes_texto_log = opts.logPatch
    }
    await patchHabitoConfig(h.id, patch)
    await setHabitoProgress(h.id, total)
  }

  const adicionarGramas = async (gramas: number, _label: string, kcal?: number) =>
  {
    if (gramas <= 0) return
    const h = await ensureProteina()
    if (!h) return
    const nextRefeicao = (porRefeicao[refeicao] ?? 0) + gramas
    const nextMap = { ...porRefeicao, [refeicao]: nextRefeicao }
    const total = Math.min(h.meta_diaria + 200, current + gramas)
    const kcalAdd = kcal ?? kcalFromProteinGrams(gramas)
    await salvarRefeicoes(nextMap, total, { kcalAdd })
  }

  const removerGramas = async (gramas: number, kcal?: number) =>
  {
    if (gramas <= 0 || current <= 0) return
    const h = await ensureProteina()
    if (!h) return
    const remove = Math.min(gramas, current)
    const refeicaoAtual = porRefeicao[refeicao] ?? 0
    const nextRefeicao = Math.max(0, refeicaoAtual - remove)
    const nextMap = { ...porRefeicao, [refeicao]: nextRefeicao }
    const total = Math.max(0, current - remove)
    const kcalRemove = kcal ?? kcalFromProteinGrams(remove)
    await salvarRefeicoes(nextMap, total, { kcalRemove })
  }

  const salvarCustomFoods = async (foods: ProteinFood[]) =>
  {
    const h = await ensureProteina()
    if (!h) return
    await patchHabitoConfig(h.id, {
      alimentos_custom: { ...customByMeal, [refeicao]: foods },
    })
  }

  const handleJournal = async () =>
  {
    const texto = journalText.trim()
    if (!texto)
    {
      return
    }

    setSavingJournal(true)
    try
    {
      const parsed = await fetchProteinEstimate(texto, refeicao)
      const h = await ensureProteina()
      if (!h) return

      const nextRefeicao = (porRefeicao[refeicao] ?? 0) + parsed.gramas
      const nextMap = { ...porRefeicao, [refeicao]: nextRefeicao }
      const total = Math.min(h.meta_diaria + 200, current + parsed.gramas)
      const entry = {
        refeicao,
        texto,
        gramas: parsed.gramas,
        kcal: parsed.kcal,
        hora: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        matches: parsed.matches.map((m) => m.label),
      }
      const nextLog = [entry, ...textoLog].slice(0, 24)

      await salvarRefeicoes(nextMap, total, { logPatch: nextLog, kcalAdd: parsed.kcal })
      setJournalText('')
      const via = parsed.source === 'ai' ? 'IA' : 'estimativa local'
      toast.success(
        `~${parsed.gramas}g · ~${parsed.kcal} kcal (${via})`,
        { duration: 2400 },
      )
    }
    finally
    {
      setSavingJournal(false)
    }
  }

  const refeicaoLabel = REFEICOES_PROTEINA.find((r) => r.id === refeicao)?.label ?? refeicao

  return (
    <section className="rounded-sl border border-zinc-200/80 dark:border-line bg-white dark:bg-card p-4 space-y-4 shadow-[0_1px_2px_rgba(0,0,0,0.05)] dark:shadow-none">
      <div>
        <p className={`text-[12px] font-medium ${AXEL_TEXT_PRIMARY}`}>O que você comeu</p>
        <p className={`text-[11px] mt-0.5 ${AXEL_TEXT_SECONDARY}`}>
          Descreva o prato ou use os atalhos abaixo com porção ajustável.
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
              className={`flex flex-col items-center gap-0.5 py-2 rounded-sl border text-center transition-colors min-h-[52px] ${
                ativo
                  ? 'border-amber-500/35 bg-zinc-100 dark:bg-amber-500/10 text-zinc-900 dark:text-ink'
                  : 'border-zinc-200/80 dark:border-line bg-transparent text-zinc-500 hover:text-zinc-700 dark:hover:bg-chrome/60'
              }`}
            >
              <span className="text-lg">{r.emoji}</span>
              <span className="font-mono text-[8px] uppercase">{r.label}</span>
              {sub > 0 && (
                <span className="font-mono text-[9px] text-amber-600 dark:text-amber-300 tabular-nums">{sub}g</span>
              )}
            </button>
          )
        })}
      </div>

      <div className="space-y-2">
        <label className={`text-[10px] font-mono uppercase tracking-wide ${AXEL_TEXT_SECONDARY}`}>
          {refeicaoLabel}: descreva o prato
        </label>
        <textarea
          value={journalText}
          onChange={(e) => setJournalText(e.target.value)}
          placeholder="Ex.: arroz, feijão, frango grelhado e salada"
          rows={2}
          className="w-full px-3 py-2.5 rounded-sl border border-line bg-white dark:bg-chrome text-[13px] text-ink outline-none focus:border-amber-500/40 resize-none min-h-[72px]"
        />
        <button
          type="button"
          disabled={!journalText.trim() || savingJournal}
          onClick={() => void handleJournal()}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-sl border border-amber-500/30 bg-amber-500/10 text-[11px] font-mono uppercase text-amber-700 dark:text-amber-200 disabled:opacity-40 min-h-[44px] hover:bg-amber-500/15 transition-colors"
        >
          {savingJournal ? <Loader2 className="w-4 h-4 animate-spin" /> : <PenLine className="w-4 h-4" />}
          Registrar refeição
        </button>
      </div>

      {textoLog.length > 0 && (
        <div className="space-y-2 pt-2 border-t border-line">
          <p className={`text-[10px] font-mono uppercase tracking-wide ${AXEL_TEXT_SECONDARY}`}>Hoje</p>
          <ul className="space-y-2 max-h-36 overflow-y-auto custom-scrollbar">
            {textoLog.map((entry, i) => (
              <li key={`${entry.hora}-${i}`} className="text-[12px] leading-snug">
                <span className="font-mono text-[10px] text-ink-muted">{entry.hora}</span>
                <span className="text-ink-muted"> · </span>
                <span className="text-ink">{entry.texto}</span>
                <span className="font-mono text-amber-600 dark:text-amber-300/90 ml-1 tabular-nums">
                  +{entry.gramas}g
                  {entry.kcal ? ` · ${entry.kcal} kcal` : ''}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <ProteinFoodQuickAdd
        refeicao={refeicao}
        customFoods={customFoods}
        onAdd={adicionarGramas}
        onRemove={removerGramas}
        onSaveCustom={salvarCustomFoods}
      />
    </section>
  )
}
