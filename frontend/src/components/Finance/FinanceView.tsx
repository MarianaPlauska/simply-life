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

/* ── Glass Card ── */
function GlassCard({ label, value, icon: Icon, accent }: { label: string; value: string; icon: React.ElementType; accent: string }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-zinc-800/60 bg-zinc-900/50 backdrop-blur-sm p-6 flex flex-col gap-3">
      <div className="absolute -top-8 -right-8 w-24 h-24 rounded-full opacity-[0.07]" style={{ background: accent }} />
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${accent}15` }}>
          <Icon className="w-5 h-5" style={{ color: accent }} />
        </div>
        <span className="text-[13px] text-zinc-400 font-medium">{label}</span>
      </div>
      <span className="text-2xl font-bold text-white tracking-tight">{value}</span>
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
    <div className="max-w-6xl mx-auto space-y-8 pb-16">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Financeiro</h1>
          <p className="text-sm text-zinc-500 mt-1">Controle inteligente dos seus gastos</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 rounded-xl px-5 py-2.5 text-[13px] font-semibold transition-colors"
        >
          <Plus className="w-4 h-4" />
          Novo Gasto
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <GlassCard label="Gastos do Mês" value={formatCurrency(totalMes)} icon={Wallet} accent="#ef4444" />
        <GlassCard label="Orçamento Total" value={formatCurrency(orcamento)} icon={TrendingUp} accent="#8b5cf6" />
        <GlassCard label="Orçamento Livre" value={formatCurrency(livre)} icon={PiggyBank} accent={livre >= 0 ? '#10b981' : '#ef4444'} />
      </div>

      {/* Despesas Recentes */}
      <div className="rounded-2xl border border-zinc-800/60 bg-zinc-900/30 backdrop-blur-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-zinc-800/40">
          <h2 className="text-[15px] font-semibold text-white">Despesas Recentes</h2>
        </div>
        <div className="divide-y divide-zinc-800/30">
          {despesas.map((d) => {
            const CatIcon = CATEGORIAS_ICON[d.categoria] || MoreHorizontal;
            return (
              <div key={d.id} className="flex items-center gap-4 px-6 py-4 hover:bg-zinc-800/20 transition-colors">
                <div className="w-9 h-9 rounded-lg bg-zinc-800/60 flex items-center justify-center shrink-0">
                  <CatIcon className="w-4 h-4 text-zinc-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-medium text-white truncate">{d.descricao}</p>
                  <p className="text-[11px] text-zinc-500">{d.categoria}</p>
                </div>
                <span className="text-[13px] font-semibold text-red-400 tabular-nums">{formatCurrency(d.valor)}</span>
                <span className="text-[12px] text-zinc-500 w-16 text-right">{formatDate(d.data)}</span>
              </div>
            );
          })}
          {despesas.length === 0 && (
            <div className="px-6 py-12 text-center text-zinc-500 text-sm">
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
