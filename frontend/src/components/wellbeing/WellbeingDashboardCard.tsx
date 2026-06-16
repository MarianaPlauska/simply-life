import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { HeartPulse, ChevronRight, X, Shield } from 'lucide-react'
import { toast } from 'sonner'
import { useTaskStore } from '../../store/useTaskStore'
import { MoodQuickPicker } from './MoodQuickPicker'
import { MoodDayTimeline } from './MoodDayTimeline'
import { MoodWeekSparkline } from './MoodWeekSparkline'
import { MoodMonthHeatmap } from './MoodMonthHeatmap'
import { ENERGY_LEVELS } from '../../lib/moodConstants'
import {
  insightHumorHoje,
  mediaHumor,
  tendenciaLabel,
  tendenciaSemana,
} from '../../lib/moodInsights'
import { buildMoodOrchestrationContext } from '../../lib/moodOrchestration'
import { useMoodOrchestration } from '../../hooks/useMoodOrchestration'
import {
  decideWellbeingNudge,
  dismissWellbeingNudgeToday,
  snoozeWellbeingNudge,
  snoozeWellbeingUntilTomorrow,
} from '../../lib/wellbeingPrompt'

export function WellbeingDashboardCard()
{
  const navigate = useNavigate()
  const humorHojeLista = useTaskStore((s) => s.humorHojeLista)
  const humorSemanaAgregado = useTaskStore((s) => s.humorSemanaAgregado)
  const humorMesAgregado = useTaskStore((s) => s.humorMesAgregado)
  const dailyScoreCap = useTaskStore((s) => s.dailyScoreCap)
  const pushAiDecision = useTaskStore((s) => s.pushAiDecision)
  const registrarHumor = useTaskStore((s) => s.registrarHumor)
  const atualizarHumorEntry = useTaskStore((s) => s.atualizarHumorEntry)
  const completeOnboardingStep = useTaskStore((s) => s.completeOnboardingStep)
  const mood = useMoodOrchestration()

  const [saving, setSaving] = useState(false)
  const [lastSavedId, setLastSavedId] = useState<number | null>(null)
  const [nudgeDismissed, setNudgeDismissed] = useState(false)

  const temRegistroHoje = humorHojeLista.length > 0

  const mediaHoje = mediaHumor(humorHojeLista)
  const ultimo = humorHojeLista[humorHojeLista.length - 1] ?? null
  const tendencia = tendenciaSemana(humorSemanaAgregado)

  const nudge = useMemo(() =>
  {
    if (nudgeDismissed || temRegistroHoje) return { mode: 'none' as const, message: '' }
    const lastDate = humorMesAgregado.at(-1)?.data ?? null
    return decideWellbeingNudge({
      entriesTodayCount: humorHojeLista.length,
      lastEntryAt: ultimo?.created_at ?? null,
      lastEntryDate: lastDate,
      onDashboard: true,
    })
  }, [humorHojeLista.length, humorMesAgregado, ultimo, nudgeDismissed, temRegistroHoje])

  const insight = insightHumorHoje(humorHojeLista, humorSemanaAgregado)

  const saveMood = async (value: number, label: string) =>
  {
    setSaving(true)
    try
    {
      const row = await registrarHumor(value, label, '')
      if (row)
      {
        setLastSavedId(row.id)
        window.setTimeout(() => setLastSavedId(null), 8000)
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
      }
      toast.success(`${label} guardado — AXEL calibrou seu ritmo`, { duration: 2500 })
      setNudgeDismissed(true)
    }
    finally
    {
      setSaving(false)
    }
  }

  const addEnergy = async (energia: number) =>
  {
    if (!lastSavedId) return
    setSaving(true)
    try
    {
      await atualizarHumorEntry(lastSavedId, { energia })
      toast.success('Energia anotada', { duration: 1500 })
      setLastSavedId(null)
    }
    finally
    {
      setSaving(false)
    }
  }

  return (
    <div
      className={`sl-panel h-full flex flex-col p-4 sm:p-5 ${
        !temRegistroHoje ? 'ring-1 ring-accent/30' : ''
      }`}
    >
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <HeartPulse className="w-4 h-4 text-accent shrink-0" strokeWidth={1.75} />
            <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-accent">
              Bem-estar
            </p>
            {temRegistroHoje ? (
              <span className="font-mono text-[8px] uppercase px-1.5 py-0.5 rounded-sl bg-concluido/10 text-concluido border border-concluido/25">
                Registrado hoje
              </span>
            ) : (
              <span className="font-mono text-[8px] uppercase px-1.5 py-0.5 rounded-sl bg-accent-muted text-accent border border-accent/30">
                Recomendado hoje
              </span>
            )}
          </div>
          <h3 className="font-display text-lg text-ink mt-1 leading-tight">
            {temRegistroHoje ? `Média hoje · ${mediaHoje}/5` : 'Como você está agora?'}
          </h3>
          <p className="text-[12px] text-ink-muted mt-1 leading-relaxed">{insight}</p>
          {mood.capMultiplier !== 1 && (
            <p className="text-[11px] text-atencao mt-1.5 leading-relaxed">{mood.axelNote}</p>
          )}
        </div>
        <button
          type="button"
          onClick={() => navigate('/saude#bem_estar')}
          className="p-1 text-ink-muted hover:text-accent shrink-0"
          aria-label="Abrir diário de bem-estar"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      {!temRegistroHoje && (
        <div className="mb-3 px-3 py-2.5 rounded-sl border border-accent/25 bg-accent-muted/40">
          <p className="text-[12px] text-ink leading-relaxed">
            <strong className="font-medium">Um toque importa.</strong>{' '}
            Seu humor ajuda o AXEL a sugerir ritmo, carga e prioridades — e fica guardado só para você.
          </p>
          <p className="flex items-center gap-1 mt-1.5 text-[10px] text-ink-muted">
            <Shield size={11} className="shrink-0" />
            Registro privado na sua conta
          </p>
        </div>
      )}

      {nudge.mode !== 'none' && (
        <div
          className={`mb-3 px-3 py-2 rounded-sl border text-[12px] leading-relaxed flex items-start justify-between gap-2 ${
            nudge.mode === 'returning'
              ? 'border-accent/30 bg-accent-muted text-ink'
              : 'border-line bg-chrome/60 text-ink-muted'
          }`}
        >
          <span>{nudge.message}</span>
          <button
            type="button"
            onClick={() =>
            {
              dismissWellbeingNudgeToday()
              setNudgeDismissed(true)
            }}
            className="p-0.5 text-ink-muted hover:text-ink shrink-0"
            aria-label="Dispensar sugestão"
          >
            <X size={14} />
          </button>
        </div>
      )}

      <MoodQuickPicker
        disabled={saving}
        selected={ultimo?.humor ?? null}
        onSelect={(value, label) => void saveMood(value, label)}
      />

      {lastSavedId && (
        <div className="mt-2 flex items-center gap-1.5 flex-wrap">
          <span className="font-mono text-[9px] text-ink-muted uppercase">Energia (opcional)</span>
          {ENERGY_LEVELS.map((e) =>
          {
            const Icon = e.icon
            return (
              <button
                key={e.value}
                type="button"
                disabled={saving}
                onClick={() => void addEnergy(e.value)}
                className="p-1.5 rounded-sl border border-line hover:border-accent/40 text-ink-muted hover:text-ink transition-colors"
                title={e.label}
              >
                <Icon size={14} />
              </button>
            )
          })}
        </div>
      )}

      <MoodDayTimeline entries={humorHojeLista} />
      <MoodWeekSparkline dias={humorSemanaAgregado} />
      <MoodMonthHeatmap agregados={humorMesAgregado} />

      <div className="mt-auto pt-3 flex flex-wrap gap-x-3 gap-y-1 border-t border-line">
        <span className="font-mono text-[9px] text-ink-muted uppercase">
          {tendenciaLabel(tendencia)}
        </span>
        {!temRegistroHoje && (
          <>
            <button
              type="button"
              onClick={() =>
              {
                snoozeWellbeingNudge(4)
                setNudgeDismissed(true)
              }}
              className="font-mono text-[9px] text-ink-muted hover:text-ink uppercase"
            >
              Lembrar em 4h
            </button>
            <button
              type="button"
              onClick={() =>
              {
                snoozeWellbeingUntilTomorrow()
                setNudgeDismissed(true)
              }}
              className="font-mono text-[9px] text-ink-muted hover:text-ink uppercase"
            >
              Depois do almoço
            </button>
          </>
        )}
      </div>
    </div>
  )
}
