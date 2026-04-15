import { motion } from 'framer-motion';
import { Radar, Eye, TrendingUp, Zap, Mail, CheckCircle2 } from 'lucide-react';
import { fadeUp } from './DashboardPrimitives';
import { useTaskStore } from '../../store/useTaskStore';
import { useState } from 'react';

/* ══════════════════════════════════════════════════════════════
   KeywordsRadarSection
   Shows the user's configured focus-keywords in a stylized
   "monitoring radar" card so they always know what the triage
   engine is watching for.  Future: keyword hit counts from API.
   ══════════════════════════════════════════════════════════════ */

const KEYWORD_COLORS = [
  'from-violet-500 to-indigo-500',
  'from-cyan-400  to-blue-500',
  'from-emerald-400 to-teal-500',
  'from-amber-400 to-orange-500',
  'from-rose-400  to-pink-500',
  'from-fuchsia-400 to-purple-500',
  'from-lime-400  to-green-500',
  'from-sky-400   to-indigo-400',
];

export function KeywordsRadarSection({ keywords }: { keywords: string[] }) {
  const sincronizarGmail = useTaskStore((s) => s.sincronizarGmail);
  const isSyncing = useTaskStore((s) => s.isSyncingGmail);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'info' } | null>(null);

  /* dispara a sync real via gmail api */
  const handleSync = async () =>
  {
    if ( isSyncing ) return;
    const result = await sincronizarGmail();
    if ( result )
    {
      const msg = result.tarefas_geradas > 0
        ? `${result.emails_lidos} e-mails varridos, ${result.tarefas_geradas} tarefa${result.tarefas_geradas > 1 ? 's' : ''} urgente${result.tarefas_geradas > 1 ? 's' : ''} criada${result.tarefas_geradas > 1 ? 's' : ''}`
        : `${result.emails_lidos} e-mails varridos — nenhuma urgência detectada`;
      setToast({ msg, type: result.tarefas_geradas > 0 ? 'success' : 'info' });
      setTimeout(() => setToast(null), 4000);
    }
    else
    {
      setToast({ msg: 'Erro ao sincronizar. Verifique a conexão com o Google.', type: 'info' });
      setTimeout(() => setToast(null), 4000);
    }
  };

  if (keywords.length === 0) return <EmptyKeywords />;

  return (
    <motion.div {...fadeUp}>
      <div className="relative overflow-hidden bg-zinc-950/50 backdrop-blur-2xl border border-white/5 rounded-[2rem] shadow-2xl transition-all duration-300 hover:border-cyan-500/20">
        {/* Radial glow */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(34,211,238,0.06),transparent_50%)] pointer-events-none" />

        <div className="p-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center relative">
                <Radar className="w-5 h-5 text-cyan-400" />
                {/* Pulse ring */}
                <span className="absolute inset-0 rounded-xl bg-cyan-400/20 animate-ping" style={{ animationDuration: '3s' }} />
              </div>
              <div>
                <h3 className="text-[14px] font-semibold text-white flex items-center gap-2">
                  Radar de Palavras-Chave
                  <Eye className="w-3.5 h-3.5 text-cyan-400/60" />
                </h3>
                <p className="text-[11px] text-zinc-600">
                  {keywords.length} palavra{keywords.length !== 1 ? 's' : ''} monitorada{keywords.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/10">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[10px] font-semibold text-emerald-400 uppercase tracking-wider">Ativo</span>
            </div>

            {/* botão sincronizar gmail */}
            <button
              onClick={handleSync}
              disabled={isSyncing}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-[11px] font-semibold
                bg-cyan-500/10 border border-cyan-500/15 text-cyan-400
                hover:bg-cyan-500/20 hover:border-cyan-500/30
                disabled:opacity-60 disabled:cursor-wait
                transition-all duration-300"
            >
              <Mail className={`w-4 h-4 ${isSyncing ? 'animate-radar-pulse' : ''}`} />
              <span>{isSyncing ? 'Sincronizando...' : 'Sincronizar Caixa'}</span>
            </button>
          </div>

          {/* Keywords Cloud */}
          <div className="flex flex-wrap gap-2.5">
            {keywords.map((kw, i) => {
              const colorClass = KEYWORD_COLORS[i % KEYWORD_COLORS.length];
              return (
                <motion.div
                  key={kw}
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.06, duration: 0.4 }}
                  className="group relative"
                >
                  <div className={`absolute inset-0 rounded-2xl bg-gradient-to-r ${colorClass} opacity-0 group-hover:opacity-20 blur-md transition-opacity duration-500`} />
                  <div className="relative px-4 py-2 rounded-2xl border border-white/5 bg-zinc-900/40 backdrop-blur-sm hover:border-white/10 transition-all duration-300 cursor-default">
                    <div className="flex items-center gap-2">
                      <div className={`w-1.5 h-1.5 rounded-full bg-gradient-to-r ${colorClass}`} />
                      <span className="text-[12px] font-medium text-zinc-300 group-hover:text-white transition-colors">
                        {kw}
                      </span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Footer insight */}
          <div className="mt-6 pt-5 border-t border-white/5 flex items-center gap-2">
            <Zap className="w-3.5 h-3.5 text-amber-400/60" />
            <p className="text-[11px] text-zinc-500">
              E-mails e mensagens contendo estas palavras sao automaticamente priorizados como <span className="text-amber-400/80 font-medium">Tarefa Critica</span>
            </p>
          </div>
        </div>

        {/* toast de resultado da sync */}
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className={`absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 px-5 py-2.5 rounded-xl backdrop-blur-xl border text-[12px] font-medium shadow-lg z-10
              ${toast.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
                : 'bg-cyan-500/10 border-cyan-500/20 text-cyan-300'
              }`}
          >
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{toast.msg}</span>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}

/* ── Empty State ─────────────────────────────────────────────── */
function EmptyKeywords() {
  return (
    <motion.div {...fadeUp}>
      <div className="relative overflow-hidden bg-zinc-950/50 backdrop-blur-2xl border border-white/5 rounded-[2rem] shadow-2xl p-8">
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <div className="w-14 h-14 rounded-[1.25rem] bg-zinc-800/30 border border-white/5 flex items-center justify-center mb-4">
            <Radar className="w-6 h-6 text-zinc-600" />
          </div>
          <p className="text-[14px] font-semibold text-zinc-400 mb-1">Radar Desativado</p>
          <p className="text-[12px] text-zinc-600 max-w-xs leading-relaxed">
            Configure suas Palavras-Chave de Foco nas Configuracoes para ativar a triagem automatica de e-mails
          </p>
          <div className="flex items-center gap-1.5 mt-4 text-[11px] text-cyan-400/60">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Integracoes → Palavras-Chave</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
