// modal de simulação de triagem - envia itens brutos para o motor de score (IA + matemática)
import { useState } from 'react';
import { FlaskConical, X, Send, Loader2, Mail, GitBranch, Calendar } from 'lucide-react';
import { useTaskStore } from '../../store/useTaskStore';
import { toast } from 'sonner';

interface DevIngestaoModalProps
{
  open: boolean;
  onClose: () => void;
}

const ORIGENS = [
  { id: 'email',        label: 'E-mail',        icon: Mail,     color: 'text-blue-400' },
  { id: 'github_issue', label: 'GitHub Issue',   icon: GitBranch,   color: 'text-zinc-300' },
  { id: 'meeting',      label: 'Reunião',        icon: Calendar, color: 'text-amber-400' },
] as const;

export function DevIngestaoModal({ open, onClose }: DevIngestaoModalProps)
{
  const [sender, setSender] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [origem, setOrigem] = useState<string>('email');
  const [sending, setSending] = useState(false);
  const simularIngestao = useTaskStore((s) => s.simularIngestao);

  if (!open)
  {
    return null;
  }

  const handleSubmit = async () =>
  {
    if (!subject.trim())
    {
      return;
    }
    setSending(true);
    try
    {
      await simularIngestao({
        sender: sender.trim() || undefined,
        subject: subject.trim(),
        body: body.trim() || undefined,
        origem,
      });
      toast.success('Item enviado para o motor de triagem');
      setSender('');
      setSubject('');
      setBody('');
      onClose();
    }
    catch
    {
      toast.error('Erro ao processar triagem');
    }
    finally
    {
      setSending(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-zinc-950 border border-zinc-800/80 rounded-xl shadow-2xl w-full max-w-lg mx-4 p-6 space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        {/* cabeçalho */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FlaskConical className="w-4 h-4 text-violet-400" />
            <h2 className="text-[14px] font-semibold text-zinc-100">Simular Triagem Ativa</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md hover:bg-zinc-900 transition-colors"
          >
            <X className="w-4 h-4 text-zinc-500 hover:text-zinc-300" />
          </button>
        </div>

        <p className="text-[11px] text-zinc-500 leading-relaxed">
          Simule a ingestão de um e-mail, issue do GitHub ou convite de reunião.
          O motor de IA (Gemini) + Score Matemático irá classificar a urgência automaticamente.
        </p>

        {/* seletor de origem */}
        <div className="space-y-1.5">
          <label className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">Origem</label>
          <div className="flex items-center gap-2">
            {ORIGENS.map((o) =>
            {
              const Icon = o.icon;
              const isActive = origem === o.id;
              return (
                <button
                  key={o.id}
                  onClick={() => setOrigem(o.id)}
                  className={[
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all border',
                    isActive
                      ? 'bg-violet-600/10 border-violet-500/30 text-violet-300'
                      : 'bg-zinc-900/40 border-zinc-800/60 text-zinc-500 hover:text-zinc-300 hover:border-zinc-700',
                  ].join(' ')}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? o.color : ''}`} />
                  {o.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* campo remetente */}
        <div className="space-y-1.5">
          <label className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">Remetente</label>
          <input
            type="text"
            value={sender}
            onChange={(e) => setSender(e.target.value)}
            placeholder="ex: ceo@empresa.com, cliente VIP, GitHub Bot"
            className="w-full bg-zinc-900/60 border border-zinc-800/80 rounded-lg px-3 py-2
                       text-[13px] text-zinc-200 placeholder:text-zinc-600
                       outline-none focus:ring-1 focus:ring-violet-500/40 transition-all"
          />
        </div>

        {/* campo assunto */}
        <div className="space-y-1.5">
          <label className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">Assunto *</label>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            onKeyDown={(e) =>
            {
              if (e.key === 'Enter' && !e.shiftKey)
              {
                handleSubmit();
              }
            }}
            placeholder="ex: URGENTE - Bug crítico em produção / Revisão do contrato"
            className="w-full bg-zinc-900/60 border border-zinc-800/80 rounded-lg px-3 py-2
                       text-[13px] text-zinc-200 placeholder:text-zinc-600
                       outline-none focus:ring-1 focus:ring-violet-500/40 transition-all"
            autoFocus
          />
        </div>

        {/* campo corpo */}
        <div className="space-y-1.5">
          <label className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">
            Corpo <span className="normal-case text-zinc-600">(opcional)</span>
          </label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Cole aqui o corpo do e-mail ou a descrição da issue para a IA analisar..."
            rows={3}
            className="w-full bg-zinc-900/60 border border-zinc-800/80 rounded-lg px-3 py-2
                       text-[13px] text-zinc-200 placeholder:text-zinc-600 resize-none
                       outline-none focus:ring-1 focus:ring-violet-500/40 transition-all
                       scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent"
          />
        </div>

        {/* botão de ação */}
        <button
          onClick={handleSubmit}
          disabled={!subject.trim() || sending}
          className="w-full flex items-center justify-center gap-2 bg-violet-600/10 hover:bg-violet-600/20
                     text-violet-400 border border-violet-500/20 rounded-lg px-4 py-2.5 text-[13px]
                     font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {sending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
          {sending ? 'Processando com IA...' : 'Enviar para Triagem'}
        </button>
      </div>
    </div>
  );
}
