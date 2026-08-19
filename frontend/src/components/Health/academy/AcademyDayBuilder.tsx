import { useMemo } from 'react'
import { Calendar } from 'lucide-react'
import {
  type AcademyDiaRef,
  type AcademyPlanoDia,
  resolvePlanoParaRef,
} from '../../../lib/academyWorkouts'
import {
  ensurePlanoCodigo,
  formatTreinoLabel,
  labelTreinoPlano,
} from '../../../lib/academyTreinoCodes'
import { AXEL_TEXT_PRIMARY, AXEL_TEXT_SECONDARY } from '../../../constants/axelSurfaces'
import { useTaskStore } from '../../../store/useTaskStore'
import { DEFAULT_TREINO_MINUTOS } from '../../../constants/healthPresets'
import { AcademyExercisesPanel } from '../AcademyExercisesPanel'

interface AcademyDayBuilderProps
{
  diaRef: AcademyDiaRef
  subtitulo?: string
}

function labelDoDia(ref: AcademyDiaRef): string
{
  if (ref.modo === 'mes')
  {
    const d = new Date(`${ref.iso}T12:00:00`)
    return d.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })
  }
  const map: Record<string, string> = {
    seg: 'Segunda', ter: 'Terça', qua: 'Quarta', qui: 'Quinta', sex: 'Sexta', sab: 'Sábado', dom: 'Domingo',
  }
  return map[ref.key] ?? ref.key
}

export function AcademyDayBuilder({ diaRef, subtitulo }: AcademyDayBuilderProps)
{
  const habitos = useTaskStore((s) => s.habitos)
  const updateTreinoPlanoSemana = useTaskStore((s) => s.updateTreinoPlanoSemana)
  const updateAcademyTreinoConfig = useTaskStore((s) => s.updateAcademyTreinoConfig)

  const treino = habitos.find((h) => h.tipo === 'treino')
  const planoSemana = (treino?.config?.plano_semana ?? {}) as Record<string, AcademyPlanoDia>
  const academyRaw = treino?.config as Parameters<typeof resolvePlanoParaRef>[0]

  const planoAtual = useMemo(
    () => resolvePlanoParaRef(academyRaw, diaRef, planoSemana),
    [academyRaw, diaRef, planoSemana],
  )

  const titulo = planoAtual?.titulo ?? ''
  const metaMinutos = planoAtual?.meta_minutos ?? 0
  const codigo = planoAtual?.codigo ?? ''

  const refCodigo = diaRef.modo === 'mes'
    ? { iso: diaRef.iso }
    : { diaKey: diaRef.key }

  const rotuloTreino = labelTreinoPlano(planoAtual, refCodigo)

  const salvarPlano = async (patch: Partial<AcademyPlanoDia>) =>
  {
    const next = ensurePlanoCodigo(patch, planoAtual, refCodigo, planoSemana)

    if (diaRef.modo === 'semana')
    {
      await updateTreinoPlanoSemana({
        ...planoSemana,
        [diaRef.key]: next,
      })
      return
    }

    await updateAcademyTreinoConfig({
      plano_por_data: { [diaRef.iso]: next },
    })
  }

  return (
    <div className="space-y-3">
      <section className="rounded-sl border border-line bg-card p-4 space-y-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Calendar className="w-3.5 h-3.5 text-ink-muted" />
            <h3 className={`text-[13px] font-medium ${AXEL_TEXT_PRIMARY}`}>
              {labelDoDia(diaRef)}
            </h3>
          </div>
          {subtitulo && (
            <p className={`text-[11px] ${AXEL_TEXT_SECONDARY}`}>{subtitulo}</p>
          )}
          {(titulo.trim() || codigo) && (
            <p className={`text-[12px] mt-1 font-medium ${AXEL_TEXT_PRIMARY}`}>
              {rotuloTreino}
            </p>
          )}
        </div>

        <label className="block space-y-1">
          <span className="text-[10px] font-mono uppercase text-ink-muted">Código do treino</span>
          <input
            type="text"
            maxLength={4}
            value={codigo}
            onChange={(e) => void salvarPlano({ codigo: e.target.value.toUpperCase() })}
            placeholder="A"
            className="w-20 px-3 py-2 rounded-sl border border-line bg-chrome text-[13px] text-ink font-mono uppercase outline-none focus:border-accent/40"
          />
          <p className="text-[10px] text-ink-muted">
            Estável no mês — ex.: {formatTreinoLabel(codigo || 'A', titulo || '…')}
          </p>
        </label>

        <label className="block space-y-1">
          <span className="text-[10px] font-mono uppercase text-ink-muted">Nome do treino</span>
          <input
            type="text"
            value={titulo}
            onChange={(e) => void salvarPlano({ titulo: e.target.value })}
            placeholder="Ex: Costas e bíceps, cardio, descanso…"
            className="w-full px-3 py-2 rounded-sl border border-line bg-chrome text-[13px] text-ink outline-none focus:border-accent/40"
          />
        </label>

        <label className="block space-y-1">
          <span className="text-[10px] font-mono uppercase text-ink-muted">Duração (min)</span>
          <input
            type="number"
            min={0}
            max={180}
            value={metaMinutos || ''}
            onChange={(e) =>
            {
              const v = e.target.value === '' ? 0 : Number(e.target.value)
              void salvarPlano({ meta_minutos: v })
            }}
            placeholder={String(DEFAULT_TREINO_MINUTOS)}
            className="w-24 px-3 py-2 rounded-sl border border-line bg-chrome text-[13px] text-ink font-mono outline-none focus:border-accent/40"
          />
        </label>
      </section>

      <AcademyExercisesPanel
        diaRef={diaRef}
        tituloSecao="Lista do dia"
      />
    </div>
  )
}
