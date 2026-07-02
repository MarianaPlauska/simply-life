import { useEffect, useMemo, useCallback } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  Plus, Trash2, Minus, BookOpen, Moon, Brain, Sun, Sparkles, HeartPulse, LayoutGrid,
} from 'lucide-react'
import { toast } from 'sonner'
import { useTaskStore } from '../../store/useTaskStore'
import type { HabitoDiario } from '../../store/useTaskStore'
import { buildHealthRitual } from '../../lib/healthRitual'
import { countDoseProgress } from '../../lib/medicamentosSchedule'
import {
  parseHealthRoute,
  healthSectionHash,
  cuidadosTabHash,
  type HealthSection,
  type CuidadosTab,
} from '../../lib/healthRoute'
import { HealthDiaryTab } from './HealthDiaryTab'
import { WeeklyReviewCard } from './WeeklyReviewCard'
import { BemEstarWelcomePanel } from '../wellbeing/BemEstarWelcomePanel'
import { HealthTodayPanel } from './HealthTodayPanel'
import { HealthCuidadosPanel } from './HealthCuidadosPanel'
import { HealthNutritionStrip } from './HealthNutritionStrip'
import { healthHeaderSubtitle } from './healthSectionMeta'
import { AXEL_CANVAS, AXEL_MAIN_PB_MOBILE, AXEL_MAIN_PT, AXEL_PAGE_SHELL_MOBILE_NARROW } from '../../constants/axelSurfaces'

// HealthView — hub com 4 seções + subabas em Cuidados

const SECTIONS: {
  id: HealthSection
  label: string
  short: string
  Icon: typeof Sun
}[] = [
  { id: 'hoje', label: 'Hoje', short: 'Hoje', Icon: Sun },
  { id: 'cuidados', label: 'Cuidados', short: 'Cuidados', Icon: LayoutGrid },
  { id: 'diario', label: 'Diário', short: 'Diário', Icon: BookOpen },
  { id: 'bem_estar', label: 'Bem-estar', short: 'Humor', Icon: HeartPulse },
]

const ICON_MAP: Record<string, React.ElementType> = {
  sono: Moon, leitura: BookOpen, meditacao: Brain, customizado: Sparkles,
}

const PRESET_HABITOS = [
  { tipo: 'sono',      nome_exibicao: 'Horas de Sono',         meta_diaria: 8,  unidade: 'horas'   },
  { tipo: 'leitura',   nome_exibicao: 'Páginas Lidas',         meta_diaria: 20, unidade: 'páginas' },
  { tipo: 'meditacao', nome_exibicao: 'Minutos de Meditação',  meta_diaria: 10, unidade: 'min'     },
]

const CORE_HEALTH = new Set(['agua', 'proteina', 'treino'])

export function HealthView()
{
  const location = useLocation()
  const navigate = useNavigate()
  const route = useMemo(() => parseHealthRoute(location.hash), [location.hash])
  const section = route.section
  const cuidadosTab = route.cuidados

  const selectSection = useCallback((id: HealthSection) =>
  {
    const hash = healthSectionHash(id, cuidadosTab)
    navigate(`/saude#${hash}`, { replace: true })
  }, [navigate, cuidadosTab])

  const selectCuidadosTab = useCallback((tab: CuidadosTab) =>
  {
    navigate(`/saude#${cuidadosTabHash(tab)}`, { replace: true })
  }, [navigate])

  const goFromToday = useCallback((target: string) =>
  {
    if (target === 'bem_estar')
    {
      navigate('/saude#bem-estar', { replace: true })
      return
    }
    if (target === 'hidratacao' || target === 'alimentacao' || target === 'academia' || target === 'medicamentos')
    {
      navigate(`/saude#${cuidadosTabHash(target as CuidadosTab)}`, { replace: true })
    }
  }, [navigate])

  const medicamentos = useTaskStore((s) => s.medicamentos)
  const medicamentoTomadas = useTaskStore((s) => s.medicamentoTomadas)
  const humorHojeLista = useTaskStore((s) => s.humorHojeLista)
  const habitos = useTaskStore((s) => s.habitos)
  const fetchMedicamentos = useTaskStore((s) => s.fetchMedicamentos)
  const fetchMedicamentoTomadas = useTaskStore((s) => s.fetchMedicamentoTomadas)
  const fetchHabitos = useTaskStore((s) => s.fetchHabitos)
  const fetchHabitosStreaks = useTaskStore((s) => s.fetchHabitosStreaks)
  const fetchSessaoTreinoAtiva = useTaskStore((s) => s.fetchSessaoTreinoAtiva)
  const fetchSessoesTreinoHoje = useTaskStore((s) => s.fetchSessoesTreinoHoje)
  const addHabito = useTaskStore((s) => s.addHabito)
  const incrementHabito = useTaskStore((s) => s.incrementHabito)
  const decrementHabito = useTaskStore((s) => s.decrementHabito)
  const deleteHabito = useTaskStore((s) => s.deleteHabito)
  const concluirHabito = useTaskStore((s) => s.concluirHabito)
  const fetchHumorHoje = useTaskStore((s) => s.fetchHumorHoje)
  const fetchHumorSemana = useTaskStore((s) => s.fetchHumorSemana)
  const fetchHumorMes = useTaskStore((s) => s.fetchHumorMes)
  const fetchDiarioHoje = useTaskStore((s) => s.fetchDiarioHoje)
  const fetchPromptDoDia = useTaskStore((s) => s.fetchPromptDoDia)
  const fetchEntradasRecentes = useTaskStore((s) => s.fetchEntradasRecentes)

  // Dados leves — ritual e header em qualquer aba
  useEffect(() =>
  {
    fetchMedicamentos()
    fetchMedicamentoTomadas()
    fetchHabitos()
  }, [fetchMedicamentos, fetchMedicamentoTomadas, fetchHabitos])

  useEffect(() =>
  {
    if (section !== 'hoje')
    {
      return
    }
    fetchHumorHoje()
    fetchHabitosStreaks()
  }, [section, fetchHumorHoje, fetchHabitosStreaks])

  useEffect(() =>
  {
    if (section !== 'cuidados')
    {
      return
    }
    fetchHabitosStreaks()
    fetchSessaoTreinoAtiva()
    fetchSessoesTreinoHoje()
  }, [section, fetchHabitosStreaks, fetchSessaoTreinoAtiva, fetchSessoesTreinoHoje])

  useEffect(() =>
  {
    if (section !== 'bem_estar')
    {
      return
    }
    fetchHumorHoje()
    fetchHumorSemana()
    fetchHumorMes()
  }, [section, fetchHumorHoje, fetchHumorSemana, fetchHumorMes])

  useEffect(() =>
  {
    if (section !== 'diario')
    {
      return
    }
    fetchDiarioHoje()
    fetchPromptDoDia()
    fetchEntradasRecentes(60)
  }, [section, fetchDiarioHoje, fetchPromptDoDia, fetchEntradasRecentes])

  const habitosGerais = useMemo(() => habitos.filter((h) => !CORE_HEALTH.has(h.tipo)), [habitos])

  const ritualSnapshot = useMemo(() =>
  {
    const agua = habitos.find((h) => h.tipo === 'agua')
    const doseProgress = countDoseProgress(medicamentos, medicamentoTomadas)
    return buildHealthRitual({
      humorHojeCount: humorHojeLista.length,
      aguaCopos: agua?.progresso_atual ?? 0,
      aguaMeta: agua?.meta_diaria ?? 8,
      medicamentosTotal: doseProgress.total || medicamentos.length,
      medicamentosTomados: doseProgress.tomados,
    })
  }, [habitos, humorHojeLista.length, medicamentos, medicamentoTomadas])

  const headerLine = healthHeaderSubtitle(section, cuidadosTab, {
    ritualPct: ritualSnapshot.percent,
    ritualDone: ritualSnapshot.doneCount,
    ritualTotal: ritualSnapshot.totalApplicable,
  })

  return (
    <div className={`w-full min-h-0 flex flex-col ${AXEL_CANVAS} ${AXEL_MAIN_PT} ${AXEL_MAIN_PB_MOBILE}`}>
      <div className={`${AXEL_PAGE_SHELL_MOBILE_NARROW} px-4 sm:px-6 lg:px-8 flex flex-col flex-1 min-h-0`}>
        <header className="space-y-2 shrink-0">
          <div className="flex flex-col gap-0.5">
            <h1 className="text-xl sm:text-2xl font-display font-semibold text-ink tracking-tight">
              Saúde
            </h1>
            <p className="text-[12px] sm:text-[13px] text-ink-muted leading-relaxed">
              Vitalidade no seu ritmo — conectada ao Kanban, Dashboard e AXEL.
            </p>
          </div>
          <p className="font-mono text-[10px] text-ink-muted tabular-nums leading-relaxed">
            {headerLine}
          </p>
          <HealthNutritionStrip />
        </header>

        <nav
          className="mt-3"
          aria-label="Seções de saúde"
        >
          <div className="flex gap-1 p-1 rounded-sl bg-chrome border border-line">
            {SECTIONS.map(({ id, label, short, Icon }) =>
            {
              const active = section === id
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => selectSection(id)}
                  className={[
                    'flex-1 flex items-center justify-center gap-1.5 px-2 py-2.5 rounded-sl text-[11px] font-mono whitespace-nowrap transition-colors min-h-[44px]',
                    active
                      ? 'bg-card text-ink border border-line shadow-sm'
                      : 'text-ink-muted border border-transparent hover:text-ink',
                  ].join(' ')}
                >
                  <Icon className={`w-3.5 h-3.5 shrink-0 ${active && id === 'bem_estar' ? 'text-rose-400' : active ? 'text-accent' : ''}`} />
                  <span className="sm:hidden">{short}</span>
                  <span className="hidden sm:inline">{label}</span>
                </button>
              )
            })}
          </div>
        </nav>

        <div className="flex-1 py-4 sm:py-5 space-y-4 sm:space-y-5 min-h-0">
          {section === 'hoje' && (
            <HealthTodayPanel onSelectTab={goFromToday} />
          )}

          {section === 'cuidados' && (
            <HealthCuidadosPanel active={cuidadosTab} onSelect={selectCuidadosTab} />
          )}

          {section === 'diario' && (
            <HealthDiaryTab />
          )}

          {section === 'bem_estar' && (
            <section className="space-y-4">
              <BemEstarWelcomePanel />
              <WeeklyReviewCard />
              <HabitosExtras
                habitos={habitosGerais.filter((h) => h.tipo !== 'exercicio')}
                onAdd={addHabito} onInc={incrementHabito} onDec={decrementHabito}
                onDel={deleteHabito} onConcluir={concluirHabito}
                preset={PRESET_HABITOS.filter((p) => p.tipo !== 'sono')}
              />
            </section>
          )}
        </div>
      </div>
    </div>
  )
}

interface HabitosProps
{
  habitos: HabitoDiario[]
  preset: typeof PRESET_HABITOS
  onAdd: (preset: typeof PRESET_HABITOS[number]) => Promise<HabitoDiario | null | void>
  onInc: (id: number) => Promise<void> | void
  onDec: (id: number) => Promise<void> | void
  onDel: (id: number) => Promise<void> | void
  onConcluir: (pontos: number) => void
}

function HabitosExtras({ habitos, preset, onAdd, onInc, onDec, onDel, onConcluir }: HabitosProps)
{
  const handleInc = (h: HabitoDiario) =>
  {
    if (h.progresso_atual >= h.meta_diaria) return
    onInc(h.id)
    if (h.progresso_atual + 1 === h.meta_diaria)
    {
      onConcluir(15)
      toast.success(`${h.nome_exibicao} completo! +15 pts`)
    }
  }

  return (
    <div className="rounded-sl border border-line bg-card overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-line min-h-[48px]">
        <h3 className="text-[12px] font-semibold text-ink">Hábitos</h3>
        <span className="text-[11px] text-ink-muted font-mono">{habitos.length} ativo{habitos.length !== 1 ? 's' : ''}</span>
      </div>

      {habitos.length === 0 ? (
        <p className="px-4 py-4 text-[12px] text-ink-muted">Nenhum hábito ainda.</p>
      ) : (
        <ul className="divide-y divide-line">
          {habitos.map((h) =>
          {
            const pct = h.meta_diaria > 0 ? Math.min((h.progresso_atual / h.meta_diaria) * 100, 100) : 0
            const HIcon = ICON_MAP[h.tipo] || Sparkles
            return (
              <li key={h.id} className="flex items-center gap-2 px-4 py-3 min-h-[52px] hover:bg-chrome/30 transition-colors">
                <HIcon className="w-4 h-4 text-ink-muted shrink-0" />
                <span className="flex-1 min-w-0 text-[13px] text-ink truncate">{h.nome_exibicao}</span>
                <div className="w-16 sm:w-20 h-1.5 rounded-sl bg-chrome overflow-hidden shrink-0">
                  <div className="h-full bg-accent transition-all" style={{ width: `${pct}%` }} />
                </div>
                <button
                  type="button"
                  onClick={() => onDec(h.id)}
                  disabled={h.progresso_atual <= 0}
                  className="p-2 -m-1 text-ink-muted hover:text-ink disabled:opacity-30 min-w-[40px] min-h-[40px] flex items-center justify-center"
                  aria-label="Diminuir"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="text-[11px] font-mono tabular-nums text-ink w-12 text-center shrink-0">
                  {h.progresso_atual}/{h.meta_diaria}
                </span>
                <button
                  type="button"
                  onClick={() => handleInc(h)}
                  className="p-2 -m-1 text-ink-muted hover:text-ink min-w-[40px] min-h-[40px] flex items-center justify-center"
                  aria-label="Aumentar"
                >
                  <Plus className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => onDel(h.id)}
                  className="p-2 -m-1 text-ink-muted hover:text-rose-400 min-w-[40px] min-h-[40px] flex items-center justify-center"
                  aria-label="Remover hábito"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </li>
            )
          })}
        </ul>
      )}

      {preset.length > 0 && (
        <div className="flex flex-wrap gap-2 px-4 py-3 border-t border-line">
          {preset.filter((p) => !habitos.some((h) => h.tipo === p.tipo)).map((p) =>
          {
            const PIcon = ICON_MAP[p.tipo] || Sparkles
            return (
              <button
                key={p.tipo}
                type="button"
                onClick={() => { void onAdd(p); toast.success(`${p.nome_exibicao} adicionado`) }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-sl text-[11px] text-ink-muted hover:text-ink border border-line hover:bg-chrome min-h-[40px]"
              >
                <PIcon className="w-3.5 h-3.5" />
                {p.nome_exibicao}
                <Plus className="w-3 h-3 opacity-60" />
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
