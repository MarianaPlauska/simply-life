import { useMemo, useState } from 'react'
import { Dumbbell, Link2, Plus, Trash2 } from 'lucide-react'
import { useTaskStore } from '../../store/useTaskStore'
import {
  dadosGraficoCarga,
  hojeDiaTreinoKey,
  mergeAcademyConfig,
  novoExercicioEmBranco,
  resolveExerciciosParaRef,
  toggleSupersetPar,
  type AcademyDiaRef,
  type AcademyExercise,
} from '../../lib/academyWorkouts'
import type { LibraryExercise } from '../../lib/academyExerciseLibrary'
import { AXEL_TEXT_PRIMARY, AXEL_TEXT_SECONDARY } from '../../constants/axelSurfaces'
import { AcademyExerciseLibraryPicker } from './academy/AcademyExerciseLibraryPicker'
import { AcademyLoadChart } from './academy/AcademyLoadChart'

interface AcademyExercisesPanelProps
{
  /** Dia da semana para editar (padrão: hoje) - legado */
  diaKey?: string
  /** Referência semana ou data ISO */
  diaRef?: AcademyDiaRef
  tituloSecao?: string
}

export function AcademyExercisesPanel({
  diaKey: diaKeyProp,
  diaRef: diaRefProp,
  tituloSecao = 'Exercícios',
}: AcademyExercisesPanelProps)
{
  const habitos = useTaskStore((s) => s.habitos)
  const updateAcademyTreinoConfig = useTaskStore((s) => s.updateAcademyTreinoConfig)

  const treino = habitos.find((h) => h.tipo === 'treino')
  const diaRef: AcademyDiaRef = diaRefProp
    ?? { modo: 'semana', key: diaKeyProp ?? hojeDiaTreinoKey() }

  const config = useMemo(
    () => mergeAcademyConfig(treino?.config as Parameters<typeof mergeAcademyConfig>[0]),
    [treino?.config],
  )
  const exercicios = useMemo(
    () => resolveExerciciosParaRef(treino?.config as Parameters<typeof resolveExerciciosParaRef>[0], diaRef),
    [treino?.config, diaRef],
  )
  const [graficoId, setGraficoId] = useState<string | null>(null)

  const exercicioGrafico = exercicios.find((e) => e.id === graficoId) ?? exercicios[0]
  const dadosGrafico = exercicioGrafico
    ? dadosGraficoCarga(config.historico_cargas, exercicioGrafico.id)
    : []

  const salvarLista = async (lista: AcademyExercise[]) =>
  {
    if (diaRef.modo === 'mes')
    {
      await updateAcademyTreinoConfig({
        exercicios_por_data: { [diaRef.iso]: lista },
      })
      return
    }
    await updateAcademyTreinoConfig({
      exercicios_por_dia: { [diaRef.key]: lista },
    })
  }

  const atualizarExercicio = (idx: number, patch: Partial<AcademyExercise>) =>
  {
    const next = exercicios.map((ex, i) => (i === idx ? { ...ex, ...patch } : ex))
    void salvarLista(next)
  }

  const removerExercicio = (idx: number) =>
  {
    void salvarLista(exercicios.filter((_, i) => i !== idx))
  }

  const adicionarExercicio = (ex: AcademyExercise) =>
  {
    void salvarLista([...exercicios, ex])
    setGraficoId(ex.id)
  }

  const adicionarLinhaEmBranco = () =>
  {
    void salvarLista([...exercicios, novoExercicioEmBranco()])
  }

  const salvarCustom = async (lib: LibraryExercise) =>
  {
    const lista = config.exercicios_customizados ?? []
    if (lista.some((e) => e.id === lib.id))
    {
      return
    }
    await updateAcademyTreinoConfig({
      exercicios_customizados: [...lista, lib],
    })
  }

  const vincularSuperset = (idx: number) =>
  {
    if (idx >= exercicios.length - 1)
    {
      return
    }
    void salvarLista(toggleSupersetPar(exercicios, idx, idx + 1))
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <AcademyExerciseLibraryPicker
          customLibrary={config.exercicios_customizados ?? []}
          onAdd={adicionarExercicio}
          onSaveCustom={(lib) => void salvarCustom(lib)}
        />
        <button
          type="button"
          onClick={adicionarLinhaEmBranco}
          className="flex items-center gap-1.5 px-3 py-2 rounded-sl border border-dashed border-line text-[11px] font-mono text-ink-muted hover:text-ink hover:border-accent/30 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          Linha em branco
        </button>
      </div>

      <section className="rounded-sl border border-line bg-card overflow-hidden">
        <header className="px-4 py-2.5 border-b border-line flex items-center gap-2">
          <Dumbbell className="w-3.5 h-3.5 text-ink-muted" />
          <h3 className="text-[11px] font-mono uppercase text-ink-muted">{tituloSecao}</h3>
          <span className="ml-auto font-mono text-[9px] text-ink-muted tabular-nums">
            {exercicios.length} item(ns)
          </span>
        </header>
        {exercicios.length === 0 ? (
          <p className={`px-4 py-4 text-[12px] ${AXEL_TEXT_SECONDARY}`}>
            Nenhum exercício ainda. Use a biblioteca ou adicione uma linha em branco.
          </p>
        ) : (
          <ul className="divide-y divide-line">
            {exercicios.map((ex, idx) => (
              <li key={`${ex.id}-${idx}`} className="px-4 py-3 space-y-2">
                <div className="flex items-start gap-2">
                  <input
                    type="text"
                    value={ex.nome}
                    onChange={(e) => atualizarExercicio(idx, { nome: e.target.value })}
                    placeholder="Nome do exercício"
                    className={`flex-1 bg-transparent text-[13px] font-medium ${AXEL_TEXT_PRIMARY} outline-none placeholder:text-ink-muted/60`}
                  />
                  {ex.superset_id && (
                    <span className="shrink-0 px-1.5 py-0.5 rounded font-mono text-[9px] uppercase bg-accent/15 text-accent border border-accent/25">
                      Superset
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => removerExercicio(idx)}
                    className="p-1 text-ink-muted hover:text-urgent"
                    aria-label="Remover exercício"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="flex flex-wrap gap-2 items-center">
                  <label className="flex items-center gap-1 text-[10px] font-mono text-ink-muted">
                    Séries
                    <input
                      type="number"
                      min={1}
                      max={10}
                      value={ex.series}
                      onChange={(e) => atualizarExercicio(idx, { series: Number(e.target.value) })}
                      className="w-12 px-1 py-0.5 rounded border border-line bg-chrome text-ink text-[11px]"
                    />
                  </label>
                  <label className="flex items-center gap-1 text-[10px] font-mono text-ink-muted">
                    Reps
                    <input
                      type="text"
                      value={ex.reps_alvo}
                      onChange={(e) => atualizarExercicio(idx, { reps_alvo: e.target.value })}
                      className="w-16 px-1 py-0.5 rounded border border-line bg-chrome text-ink text-[11px]"
                    />
                  </label>
                  <label className="flex items-center gap-1 text-[10px] font-mono text-ink-muted">
                    kg
                    <input
                      type="number"
                      min={0}
                      step={0.5}
                      value={ex.carga_kg ?? ''}
                      onChange={(e) => atualizarExercicio(idx, { carga_kg: Number(e.target.value) })}
                      className="w-14 px-1 py-0.5 rounded border border-line bg-chrome text-ink text-[11px]"
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() => setGraficoId(ex.id)}
                    className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded border ${
                      graficoId === ex.id || (!graficoId && idx === 0)
                        ? 'border-accent/40 text-accent bg-accent/10'
                        : 'border-line text-ink-muted'
                    }`}
                  >
                    Gráfico
                  </button>
                  {idx < exercicios.length - 1 && (
                    <button
                      type="button"
                      onClick={() => vincularSuperset(idx)}
                      className="flex items-center gap-1 text-[10px] font-mono uppercase text-ink-muted hover:text-accent"
                      title="Superset com o próximo (sem descanso entre eles)"
                    >
                      <Link2 className="w-3 h-3" />
                      {ex.superset_id === exercicios[idx + 1]?.superset_id ? 'Desvincular' : 'Superset'}
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {exercicioGrafico && dadosGrafico.length > 0 && (
        <section className="rounded-sl border border-line bg-card p-4">
          <h3 className="text-[11px] font-mono uppercase text-ink-muted mb-2">
            Evolução · {exercicioGrafico.nome || 'Exercício'}
          </h3>
          <AcademyLoadChart dados={dadosGrafico} exercicioNome={exercicioGrafico.nome} />
        </section>
      )}
    </div>
  )
}
