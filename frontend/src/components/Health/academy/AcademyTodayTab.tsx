import { useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Dumbbell, Play, Settings2 } from 'lucide-react'
import { toast } from 'sonner'
import { useTaskStore } from '../../../store/useTaskStore'
import { TREINO_PRESET, DEFAULT_TREINO_MINUTOS } from '../../../constants/healthPresets'
import { hojeDiaTreinoKey, mergeAcademyConfig, resolveExerciciosHoje, resolvePlanoHoje } from '../../../lib/academyWorkouts'
import { labelTreinoPlano } from '../../../lib/academyTreinoCodes'
import { localTodayIso } from '../../../lib/healthDayBoundary'
import { AXEL_TEXT_PRIMARY, AXEL_TEXT_SECONDARY } from '../../../constants/axelSurfaces'
import type { HabitoDiarioConfig } from '../../../store/storeTypes'

interface AcademyTodayTabProps
{
  onGoConfig: () => void
}

export function AcademyTodayTab({ onGoConfig }: AcademyTodayTabProps)
{
  const navigate = useNavigate()
  const habitos = useTaskStore((s) => s.habitos)
  const ensureHealthHabit = useTaskStore((s) => s.ensureHealthHabit)
  const iniciarTreino = useTaskStore((s) => s.iniciarTreino)
  const sessaoTreinoAtiva = useTaskStore((s) => s.sessaoTreinoAtiva)
  const sessoesTreinoHoje = useTaskStore((s) => s.sessoesTreinoHoje)
  const fetchSessoesTreinoHoje = useTaskStore((s) => s.fetchSessoesTreinoHoje)

  useEffect(() =>
  {
    void fetchSessoesTreinoHoje()
  }, [fetchSessoesTreinoHoje])

  const treino = useMemo(() => habitos.find((h) => h.tipo === 'treino'), [habitos])
  const habitConfig = treino?.config as HabitoDiarioConfig | undefined
  const planoHoje = useMemo(
    () => resolvePlanoHoje(habitConfig, habitConfig?.plano_semana),
    [habitConfig],
  )
  const exercicios = useMemo(
    () => resolveExerciciosHoje(habitConfig),
    [habitConfig],
  )
  const rotuloHoje = useMemo(() =>
  {
    const modo = mergeAcademyConfig(habitConfig).academy_modo_plano ?? 'semana'
    const ref = modo === 'mes'
      ? { iso: localTodayIso() }
      : { diaKey: hojeDiaTreinoKey() }
    return labelTreinoPlano(planoHoje, ref)
  }, [habitConfig, planoHoje])
  const concluidasHoje = sessoesTreinoHoje.filter((s) => s.concluido).length
  const temTreinoMontado = Boolean(
    planoHoje?.titulo?.trim()
    || (planoHoje && planoHoje.meta_minutos > 0)
    || exercicios.length > 0,
  )

  const handleStart = async () =>
  {
    if (sessaoTreinoAtiva)
    {
      navigate('/saude#academia')
      return
    }
    if (!temTreinoMontado)
    {
      toast.message('Monte o treino em Configurar antes de iniciar')
      onGoConfig()
      return
    }
    const h = treino ?? await ensureHealthHabit(TREINO_PRESET)
    if (!h)
    {
      return
    }
    const titulo = planoHoje?.titulo?.trim() || 'Treino'
    const minutos = planoHoje?.meta_minutos ?? DEFAULT_TREINO_MINUTOS
    if (minutos <= 0 && exercicios.length === 0)
    {
      toast.message('Dia sem treino configurado')
      return
    }
    await iniciarTreino(h.id, titulo, Math.max(minutos, 1))
    const { emitCareRegistered } = await import('../../../lib/healthVitality')
    emitCareRegistered()
    navigate('/saude#academia')
  }

  return (
    <div className="space-y-4">
      {!temTreinoMontado && (
        <button
          type="button"
          onClick={onGoConfig}
          className="w-full flex items-center justify-between gap-3 rounded-sl border border-dashed border-accent/35 bg-accent-muted/10 px-4 py-3 text-left hover:bg-accent-muted/20 transition-colors"
        >
          <div>
            <p className={`text-[12px] font-medium ${AXEL_TEXT_PRIMARY}`}>Ainda sem treino para hoje</p>
            <p className={`text-[11px] mt-0.5 ${AXEL_TEXT_SECONDARY}`}>
              Monte o dia em Configurar - leva poucos minutos.
            </p>
          </div>
          <Settings2 className="w-4 h-4 text-accent shrink-0" />
        </button>
      )}

      <section className="rounded-sl border border-line bg-card p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Dumbbell className="w-4 h-4 text-ink-muted" />
              <h2 className={`text-[14px] font-display font-medium ${AXEL_TEXT_PRIMARY}`}>
                Treino de hoje
              </h2>
            </div>
            <p className={`text-lg font-display ${AXEL_TEXT_PRIMARY}`}>
              {temTreinoMontado ? rotuloHoje : '-'}
            </p>
            <p className={`text-[12px] mt-1 ${AXEL_TEXT_SECONDARY}`}>
              {temTreinoMontado
                ? `Meta: ${planoHoje?.meta_minutos ?? DEFAULT_TREINO_MINUTOS} min · ${concluidasHoje} sessão(ões) hoje`
                : 'Configure o plano quando quiser - sem pressa'}
            </p>
          </div>
          <span className="font-mono text-[10px] text-ink-muted tabular-nums">
            {exercicios.length} exerc.
          </span>
        </div>

        <button
          type="button"
          onClick={() => void handleStart()}
          disabled={!temTreinoMontado && !sessaoTreinoAtiva}
          className="w-full min-h-[48px] flex items-center justify-center gap-2 py-3 rounded-sl bg-health-muted border border-health/30 text-ink font-mono text-[11px] uppercase hover:bg-health-muted/80 disabled:opacity-40 transition-colors"
        >
          <Play className="w-4 h-4" />
          {sessaoTreinoAtiva ? 'Continuar cronômetro' : 'Iniciar treino'}
        </button>
      </section>

      <section className="rounded-sl border border-line bg-card overflow-hidden">
        <header className="px-4 py-2.5 border-b border-line flex items-center justify-between gap-2">
          <h3 className="text-[11px] font-mono uppercase text-ink-muted">Exercícios de hoje</h3>
          <button
            type="button"
            onClick={onGoConfig}
            className="text-[10px] font-mono uppercase text-accent hover:underline"
          >
            Editar
          </button>
        </header>
        {exercicios.length === 0 ? (
          <p className={`px-4 py-3 text-[12px] ${AXEL_TEXT_SECONDARY}`}>
            Lista vazia - adicione exercícios em Configurar.
          </p>
        ) : (
          <ul className="divide-y divide-line">
            {exercicios.map((ex) => (
              <li key={ex.id} className="px-4 py-2.5 flex items-center justify-between gap-2 text-[12px]">
                <span className={`truncate ${AXEL_TEXT_PRIMARY}`}>{ex.nome || 'Sem nome'}</span>
                <span className="font-mono text-[10px] text-ink-muted shrink-0 tabular-nums">
                  {ex.series}×{ex.reps_alvo}
                  {ex.carga_kg != null ? ` · ${ex.carga_kg}kg` : ''}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
