import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { HeartPulse } from 'lucide-react'
import { useTaskStore } from '../../store/useTaskStore'
import { MoodQuickPicker } from './MoodQuickPicker'
import { buildMoodOrchestrationContext } from '../../lib/moodOrchestration'
import { AxelCareNudge } from '../axel/AxelCareNudge'
import { useAxelCareMomentKey } from '../axel/AxelCareMoment'
import type { MoodLevel } from '../../lib/axelCareMessages'
import {
  isWellbeingCheckInDue,
  isWellbeingDashboardHidden,
  wellbeingHiddenUntilIso,
} from '../../lib/axelCareRotation'

export function WellbeingDashboardCard()
{
  const navigate = useNavigate()
  const humorHojeLista = useTaskStore((s) => s.humorHojeLista)
  const humorSemanaAgregado = useTaskStore((s) => s.humorSemanaAgregado)
  const dailyScoreCap = useTaskStore((s) => s.dailyScoreCap)
  const pushAiDecision = useTaskStore((s) => s.pushAiDecision)
  const registrarHumor = useTaskStore((s) => s.registrarHumor)
  const criarEntradaDiario = useTaskStore((s) => s.criarEntradaDiario)
  const fetchHumorResumo = useTaskStore((s) => s.fetchHumorResumo)
  const completeOnboardingStep = useTaskStore((s) => s.completeOnboardingStep)
  const patchWorkspacePrefs = useTaskStore((s) => s.patchWorkspacePrefs)
  const workspacePrefs = useTaskStore((s) => s.workspacePrefs)
  const userProfile = useTaskStore((s) => s.userProfile)
  const { key: careKey, trigger: triggerCare } = useAxelCareMomentKey()
  const [careMood, setCareMood] = useState<MoodLevel | null>(null)
  const [notaAgora, setNotaAgora] = useState('')
  const [pendingMood, setPendingMood] = useState<{ value: number; label: string } | null>(null)
  const [notaDia, setNotaDia] = useState('')
  const [salvandoNota, setSalvandoNota] = useState(false)

  const displayName = workspacePrefs.axel_calls_you
    || workspacePrefs.display_name
    || userProfile?.nome
    || ''

  const hiddenUntil = workspacePrefs.wellbeing_dashboard_hidden_until
  const temRegistroHoje = humorHojeLista.length > 0
  const ultimo = humorHojeLista[humorHojeLista.length - 1] ?? null
  const snoozed = temRegistroHoje && isWellbeingDashboardHidden(hiddenUntil)
  const checkInDue = isWellbeingCheckInDue(hiddenUntil, temRegistroHoje)

  useEffect(() =>
  {
    void fetchHumorResumo()
  }, [fetchHumorResumo])

  const [saving, setSaving] = useState(false)

  const confirmMood = async () =>
  {
    if (!pendingMood) return
    await saveMood(pendingMood.value, pendingMood.label)
    setPendingMood(null)
  }

  const saveMood = async (value: number, label: string) =>
  {
    setSaving(true)
    try
    {
      const nota = notaAgora.trim()
      const row = await registrarHumor(value, label, nota)
      if (!row) return

      if (nota)
      {
        await criarEntradaDiario(nota, `Humor: ${label}`)
      }

      completeOnboardingStep('register_mood')

      const moodCtx = buildMoodOrchestrationContext(
        [...humorHojeLista, row],
        humorSemanaAgregado,
        dailyScoreCap,
      )
      if (moodCtx.capMultiplier !== 1)
      {
        pushAiDecision(moodCtx.axelNote)
      }
      setCareMood(value as MoodLevel)
      setNotaAgora('')
      triggerCare()
    }
    finally
    {
      setSaving(false)
    }
  }

  const saveDayNote = async () =>
  {
    const texto = notaDia.trim()
    if (!texto) return
    setSalvandoNota(true)
    try
    {
      await criarEntradaDiario(texto, 'Reflexão do dia — dashboard')
      setNotaDia('')
      await patchWorkspacePrefs({
        wellbeing_dashboard_hidden_until: wellbeingHiddenUntilIso(),
      })
    }
    finally
    {
      setSalvandoNota(false)
    }
  }

  if (snoozed || (temRegistroHoje && !hiddenUntil))
  {
    return null
  }

  if (checkInDue)
  {
    return (
      <div className="sl-panel p-3 sm:p-4 space-y-2">
        <div className="flex items-center gap-2">
          <HeartPulse className="w-4 h-4 text-accent shrink-0" strokeWidth={1.75} />
          <p className="text-[13px] text-ink">Como foi o dia?</p>
        </div>
        <p className="text-[11px] text-ink-muted leading-relaxed">
          Uma linha ajuda a ver padrões na semana e no mês.
        </p>
        <textarea
          value={notaDia}
          onChange={(e) => setNotaDia(e.target.value)}
          placeholder="Resumo do dia…"
          rows={2}
          className="w-full bg-chrome border border-line rounded-sl px-3 py-2 text-[13px] text-ink resize-none min-h-[56px]"
        />
        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => navigate('/saude#bem_estar')}
            className="text-[11px] font-mono uppercase text-ink-muted hover:text-accent"
          >
            Diário completo
          </button>
          <button
            type="button"
            disabled={salvandoNota || !notaDia.trim()}
            onClick={() => void saveDayNote()}
            className="px-3 py-1.5 rounded-sl bg-accent text-white text-[11px] font-mono uppercase disabled:opacity-50"
          >
            Guardar
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="sl-panel h-full flex flex-col p-4 sm:p-5 sl-panel-emphasis">
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <HeartPulse className="w-4 h-4 text-accent shrink-0" strokeWidth={1.75} />
            <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-accent">
              Bem-estar
            </p>
          </div>
          <h3 className="font-display text-lg text-ink mt-1 leading-tight">
            Como você está agora?
          </h3>
        </div>
      </div>

      {careMood !== null && (
        <AxelCareNudge
          key={careKey}
          avatarStyle={workspacePrefs.avatar_style}
          displayName={displayName}
          moodLevel={careMood}
          className="mb-3"
          onDone={() => setCareMood(null)}
        />
      )}

      <MoodQuickPicker
        disabled={saving}
        selected={pendingMood?.value ?? ultimo?.humor ?? null}
        onSelect={(value, label) => setPendingMood({ value, label })}
      />

      <div className="mt-3 space-y-1.5">
        <p className="font-mono text-[9px] uppercase text-ink-muted">Nota rápida (opcional)</p>
        <textarea
          value={notaAgora}
          onChange={(e) => setNotaAgora(e.target.value)}
          placeholder="Uma linha sobre agora…"
          rows={2}
          disabled={saving}
          className="w-full bg-chrome border border-line rounded-sl px-3 py-2 text-[13px] text-ink resize-none min-h-[52px] disabled:opacity-50"
        />
      </div>

      <button
        type="button"
        disabled={saving || !pendingMood}
        onClick={() => void confirmMood()}
        className="mt-3 w-full py-2.5 rounded-sl bg-accent text-white font-mono text-[11px] uppercase tracking-wide disabled:opacity-40 hover:bg-accent/90 transition-colors"
      >
        {saving ? 'Salvando…' : pendingMood ? `Registrar — ${pendingMood.label}` : 'Escolha o humor acima'}
      </button>
    </div>
  )
}
