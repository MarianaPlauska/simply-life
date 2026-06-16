import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Dumbbell, Play, Check, Calendar } from 'lucide-react'
import { toast } from 'sonner'
import { useTaskStore } from '../../store/useTaskStore'
import { TREINO_PRESET } from '../../constants/healthPresets'
import { AXEL_TEXT_PRIMARY, AXEL_TEXT_SECONDARY } from '../../constants/axelSurfaces'

// Academia — plano semanal + cronômetro (dia / semana / mês)

const DIAS = [
  { key: 'seg', label: 'Seg' },
  { key: 'ter', label: 'Ter' },
  { key: 'qua', label: 'Qua' },
  { key: 'qui', label: 'Qui' },
  { key: 'sex', label: 'Sex' },
  { key: 'sab', label: 'Sáb' },
  { key: 'dom', label: 'Dom' },
] as const

const DIA_KEYS = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sab'] as const

function hojeKey(): string
{
  return DIA_KEYS[new Date().getDay()]
}

export function WorkoutPlannerCard()
{
  const navigate = useNavigate()
  const habitos = useTaskStore((s) => s.habitos)
  const ensureHealthHabit = useTaskStore((s) => s.ensureHealthHabit)
  const updateTreinoPlanoSemana = useTaskStore((s) => s.updateTreinoPlanoSemana)
  const iniciarTreino = useTaskStore((s) => s.iniciarTreino)
  const sessaoTreinoAtiva = useTaskStore((s) => s.sessaoTreinoAtiva)
  const sessoesTreinoHoje = useTaskStore((s) => s.sessoesTreinoHoje)
  const fetchSessoesTreinoHoje = useTaskStore((s) => s.fetchSessoesTreinoHoje)

  const [view, setView] = useState<'semana' | 'mes'>('semana')

  useEffect(() =>
  {
    void fetchSessoesTreinoHoje()
  }, [fetchSessoesTreinoHoje])

  const treino = useMemo(() => habitos.find((h) => h.tipo === 'treino'), [habitos])
  const plano = (treino?.config?.plano_semana ?? TREINO_PRESET.config.plano_semana) as Record<string, { titulo: string; meta_minutos: number }>
  const diaAtual = hojeKey()
  const treinoHoje = plano?.[diaAtual]

  const sessoesMes = useMemo(() =>
  {
    const now = new Date()
    return sessoesTreinoHoje.filter((s) =>
    {
      const d = new Date(s.iniciado_em)
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
    }).length
  }, [sessoesTreinoHoje])

  const concluidasHoje = sessoesTreinoHoje.filter((s) => s.concluido).length

  const handleEnsure = async () =>
  {
    await ensureHealthHabit(TREINO_PRESET)
    toast.success('Plano de treino ativado')
  }

  const handleStart = async () =>
  {
    if (sessaoTreinoAtiva)
    {
      navigate('/foco')
      return
    }
    let h = treino ?? await ensureHealthHabit(TREINO_PRESET)
    if (!h)
    {
      return
    }
    const titulo = treinoHoje?.titulo ?? 'Treino'
    const minutos = treinoHoje?.meta_minutos ?? 45
    if (minutos <= 0)
    {
      toast.message('Dia de descanso — sem cronômetro hoje')
      return
    }
    await iniciarTreino(h.id, titulo, minutos)
    navigate('/foco')
  }

  const handleEditDia = async (key: string, titulo: string) =>
  {
    if (!treino) return
    const next = {
      ...plano,
      [key]: { ...plano?.[key], titulo, meta_minutos: plano?.[key]?.meta_minutos ?? 45 },
    }
    await updateTreinoPlanoSemana(next)
  }

  return (
    <div className="space-y-4">
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
              {treinoHoje?.titulo ?? 'Ative o plano'}
            </p>
            <p className={`text-[12px] mt-1 ${AXEL_TEXT_SECONDARY}`}>
              {treinoHoje && treinoHoje.meta_minutos > 0
                ? `Meta: ${treinoHoje.meta_minutos} min · ${concluidasHoje} sessão(ões) hoje`
                : 'Descanso programado — sem pressão'}
            </p>
          </div>
          <div className="text-right font-mono text-[10px] text-ink-muted">
            <p>{sessoesMes} no mês</p>
          </div>
        </div>

        {!treino ? (
          <button
            type="button"
            onClick={() => void handleEnsure()}
            className="w-full py-3 rounded-sl border border-line bg-chrome font-mono text-[11px] uppercase"
          >
            Ativar plano semanal
          </button>
        ) : (
          <button
            type="button"
            onClick={() => void handleStart()}
            disabled={!treinoHoje || treinoHoje.meta_minutos <= 0}
            className="w-full min-h-[48px] flex items-center justify-center gap-2 py-3 rounded-sl bg-accent/15 border border-accent/30 text-ink font-mono text-[11px] uppercase hover:bg-accent/20 disabled:opacity-40 transition-colors"
          >
            <Play className="w-4 h-4" />
            {sessaoTreinoAtiva ? 'Continuar cronômetro' : 'Iniciar com cronômetro'}
          </button>
        )}
      </section>

      <div className="flex gap-1 p-1 rounded-sl bg-chrome border border-line w-fit">
        {(['semana', 'mes'] as const).map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => setView(v)}
            className={`px-3 py-1.5 rounded-sl text-[11px] font-mono uppercase ${
              view === v ? 'bg-card text-ink border border-line' : 'text-ink-muted'
            }`}
          >
            {v === 'semana' ? 'Semana' : 'Mês'}
          </button>
        ))}
      </div>

      {view === 'semana' ? (
        <section className="rounded-sl border border-line bg-card overflow-hidden">
          <header className="px-4 py-2.5 border-b border-line flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5 text-ink-muted" />
            <h3 className="text-[11px] font-mono uppercase text-ink-muted">Plano da semana</h3>
          </header>
          <ul className="divide-y divide-line">
            {DIAS.map(({ key, label }) =>
            {
              const item = plano?.[key]
              const isToday = key === diaAtual
              const done = isToday && concluidasHoje > 0
              return (
                <li
                  key={key}
                  className={`px-4 py-3 flex items-center gap-3 min-h-[52px] ${isToday ? 'bg-accent-muted/20' : ''}`}
                >
                  <span className={`w-8 font-mono text-[11px] ${isToday ? 'text-accent font-semibold' : 'text-ink-muted'}`}>
                    {label}
                  </span>
                  <input
                    type="text"
                    value={item?.titulo ?? ''}
                    onChange={(e) => void handleEditDia(key, e.target.value)}
                    disabled={!treino}
                    className="flex-1 bg-transparent text-[13px] text-ink outline-none border-b border-transparent focus:border-line disabled:opacity-50"
                  />
                  <span className="font-mono text-[10px] text-ink-muted tabular-nums shrink-0">
                    {item?.meta_minutos ? `${item.meta_minutos}m` : '—'}
                  </span>
                  {done && <Check className="w-4 h-4 text-concluido shrink-0" />}
                </li>
              )
            })}
          </ul>
        </section>
      ) : (
        <section className="rounded-sl border border-line bg-card p-4">
          <p className={`text-[13px] ${AXEL_TEXT_PRIMARY}`}>
            {sessoesMes} treino(s) registrado(s) neste mês.
          </p>
          <p className={`text-[12px] mt-2 ${AXEL_TEXT_SECONDARY}`}>
            Cada sessão com cronômetro no Modo Academia conta para sua vitalidade.
          </p>
          <ul className="mt-3 space-y-2 max-h-40 overflow-y-auto">
            {sessoesTreinoHoje.map((s) => (
              <li key={s.id} className="flex justify-between text-[12px] text-ink-muted font-mono">
                <span className="text-ink truncate">{s.tipo_treino}</span>
                <span>{s.duracao_real_min ?? '—'} min</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
