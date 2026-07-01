import { useMemo, useState } from 'react'
import { Loader2, PenLine } from 'lucide-react'
import { toast } from 'sonner'
import { useTaskStore } from '../../store/useTaskStore'
import { PROTEINA_PRESET } from '../../constants/healthPresets'
import {
  ALIMENTOS_PROTEINA,
  REFEICOES_PROTEINA,
  type RefeicaoId,
} from '../../constants/proteinFoods'
import { fetchProteinEstimate } from '../../lib/estimateProteinApi'
import { kcalFromProteinGrams } from '../../lib/healthNutrition'
import { AXEL_TEXT_PRIMARY, AXEL_TEXT_SECONDARY } from '../../constants/axelSurfaces'

export function ProteinMealLog()
{
  const habitos = useTaskStore((s) => s.habitos)
  const ensureHealthHabit = useTaskStore((s) => s.ensureHealthHabit)
  const setHabitoProgress = useTaskStore((s) => s.setHabitoProgress)
  const patchHabitoConfig = useTaskStore((s) => s.updateHabitoConfig)

  const [refeicao, setRefeicao] = useState<RefeicaoId>('almoco')
  const [customG, setCustomG] = useState('')
  const [journalText, setJournalText] = useState('')
  const [savingJournal, setSavingJournal] = useState(false)

  const proteina = useMemo(() => habitos.find((h) => h.tipo === 'proteina'), [habitos])
  const porRefeicao = (proteina?.config?.proteina_por_refeicao ?? {}) as Record<string, number>
  const textoLog = proteina?.config?.refeicoes_texto_log ?? []
  const current = proteina?.progresso_atual ?? 0

  const ensureProteina = async () =>
  {
    return proteina ?? await ensureHealthHabit(PROTEINA_PRESET)
  }

  const salvarRefeicoes = async (
    nextMap: Record<string, number>,
    total: number,
    opts?: { logPatch?: typeof textoLog; kcalAdd?: number },
  ) =>
  {
    const h = await ensureProteina()
    if (!h) return
    const kcalBase = typeof h.config?.kcal_hoje === 'number' ? h.config.kcal_hoje : 0
    const kcalAdd = opts?.kcalAdd ?? 0
    const patch: Record<string, unknown> = {
      proteina_por_refeicao: nextMap,
      kcal_hoje: kcalBase + kcalAdd,
    }
    if (opts?.logPatch)
    {
      patch.refeicoes_texto_log = opts.logPatch
    }
    await patchHabitoConfig(h.id, patch)
    await setHabitoProgress(h.id, total)
  }

  const adicionarGramas = async (gramas: number, label: string, kcal?: number) =>
  {
    if (gramas <= 0) return
    const h = await ensureProteina()
    if (!h) return
    const nextRefeicao = (porRefeicao[refeicao] ?? 0) + gramas
    const nextMap = { ...porRefeicao, [refeicao]: nextRefeicao }
    const total = Math.min(h.meta_diaria + 200, current + gramas)
    const kcalAdd = kcal ?? kcalFromProteinGrams(gramas)
    await salvarRefeicoes(nextMap, total, { kcalAdd })
    toast.success(`+${gramas}g · ~${kcalAdd} kcal`, { duration: 1500 })
  }

  const handleCustom = async () =>
  {
    const g = parseInt(customG, 10)
    if (!g || g <= 0) return
    await adicionarGramas(g, 'porção manual')
    setCustomG('')
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

  const alimentos = ALIMENTOS_PROTEINA[refeicao]
  const refeicaoLabel = REFEICOES_PROTEINA.find((r) => r.id === refeicao)?.label ?? refeicao

  return (
    <section className="rounded-sl border border-line bg-card p-4 space-y-4">
      <div>
        <p className={`text-[12px] font-medium ${AXEL_TEXT_PRIMARY}`}>O que você comeu</p>
        <p className={`text-[11px] mt-0.5 ${AXEL_TEXT_SECONDARY}`}>
          Escreva o prato — o AXEL usa IA no servidor (Groq/Gemini) e cai na tabela local se estiver offline.
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

      <div className="space-y-2">
        <label className={`text-[10px] font-mono uppercase tracking-wide ${AXEL_TEXT_SECONDARY}`}>
          {refeicaoLabel} — descreva o prato
        </label>
        <textarea
          value={journalText}
          onChange={(e) => setJournalText(e.target.value)}
          placeholder="Ex.: arroz, feijão, frango grelhado e salada"
          rows={2}
          className="w-full px-3 py-2.5 rounded-sl border border-line bg-chrome text-[13px] text-ink outline-none focus:border-amber-500/40 resize-none min-h-[72px]"
        />
        <button
          type="button"
          disabled={!journalText.trim() || savingJournal}
          onClick={() => void handleJournal()}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-sl border border-amber-500/30 bg-amber-500/10 text-[11px] font-mono uppercase text-amber-200 disabled:opacity-40 min-h-[44px] hover:bg-amber-500/15 transition-colors"
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
                <span className="font-mono text-amber-300/90 ml-1 tabular-nums">
                  +{entry.gramas}g
                  {entry.kcal ? ` · ${entry.kcal} kcal` : ''}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="pt-2 border-t border-line space-y-3">
        <p className={`text-[11px] ${AXEL_TEXT_SECONDARY}`}>Atalhos rápidos</p>
        <div className="flex flex-wrap gap-1.5">
          {alimentos.map((a) => (
            <button
              key={a.id}
              type="button"
              onClick={() => void adicionarGramas(a.gramas, a.nome, a.kcal)}
              className="px-2.5 py-1.5 rounded-sl border border-line bg-chrome/40 text-[11px] text-ink hover:border-amber-500/30 hover:bg-amber-500/10 transition-colors text-left min-h-[40px]"
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
            className="flex-1 px-3 py-2 rounded-sl border border-line bg-chrome text-[12px] text-ink outline-none focus:border-amber-500/40 min-h-[44px]"
          />
          <button
            type="button"
            onClick={() => void handleCustom()}
            disabled={!customG}
            className="px-3 py-2 rounded-sl border border-amber-500/30 bg-amber-500/10 text-[11px] font-mono uppercase text-amber-200 disabled:opacity-40 min-h-[44px]"
          >
            Adicionar
          </button>
        </div>
      </div>
    </section>
  )
}
