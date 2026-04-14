import { useEffect, useState } from 'react';
import {
  Pill, Check, Clock, Battery, Droplets, Moon, Plus, X, Minus,
  Zap, Trash2, Sparkles, BookOpen, Dumbbell, Brain,
} from 'lucide-react';
import { toast } from 'sonner';
import { useTaskStore } from '../../store/useTaskStore';
import type { HabitoDiario } from '../../store/useTaskStore';

/* -- Icon map for habit types -- */
const ICON_MAP: Record<string, React.ElementType> = {
  agua: Droplets, sono: Moon, leitura: BookOpen,
  exercicio: Dumbbell, meditacao: Brain, customizado: Sparkles,
};

const PRESET_HABITOS = [
  { tipo: 'agua', nome_exibicao: 'Copos de Agua', meta_diaria: 8, unidade: 'copos' },
  { tipo: 'sono', nome_exibicao: 'Horas de Sono', meta_diaria: 8, unidade: 'horas' },
  { tipo: 'leitura', nome_exibicao: 'Paginas Lidas', meta_diaria: 20, unidade: 'paginas' },
  { tipo: 'exercicio', nome_exibicao: 'Minutos de Exercicio', meta_diaria: 30, unidade: 'min' },
  { tipo: 'meditacao', nome_exibicao: 'Minutos de Meditacao', meta_diaria: 10, unidade: 'min' },
];

function getBatteryColor(pct: number) {
  if (pct >= 80) return { bar: 'bg-emerald-500', text: 'text-emerald-400', glow: 'shadow-[0_0_20px_rgba(16,185,129,0.08)]' };
  if (pct >= 50) return { bar: 'bg-amber-500', text: 'text-amber-400', glow: 'shadow-[0_0_20px_rgba(245,158,11,0.08)]' };
  return { bar: 'bg-red-500', text: 'text-red-400', glow: 'shadow-[0_0_20px_rgba(239,68,68,0.08)]' };
}

/* ── Component ── */
export function HealthView() {
  const medicamentos = useTaskStore((s) => s.medicamentos);
  const fetchMedicamentos = useTaskStore((s) => s.fetchMedicamentos);
  const toggleMedicamento = useTaskStore((s) => s.toggleMedicamento);
  const addMedicamento = useTaskStore((s) => s.addMedicamento);
  const habitos = useTaskStore((s) => s.habitos);
  const fetchHabitos = useTaskStore((s) => s.fetchHabitos);
  const addHabito = useTaskStore((s) => s.addHabito);
  const incrementHabito = useTaskStore((s) => s.incrementHabito);
  const decrementHabito = useTaskStore((s) => s.decrementHabito);
  const deleteHabito = useTaskStore((s) => s.deleteHabito);
  const scoreDiario = useTaskStore((s) => s.scoreDiario);
  const concluirHabito = useTaskStore((s) => s.concluirHabito);

  const [showMedForm, setShowMedForm] = useState(false);
  const [newMed, setNewMed] = useState({ nome: '', horario: '' });
  const [showHabitForm, setShowHabitForm] = useState(false);
  const [habitForm, setHabitForm] = useState({ tipo: 'customizado', nome_exibicao: '', meta_diaria: '5', unidade: 'un' });

  useEffect(() => {
    fetchMedicamentos();
    fetchHabitos();
  }, []);

  /* -- Vitality score from habits + meds -- */
  const totalHabitoPct = habitos.length > 0
    ? habitos.reduce((sum, h) => sum + Math.min(h.progresso_atual / h.meta_diaria, 1), 0) / habitos.length * 100
    : 0;
  const tomados = medicamentos.filter((m) => m.tomado).length;
  const totalMeds = medicamentos.length;
  const medPct = totalMeds > 0 ? (tomados / totalMeds) * 100 : 0;
  const vitalidade = habitos.length > 0 || totalMeds > 0
    ? Math.round((totalHabitoPct * 0.6) + (medPct * 0.4))
    : scoreDiario;
  const battery = getBatteryColor(vitalidade);

  const handleIncrement = (h: HabitoDiario) => {
    if (h.progresso_atual >= h.meta_diaria) return;
    incrementHabito(h.id);
    if (h.progresso_atual + 1 === h.meta_diaria) {
      concluirHabito(15);
      toast.success(`${h.nome_exibicao} completo! +15 pts`, { description: 'Meta diaria atingida!' });
    } else {
      toast.success(`+1 ${h.unidade}`, { description: `${h.progresso_atual + 1}/${h.meta_diaria}` });
    }
  };

  const handleDecrement = (h: HabitoDiario) => {
    if (h.progresso_atual <= 0) return;
    decrementHabito(h.id);
  };

  const handleToggleMed = (id: number) => {
    const med = medicamentos.find((m) => m.id === id);
    if (med && !med.tomado) {
      concluirHabito(10);
      toast.success('+10 Pontos de Foco!', { description: med.nome });
    }
    toggleMedicamento(id);
  };

  const handleAddMed = () => {
    if (!newMed.nome.trim() || !newMed.horario.trim()) return;
    addMedicamento({ nome: newMed.nome.trim(), horario: newMed.horario.trim() });
    setNewMed({ nome: '', horario: '' });
    setShowMedForm(false);
    toast.success('Medicamento adicionado');
  };

  const handleAddPreset = (preset: typeof PRESET_HABITOS[number]) => {
    if (habitos.some((h) => h.tipo === preset.tipo)) {
      toast.error('Esse habito ja existe');
      return;
    }
    addHabito(preset);
    toast.success(`${preset.nome_exibicao} adicionado!`);
  };

  const handleAddCustom = () => {
    if (!habitForm.nome_exibicao.trim()) return;
    addHabito({
      tipo: 'customizado',
      nome_exibicao: habitForm.nome_exibicao.trim(),
      meta_diaria: parseInt(habitForm.meta_diaria) || 5,
      unidade: habitForm.unidade || 'un',
    });
    setHabitForm({ tipo: 'customizado', nome_exibicao: '', meta_diaria: '5', unidade: 'un' });
    setShowHabitForm(false);
    toast.success('Habito personalizado criado!');
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-16">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Saude & Bem-Estar</h1>
          <p className="text-sm text-zinc-500 mt-1">Habitos, medicamentos e vitalidade diaria</p>
        </div>
        <div className="flex items-center gap-2">
          <Zap className={`w-4 h-4 ${battery.text}`} />
          <span className={`text-xl font-bold tabular-nums ${battery.text}`}>{vitalidade}</span>
          <span className="text-[11px] text-zinc-500 font-medium">%</span>
        </div>
      </div>

      {/* === Barra de Vitalidade === */}
      <section className={`rounded-xl border border-zinc-800/50 bg-zinc-900/40 p-5 ${battery.glow}`}>
        <div className="flex items-center gap-3 mb-3">
          <Battery className={`w-4 h-4 ${battery.text}`} />
          <h2 className="text-[13px] font-semibold text-white">Barra de Vitalidade Diaria</h2>
          <span className={`ml-auto text-[12px] font-bold tabular-nums ${battery.text}`}>{vitalidade}%</span>
        </div>
        <div className="h-3 rounded-full bg-zinc-800/60 overflow-hidden">
          <div
            className={`h-full rounded-full ${battery.bar} transition-all duration-700 ease-out`}
            style={{ width: `${vitalidade}%` }}
          />
        </div>
        <div className="flex items-center gap-4 mt-2 text-[10px] text-zinc-500">
          <span>Habitos: {Math.round(totalHabitoPct)}%</span>
          <span>Medicamentos: {tomados}/{totalMeds}</span>
        </div>
      </section>

      {/* === Habitos Interativos === */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Sparkles className="w-4 h-4 text-violet-400" />
            <h2 className="text-[13px] font-semibold text-white">Habitos Configuraveis</h2>
            <span className="text-[11px] text-zinc-600">{habitos.length} rastreadores</span>
          </div>
          <button onClick={() => setShowHabitForm(true)} className="flex items-center gap-1.5 text-[12px] text-zinc-400 hover:text-white transition-colors">
            <Plus className="w-3.5 h-3.5" />Personalizar Habitos
          </button>
        </div>

        {/* Habit Cards Grid */}
        {habitos.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {habitos.map((h) => {
              const pct = h.meta_diaria > 0 ? Math.min((h.progresso_atual / h.meta_diaria) * 100, 100) : 0;
              const done = h.progresso_atual >= h.meta_diaria;
              const HIcon = ICON_MAP[h.tipo] || Sparkles;
              return (
                <div key={h.id} className={`group rounded-xl border p-4 transition-all ${done ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-zinc-900/40 border-zinc-800/50'}`}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <HIcon className={`w-4 h-4 ${done ? 'text-emerald-400' : 'text-zinc-400'}`} />
                      <span className="text-[13px] font-medium text-zinc-200">{h.nome_exibicao}</span>
                    </div>
                    <button onClick={() => deleteHabito(h.id)} className="p-1 rounded-lg hover:bg-zinc-800 text-zinc-600 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                  {/* Progress bar */}
                  <div className="h-2 rounded-full bg-zinc-800/60 overflow-hidden mb-3">
                    <div className={`h-full rounded-full transition-all duration-500 ${done ? 'bg-emerald-500' : 'bg-violet-500'}`} style={{ width: `${pct}%` }} />
                  </div>
                  {/* Controls */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <button onClick={() => handleDecrement(h)} disabled={h.progresso_atual <= 0} className="w-8 h-8 rounded-lg border border-zinc-700/50 flex items-center justify-center text-zinc-400 hover:text-white hover:border-zinc-600 transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className={`text-lg font-bold tabular-nums min-w-[48px] text-center ${done ? 'text-emerald-400' : 'text-white'}`}>
                        {h.progresso_atual}<span className="text-[11px] text-zinc-500 font-normal">/{h.meta_diaria}</span>
                      </span>
                      <button onClick={() => handleIncrement(h)} disabled={done} className="w-8 h-8 rounded-lg border border-zinc-700/50 flex items-center justify-center text-zinc-400 hover:text-white hover:border-zinc-600 transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <span className="text-[10px] text-zinc-500">{h.unidade}</span>
                  </div>
                  {done && <p className="text-[10px] text-emerald-400 font-medium mt-2 flex items-center gap-1"><Check className="w-3 h-3" />Meta atingida!</p>}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-xl border border-zinc-800/50 bg-zinc-900/30 p-8 text-center">
            <Sparkles className="w-8 h-8 text-zinc-700 mx-auto mb-3" />
            <p className="text-[13px] text-zinc-400 mb-1">Nenhum habito configurado ainda</p>
            <p className="text-[11px] text-zinc-600">Adicione habitos abaixo ou clique em &ldquo;Personalizar Habitos&rdquo;</p>
          </div>
        )}

        {/* Presets */}
        <div className="flex flex-wrap gap-2">
          {PRESET_HABITOS.filter((p) => !habitos.some((h) => h.tipo === p.tipo)).map((preset) => {
            const PIcon = ICON_MAP[preset.tipo] || Sparkles;
            return (
              <button key={preset.tipo} onClick={() => handleAddPreset(preset)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-800/50 bg-zinc-900/30 text-[11px] text-zinc-400 hover:text-white hover:border-zinc-700 transition-colors">
                <PIcon className="w-3 h-3" />{preset.nome_exibicao}
                <Plus className="w-2.5 h-2.5 text-zinc-600" />
              </button>
            );
          })}
        </div>

        {/* Custom habit form */}
        {showHabitForm && (
          <div className="rounded-xl border border-zinc-800/50 bg-zinc-900/40 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[13px] font-medium text-white">Criar Habito Personalizado</span>
              <button onClick={() => setShowHabitForm(false)}><X className="w-4 h-4 text-zinc-500 hover:text-white transition-colors" /></button>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <input type="text" placeholder="Nome (ex: Meditacao)" value={habitForm.nome_exibicao} onChange={(e) => setHabitForm({ ...habitForm, nome_exibicao: e.target.value })} className="col-span-3 sm:col-span-1 bg-zinc-800/40 border border-zinc-700/40 rounded-lg px-3 py-2 text-[13px] text-white placeholder:text-zinc-600 outline-none focus:ring-1 focus:ring-violet-500/40" autoFocus />
              <input type="number" min="1" placeholder="Meta diaria" value={habitForm.meta_diaria} onChange={(e) => setHabitForm({ ...habitForm, meta_diaria: e.target.value })} className="bg-zinc-800/40 border border-zinc-700/40 rounded-lg px-3 py-2 text-[13px] text-white placeholder:text-zinc-600 outline-none focus:ring-1 focus:ring-violet-500/40" />
              <input type="text" placeholder="Unidade (ex: min)" value={habitForm.unidade} onChange={(e) => setHabitForm({ ...habitForm, unidade: e.target.value })} className="bg-zinc-800/40 border border-zinc-700/40 rounded-lg px-3 py-2 text-[13px] text-white placeholder:text-zinc-600 outline-none focus:ring-1 focus:ring-violet-500/40" />
            </div>
            <button onClick={handleAddCustom} disabled={!habitForm.nome_exibicao.trim()} className="px-4 py-2 text-[12px] font-medium bg-violet-600 text-white rounded-lg hover:bg-violet-500 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
              Criar Habito
            </button>
          </div>
        )}
      </section>

      {/* === Medicamentos === */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Pill className="w-4 h-4 text-emerald-400" />
            <h2 className="text-[13px] font-semibold text-white">Medicamentos Hoje</h2>
            <span className="text-[11px] text-zinc-500 ml-1">{tomados}/{totalMeds}</span>
          </div>
          <button onClick={() => setShowMedForm(true)} className="flex items-center gap-1.5 text-[12px] text-zinc-400 hover:text-white transition-colors">
            <Plus className="w-3.5 h-3.5" />Novo Medicamento
          </button>
        </div>

        <div className="h-1 rounded-full bg-zinc-800/60 overflow-hidden">
          <div className="h-full rounded-full bg-emerald-500 transition-all duration-500" style={{ width: `${medPct}%` }} />
        </div>

        {showMedForm && (
          <div className="rounded-xl border border-zinc-800/50 bg-zinc-900/40 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[13px] font-medium text-white">Adicionar Medicamento</span>
              <button onClick={() => setShowMedForm(false)}><X className="w-4 h-4 text-zinc-500 hover:text-white transition-colors" /></button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <input type="text" placeholder="Nome do medicamento" value={newMed.nome} onChange={(e) => setNewMed({ ...newMed, nome: e.target.value })} className="bg-zinc-800/40 border border-zinc-700/40 rounded-lg px-3 py-2 text-[13px] text-white placeholder:text-zinc-600 outline-none focus:ring-1 focus:ring-zinc-600" />
              <input type="text" placeholder="Horario (ex: 08:00)" value={newMed.horario} onChange={(e) => setNewMed({ ...newMed, horario: e.target.value })} className="bg-zinc-800/40 border border-zinc-700/40 rounded-lg px-3 py-2 text-[13px] text-white placeholder:text-zinc-600 outline-none focus:ring-1 focus:ring-zinc-600" />
            </div>
            <button onClick={handleAddMed} disabled={!newMed.nome.trim() || !newMed.horario.trim()} className="px-4 py-2 text-[12px] font-medium bg-white text-zinc-900 rounded-lg hover:bg-zinc-200 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
              Salvar
            </button>
          </div>
        )}

        {totalMeds > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {medicamentos.map((med) => (
              <button key={med.id} onClick={() => handleToggleMed(med.id)} className={`flex items-center gap-3 rounded-xl border p-3.5 transition-all group ${med.tomado ? 'bg-zinc-900/30 border-zinc-800/30' : 'bg-zinc-900/40 border-zinc-800/50 hover:border-zinc-700/60'}`}>
                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-all ${med.tomado ? 'bg-emerald-500 border-emerald-500' : 'border-zinc-600 group-hover:border-zinc-400'}`}>
                  {med.tomado && <Check className="w-3 h-3 text-white" />}
                </div>
                <div className="flex-1 text-left min-w-0">
                  <p className={`text-[13px] transition-all ${med.tomado ? 'text-zinc-500 line-through' : 'text-zinc-200'}`}>{med.nome}</p>
                  <div className="flex items-center gap-1 mt-0.5">
                    <Clock className="w-3 h-3 text-zinc-600" />
                    <span className="text-[11px] text-zinc-600">{med.horario}</span>
                  </div>
                </div>
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${med.tomado ? 'text-emerald-400/60' : 'text-zinc-500'}`}>
                  {med.tomado ? 'Tomado' : 'Pendente'}
                </span>
              </button>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-zinc-800/50 bg-zinc-900/30 p-6 text-center">
            <Pill className="w-6 h-6 text-zinc-700 mx-auto mb-2" />
            <p className="text-[12px] text-zinc-500">Nenhum medicamento cadastrado</p>
          </div>
        )}
      </section>
    </div>
  );
}
