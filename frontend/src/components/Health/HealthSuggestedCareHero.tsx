import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { useTaskStore } from '../../store/useTaskStore'
import { useHealthRitualSnapshot } from '../../hooks/useHealthRitualSnapshot'
import { pickSuggestedCare } from '../../lib/healthSuggestedCare'
import type { CuidadosTab } from '../../lib/healthRoute'
import {
  buildDosesHoje,
  proximaDosePendente,
  mensagemGentilDose,
} from '../../lib/medicamentosSchedule'
import { AGUA_PRESET } from '../../constants/healthPresets'
import { emitCareRegistered } from '../../lib/healthVitality'
import {
  DEFAULT_ML_POR_COPO,
  mlPorCopo,
  registrosMl,
} from '../../lib/waterHydration'
import { AXEL_BTN_MD, AXEL_BTN_PRIMARY } from '../../constants/axelSurfaces'
import { AxelMoodFace } from '../axel/AxelMoodFace'

interface HealthSuggestedCareHeroProps
{
  onSelectTab: (tab: CuidadosTab) => void
}

export function HealthSuggestedCareHero({ onSelectTab }: HealthSuggestedCareHeroProps)
{
  const navigate = useNavigate()
  const snapshot = useHealthRitualSnapshot()
  const habitos = useTaskStore((s) => s.habitos)
  const medicamentos = useTaskStore((s) => s.medicamentos)
  const medicamentoTomadas = useTaskStore((s) => s.medicamentoTomadas)
  const ensureHealthHabit = useTaskStore((s) => s.ensureHealthHabit)
  const setAguaRegistros = useTaskStore((s) => s.setAguaRegistros)
  const registrarTomadaMedicamento = useTaskStore((s) => s.registrarTomadaMedicamento)
  const sessaoTreinoAtiva = useTaskStore((s) => s.sessaoTreinoAtiva)
  const [busy, setBusy] = useState(false)

  const agua = habitos.find((h) => h.tipo === 'agua')
  const proteina = habitos.find((h) => h.tipo === 'proteina')
  const treino = habitos.find((h) => h.tipo === 'treino')
  const aguaCopos = agua?.progresso_atual ?? 0
  const aguaMeta = agua?.meta_diaria ?? 10

  const proximaDose = useMemo(() =>
  {
    if (!medicamentos.length)
    {
      return null
    }
    const doses = buildDosesHoje(medicamentos, medicamentoTomadas)
    return proximaDosePendente(doses)
  }, [medicamentos, medicamentoTomadas])

  const suggested = useMemo(() => pickSuggestedCare({
    snapshot,
    aguaCopos,
    aguaMeta,
    proximaDose,
    proteinaDone: Boolean(proteina && proteina.progresso_atual >= proteina.meta_diaria),
    proteinaActive: Boolean(proteina),
    treinoPending: Boolean(treino && !sessaoTreinoAtiva),
    treinoActive: Boolean(treino),
  }), [
    snapshot,
    aguaCopos,
    aguaMeta,
    proximaDose,
    proteina,
    treino,
    sessaoTreinoAtiva,
  ])

  const addCopo = async () =>
  {
    if (busy)
    {
      return
    }
    setBusy(true)
    try
    {
      const ensured = agua ?? await ensureHealthHabit(AGUA_PRESET)
      if (!ensured)
      {
        return
      }
      const entries = registrosMl(ensured)
      const ml = mlPorCopo(ensured) || DEFAULT_ML_POR_COPO
      await setAguaRegistros(ensured.id, [...entries, ml])
      emitCareRegistered()
      toast.success(`+${ml} ml`, { duration: 2000 })
    }
    finally
    {
      setBusy(false)
    }
  }

  const tomarDose = async () =>
  {
    if (!proximaDose || busy)
    {
      return
    }
    setBusy(true)
    try
    {
      await registrarTomadaMedicamento(proximaDose.medicamentoId, proximaDose.horario)
      emitCareRegistered()
      toast.success('Dose registrada', { duration: 2000 })
    }
    finally
    {
      setBusy(false)
    }
  }

  const handlePrimary = () =>
  {
    switch (suggested.kind)
    {
      case 'humor':
        navigate('/saude#diario')
        return
      case 'agua':
        void addCopo()
        return
      case 'medicamento':
        void tomarDose()
        return
      case 'alimentacao':
        onSelectTab('alimentacao')
        return
      case 'treino':
        onSelectTab('academia')
        return
      case 'complete':
        navigate('/saude#diario')
        return
      default:
        return
    }
  }

  const detail = suggested.kind === 'medicamento' && proximaDose
    ? mensagemGentilDose(proximaDose)
    : suggested.detail

  return (
    <section
      className="rounded-sl border border-health/20 bg-health-muted/40 px-3 py-3 sm:px-4"
      aria-label="Cuidado sugerido"
    >
      <div className="flex items-start gap-3">
        <AxelMoodFace
          level={snapshot.moodLoggedToday ? 4 : 3}
          presence="calmo"
          size={32}
          className="shrink-0 mt-0.5"
        />
        <div className="min-w-0 flex-1">
          <p className="sl-section-label text-health">
            Agora
          </p>
          <p className="sl-body font-semibold text-ink mt-0.5 leading-snug">
            {suggested.title}
          </p>
          <p className="sl-body-muted mt-1 leading-relaxed">
            {detail}
          </p>
        </div>
      </div>
      <button
        type="button"
        disabled={busy}
        onClick={handlePrimary}
        className={`mt-3 w-full sm:w-auto gap-1.5 ${AXEL_BTN_MD} ${AXEL_BTN_PRIMARY} disabled:opacity-50`}
      >
        {busy ? '…' : suggested.cta}
      </button>
    </section>
  )
}
