import { useState } from 'react';
import { FlaskConical, X, Send, Loader2 } from 'lucide-react';
import { useTaskStore } from '../../store/useTaskStore';

interface DevIngestaoModalProps {
  open: boolean;
  onClose: () => void;
}

export function DevIngestaoModal({ open, onClose }: DevIngestaoModalProps) {
  const [titulo, setTitulo] = useState('');
  const [sending, setSending] = useState(false);
  const simularIngestao = useTaskStore((s) => s.simularIngestao);

  if (!open)
  {
    return null;
  }

  const handleSubmit = async () => {
    if (!titulo.trim())
    {
      return;
    }
    setSending(true);
    await simularIngestao(titulo.trim());
    setSending(false);
    setTitulo('');
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm" 
      onClick={onClose}
    >
      <div 
        className="bg-zinc-950 border border-zinc-800/80 rounded-xl shadow-2xl w-full max-w-md mx-4 p-6 space-y-5" 
        onClick={(e) => e.stopPropagation()}
      >
        {/* cabeçalho */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FlaskConical className="w-4 h-4 text-violet-400" />
            <h2 className="text-[14px] font-semibold text-zinc-100">Simular Ingestão de E-mail</h2>
          </div>
          <button 
            onClick={onClose} 
            className="p-1 rounded-md hover:bg-zinc-900 transition-colors"
          >
            <X className="w-4 h-4 text-zinc-500 hover:text-zinc-300" />
          </button>
        </div>

        {/* corpo do modal */}
        <div className="space-y-2">
          <label className="text-[11px] text-zinc-500 uppercase tracking-wider font-semibold">Título do E-mail</label>
          <input
            type="text" 
            value={titulo} 
            onChange={(e) => setTitulo(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter')
              {
                handleSubmit();
              }
            }}
            placeholder="ex: Proposta urgente – revisão do contrato"
            className="w-full bg-zinc-900/60 border border-zinc-800/80 rounded-lg px-3 py-2
                       text-[13px] text-zinc-200 placeholder:text-zinc-600 
                       outline-none focus:ring-1 focus:ring-violet-500/40 transition-all"
            autoFocus
          />
          <p className="text-[10px] text-zinc-500">O motor de score vai triar o e-mail simulado usando suas keywords configuradas.</p>
        </div>

        {/* botão de ação */}
        <button
          onClick={handleSubmit} 
          disabled={!titulo.trim() || sending}
          className="w-full flex items-center justify-center gap-2 bg-violet-600/10 hover:bg-violet-600/20 
                     text-violet-400 border border-violet-500/20 rounded-lg px-4 py-2 text-[13px] 
                     font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {sending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
          {sending ? 'Enviando...' : 'Enviar para Triagem'}
        </button>
      </div>
    </div>
  );
}
