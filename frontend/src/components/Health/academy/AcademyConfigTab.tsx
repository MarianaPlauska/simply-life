import { useEffect, useMemo, useState } from 'react'
import { useTaskStore } from '../../../store/useTaskStore'
import {
  DIAS_SEMANA,
  hojeDiaTreinoKey,
  mergeAcademyConfig,
  type AcademyDiaRef,
  type AcademyModoPlano,
} from '../../../lib/academyWorkouts'
import { localTodayIso } from '../../../lib/healthDayBoundary'
import { AXEL_TEXT_SECONDARY } from '../../../constants/axelSurfaces'
import { AcademyDayBuilder } from './AcademyDayBuilder'
import { AcademyMonthDayGrid } from './AcademyMonthDayGrid'

export function AcademyConfigTab()
{
  const habitos = useTaskStore((s) => s.habitos)
  const updateAcademyTreinoConfig = useTaskStore((s) => s.updateAcademyTreinoConfig)

  const treino = useMemo(() => habitos.find((h) => h.tipo === 'treino'), [habitos])
  const academyConfig = useMemo(
    () => mergeAcademyConfig(treino?.config as Parameters<typeof mergeAcademyConfig>[0]),
    [treino?.config],
  )

  const [modo, setModo] = useState<AcademyModoPlano>(
    () => academyConfig.academy_modo_plano ?? 'semana',
  )
  const [diaSemana, setDiaSemana] = useState(hojeDiaTreinoKey())
  const [diaMes, setDiaMes] = useState(localTodayIso())
  const [mesAtual] = useState(() => new Date())

  useEffect(() =>
  {
    if (academyConfig.academy_modo_plano && academyConfig.academy_modo_plano !== modo)
    {
      setModo(academyConfig.academy_modo_plano)
    }
  }, [academyConfig.academy_modo_plano, modo])

  const diaRef: AcademyDiaRef = modo === 'semana'
    ? { modo: 'semana', key: diaSemana }
    : { modo: 'mes', iso: diaMes }

  const trocarModo = async (next: AcademyModoPlano) =>
  {
    setModo(next)
    await updateAcademyTreinoConfig({ academy_modo_plano: next })
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <h3 className="text-[12px] font-medium text-ink">Montar treino</h3>
        <p className={`text-[11px] leading-relaxed ${AXEL_TEXT_SECONDARY}`}>
          Escolha o tipo de plano, selecione o dia e monte como uma lista - nome, duração e exercícios salvam automaticamente.
        </p>
      </div>

      <div className="flex gap-1 p-1 rounded-sl bg-chrome border border-line w-full">
        {([
          { id: 'semana' as const, label: 'Semana', hint: 'Repete todo mês' },
          { id: 'mes' as const, label: 'Mês', hint: 'Data específica' },
        ]).map(({ id, label, hint }) =>
        {
          const ativo = modo === id
          return (
            <button
              key={id}
              type="button"
              onClick={() => void trocarModo(id)}
              className={`flex-1 px-2 py-2 rounded-sl text-left transition-colors ${
                ativo ? 'bg-card border border-line shadow-sm' : 'border border-transparent'
              }`}
            >
              <span className={`block text-[11px] font-mono uppercase ${ativo ? 'text-ink' : 'text-ink-muted'}`}>
                {label}
              </span>
              <span className={`block text-[9px] mt-0.5 ${AXEL_TEXT_SECONDARY}`}>{hint}</span>
            </button>
          )
        })}
      </div>

      {modo === 'semana' ? (
        <div className="flex gap-1 overflow-x-auto custom-scrollbar custom-scrollbar-x pb-1">
          {DIAS_SEMANA.map(({ key, label }) =>
          {
            const ativo = key === diaSemana
            const isHoje = key === hojeDiaTreinoKey()
            return (
              <button
                key={key}
                type="button"
                onClick={() => setDiaSemana(key)}
                className={`px-3 py-1.5 rounded-sl text-[11px] font-mono whitespace-nowrap shrink-0 border transition-colors ${
                  ativo
                    ? 'bg-card text-ink border-line'
                    : 'text-ink-muted border-transparent hover:bg-chrome'
                } ${isHoje && !ativo ? 'ring-1 ring-accent/30' : ''}`}
              >
                {label}
              </button>
            )
          })}
        </div>
      ) : (
        <AcademyMonthDayGrid
          mes={mesAtual}
          diaSelecionado={diaMes}
          config={academyConfig}
          onSelect={setDiaMes}
        />
      )}

      <AcademyDayBuilder
        diaRef={diaRef}
        subtitulo={
          modo === 'semana'
            ? 'Este dia se repete em todas as semanas do mês.'
            : 'Vale só para esta data no calendário.'
        }
      />
    </div>
  )
}
