import { useState } from 'react';
import { BookOpen, Send, Check, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { useTaskStore } from '../../store/useTaskStore';

/* prompts de fallback caso a api não responda */
const FALLBACK_PROMPTS = [
  'Como você está se sentindo agora?',
  'O que te deixou grato hoje?',
  'Qual foi o momento mais difícil de hoje?',
  'O que você aprendeu hoje?',
  'Descreva um momento que te fez sorrir.',
];

export function JournalEntry()
{
  const promptDoDia = useTaskStore((s) => s.promptDoDia);
  const entradaHoje = useTaskStore((s) => s.entradaHoje);
  const criarEntradaDiario = useTaskStore((s) => s.criarEntradaDiario);

  const [conteudo, setConteudo] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [promptIdx, setPromptIdx] = useState(0);

  const jaEscreveu = !!entradaHoje;
  const promptAtual = promptDoDia || FALLBACK_PROMPTS[promptIdx % FALLBACK_PROMPTS.length];

  const handleSubmit = async () =>
  {
    if ( !conteudo.trim() ) return;
    setSalvando(true);
    await criarEntradaDiario(conteudo.trim(), promptAtual);
    toast.success('Entrada de diário salva!', { description: 'Bom trabalho cuidando da sua mente.' });
    setConteudo('');
    setSalvando(false);
  };

  const rotatePrompt = () =>
  {
    setPromptIdx((i) => i + 1);
  };

  return (
    <section className="h-full rounded-xl border border-zinc-800/50 bg-zinc-900/50 backdrop-blur-md p-5 space-y-4
                        shadow-[0_-1px_0_rgba(251,113,133,0.15),0_0_30px_rgba(244,63,94,0.04)]
                        hover:border-rose-500/20 transition-colors duration-300">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <BookOpen className="w-4 h-4 text-rose-400" />
          <h2 className="text-[13px] font-semibold bg-gradient-to-r from-rose-300 to-rose-500 bg-clip-text text-transparent">
            Diário Pessoal
          </h2>
        </div>
        {jaEscreveu && (
          <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-medium">
            <Check className="w-3 h-3" />Escreveu hoje
          </span>
        )}
      </div>

      {/* caixa com o prompt do dia */}
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-zinc-800/30 border border-rose-900/20">
        <span className="text-[12px] text-zinc-400 italic flex-1">“{promptAtual}”</span>
        <button
          onClick={rotatePrompt}
          className="p-1 rounded hover:bg-zinc-700/40 text-zinc-500 hover:text-zinc-300 transition-colors"
          title="Trocar prompt"
        >
          <RefreshCw className="w-3 h-3" />
        </button>
      </div>

      {/* mostrar entrada existente */}
      {jaEscreveu ? (
        <div className="space-y-2">
          <div className="rounded-lg bg-zinc-800/20 border border-zinc-800/30 p-3">
            <p className="text-[12px] text-zinc-300 leading-relaxed whitespace-pre-wrap">
              {entradaHoje?.conteudo}
            </p>
            {entradaHoje?.prompt_usado && (
              <p className="text-[10px] text-zinc-600 mt-2 italic">
                Prompt: "{entradaHoje.prompt_usado}"
              </p>
            )}
          </div>
        </div>
      ) : (
        /* textarea para nova entrada */
        <div className="space-y-3">
          <textarea
            placeholder="Escreva livremente..."
            value={conteudo}
            onChange={(e) => setConteudo(e.target.value)}
            rows={4}
            className="w-full bg-zinc-800/40 border border-zinc-700/40 rounded-lg px-3 py-2.5
                       text-[13px] text-white placeholder:text-zinc-600 leading-relaxed
                       outline-none focus:ring-1 focus:ring-rose-500/30 transition-all
                       resize-none"
          />
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-zinc-600">
              {conteudo.length > 0 ? `${conteudo.length} caracteres` : 'Mínimo 1 caractere'}
            </span>
            <button
              onClick={handleSubmit}
              disabled={salvando || !conteudo.trim()}
              className="flex items-center gap-1.5 px-4 py-2 text-[12px] font-medium
                         bg-rose-600/90 text-white rounded-lg
                         hover:bg-rose-500 transition-colors
                         disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Send className="w-3.5 h-3.5" />
              {salvando ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
