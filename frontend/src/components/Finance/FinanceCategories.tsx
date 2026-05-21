import { useState } from 'react';
import { 
  X, Plus, Wallet, ShoppingCart, Utensils, 
  Home, Heart, GraduationCap, Gamepad2, Wifi, Plane, Briefcase, 
  Trash2
} from 'lucide-react';
import { useTaskStore } from '../../store/useTaskStore';
import { toast } from 'sonner';

const PRESET_ICONS = [
  { id: 'Wallet', icon: Wallet },
  { id: 'ShoppingCart', icon: ShoppingCart },
  { id: 'Utensils', icon: Utensils },
  { id: 'Home', icon: Home },
  { id: 'Heart', icon: Heart },
  { id: 'GraduationCap', icon: GraduationCap },
  { id: 'Gamepad2', icon: Gamepad2 },
  { id: 'Wifi', icon: Wifi },
  { id: 'Plane', icon: Plane },
  { id: 'Briefcase', icon: Briefcase },
];

const PRESET_COLORS = [
  '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', 
  '#ec4899', '#06b6d4', '#f97316', '#6366f1', '#14b8a6'
];

interface Props {
  onClose: () => void;
}

export function FinanceCategories({ onClose }: Props) {
  const categories = useTaskStore((s) => s.categories);
  const addCategory = useTaskStore((s) => s.addCategory);
  const removeCategory = useTaskStore((s) => s.removeCategory);

  const [isAdding, setIsAdding] = useState(false);
  const [form, setForm] = useState({
    nome: '',
    cor: PRESET_COLORS[0],
    icone: 'Wallet',
    tipo: 'despesa' as 'receita' | 'despesa'
  });

  const handleAdd = async () => {
    if (!form.nome.trim()) return;
    try {
      await addCategory(form);
      setForm({ nome: '', cor: PRESET_COLORS[0], icone: 'Wallet', tipo: 'despesa' });
      setIsAdding(false);
      toast.success('Categoria criada!');
    } catch {
      toast.error('Erro ao criar categoria');
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm('Tem certeza que deseja excluir esta categoria? Transações vinculadas ficarão sem categoria.')) {
      try {
        await removeCategory(id);
        toast.success('Categoria removida');
      } catch {
        toast.error('Erro ao remover categoria');
      }
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose} />
      
      <div className="relative w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-900/50">
          <div>
            <h3 className="text-lg font-bold text-white">Categorias</h3>
            <p className="text-[11px] text-zinc-500">Personalize sua organização financeira</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-zinc-800 rounded-xl transition-colors">
            <X className="w-5 h-5 text-zinc-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          {/* Form Novo */}
          {isAdding ? (
            <div className="bg-zinc-800/30 border border-zinc-800 p-5 rounded-2xl space-y-5 animate-in fade-in slide-in-from-top-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-white">Nova Categoria</h4>
                <button onClick={() => setIsAdding(false)} className="text-[11px] text-zinc-500 hover:text-white">Cancelar</button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-4">
                  <div>
                    <label className="block text-[11px] font-medium text-zinc-500 mb-1.5">Nome</label>
                    <input 
                      type="text" 
                      value={form.nome} 
                      onChange={(e) => setForm({ ...form, nome: e.target.value })}
                      placeholder="Ex: Assinaturas, Freelance..." 
                      className="w-full bg-zinc-900 border border-zinc-700/50 rounded-xl px-4 py-2 text-[13px] text-white focus:ring-2 focus:ring-violet-500/40 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-zinc-500 mb-1.5">Tipo</label>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => setForm({ ...form, tipo: 'despesa' })}
                        className={`flex-1 py-2 rounded-xl text-[11px] font-medium border transition-colors ${form.tipo === 'despesa' ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-zinc-900 border-zinc-800 text-zinc-500'}`}
                      >Despesa</button>
                      <button 
                        onClick={() => setForm({ ...form, tipo: 'receita' })}
                        className={`flex-1 py-2 rounded-xl text-[11px] font-medium border transition-colors ${form.tipo === 'receita' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-zinc-900 border-zinc-800 text-zinc-500'}`}
                      >Receita</button>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-[11px] font-medium text-zinc-500 mb-1.5">Cor</label>
                    <div className="flex flex-wrap gap-2">
                      {PRESET_COLORS.map(c => (
                        <button 
                          key={c} 
                          onClick={() => setForm({ ...form, cor: c })}
                          className={`w-6 h-6 rounded-full border-2 transition-transform hover:scale-110 ${form.cor === c ? 'border-white scale-110' : 'border-transparent'}`}
                          style={{ backgroundColor: c }}
                        />
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-zinc-500 mb-1.5">Ícone</label>
                    <div className="grid grid-cols-6 gap-2">
                      {PRESET_ICONS.map(({ id, icon: Icon }) => (
                        <button 
                          key={id} 
                          onClick={() => setForm({ ...form, icone: id })}
                          className={`flex items-center justify-center w-8 h-8 rounded-lg border transition-colors ${form.icone === id ? 'bg-zinc-700 border-zinc-600 text-white' : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:bg-zinc-800'}`}
                        >
                          <Icon className="w-4 h-4" />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <button 
                onClick={handleAdd}
                disabled={!form.nome.trim()}
                className="w-full bg-white text-zinc-900 py-2.5 rounded-xl text-[13px] font-bold hover:bg-zinc-200 transition-colors disabled:opacity-50"
              >
                Salvar Categoria
              </button>
            </div>
          ) : (
            <button 
              onClick={() => setIsAdding(true)}
              className="w-full py-4 border-2 border-dashed border-zinc-800 rounded-2xl flex flex-col items-center justify-center gap-2 text-zinc-500 hover:border-zinc-700 hover:text-zinc-400 transition-all"
            >
              <Plus className="w-6 h-6" />
              <span className="text-[13px] font-medium">Nova Categoria</span>
            </button>
          )}

          {/* Lista de Categorias - Estilo Notion/Slack com divisorias simples e hover suave */}
          <div className="space-y-4">
            <h4 className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest">Suas Categorias</h4>
            <div className="divide-y divide-zinc-900/40">
              {categories.map(cat => {
                const Icon = PRESET_ICONS.find(i => i.id === cat.icone)?.icon || Wallet;
                return (
                  <div key={cat.id} className="flex items-center gap-3 py-3.5 hover:bg-white/[0.01] hover:px-3 -mx-3 rounded-lg transition-all duration-200 group">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border border-zinc-800/60 bg-zinc-900 group-hover:border-violet-500/30 group-hover:bg-violet-950/20 transition-colors" style={{ color: cat.cor }}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-medium text-zinc-200 group-hover:text-white transition-colors truncate">{cat.nome}</p>
                      <p className="text-[10px] text-zinc-500 capitalize font-medium">{cat.tipo}</p>
                    </div>
                    <button 
                      onClick={() => handleDelete(cat.id)}
                      className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-500/10 rounded-lg text-zinc-600 hover:text-red-400 transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
              {categories.length === 0 && (
                <div className="py-12 text-center">
                  <p className="text-[12px] text-zinc-600">Nenhuma categoria customizada ainda.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
