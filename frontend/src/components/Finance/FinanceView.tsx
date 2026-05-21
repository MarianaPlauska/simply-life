import { useEffect, useState } from 'react';
import {
  Wallet, TrendingUp, PiggyBank, Plus, X,
  ShoppingCart, Car, Utensils, Zap, Home, Heart, GraduationCap, MoreHorizontal,
} from 'lucide-react';
import { toast } from 'sonner';
import { useTaskStore } from '../../store/useTaskStore';

/* ── Categorias ── */
const CATEGORIAS_ICON: Record<string, React.ElementType> = {
  'Mercado': ShoppingCart,
  'Transporte': Car,
  'Alimentação': Utensils,
  'Energia': Zap,
  'Moradia': Home,
  'Saúde': Heart,
  'Educação': GraduationCap,
  'Outros': MoreHorizontal,
};

const CATEGORIAS = Object.keys(CATEGORIAS_ICON);

function formatCurrency(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatDate(iso: string) {
  return new Date(iso + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
}

/* ── Flat Metric ── */
function FlatMetric({ label, value, icon: Icon, accent }: { label: string; value: string; icon: React.ElementType; accent: string }) {
  return (
    <div className="flex flex-col gap-1.5 py-2">
      <div className="flex items-center gap-2 text-zinc-500">
        <Icon className="w-4 h-4 shrink-0" style={{ color: accent }} />
        <span className="text-[11px] font-semibold uppercase tracking-wider">{label}</span>
      </div>
      <span className="text-3xl font-bold text-zinc-100 tracking-tight font-mono">{value}</span>
    </div>
  );
}

/* ── Component ── */
export function FinanceView() {
  const registerInteraction = useTaskStore((s) => s.registerInteraction);
  const despesas = useTaskStore((s) => s.despesas);
  const fetchDespesas = useTaskStore((s) => s.fetchDespesas);
  const addDespesa = useTaskStore((s) => s.addDespesa);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ categoria: 'Mercado', descricao: '', valor: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    registerInteraction('financeiro');
    fetchDespesas();
  }, []);

  const totalMes = despesas.reduce((sum, d) => sum + d.valor, 0);
  const orcamento = 4500;
  const livre = orcamento - totalMes;

  const handleAddDespesa = async () => {
    if (!form.descricao.trim() || !form.valor) return;
    const valor = parseFloat(form.valor);
    if (isNaN(valor) || valor <= 0) return;
    setSaving(true);
    try {
      await addDespesa({
        descricao: form.descricao.trim(),
        categoria: form.categoria,
        valor,
      });
      setShowModal(false);
      setForm({ categoria: 'Mercado', descricao: '', valor: '' });
      toast.success('Despesa registrada!');
    } catch {
      toast.error('Erro ao registrar despesa');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-12 pb-16">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-900/50 pb-6">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Financeiro</h1>
          <p className="text-xs text-zinc-500 mt-1 font-medium">Controle de gastos com inteligência e simplicidade</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5 bg-violet-600 hover:bg-violet-500 text-white rounded-lg px-4 py-2 text-[12px] font-semibold transition-all shadow-md shadow-violet-950/20 hover:shadow-lg active:scale-95"
        >
          <Plus className="w-4 h-4" />
          Novo Gasto
        </button>
      </div>

      {/* Summary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-16 py-2 border-b border-zinc-900/50">
        <FlatMetric label="Gastos do Mês" value={formatCurrency(totalMes)} icon={Wallet} accent="#f43f5e" />
        <FlatMetric label="Orçamento Total" value={formatCurrency(orcamento)} icon={TrendingUp} accent="#a78bfa" />
        <FlatMetric label="Orçamento Livre" value={formatCurrency(livre)} icon={PiggyBank} accent={livre >= 0 ? '#34d399' : '#f43f5e'} />
      </div>

      {/* Despesas Recentes */}
      <div className="space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-zinc-900/50">
          <h2 className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest">Despesas Recentes</h2>
        </div>
        <div className="divide-y divide-zinc-900/40">
          {despesas.map((d) => {
            const CatIcon = CATEGORIAS_ICON[d.categoria] || MoreHorizontal;
            return (
              <div key={d.id} className="flex items-center gap-4 py-3.5 hover:bg-white/[0.01] hover:px-3 -mx-3 rounded-lg transition-all duration-200 group">
                <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800/60 flex items-center justify-center shrink-0 group-hover:border-violet-500/30 group-hover:bg-violet-950/20 transition-colors">
                  <CatIcon className="w-4 h-4 text-zinc-400 group-hover:text-violet-400 transition-colors" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-medium text-zinc-200 group-hover:text-white transition-colors truncate">{d.descricao}</p>
                  <p className="text-[11px] text-zinc-500 group-hover:text-zinc-400 transition-colors">{d.categoria}</p>
                </div>
                <span className="text-[13px] font-semibold text-rose-400 tabular-nums">{formatCurrency(d.valor)}</span>
                <span className="text-[11px] text-zinc-500 w-16 text-right font-medium">{formatDate(d.data)}</span>
              </div>
            );
          })}
          {despesas.length === 0 && (
            <div className="py-12 text-center text-zinc-600 text-[13px]">
              Nenhuma despesa registrada ainda.
            </div>
          )}
        </div>
      </div>

      {/* Modal Novo Gasto */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative w-full max-w-md rounded-2xl border border-zinc-800/60 bg-zinc-900 p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">Novo Gasto</h3>
              <button onClick={() => setShowModal(false)} className="p-1 rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/40 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Categoria */}
            <div>
              <label className="block text-[12px] font-medium text-zinc-400 mb-2">Categoria</label>
              <div className="flex flex-wrap gap-2">
                {CATEGORIAS.map((cat) => {
                  const CIcon = CATEGORIAS_ICON[cat];
                  const selected = form.categoria === cat;
                  return (
                    <button
                      key={cat}
                      onClick={() => setForm((f) => ({ ...f, categoria: cat }))}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium border transition-colors ${
                        selected
                          ? 'bg-ia/10 text-ia border-ia/30'
                          : 'bg-zinc-800/40 text-zinc-400 border-zinc-700/40 hover:border-zinc-600'
                      }`}
                    >
                      <CIcon className="w-3.5 h-3.5" />
                      {cat}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Descrição */}
            <div>
              <label className="block text-[12px] font-medium text-zinc-400 mb-1.5">Descrição</label>
              <input
                type="text"
                value={form.descricao}
                onChange={(e) => setForm((f) => ({ ...f, descricao: e.target.value }))}
                placeholder="Ex: Compras do mês"
                className="w-full bg-zinc-800/50 border border-zinc-700/50 rounded-xl px-4 py-2.5 text-[13px] text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-ia/30 focus:border-transparent transition-shadow"
              />
            </div>

            {/* Valor */}
            <div>
              <label className="block text-[12px] font-medium text-zinc-400 mb-1.5">Valor (R$)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={form.valor}
                onChange={(e) => setForm((f) => ({ ...f, valor: e.target.value }))}
                placeholder="0,00"
                className="w-full bg-zinc-800/50 border border-zinc-700/50 rounded-xl px-4 py-2.5 text-[13px] text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-ia/30 focus:border-transparent transition-shadow"
              />
            </div>

            {/* Submit */}
            <button
              onClick={handleAddDespesa}
              disabled={saving}
              className="w-full bg-emerald-500 hover:bg-emerald-400 text-zinc-950 rounded-xl py-2.5 text-[13px] font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Salvando...' : 'Registrar Gasto'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
