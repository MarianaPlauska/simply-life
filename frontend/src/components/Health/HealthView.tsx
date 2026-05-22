import { useEffect, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import {
  Pill, Droplets, Dumbbell, Beef, HeartPulse, Sparkles,
  Plus, Trash2, Minus, Clock, X, BookOpen, Moon, Brain,
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

// HealthView — visao unificada com aba ativa lida do hash (#hidratacao, #medicamentos...)
// Densidade alta, sem rounded-xl, bg-card (zinc-950) nas listas

type HealthTab = 'hidratacao' | 'alimentacao' | 'academia' | 'medicamentos' | 'bem_estar'

const TABS: { id: HealthTab; label: string; Icon: typeof Droplets; color: string }[] = [
  { id: 'hidratacao',    label: 'Hidratação',    Icon: Droplets,   color: 'text-cyan-400'    },
  { id: 'alimentacao',   label: 'Alimentação',   Icon: Beef,       color: 'text-amber-400'   },
  { id: 'academia',      label: 'Academia',      Icon: Dumbbell,   color: 'text-zinc-200'    },
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
  const location = useLocation()
  const initialTab = (location.hash.replace('#', '') as HealthTab) || 'hidratacao'
  const [tab, setTab] = useState<HealthTab>(initialTab)

  // sincroniza com submenu da sidebar
  useEffect(() =>
  {
    const fromHash = location.hash.replace('#', '') as HealthTab
    if (fromHash && fromHash !== tab) setTab(fromHash)
  }, [location.hash, tab])

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

  const habitosGerais = useMemo(() => habitos.filter((h) => !CORE_HEALTH.has(h.tipo)), [habitos])
  const totalMeds = medicamentos.length
  const medsTomados = medicamentos.filter((m) => m.tomado).length

  return (
    <div className="max-w-5xl mx-auto pb-12 space-y-3">
      <header>
        <div className="flex items-baseline gap-3">
          <h1 className="text-xl font-bold text-white tracking-tight">Saúde</h1>
          <span className="text-[12px] text-zinc-500">
            {medsTomados}/{totalMeds} medicamentos · {habitosGerais.length} hábitos ativos
          </span>
        </div>

        {/* abas — densas, sem moldura, igual a sub-sidebar */}
        <nav className="flex flex-wrap items-center gap-0 border-b border-zinc-900 mt-2">
          {TABS.map(({ id, label, Icon, color }) =>
          {
            const active = tab === id
            return (
              <button
                key={id}
                onClick={() => setTab(id)}
                className={[
                  'flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium border-b-2 -mb-px transition-colors',
                  active ? 'border-violet-500 text-white' : 'border-transparent text-zinc-500 hover:text-zinc-200',
                ].join(' ')}
              >
                <Icon className={`w-3.5 h-3.5 ${active ? color : 'text-zinc-500'}`} />
                {label}
              </button>
            )
          })}
        </nav>
      </header>

      {tab === 'hidratacao' && (
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          <WaterTrackerCard />
          <HabitosExtras
            habitos={habitos.filter((h) => h.tipo === 'sono')}
            onAdd={addHabito} onInc={incrementHabito} onDec={decrementHabito}
            onDel={deleteHabito} onConcluir={concluirHabito}
            preset={PRESET_HABITOS.filter((p) => p.tipo === 'sono')}
          />
        </section>
      )}

      {tab === 'alimentacao' && (
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          <ProteinGoalCard />
          <div className="bg-card border border-zinc-900 rounded-md p-3 text-[12px] text-zinc-400">
            <h2 className="text-[13px] font-semibold text-white mb-1">Refeições</h2>
            <p>Em breve: log rápido de café, almoço, jantar com macros.</p>
          </div>
        </section>
      )}

      {tab === 'academia' && (
        <section className="space-y-3">
          <WorkoutTrackerCard />
          <HabitosExtras
            habitos={habitosGerais.filter((h) => h.tipo === 'exercicio' || h.tipo === 'customizado')}
            onAdd={addHabito} onInc={incrementHabito} onDec={decrementHabito}
            onDel={deleteHabito} onConcluir={concluirHabito}
            preset={[]}
          />
        </section>
      )}

      {tab === 'medicamentos' && (
        <MedicamentosLista
          medicamentos={medicamentos}
          totalMeds={totalMeds}
          medsTomados={medsTomados}
          onAdd={addMedicamento}
          onToggle={toggleMedicamento}
          onConcluir={concluirHabito}
        />
      )}

      {tab === 'bem_estar' && (
        <section className="space-y-3">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
            <JournalEntry />
            <div className="lg:col-span-2"><MoodTracker /></div>
          </div>
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

// Lista de habitos como linhas densas — sem caixa dentro de caixa
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
    <div className="bg-card border border-zinc-900 rounded-md">
      <div className="flex items-center justify-between px-3 py-2 border-b border-zinc-900">
        <h3 className="text-[12px] font-semibold text-white">Hábitos</h3>
        <span className="text-[11px] text-zinc-500">{habitos.length} ativo{habitos.length !== 1 ? 's' : ''}</span>
      </div>

      {habitos.length === 0 ? (
        <p className="px-3 py-3 text-[12px] text-zinc-500">Nenhum hábito ainda.</p>
      ) : (
        <ul className="divide-y divide-zinc-900">
          {habitos.map((h) =>
          {
            const pct = h.meta_diaria > 0 ? Math.min((h.progresso_atual / h.meta_diaria) * 100, 100) : 0
            const HIcon = ICON_MAP[h.tipo] || Sparkles
            return (
              <li key={h.id} className="flex items-center gap-2 px-3 py-2 hover:bg-zinc-900/40 transition-colors">
                <HIcon className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                <span className="flex-1 min-w-0 text-[12px] text-zinc-200 truncate">{h.nome_exibicao}</span>
                <div className="w-20 h-1 rounded-full bg-zinc-900 overflow-hidden">
                  <div className="h-full bg-violet-500 transition-all" style={{ width: `${pct}%` }} />
                </div>
                <button onClick={() => onDec(h.id)} disabled={h.progresso_atual <= 0} className="text-zinc-500 hover:text-white disabled:opacity-30 p-0.5">
                  <Minus className="w-3 h-3" />
                </button>
                <span className="text-[11px] font-mono tabular-nums text-zinc-300 w-12 text-center">
                  {h.progresso_atual}/{h.meta_diaria}
                </span>
                <button onClick={() => handleInc(h)} className="text-zinc-500 hover:text-white p-0.5">
                  <Plus className="w-3 h-3" />
                </button>
                <button onClick={() => onDel(h.id)} className="text-zinc-600 hover:text-red-400 p-0.5 ml-1">
                  <Trash2 className="w-3 h-3" />
                </button>
              </li>
            )
          })}
        </ul>
      )}

      {preset.length > 0 && (
        <div className="flex flex-wrap gap-1.5 px-3 py-2 border-t border-zinc-900">
          {preset.filter((p) => !habitos.some((h) => h.tipo === p.tipo)).map((p) =>
          {
            const PIcon = ICON_MAP[p.tipo] || Sparkles
            return (
              <button
                key={p.tipo}
                onClick={() => { void onAdd(p); toast.success(`${p.nome_exibicao} adicionado`) }}
                className="flex items-center gap-1 px-2 py-0.5 rounded text-[11px] text-zinc-400 hover:text-white border border-zinc-900 hover:border-zinc-700"
              >
                <PIcon className="w-3 h-3" />{p.nome_exibicao}
                <Plus className="w-2.5 h-2.5 text-zinc-500" />
              </button>
            )
          })}
        </div>
      )}
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

// Medicamentos como linhas tipo "tudo é linha" do design system
function MedicamentosLista({ medicamentos, totalMeds, medsTomados, onAdd, onToggle, onConcluir }: MedicamentosProps)
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
    <section className="bg-card border border-zinc-900 rounded-md">
      <header className="flex items-center justify-between px-3 py-2 border-b border-zinc-900">
        <div className="flex items-center gap-2">
          <Pill className="w-4 h-4 text-teal-400" />
          <h2 className="text-[13px] font-semibold text-white">Medicamentos</h2>
          <span className="text-[11px] text-zinc-500">{medsTomados}/{totalMeds} hoje</span>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-1 px-2 py-0.5 rounded text-[11px] text-violet-300 hover:text-white border border-zinc-900 hover:border-violet-500/40"
        >
          <Plus className="w-3 h-3" /> Novo
        </button>
      </header>

      <div className="h-[2px] bg-zinc-900 overflow-hidden">
        <div className="h-full bg-teal-500 transition-all" style={{ width: `${pct}%` }} />
      </div>

      {showForm && (
        <div className="px-3 py-2 border-b border-zinc-900 flex items-center gap-2">
          <input
            type="text"
            placeholder="Nome"
            value={form.nome}
            onChange={(e) => setForm({ ...form, nome: e.target.value })}
            className="flex-1 bg-transparent border border-zinc-900 rounded px-2 py-1 text-[12px] text-white placeholder:text-zinc-600 outline-none focus:border-violet-500/40"
          />
          <input
            type="text"
            placeholder="08:00"
            value={form.horario}
            onChange={(e) => setForm({ ...form, horario: e.target.value })}
            className="w-20 bg-transparent border border-zinc-900 rounded px-2 py-1 text-[12px] text-white placeholder:text-zinc-600 outline-none focus:border-violet-500/40"
          />
          <button
            onClick={handleAdd}
            disabled={!form.nome.trim() || !form.horario.trim()}
            className="px-2 py-1 text-[11px] font-medium bg-violet-600 text-white rounded hover:bg-violet-500 disabled:opacity-40"
          >
            Salvar
          </button>
          <button onClick={() => setShowForm(false)} className="text-zinc-500 hover:text-white">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {totalMeds === 0 ? (
        <div className="p-4">
          <EmptyState
            icon={Pill}
            title="Nenhum medicamento cadastrado"
            description="Adicione com horário e o Jarvis lembra no Kanban com prioridade máxima."
            actionLabel="Novo medicamento"
            onAction={() => setShowForm(true)}
          />
        </div>
      ) : (
        <ul className="divide-y divide-zinc-900">
          {medicamentos.map((med) => (
            <li
              key={med.id}
              className={[
                'flex items-center gap-2.5 px-3 py-1.5 cursor-pointer hover:bg-zinc-900/40 transition-colors border-l-2',
                med.tomado ? 'border-l-emerald-500/60 opacity-60' : 'border-l-teal-500/60',
              ].join(' ')}
              onClick={() => handleToggle(med.id)}
            >
              <div className={[
                'w-4 h-4 rounded border flex items-center justify-center shrink-0',
                med.tomado ? 'bg-teal-500 border-teal-500' : 'border-zinc-700',
              ].join(' ')}>
                {med.tomado && <div className="w-1.5 h-1.5 rounded-sm bg-white" />}
              </div>
              <span className={`flex-1 text-[13px] truncate ${med.tomado ? 'text-zinc-500 line-through' : 'text-zinc-100'}`}>
                {med.nome}
              </span>
              <Clock className="w-3 h-3 text-zinc-600" />
              <span className="text-[11px] font-mono tabular-nums text-zinc-400">{med.horario}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
