import { useState } from 'react';
import { X } from 'lucide-react';
import { toast } from 'sonner';
import { useTaskStore } from '../../store/useTaskStore';

export function QuickCaptureModal() {
  const isOpen = useTaskStore((s) => s.isQuickCaptureOpen);
  const setOpen = useTaskStore((s) => s.setQuickCaptureOpen);
  const addAnotacao = useTaskStore((s) => s.addAnotacao);

  const [titulo, setTitulo] = useState('');
  const [conteudo, setConteudo] = useState('');
  const [saving, setSaving] = useState(false);

  if (!isOpen) return null;

  function handleClose() {
    setTitulo('');
    setConteudo('');
    setOpen(false);
  }

  async function handleSave() {
    if (!conteudo.trim()) return;
    setSaving(true);
    try {
      await addAnotacao(conteudo.trim(), titulo.trim() || undefined);
      toast.success('Captura salva! +10 Pontos de Foco');
      handleClose();
    } catch {
      toast.error('Erro ao salvar anotação.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-white">Captura Rápida</h2>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Fields */}
        <div className="space-y-4">
          <input
            type="text"
            placeholder="Título (opcional)"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            className="w-full bg-zinc-800/60 border border-zinc-700/50 rounded-xl px-4 py-3 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-white/20 transition"
          />
          <textarea
            placeholder="O que está na sua mente?"
            value={conteudo}
            onChange={(e) => setConteudo(e.target.value)}
            rows={4}
            autoFocus
            className="w-full bg-zinc-800/60 border border-zinc-700/50 rounded-xl px-4 py-3 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-white/20 transition resize-none"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 mt-5">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-[13px] font-medium text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={!conteudo.trim() || saving}
            className="px-5 py-2 text-[13px] font-semibold bg-white text-zinc-900 rounded-full hover:bg-zinc-200 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {saving ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </div>
    </div>
  );
}
