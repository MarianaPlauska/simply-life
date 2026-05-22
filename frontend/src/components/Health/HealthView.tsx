import { useEffect, useMemo, useState } from 'react'
import {
  Pill, Droplets, Dumbbell, Beef, HeartPulse, Sparkles,
  Plus, Trash2, Minus, Check, Clock, X, BookOpen, Moon, Brain,
} from 'lucide-react'
import { toast } from 'sonner'
import { useTaskStore } from '../../store/useTaskStore'
import type { HabitoDiario } from '../../store/useTaskStore'
import { MoodTracker } from './MoodTracker'
import { JournalEntry } from './JournalEntry'
import { WeeklyReviewCard } from './WeeklyReviewCard'
import { WaterTrackerCard } from './WaterTrackerCard'
import { ProteinGoalCard } from './ProteinGoalCard'
import { WorkoutTrackerCard } from './WorkoutTrackerCard'
import { EmptyState } from '../ui/EmptyState'

type HealthTab = 'hidratacao' | 'alimentacao' | 'academia' | 'medicamentos' | 'bem_estar'

const TABS: { id: HealthTab; label: string; Icon: typeof Droplets; color: string }[] = [
  { id: 'hidratacao',    label: 'Hidratação',    Icon: Droplets,   color: 'text-cyan-400'    },
  { id: 'alimentacao',   label: 'Alimentação',   Icon: Beef,       color: 'text-amber-400'   },
  { id: 'academia',      label: 'Academia',      Icon: Dumbbell,   color: 'text-white'       },
  { id: 'medicamentos',  label: 'Medicamentos',  Icon: Pill,       color: 'text-teal-400'    },
  { id: 'bem_estar',     label: 'Bem-estar',     Icon: HeartPulse, color: 'text-rose-400'    },
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
  const [tab, setTab] = useState<HealthTab>('hidratacao')

  const medicamentos = useTaskStore((s) => s.medicamentos)
  const fetchMedicamentos = useTaskStore((s) => s.fetchMedicamentos)
  const toggleMedicamento = useTaskStore((s) => s.toggleMedicamento)
  const addMedicamento = useTaskStore((s) => s.addMedicamento)
  const habitos = useTaskStore((s) => s.habitos)
  const fetchHabitos = useTaskStore((s) => s.fetchHabitos)
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

  useEffect(() =>
  {
    fetchMedicamentos()
    fetchHabitos()
    fetchSessaoTreinoAtiva()
    fetchSessoesTreinoHoje()
    fetchHumorHoje()
    fetchHumorSemana()
    fetchHumorMes()
    fetchDiarioHoje()
    fetchPromptDoDia()
  }, [
    fetchMedicamentos, fetchHabitos, fetchSessaoTreinoAtiva, fetchSessoesTreinoHoje,
    fetchHumorHoje, fetchHumorSemana, fetchHumorMes, fetchDiarioHoje, fetchPromptDoDia,
  ])

  // resumo numérico topo
  const habitosGerais = useMemo(() => habitos.filter((h) => !CORE_HEALTH.has(h.tipo)), [habitos])
  const totalMeds = medicamentos.length
  const medsTomados = medicamentos.filter((m) => m.tomado).length

  return (
    <div className="max-w-6xl mx-auto pb-16 space-y-5">
      <header className="space-y-3">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Saúde</h1>
          <p className="text-sm text-zinc-400 mt-1">Hidratação, alimentação, academia, medicamentos e bem-estar.</p>
        </div>

        <nav className="flex flex-wrap items-center gap-1 border-b border-zinc-800/80 pb-0">
          {TABS.map(({ id, label, Icon, color }) =>
          {
            const active = tab === id
            return (
              <button
                key={id}
                onClick={() => setTab(id)}
                className={[
                  'flex items-center gap-2 px-3 py-2 text-[13px] font-medium border-b-2 -mb-px transition-colors',
                  active
                    ? 'border-violet-500 text-white'
                    : 'border-transparent text-zinc-500 hover:text-zinc-200',
                ].join(' ')}
              >
                <Icon className={`w-4 h-4 ${active ? color : 'text-zinc-500'}`} />
                {label}
              </button>
            )
          })}
        </nav>
      </header>

      {tab === 'hidratacao' && (
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <WaterTrackerCard />
          <HabitosExtrasSection
            tipos={['sono']}
            habitos={habitos}
            onAdd={addHabito}
            onInc={incrementHabito}
            onDec={decrementHabito}
            onDel={deleteHabito}
            onConcluir={concluirHabito}
          />
        </section>
      )}

      {tab === 'alimentacao' && (
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <ProteinGoalCard />
          <div className="rounded-xl border border-zinc-800/50 bg-zinc-900/40 p-5 text-[13px] text-zinc-400">
            <h2 className="text-base font-semibold text-white mb-2">Refeições</h2>
            <p>Em breve: log rápido de café, almoço, jantar com macros. Por enquanto, foque na meta de proteína.</p>
          </div>
        </section>
      )}

      {tab === 'academia' && (
        <section className="space-y-4">
          <WorkoutTrackerCard />
          <HabitosExtrasSection
            tipos={['exercicio', 'customizado']}
            habitos={habitosGerais.filter((h) => h.tipo === 'exercicio' || h.tipo === 'customizado')}
            onAdd={addHabito}
            onInc={incrementHabito}
            onDec={decrementHabito}
            onDel={deleteHabito}
            onConcluir={concluirHabito}
          />
        </section>
      )}

      {tab === 'medicamentos' && (
        <MedicamentosSection
          medicamentos={medicamentos}
          totalMeds={totalMeds}
          medsTomados={medsTomados}
          onAdd={addMedicamento}
          onToggle={toggleMedicamento}
          onConcluir={concluirHabito}
        />
      )}

      {tab === 'bem_estar' && (
        <section className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-1"><JournalEntry /></div>
            <div className="lg:col-span-2"><MoodTracker /></div>
          </div>
          <WeeklyReviewCard />
          <HabitosExtrasSection
            tipos={['leitura', 'meditacao', 'customizado']}
            habitos={habitosGerais.filter((h) => h.tipo !== 'exercicio')}
            onAdd={addHabito}
            onInc={incrementHabito}
            onDec={decrementHabito}
            onDel={deleteHabito}
            onConcluir={concluirHabito}
          />
        </section>
      )}
    </div>
  )
}

interface HabitosExtrasProps
{
  tipos: string[]
  habitos: HabitoDiario[]
  onAdd: (preset: typeof PRESET_HABITOS[number]) => Promise<HabitoDiario | null | void>
  onInc: (id: number) => Promise<void> | void
  onDec: (id: number) => Promise<void> | void
  onDel: (id: number) => Promise<void> | void
  onConcluir: (pontos: number) => void
}

function HabitosExtrasSection({ habitos, onAdd, onInc, onDec, onDel, onConcluir }: HabitosExtrasProps)
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
    <div className="rounded-xl border border-zinc-800/50 bg-zinc-900/40 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-[14px] font-semibold text-white">Hábitos extras</h3>
      </div>

      {habitos.length === 0 ? (
        <p className="text-[13px] text-zinc-500">Nenhum hábito nesta aba ainda.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {habitos.map((h) =>
          {
            const pct = h.meta_diaria > 0 ? Math.min((h.progresso_atual / h.meta_diaria) * 100, 100) : 0
            const HIcon = ICON_MAP[h.tipo] || Sparkles
            return (
              <div key={h.id} className="rounded-lg border border-zinc-800/60 bg-zinc-950/40 p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <HIcon className="w-4 h-4 text-zinc-400" />
                    <span className="text-[13px] font-medium text-zinc-200">{h.nome_exibicao}</span>
                  </div>
                  <button onClick={() => onDel(h.id)} className="text-zinc-600 hover:text-red-400">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
                <div className="h-1.5 rounded-full bg-zinc-800 overflow-hidden mb-2">
                  <div className="h-full bg-emerald-500 transition-all duration-500" style={{ width: `${pct}%` }} />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button onClick={() => onDec(h.id)} disabled={h.progresso_atual <= 0} className="w-7 h-7 rounded border border-zinc-700 text-zinc-400 hover:text-white disabled:opacity-30">
                      <Minus className="w-3.5 h-3.5 mx-auto" />
                    </button>
                    <span className="text-base font-bold tabular-nums text-white">{h.progresso_atual}<span className="text-[11px] text-zinc-500">/{h.meta_diaria}</span></span>
                    <button onClick={() => handleInc(h)} className="w-7 h-7 rounded border border-zinc-700 text-zinc-400 hover:text-white">
                      <Plus className="w-3.5 h-3.5 mx-auto" />
                    </button>
                  </div>
                  <span className="text-[11px] text-zinc-500">{h.unidade}</span>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <div className="flex flex-wrap gap-2 pt-2 border-t border-zinc-800/60">
        {PRESET_HABITOS.filter((p) => !habitos.some((h) => h.tipo === p.tipo)).map((preset) =>
        {
          const PIcon = ICON_MAP[preset.tipo] || Sparkles
          return (
            <button
              key={preset.tipo}
              onClick={() => { void onAdd(preset); toast.success(`${preset.nome_exibicao} adicionado!`) }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-zinc-800/60 bg-zinc-950/40 text-[12px] text-zinc-300 hover:text-white hover:border-zinc-700"
            >
              <PIcon className="w-3.5 h-3.5" />{preset.nome_exibicao}
              <Plus className="w-3 h-3 text-zinc-500" />
            </button>
          )
        })}
      </div>
    </div>
  )
}

interface MedicamentosProps
{
  medicamentos: { id: number; nome: string; horario: string; tomado: boolean }[]
  totalMeds: number
  medsTomados: number
  onAdd: (med: { nome: string; horario: string }) => Promise<void>
  onToggle: (id: number) => Promise<void> | void
  onConcluir: (pontos: number) => void
}

function MedicamentosSection({ medicamentos, totalMeds, medsTomados, onAdd, onToggle, onConcluir }: MedicamentosProps)
{
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ nome: '', horario: '' })
  const pct = totalMeds > 0 ? (medsTomados / totalMeds) * 100 : 0

  const handleAdd = async () =>
  {
    if (!form.nome.trim() || !form.horario.trim()) return
    await onAdd({ nome: form.nome.trim(), horario: form.horario.trim() })
    setForm({ nome: '', horario: '' })
    setShowForm(false)
    toast.success('Medicamento adicionado')
  }

  const handleToggle = (id: number) =>
  {
    const med = medicamentos.find((m) => m.id === id)
    if (med && !med.tomado)
    {
      onConcluir(10)
      toast.success('+10 pts', { description: med.nome })
    }
    void onToggle(id)
  }

  return (
    <section className="rounded-xl border border-zinc-800/50 bg-zinc-900/40 p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-white flex items-center gap-2">
            <Pill className="w-4 h-4 text-teal-400" /> Medicamentos
          </h2>
          <p className="text-[12px] text-zinc-500 mt-0.5">
            {medsTomados}/{totalMeds} tomados hoje
          </p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-teal-500/10 border border-teal-500/30 text-[12px] text-teal-300 hover:bg-teal-500/20"
        >
          <Plus className="w-3.5 h-3.5" /> Novo medicamento
        </button>
      </div>

      <div className="h-1.5 rounded-full bg-zinc-800/60 overflow-hidden">
        <div className="h-full bg-teal-500 transition-all duration-500" style={{ width: `${pct}%` }} />
      </div>

      {showForm && (
        <div className="rounded-lg border border-zinc-800/60 bg-zinc-950/60 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-medium text-white">Adicionar Medicamento</span>
            <button onClick={() => setShowForm(false)}><X className="w-4 h-4 text-zinc-500 hover:text-white" /></button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <input
              type="text"
              placeholder="Nome do medicamento"
              value={form.nome}
              onChange={(e) => setForm({ ...form, nome: e.target.value })}
              className="bg-zinc-900 border border-zinc-700 rounded-md px-3 py-2 text-[13px] text-white placeholder:text-zinc-500 outline-none focus:border-teal-500"
            />
            <input
              type="text"
              placeholder="Horário (ex: 08:00)"
              value={form.horario}
              onChange={(e) => setForm({ ...form, horario: e.target.value })}
              className="bg-zinc-900 border border-zinc-700 rounded-md px-3 py-2 text-[13px] text-white placeholder:text-zinc-500 outline-none focus:border-teal-500"
            />
          </div>
          <button
            onClick={handleAdd}
            disabled={!form.nome.trim() || !form.horario.trim()}
            className="px-4 py-2 text-[13px] font-medium bg-teal-600 text-white rounded-md hover:bg-teal-500 disabled:opacity-40"
          >
            Salvar
          </button>
        </div>
      )}

      {totalMeds === 0 ? (
        <EmptyState
          icon={Pill}
          title="Nenhum medicamento cadastrado"
          description="Adicione seus medicamentos com horário. O Jarvis lembra você no Kanban com prioridade máxima."
          actionLabel="Novo medicamento"
          onAction={() => setShowForm(true)}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {medicamentos.map((med) => (
            <button
              key={med.id}
              onClick={() => handleToggle(med.id)}
              className={[
                'flex items-center gap-3 rounded-lg border p-3 transition-all text-left',
                med.tomado
                  ? 'bg-zinc-900/30 border-zinc-800/30'
                  : 'bg-zinc-900/40 border-zinc-800/60 hover:border-teal-500/40',
              ].join(' ')}
            >
              <div className={[
                'w-5 h-5 rounded border-2 flex items-center justify-center shrink-0',
                med.tomado ? 'bg-teal-500 border-teal-500' : 'border-zinc-600',
              ].join(' ')}>
                {med.tomado && <Check className="w-3 h-3 text-white" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-[13px] ${med.tomado ? 'text-zinc-500 line-through' : 'text-zinc-100'}`}>{med.nome}</p>
                <div className="flex items-center gap-1 mt-0.5">
                  <Clock className="w-3 h-3 text-zinc-500" />
                  <span className="text-[11px] text-zinc-500">{med.horario}</span>
                </div>
              </div>
              <span className={[
                'text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded',
                med.tomado ? 'text-teal-400/70' : 'text-zinc-500',
              ].join(' ')}>
                {med.tomado ? 'Tomado' : 'Pendente'}
              </span>
            </button>
          ))}
        </div>
      )}
    </section>
  )
}
