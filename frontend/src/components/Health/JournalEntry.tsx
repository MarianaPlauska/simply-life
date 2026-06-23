import { useState } from 'react';
import { BookOpen, Send, Check, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { useTaskStore } from '../../store/useTaskStore';
import {
  AXEL_BTN_PRIMARY_COMPACT,
  AXEL_FIELD_INPUT,
  AXEL_TEXT_PRIMARY,
  AXEL_TEXT_SECONDARY,
} from '../../constants/axelSurfaces';

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
    if (!conteudo.trim()) return;
    setSalvando(true);
    await criarEntradaDiario(conteudo.trim(), promptAtual);
    toast.success('Reflexão guardada no diário');
    setConteudo('');
    setSalvando(false);
  };

  return (
    <section className="sl-panel p-4 sm:p-5 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-accent shrink-0" />
          <h2 className={`font-display text-base ${AXEL_TEXT_PRIMARY}`}>
            Escrever reflexão
          </h2>
        </div>
        {jaEscreveu && (
          <span className="flex items-center gap-1 text-[10px] text-concluido font-medium">
            <Check className="w-3 h-3" />
            Hoje
          </span>
        )}
      </div>

      <div className="flex items-center gap-2 px-3 py-2 rounded-sl bg-chrome/50 border border-line">
        <span className={`text-[12px] italic flex-1 ${AXEL_TEXT_SECONDARY}`}>“{promptAtual}”</span>
        <button
          type="button"
          onClick={() => setPromptIdx((i) => i + 1)}
          className="p-1 rounded-sl hover:bg-chrome text-ink-muted hover:text-ink transition-colors"
          title="Trocar prompt"
        >
          <RefreshCw className="w-3 h-3" />
        </button>
      </div>

      {jaEscreveu ? (
        <div className="rounded-sl border border-line bg-chrome/30 p-3">
          <p className={`text-[12px] leading-relaxed whitespace-pre-wrap ${AXEL_TEXT_PRIMARY}`}>
            {entradaHoje?.conteudo}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          <textarea
            placeholder="Escreva livremente…"
            value={conteudo}
            onChange={(e) => setConteudo(e.target.value)}
            rows={4}
            className={`w-full resize-none min-h-[88px] ${AXEL_FIELD_INPUT}`}
          />
          <div className="flex items-center justify-end">
            <button
              type="button"
              onClick={() => void handleSubmit()}
              disabled={salvando || !conteudo.trim()}
              className={`inline-flex items-center gap-1.5 px-4 py-2 disabled:opacity-40 ${AXEL_BTN_PRIMARY_COMPACT}`}
            >
              <Send className="w-3.5 h-3.5" />
              {salvando ? 'Salvando…' : 'Salvar'}
            </button>
          </div>
        </div>
      )}

      <p className={`text-[11px] ${AXEL_TEXT_SECONDARY}`}>
        Aparece na aba Diário em “Seus registros”.
      </p>
    </section>
  );
}
