import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { HeartPulse } from 'lucide-react'
import { AXEL_BTN_LG, AXEL_BTN_PRIMARY } from '../../constants/axelSurfaces'
import { useTaskStore } from '../../store/useTaskStore'
import { MoodQuickPicker } from './MoodQuickPicker'
import { buildMoodOrchestrationContext } from '../../lib/moodOrchestration'
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
  const [notaAgora, setNotaAgora] = useState('')
  const [pendingMood, setPendingMood] = useState<{ value: number; label: string } | null>(null)
  const [notaDia, setNotaDia] = useState('')
  const [salvandoNota, setSalvandoNota] = useState(false)

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
      setNotaAgora('')
      requestAnimationFrame(() =>
      {
        document.getElementById('dashboard-wellbeing')?.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        })
      })
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
      await criarEntradaDiario(texto, 'Reflexão do dia (dashboard)')
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

  // Humor registrado some na hora - a mensagem do AXEL aparece no painel separado (AxelPostMoodCare)
  if (snoozed)
  {
    return null
  }

  if (temRegistroHoje && !checkInDue)
  {
    return null
  }

  if (checkInDue)
  {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <HeartPulse className="sl-btn-icon text-ink-muted shrink-0" strokeWidth={1.75} />
          <p className="sl-body font-medium text-ink">Como foi o dia?</p>
        </div>
        <p className="sl-body-muted leading-relaxed">
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
            onClick={() => navigate('/saude#diario')}
            className="text-[13px] text-ink-muted hover:text-ink min-h-11"
          >
            Diário completo
          </button>
        </div>
        <button
          type="button"
          disabled={salvandoNota || !notaDia.trim()}
          onClick={() => void saveDayNote()}
          className={`${AXEL_BTN_LG} ${AXEL_BTN_PRIMARY} disabled:opacity-50`}
        >
          Guardar
        </button>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-3">
        <p className="sl-section-label">Humor</p>
        <p className="sl-body font-semibold text-ink mt-1">
          Como você está agora?
        </p>
      </div>

      <MoodQuickPicker
        compact
        disabled={saving}
        selected={pendingMood?.value ?? ultimo?.humor ?? null}
        onSelect={(value, label) => setPendingMood({ value, label })}
      />

      <div className="mt-2.5 space-y-1">
        <p className="sl-body-muted">Nota rápida (opcional)</p>
        <textarea
          value={notaAgora}
          onChange={(e) => setNotaAgora(e.target.value)}
          placeholder="Uma linha sobre agora…"
          rows={1}
          disabled={saving}
          className="w-full bg-chrome border border-line rounded-sl px-3 py-2 text-ui-body text-ink resize-none min-h-[42px] disabled:opacity-50"
        />
      </div>

      {pendingMood && (
        <button
          type="button"
          disabled={saving}
          onClick={() => void confirmMood()}
          className={`mt-3 ${AXEL_BTN_LG} ${AXEL_BTN_PRIMARY} disabled:opacity-40`}
        >
          {saving ? 'Salvando…' : `Registrar · ${pendingMood.label}`}
        </button>
      )}
    </div>
  )
}
