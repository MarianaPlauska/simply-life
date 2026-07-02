/**
 * PreferenciasIA.tsx — Gerenciamento de palavras-chave do Motor de Triagem.
 * Interface estilo "command palette" com badges removíveis e input com animação.
 */
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Plus, X, Zap, Brain, AlertTriangle } from 'lucide-react';
import { GlassCard } from '../ui/GlassCard';
import { useTaskStore } from '../../store/useTaskStore';
import { AXEL_PAGE_SHELL_MOBILE_NARROW } from '../../constants/axelSurfaces';
import { toast } from 'sonner';

/* ── Animações ───────────────────────────────────────────────── */
const badgeVariants = {
  hidden: { opacity: 0, scale: 0.7, y: 4 },
  visible: { opacity: 1, scale: 1, y: 0, transition: { type: 'spring' as const, stiffness: 400, damping: 25 } },
  exit: { opacity: 0, scale: 0.6, y: -4, transition: { duration: 0.15 } },
} as const;

const pulseRing = {
  animate: {
    scale: [1, 1.15, 1],
    opacity: [0.4, 0.1, 0.4],
    transition: { duration: 2, repeat: Infinity, ease: 'easeInOut' as const },
  },
};

/* ── Componente ─────────────────────────────────────────────── */
export function PreferenciasIA() {
  const palavrasChave = useTaskStore((s) => s.palavrasChave);
  const fetchPalavrasChave = useTaskStore((s) => s.fetchPalavrasChave);
  const addPalavraChave = useTaskStore((s) => s.addPalavraChave);
  const removePalavraChave = useTaskStore((s) => s.removePalavraChave);

  const [input, setInput] = useState('');
  const [peso, setPeso] = useState(1);
  const [isAdding, setIsAdding] = useState(false);
  const [testInput, setTestInput] = useState('');
  const [testResult, setTestResult] = useState<null | { status: string; termo?: string }>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { fetchPalavrasChave(); }, [fetchPalavrasChave]);

  const handleAdd = async () => {
    const termo = input.trim().toLowerCase();
    if (!termo) return;
    if (palavrasChave.some((p) => p.termo === termo)) {
      toast.warning(`Palavra "${termo}" já adicionada.`);
      return;
    }
    setIsAdding(true);
    await addPalavraChave(termo, peso);
    toast.success(`"${termo}" adicionado ao radar`);
    setInput('');
    setPeso(1);
    setIsAdding(false);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleAdd();
    if (e.key === 'Escape') setInput('');
  };

  const handleTest = async () => {
    if (!testInput.trim()) return;
    const result = await useTaskStore.getState().processarMensagem(testInput, 'teste', 'Simulação');
    setTestResult({ status: result.status, termo: result.termo_detectado });
  };

  return (
    <div className={`${AXEL_PAGE_SHELL_MOBILE_NARROW} p-6 lg:px-8 space-y-8 pb-24`}>

      {/* ── Header ───────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-4"
      >
        <div className="relative">
          <div className="w-12 h-12 rounded-2xl bg-violet-500/10 flex items-center justify-center">
            <Brain className="w-6 h-6 text-violet-400" />
          </div>
          <motion.div
            variants={pulseRing}
            animate="animate"
            className="absolute inset-0 rounded-2xl border border-violet-500/30"
          />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Motor de Triagem IA</h1>
          <p className="text-sm text-zinc-400 mt-0.5">
            Configure palavras-chave para captura automática de tarefas críticas.
          </p>
        </div>
      </motion.div>

      {/* ── Como funciona ─────────────────────────────────────── */}
      <GlassCard className="!p-5">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0 mt-0.5">
            <Zap className="w-4 h-4 text-amber-400" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-semibold text-white">Como funciona</p>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Quando uma mensagem (e-mail, webhook) é recebida, o motor verifica se alguma
              das suas palavras-chave aparece no texto. Se sim, uma tarefa <span className="text-red-400 font-medium">critica</span> é criada
              automaticamente com indicador <span className="inline-flex items-center gap-0.5 text-violet-400 font-medium"><Zap size={12} strokeWidth={1.5} /> IA</span> no dashboard.
            </p>
          </div>
        </div>
      </GlassCard>

      {/* ── Adicionar palavra-chave ───────────────────────────── */}
      <GlassCard>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-8 h-8 rounded-xl bg-violet-500/10 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-violet-400" />
          </div>
          <h2 className="text-sm font-semibold text-white">Adicionar palavra-chave</h2>
        </div>

        <div className="flex gap-3">
          {/* Input principal */}
          <div className="relative flex-1">
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="ex: urgente, prazo, cliente X..."
              className="
                w-full h-11 bg-zinc-900/60 border border-white/8 rounded-xl px-4 pr-10
                text-sm text-zinc-100 placeholder-zinc-600
                focus:outline-none focus:border-violet-500/40 focus:ring-1 focus:ring-violet-500/20
                transition-all duration-200
              "
            />
            {input && (
              <button
                onClick={() => setInput('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-zinc-400"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Peso */}
          <select
            value={peso}
            onChange={(e) => setPeso(Number(e.target.value))}
            title="Peso da palavra-chave"
            className="
              h-11 bg-zinc-900/60 border border-white/8 rounded-xl px-3
              text-xs text-zinc-300 focus:outline-none focus:border-violet-500/40
              transition-all duration-200 cursor-pointer
            "
          >
            {[1,2,3,4,5,6,7,8,9,10].map((v) => (
              <option key={v} value={v}>Peso {v}</option>
            ))}
          </select>

          {/* Botão adicionar */}
          <motion.button
            onClick={handleAdd}
            disabled={!input.trim() || isAdding}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className="
              h-11 px-5 rounded-xl text-sm font-semibold
              bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed
              text-white flex items-center gap-2 transition-all duration-200 shrink-0
            "
          >
            <Plus className="w-4 h-4" />
            Adicionar
          </motion.button>
        </div>

        {/* ── Badges ───────────────────────────────────────────── */}
        <div className="mt-6">
          {palavrasChave.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 gap-3">
              <div className="w-12 h-12 rounded-2xl bg-zinc-800/60 flex items-center justify-center">
                <Brain className="w-5 h-5 text-zinc-600" />
              </div>
              <p className="text-xs text-zinc-500">Nenhuma palavra-chave configurada.</p>
              <p className="text-[11px] text-zinc-600">
                Adicione termos para ativar o radar.
              </p>
            </div>
          ) : (
            <motion.div
              layout
              className="flex flex-wrap gap-2.5"
            >
              <AnimatePresence mode="popLayout">
                {palavrasChave.map((pk) => (
                  <motion.div
                    key={pk.id}
                    layout
                    variants={badgeVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    className="
                      group flex items-center gap-2 px-3.5 py-1.5 rounded-xl
                      bg-violet-500/10 border border-violet-500/20
                      hover:border-violet-500/40 transition-all duration-200
                    "
                  >
                    <span className="text-xs font-medium text-violet-300">{pk.termo}</span>
                    {pk.peso > 1 && (
                      <span className="text-[10px] text-violet-500 font-bold">×{pk.peso}</span>
                    )}
                    <button
                      onClick={() => removePalavraChave(pk.id)}
                      className="
                        w-4 h-4 rounded-full flex items-center justify-center
                        text-zinc-600 hover:text-red-400 hover:bg-red-500/10
                        transition-all duration-200 opacity-0 group-hover:opacity-100
                      "
                    >
                      <X className="w-2.5 h-2.5" />
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </div>

        {palavrasChave.length > 0 && (
          <p className="text-[11px] text-zinc-600 mt-4">
            {palavrasChave.length} palavra{palavrasChave.length !== 1 ? 's' : ''}-chave ativa{palavrasChave.length !== 1 ? 's' : ''} no radar · Hover no badge para remover
          </p>
        )}
      </GlassCard>

      {/* ── Simulador de triagem ──────────────────────────────── */}
      <GlassCard>
        <div className="flex items-center gap-3 mb-5">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center">
            <AlertTriangle className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-white">Simulador de Triagem</h2>
            <p className="text-[11px] text-zinc-500">Teste como o motor processaria uma mensagem.</p>
          </div>
        </div>

        <textarea
          value={testInput}
          onChange={(e) => setTestInput(e.target.value)}
          placeholder="Cole o conteúdo de um e-mail ou mensagem aqui..."
          rows={4}
          className="
            w-full bg-zinc-900/60 border border-white/8 rounded-xl p-4
            text-sm text-zinc-200 placeholder-zinc-600 resize-none
            focus:outline-none focus:border-emerald-500/30 focus:ring-1 focus:ring-emerald-500/10
            transition-all duration-200
          "
        />

        <div className="flex items-center justify-between mt-3 gap-4">
          <AnimatePresence mode="wait">
            {testResult && (
              <motion.div
                key={testResult.status}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 8 }}
                className={`flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-xl ${
                  testResult.status === 'match'
                    ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                    : 'bg-zinc-800/60 border border-zinc-700/40 text-zinc-400'
                }`}
              >
                {testResult.status === 'match' ? (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    Match! Termo detectado: <span className="text-white font-bold">"{testResult.termo}"</span>
                    — Tarefa criada com prioridade crítica.
                  </>
                ) : (
                  <>
                    <X className="w-3.5 h-3.5" />
                    Nenhuma palavra-chave detectada — mensagem ignorada.
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          <motion.button
            onClick={handleTest}
            disabled={!testInput.trim() || palavrasChave.length === 0}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="
              shrink-0 h-9 px-4 rounded-xl text-xs font-semibold
              bg-emerald-600/80 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed
              text-white flex items-center gap-2 transition-all duration-200
            "
          >
            <Zap className="w-3.5 h-3.5" />
            Simular triagem
          </motion.button>
        </div>
      </GlassCard>
    </div>
  );
}
